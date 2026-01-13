import { useEffect, useState } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter, useShareAppMessage } from '@tarojs/taro'
import { todoAPI, paymentAPI } from '../../utils/api'
import type { Wish } from '../../types'
import WishEditorModal from '../../components/WishEditorModal'
import PayWishModal from '../../components/PayWishModal'
import './index.scss'

export default function WishDetail() {
  const router = useRouter()
  const wishId = router.params?.id || ''
  const [wish, setWish] = useState<Wish | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)

  const loadWish = async () => {
    if (!wishId) return
    const response = await todoAPI.getList()
    if (response.code === 0) {
      const list = (response.data || []).map((item: any) => ({
        ...item,
        id: item._id
      }))
      const found = list.find((item: Wish) => item.id === wishId)
      setWish(found || null)
    }
  }

  useDidShow(() => {
    loadWish()
  })

  useEffect(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }, [])

  useShareAppMessage(() => {
    return {
      title: `拜拜：${wish?.wish_text || '愿望分享'}`,
      path: '/pages/index/index'
    }
  })

  const handleAnalyze = () => {
    if (!wish) return
    Taro.setStorageSync('bb_analyze_wish', {
      wish_text: wish.wish_text,
      deity: wish.deity || '',
      autoAnalyze: true
    })
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handleMarkSuccess = async () => {
    if (!wish) return
    const response = await todoAPI.update(wish.id, { status: 1 })
    if (response.code === 0) {
      await loadWish()
      setShowPayModal(true)
    }
  }

  const handleDelete = () => {
    if (!wish) return
    Taro.showModal({
      title: '删除愿望',
      content: '确定要删除这条愿望吗？',
      success: async (res) => {
        if (!res.confirm) return
        const response = await todoAPI.delete(wish.id)
        if (response.code === 0) {
          Taro.showToast({ title: '已删除', icon: 'success' })
          Taro.navigateBack()
        }
      }
    })
  }

  const handleSaveEdit = async (payload: Partial<Wish>) => {
    if (!wish) return
    const response = await todoAPI.update(wish.id, payload)
    if (response.code === 0) {
      Taro.showToast({ title: '修改成功', icon: 'success' })
      setShowEditor(false)
      await loadWish()
    }
  }

  const handlePay = async (payload: { deity: string; text: string; note: string }) => {
    if (!wish) return
    const response = await paymentAPI.createOrder(
      wish.id,
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

  if (!wish) {
    return (
      <View className="bb-page wish-detail">
        <View className="bb-section bb-card">
          <Text className="bb-muted">加载中或愿望不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className="bb-page wish-detail" scrollY>
      <View className="wish-detail__nav">
        <Text className="wish-detail__back" onClick={() => Taro.navigateBack()}>
          返回
        </Text>
        <Text className="wish-detail__delete" onClick={handleDelete}>
          删除
        </Text>
      </View>

      <View className="bb-section">
        <View className="bb-card wish-detail__hero">
          <Text className="wish-detail__deity">{wish.deity || '心愿对象'}</Text>
          <Text className={`wish-detail__status ${wish.status === 1 ? 'is-success' : ''}`}>
            {wish.status === 1 ? '已成功' : '进行中'}
          </Text>
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card">
          <Text className="bb-card-title">愿望原文</Text>
          <Text className="wish-detail__text">{wish.wish_text}</Text>
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card">
          <Text className="bb-card-title">愿望要素</Text>
          <View className="wish-detail__element">
            <Text className="wish-detail__label">时间范围</Text>
            <Text className="wish-detail__value">{wish.time_range || '未填写'}</Text>
          </View>
          <View className="wish-detail__element">
            <Text className="wish-detail__label">目标量化</Text>
            <Text className="wish-detail__value">{wish.target_quantify || '未填写'}</Text>
          </View>
          <View className="wish-detail__element">
            <Text className="wish-detail__label">方式边界</Text>
            <Text className="wish-detail__value">{wish.way_boundary || '未填写'}</Text>
          </View>
          <View className="wish-detail__element">
            <Text className="wish-detail__label">行动承诺</Text>
            <Text className="wish-detail__value">{wish.action_commitment || '未填写'}</Text>
          </View>
          <View className="wish-detail__element">
            <Text className="wish-detail__label">还愿/回向</Text>
            <Text className="wish-detail__value">{wish.return_wish || '未填写'}</Text>
          </View>
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card">
          <Text className="bb-card-title">时间记录</Text>
          <View className="wish-detail__element">
            <Text className="wish-detail__label">许愿时间</Text>
            <Text className="wish-detail__value">{wish.created_at || '—'}</Text>
          </View>
          {wish.status === 1 ? (
            <View className="wish-detail__element">
              <Text className="wish-detail__label">达成时间</Text>
              <Text className="wish-detail__value">{wish.updated_at || '—'}</Text>
            </View>
          ) : (
            <View className="wish-detail__element">
              <Text className="wish-detail__label">截止时间</Text>
              <Text className="wish-detail__value">—</Text>
            </View>
          )}
        </View>
      </View>

      {wish.status === 1 && (
        <View className="bb-section">
          <View className="bb-card wish-detail__repay">
            <Text className="bb-card-title">还愿状态</Text>
            <Text className="bb-muted">你之前承诺：{wish.return_wish || '未填写'}</Text>
            <Button className="bb-btn-primary" onClick={() => setShowPayModal(true)}>
              1 元代还愿
            </Button>
          </View>
        </View>
      )}

      <View className="bb-section wish-detail__actions">
        {wish.status !== 1 && (
          <>
            <Button className="bb-btn-ghost" onClick={handleAnalyze}>
              分析 / AI 优化
            </Button>
            <Button className="bb-btn-outline" onClick={handleMarkSuccess}>
              标记为已成功
            </Button>
            <Button className="bb-btn-outline" onClick={() => setShowEditor(true)}>
              编辑愿望
            </Button>
          </>
        )}
        {wish.status === 1 && (
          <>
            <Button
              className="bb-btn-ghost"
              onClick={() => Taro.setClipboardData({ data: wish.wish_text })}
            >
              复制许愿稿
            </Button>
            <Button className="bb-btn-outline" openType="share">
              分享给好友
            </Button>
          </>
        )}
      </View>

      <WishEditorModal
        open={showEditor}
        title="编辑愿望"
        confirmText="保存修改"
        initialWish={wish}
        onClose={() => setShowEditor(false)}
        onSubmit={handleSaveEdit}
      />

      <PayWishModal
        open={showPayModal}
        wish={wish}
        onClose={() => setShowPayModal(false)}
        onPay={handlePay}
      />
    </ScrollView>
  )
}
