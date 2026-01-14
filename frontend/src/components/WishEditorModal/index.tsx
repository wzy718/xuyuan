import { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { wishAPI, unlockAPI } from '../../utils/api'
import type { Wish, AnalysisResult } from '../../types'
import './index.scss'

interface WishEditorModalProps {
  open: boolean
  title: string
  confirmText?: string
  initialWish?: Partial<Wish>
  onClose: () => void
  onSubmit: (wish: Partial<Wish>) => Promise<void>
}

const emptyWish: Partial<Wish> = {
  beneficiary_type: 'self',
  beneficiary_desc: '',
  deity: '',
  wish_text: '',
  time_range: '',
  target_quantify: '',
  way_boundary: '',
  action_commitment: '',
  return_wish: ''
}

const BENEFICIARY_OPTIONS = [
  { value: 'self', label: '自己', icon: '🧑' },
  { value: 'family', label: '家人', icon: '👨‍👩‍👧' },
  { value: 'child', label: '孩子', icon: '👶' },
  { value: 'couple', label: '姻缘', icon: '💑' },
  { value: 'other', label: '其他', icon: '👥' }
]

export default function WishEditorModal({
  open,
  title,
  confirmText = '确认记录',
  initialWish,
  onClose,
  onSubmit
}: WishEditorModalProps) {
  const [wish, setWish] = useState<Partial<Wish>>(emptyWish)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [shareUnlockContext, setShareUnlockContext] = useState<{
    unlockToken: string
    analysisId: string
  } | null>(null)

  useEffect(() => {
    if (open) {
      setWish({ ...emptyWish, ...initialWish })
      setAnalysisResult(null)
      setUnlocked(false)
    }
  }, [open, initialWish])

  useShareAppMessage(() => {
    return {
      title: '拜拜：愿望分析助手',
      path: '/pages/wishes/index',
      success: async () => {
        if (!shareUnlockContext) return
        try {
          const response = await unlockAPI.unlockByShare(
            shareUnlockContext.unlockToken,
            shareUnlockContext.analysisId
          )
          if (response.code === 0) {
            setUnlocked(true)
            setAnalysisResult((prev) =>
              prev
                ? {
                    ...prev,
                    full_result: response.data.full_result
                  }
                : prev
            )
            Taro.showToast({ title: '解锁成功', icon: 'success' })
          } else {
            Taro.showToast({ title: response.msg || '解锁失败', icon: 'none' })
          }
        } catch (error: any) {
          Taro.showToast({ title: error.message || '解锁失败', icon: 'none' })
        } finally {
          setShareUnlockContext(null)
        }
      }
    }
  })

  const handleAnalyze = async () => {
    if (!wish.wish_text?.trim()) {
      Taro.showToast({ title: '请先填写愿望原文', icon: 'none' })
      return
    }
    setAnalyzing(true)
    try {
      const response = await wishAPI.analyze(wish.wish_text || '', wish.deity || '')
      if (response.code === 0) {
        setAnalysisResult(response.data)
        setUnlocked(false)
        Taro.showToast({ title: '分析完成', icon: 'success' })
      } else {
        Taro.showToast({ title: response.msg || '分析失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '分析失败', icon: 'none' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUnlockByAd = async () => {
    if (!analysisResult) return
    Taro.showLoading({ title: '观看广告中...' })
    setTimeout(async () => {
      try {
        const response = await unlockAPI.unlockByAd(
          analysisResult.unlock_token,
          analysisResult.analysis_id
        )
        if (response.code === 0) {
          setUnlocked(true)
          setAnalysisResult({
            ...analysisResult,
            full_result: response.data.full_result
          })
          Taro.showToast({ title: '解锁成功', icon: 'success' })
        } else {
          Taro.showToast({ title: response.msg || '解锁失败', icon: 'none' })
        }
      } catch (error: any) {
        Taro.showToast({ title: error.message || '解锁失败', icon: 'none' })
      } finally {
        Taro.hideLoading()
      }
    }, 1200)
  }

  const handleUnlockByShare = () => {
    if (!analysisResult) return
    setShareUnlockContext({
      unlockToken: analysisResult.unlock_token,
      analysisId: analysisResult.analysis_id
    })
  }

  const handleOptimize = async () => {
    if (!analysisResult?.analysis_id) {
      Taro.showToast({ title: '请先分析', icon: 'none' })
      return
    }
    if (!unlocked) {
      Taro.showToast({ title: '请先解锁后再一键优化', icon: 'none' })
      return
    }
    setOptimizing(true)
    try {
      const response = await wishAPI.optimize(
        wish.wish_text || '',
        analysisResult.analysis_id,
        wish.deity || '',
        undefined,
        {
          time_range: wish.time_range,
          target_quantify: wish.target_quantify,
          way_boundary: wish.way_boundary,
          action_commitment: wish.action_commitment,
          return_wish: wish.return_wish
        }
      )
      if (response.code === 0) {
        setAnalysisResult((prev) =>
          prev
            ? {
                ...prev,
                full_result: response.data
              }
            : prev
        )
        Taro.showToast({ title: '优化完成', icon: 'success' })
      } else {
        Taro.showToast({ title: response.msg || '优化失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '优化失败', icon: 'none' })
    } finally {
      setOptimizing(false)
    }
  }

  const handleSubmit = async () => {
    if (!wish.beneficiary_type) {
      Taro.showToast({ title: '请选择许愿人/受益人', icon: 'none' })
      return
    }
    if (!wish.deity?.trim()) {
      Taro.showToast({ title: '对象为必填', icon: 'none' })
      return
    }
    if (!wish.wish_text?.trim()) {
      Taro.showToast({ title: '愿望原文为必填', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await onSubmit(wish)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <View className="wish-modal">
      <View className="wish-modal__content">
        <View className="wish-modal__header">
          <Text className="wish-modal__title">{title}</Text>
          <Text className="wish-modal__close" onClick={onClose}>
            关闭
          </Text>
        </View>
        <View className="wish-modal__body">
          <View className="wish-modal__field">
            <Text className="wish-modal__label">👤 许愿人/受益人（必填）</Text>
            <Text className="wish-modal__hint">这个愿望是为谁许的？</Text>
            <View className="wish-modal__beneficiary-options">
              {BENEFICIARY_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`wish-modal__beneficiary-option ${
                    wish.beneficiary_type === option.value ? 'is-active' : ''
                  }`}
                  onClick={() => setWish((prev) => ({ ...prev, beneficiary_type: option.value as any }))}
                >
                  <Text className="wish-modal__beneficiary-icon">{option.icon}</Text>
                  <Text className="wish-modal__beneficiary-label">{option.label}</Text>
                </View>
              ))}
            </View>
            {(wish.beneficiary_type === 'family' ||
              wish.beneficiary_type === 'couple' ||
              wish.beneficiary_type === 'other') && (
              <Input
                className="wish-modal__input wish-modal__input--desc"
                placeholder="具体说明，如：爸爸妈妈 / 我和老公 / 全家人"
                value={wish.beneficiary_desc || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, beneficiary_desc: e.detail.value }))}
              />
            )}
          </View>

          <View className="wish-modal__field">
            <Text className="wish-modal__label">🏛 对象（必填）</Text>
            <Text className="wish-modal__hint">向谁许愿？</Text>
            <Input
              className="wish-modal__input"
              placeholder="例如：观音菩萨 / 财神 / 文殊菩萨 / 药师佛 / 月老 / 自己"
              value={wish.deity || ''}
              onInput={(e) => setWish((prev) => ({ ...prev, deity: e.detail.value }))}
            />
          </View>
          <View className="wish-modal__field">
            <Text className="wish-modal__label">📝 愿望原文（必填）</Text>
            <Textarea
              className="wish-modal__textarea"
              placeholder="写下你的愿望..."
              value={wish.wish_text || ''}
              onInput={(e) => setWish((prev) => ({ ...prev, wish_text: e.detail.value }))}
            />
          </View>

          <View className="wish-modal__field">
            <Text className="wish-modal__label wish-modal__label--section">📋 补充信息（选填，可帮助分析）</Text>
          </View>
          <View className="wish-modal__grid">
            <View className="wish-modal__field">
              <Text className="wish-modal__label">时间范围</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：3个月内"
                value={wish.time_range || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, time_range: e.detail.value }))}
              />
            </View>
            <View className="wish-modal__field">
              <Text className="wish-modal__label">目标量化</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：月薪≥15K"
                value={wish.target_quantify || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, target_quantify: e.detail.value }))}
              />
            </View>
            <View className="wish-modal__field">
              <Text className="wish-modal__label">方式边界</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：合法合规"
                value={wish.way_boundary || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, way_boundary: e.detail.value }))}
              />
            </View>
            <View className="wish-modal__field">
              <Text className="wish-modal__label">行动承诺</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：每天投递5份简历"
                value={wish.action_commitment || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, action_commitment: e.detail.value }))}
              />
            </View>
          </View>
          <View className="wish-modal__field">
            <Text className="wish-modal__label">🎁 还愿/回向（可选）</Text>
            <Input
              className="wish-modal__input"
              placeholder="例如：捐款/做公益/回向家人"
              value={wish.return_wish || ''}
              onInput={(e) => setWish((prev) => ({ ...prev, return_wish: e.detail.value }))}
            />
          </View>

          {analysisResult && (
            <View className="wish-modal__analysis">
              <Text className="bb-card-title">诊断结果</Text>
              <View className="wish-modal__analysis-row">
                <View className="wish-modal__analysis-card">
                  <Text className="wish-modal__analysis-title">缺失要素</Text>
                  {analysisResult.missing_elements?.map((item, index) => (
                    <Text key={index} className="wish-modal__analysis-item">
                      • {item}
                    </Text>
                  ))}
                </View>
                <View className="wish-modal__analysis-card">
                  <Text className="wish-modal__analysis-title">潜在原因</Text>
                  {analysisResult.possible_reasons?.map((item, index) => (
                    <Text key={index} className="wish-modal__analysis-item">
                      • {item}
                    </Text>
                  ))}
                </View>
              </View>
              {!unlocked && (
                <View className="wish-modal__unlock">
                  <Text className="wish-modal__analysis-title">一键 AI 优化（需解锁）</Text>
                  <View className="wish-modal__unlock-actions">
                    <Button className="bb-btn-outline" onClick={handleUnlockByAd}>
                      看广告解锁
                    </Button>
                    <Button
                      className="bb-btn-outline"
                      openType="share"
                      onClick={handleUnlockByShare}
                    >
                      分享解锁
                    </Button>
                  </View>
                </View>
              )}
              {unlocked && analysisResult.full_result && (
                <View className="wish-modal__optimize">
                  <Text className="wish-modal__analysis-title">优化结果</Text>
                  <Text className="wish-modal__optimize-text">
                    {analysisResult.full_result.optimized_text}
                  </Text>
                  <Button
                    className="bb-btn-ghost"
                    onClick={() =>
                      Taro.setClipboardData({
                        data: analysisResult.full_result?.optimized_text || ''
                      })
                    }
                  >
                    复制许愿稿
                  </Button>
                </View>
              )}
            </View>
          )}
        </View>
        <View className="wish-modal__footer">
          <Button className="bb-btn-primary" loading={saving} onClick={handleSubmit}>
            {confirmText}
          </Button>
          <Button className="bb-btn-ghost" loading={analyzing} onClick={handleAnalyze}>
            先分析一下
          </Button>
          <Button className="bb-btn-outline" loading={optimizing} onClick={handleOptimize}>
            一键 AI 优化
          </Button>
        </View>
      </View>
    </View>
  )
}
