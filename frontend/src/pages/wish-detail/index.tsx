import { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow, useRouter, useShareAppMessage } from '@tarojs/taro'
import { todoAPI } from '../../utils/api'
import { formatDateTime } from '../../utils/format'
import type { Wish } from '../../types'
import WishEditorModal from '../../components/WishEditorModal'
import './index.scss'

export default function WishDetail() {
  const router = useRouter()
  const wishId = router.params?.id || ''
  const [wish, setWish] = useState<Wish | null>(null)
  const [showEditor, setShowEditor] = useState(false)

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
    if (!wish) {
      return {
        title: '快来看看我实现的愿望！',
        path: '/pages/index/index'
      }
    }
    return {
      title: '快来看看我实现的愿望！',
      imageUrl: '', // 可选：分享图片
      path: `/pages/wish-detail/index?id=${wish.id}`
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
      Taro.showModal({
        title: '恭喜达成',
        content: '愿望已标记为成功！记得还愿哦，感恩诸佛菩萨的护佑。',
        showCancel: false,
        confirmText: '知道了'
      })
      await loadWish()
    } else {
      Taro.showToast({ title: response.msg || '标记失败', icon: 'none' })
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
    <View className="bb-page wish-detail">

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
            <Text className="wish-detail__value">{formatDateTime(wish.created_at)}</Text>
          </View>
          {wish.status === 1 ? (
            <View className="wish-detail__element">
              <Text className="wish-detail__label">达成时间</Text>
              <Text className="wish-detail__value">{formatDateTime(wish.updated_at)}</Text>
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
          <View className="bb-card wish-detail__success-hint">
            <Text className="bb-card-title">🎉 恭喜达成</Text>
            <Text className="wish-detail__success-text">
              愿望已成功实现！记得还愿，感恩诸佛菩萨的慈悲护佑。
            </Text>
            {wish.return_wish && (
              <View className="wish-detail__return-hint">
                <Text className="wish-detail__return-label">你之前承诺的还愿：</Text>
                <Text className="wish-detail__return-text">{wish.return_wish}</Text>
              </View>
            )}
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
    </View>
  )
}
