import { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { authAPI, todoAPI, paymentAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import type { Wish } from '../../types'
import WishEditorModal from '../../components/WishEditorModal'
import PayWishModal from '../../components/PayWishModal'
import './index.scss'

type FilterKey = 'all' | 'ongoing' | 'success'

export default function Wishes() {
  const { setUser, isLoggedIn } = useAppStore()
  const [wishes, setWishes] = useState<Wish[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingWish, setEditingWish] = useState<Partial<Wish> | null>(null)
  const [editingWishId, setEditingWishId] = useState<string | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payWish, setPayWish] = useState<Wish | null>(null)

  useEffect(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }, [])

  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async () => {
    if (loggingIn) return
    
    setLoggingIn(true)
    try {
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })
      const response = await authAPI.login(userInfoRes.userInfo, null)
      if (response.code === 0) {
        setUser(response.data?.user || null)
        Taro.showToast({ title: '登录成功', icon: 'success' })
        loadWishes()
      } else {
        Taro.showToast({ title: response.msg || '登录失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoggingIn(false)
    }
  }

  const loadWishes = async () => {
    // 使用 store 的最新状态，而不是闭包中的状态
    const currentIsLoggedIn = useAppStore.getState().isLoggedIn
    if (!currentIsLoggedIn) return
    setLoading(true)
    try {
      const response = await todoAPI.getList()
      if (response.code === 0) {
        const list = (response.data || []).map((item: any) => ({
          ...item,
          id: item._id
        }))
        setWishes(list)
      } else {
        console.error('加载愿望列表失败:', response.msg)
      }
    } catch (error: any) {
      console.error('加载愿望列表异常:', error)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    loadWishes()
    const prefill = Taro.getStorageSync('bb_prefill_wish')
    if (prefill?.wish_text) {
      setEditingWish(prefill)
      setEditingWishId(null)
      setShowEditor(true)
      Taro.removeStorageSync('bb_prefill_wish')
    }
  })

  const filteredWishes =
    filter === 'all'
      ? wishes
      : wishes.filter((wish) => (filter === 'success' ? wish.status === 1 : wish.status !== 1))

  const handleSubmitWish = async (payload: Partial<Wish>) => {
    if (!isLoggedIn) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (editingWishId) {
      const response = await todoAPI.update(editingWishId, payload)
      if (response.code === 0) {
        Taro.showToast({ title: '修改成功', icon: 'success' })
        setShowEditor(false)
        setEditingWish(null)
        setEditingWishId(null)
        await loadWishes()
      } else {
        Taro.showToast({ title: response.msg || '修改失败', icon: 'none' })
      }
    } else {
      const response = await todoAPI.create(payload)
      if (response.code === 0 && response.data) {
        Taro.showToast({ title: '记录成功', icon: 'success' })
        setShowEditor(false)
        setEditingWish(null)
        setEditingWishId(null)
        // 立即将新数据添加到列表，然后刷新列表确保数据完整
        const newWish = {
          ...response.data,
          id: response.data._id || response.data.id
        }
        setWishes((prev) => [newWish, ...prev])
        // 同时刷新列表，确保数据同步
        await loadWishes()
      } else {
        Taro.showToast({ title: response.msg || '记录失败', icon: 'none' })
      }
    }
  }

  const handleMarkSuccess = async (wish: Wish) => {
    const response = await todoAPI.update(wish.id, { status: 1 })
    if (response.code === 0) {
      await loadWishes()
      setPayWish({ ...wish, status: 1 })
      setShowPayModal(true)
    }
  }

  const handleDelete = (wish: Wish) => {
    Taro.showModal({
      title: '删除愿望',
      content: '确定要删除这条愿望吗？',
      success: async (res) => {
        if (!res.confirm) return
        const response = await todoAPI.delete(wish.id)
        if (response.code === 0) {
          Taro.showToast({ title: '已删除', icon: 'success' })
          loadWishes()
        }
      }
    })
  }

  const handleAnalyze = (wish: Wish) => {
    Taro.setStorageSync('bb_analyze_wish', {
      wish_text: wish.wish_text,
      deity: wish.deity || '',
      autoAnalyze: true
    })
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handlePay = async (payload: { deity: string; text: string; note: string }) => {
    if (!payWish) return
    const response = await paymentAPI.createOrder(
      payWish.id,
      payload.deity,
      payload.text,
      payload.note
    )
    if (response.code !== 0) {
      Taro.showToast({ title: response.msg || '支付失败', icon: 'none' })
      return
    }
    try {
      await Taro.requestPayment({
        timeStamp: response.data.payment_params.timeStamp,
        nonceStr: response.data.payment_params.nonceStr,
        package: response.data.payment_params.package,
        signType: response.data.payment_params.signType,
        paySign: response.data.payment_params.paySign
      })
      Taro.showToast({ title: '支付成功', icon: 'success' })
      setShowPayModal(false)
    } catch (error: any) {
      if (error.errMsg !== 'requestPayment:fail cancel') {
        Taro.showToast({ title: error.message || '支付失败', icon: 'none' })
      }
    }
  }

  return (
    <View className="bb-page wishes-page">
      <View className="bb-section wishes-header">
        <View>
          <Text className="wishes-title">我的愿望</Text>
          <Text className="wishes-subtitle">记录每一份心愿，追踪实现进度</Text>
        </View>
        {!isLoggedIn && (
          <Button 
            className="bb-btn-outline" 
            onClick={handleLogin}
            loading={loggingIn}
            disabled={loggingIn}
          >
            登录
          </Button>
        )}
      </View>

      <View className="bb-section wishes-filters">
        {([
          { key: 'all', label: `全部(${wishes.length})` },
          { key: 'ongoing', label: `进行中(${wishes.filter((wish) => wish.status !== 1).length})` },
          { key: 'success', label: `已成功(${wishes.filter((wish) => wish.status === 1).length})` }
        ] as const).map((item) => (
          <View
            key={item.key}
            className={`wishes-filter ${filter === item.key ? 'is-active' : ''}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </View>
        ))}
      </View>

      <View className="bb-section wishes-list">
        {loading && <Text className="bb-muted">加载中...</Text>}
        {!loading && filteredWishes.length === 0 && (
          <Text className="bb-muted">暂无记录，先新增一个愿望吧。</Text>
        )}
        {filteredWishes.map((wish) => (
          <View
            key={wish.id}
            className="wishes-card"
            onClick={() => Taro.navigateTo({ url: `/pages/wish-detail/index?id=${wish.id}` })}
          >
            <View className="wishes-card__header">
              <Text className="wishes-card__deity">{wish.deity || '心愿对象'}</Text>
              <Text className={`wishes-card__status ${wish.status === 1 ? 'is-success' : ''}`}>
                {wish.status === 1 ? '已成功' : '进行中'}
              </Text>
            </View>
            <Text className="wishes-card__text">{wish.wish_text}</Text>
            <View className="wishes-card__meta">
              {wish.time_range && <Text className="bb-chip">时间：{wish.time_range}</Text>}
              {wish.target_quantify && <Text className="bb-chip">目标：{wish.target_quantify}</Text>}
            </View>
            <View className="wishes-card__actions" onClick={(e) => e.stopPropagation()}>
              <Button className="bb-btn-ghost" onClick={() => handleAnalyze(wish)}>
                分析
              </Button>
              {wish.status !== 1 ? (
                <Button className="bb-btn-outline" onClick={() => handleMarkSuccess(wish)}>
                  标记成功
                </Button>
              ) : (
                <Button
                  className="bb-btn-outline"
                  onClick={() => {
                    setPayWish(wish)
                    setShowPayModal(true)
                  }}
                >
                  1 元代还愿
                </Button>
              )}
              <Button className="bb-btn-outline" onClick={() => handleDelete(wish)}>
                删除
              </Button>
            </View>
          </View>
        ))}
      </View>

      <View className="bb-section wishes-add">
        <Button
          className="bb-btn-primary"
          onClick={() => {
            setEditingWish(null)
            setEditingWishId(null)
            setShowEditor(true)
          }}
        >
          新增愿望
        </Button>
      </View>

      <WishEditorModal
        open={showEditor}
        title={editingWishId ? '编辑愿望' : '新增愿望'}
        confirmText={editingWishId ? '保存修改' : '确认记录'}
        initialWish={editingWish || undefined}
        onClose={() => {
          setShowEditor(false)
          setEditingWish(null)
          setEditingWishId(null)
        }}
        onSubmit={handleSubmitWish}
      />

      <PayWishModal
        open={showPayModal}
        wish={payWish}
        onClose={() => setShowPayModal(false)}
        onPay={handlePay}
      />
    </View>
  )
}
