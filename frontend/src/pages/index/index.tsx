/**
 * 主页面
 */
import { useState, useEffect } from 'react'
import { View, Text, Textarea, Button, Checkbox, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { authAPI, wishAPI, todoAPI, unlockAPI, paymentAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import type { Wish as WishType, AnalysisResult } from '../../types'
import './index.scss'

export default function Index() {
  const { user, setUser, isLoggedIn } = useAppStore()
  const [wishText, setWishText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [todos, setTodos] = useState<WishType[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedWish, setSelectedWish] = useState<WishType | null>(null)

  // 新增愿望表单（结构化字段）
  const [newWish, setNewWish] = useState<Partial<WishType>>({
    deity: '',
    wish_text: '',
    time_range: '',
    target_quantify: '',
    way_boundary: '',
    action_commitment: '',
    return_wish: ''
  })
  const [creatingWish, setCreatingWish] = useState(false)
  const [modalAnalyzing, setModalAnalyzing] = useState(false)
  const [modalAnalysisResult, setModalAnalysisResult] = useState<any>(null)
  const [modalUnlocked, setModalUnlocked] = useState(false)
  const [modalOptimizing, setModalOptimizing] = useState(false)

  // 分享解锁上下文：用于在分享成功回调里触发服务端解锁
  const [shareUnlockContext, setShareUnlockContext] = useState<
    | { kind: 'main'; unlockToken: string; analysisId: number }
    | { kind: 'modal'; unlockToken: string; analysisId: number }
    | null
  >(null)

  // 微信登录
  const handleLogin = async () => {
    try {
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })

      const response = await authAPI.login(userInfoRes.userInfo)
      
      if (response.code === 0) {
        setUser(response.data?.user || null)
        Taro.showToast({ title: '登录成功', icon: 'success' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadTodos()
    }
  }, [isLoggedIn])

  useEffect(() => {
    // 开启分享能力（用于分享解锁）
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }, [])

  useShareAppMessage(() => {
    return {
      title: '拜拜：愿望分析助手',
      path: '/pages/index/index',
      success: async () => {
        if (!shareUnlockContext) return
        try {
          const response = await unlockAPI.unlockByShare(
            shareUnlockContext.unlockToken,
            shareUnlockContext.analysisId
          )
          if (response.code === 0) {
            if (shareUnlockContext.kind === 'main') {
              setUnlocked(true)
              setAnalysisResult((prev: any) =>
                prev
                  ? {
                      ...prev,
                      full_result: response.data.full_result
                    }
                  : prev
              )
            } else {
              setModalUnlocked(true)
              setModalAnalysisResult((prev: any) =>
                prev
                  ? {
                      ...prev,
                      full_result: response.data.full_result
                    }
                  : prev
              )
            }
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

  // 分析愿望
  const handleAnalyze = async () => {
    if (!wishText.trim()) {
      Taro.showToast({ title: '请输入愿望内容', icon: 'none' })
      return
    }

    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            handleLogin()
          }
        }
      })
      return
    }

    setAnalyzing(true)
    try {
      const response = await wishAPI.analyze(wishText)
      
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

  // 看广告解锁
  const handleUnlockByAd = async (target: 'main' | 'modal') => {
    const targetAnalysis = target === 'main' ? analysisResult : modalAnalysisResult
    if (!targetAnalysis) return

    // 这里应该调用微信激励视频广告API
    // 示例：使用模拟
    Taro.showLoading({ title: '观看广告中...' })
    
    setTimeout(async () => {
      try {
        const response = await unlockAPI.unlockByAd(
          targetAnalysis.unlock_token,
          targetAnalysis.analysis_id
        )

        if (response.code === 0) {
          if (target === 'main') {
            setUnlocked(true)
            setAnalysisResult({
              ...targetAnalysis,
              full_result: response.data.full_result
            })
          } else {
            setModalUnlocked(true)
            setModalAnalysisResult({
              ...targetAnalysis,
              full_result: response.data.full_result
            })
          }
          Taro.showToast({ title: '解锁成功', icon: 'success' })
        } else {
          Taro.showToast({ title: response.msg || '解锁失败', icon: 'none' })
        }
      } catch (error: any) {
        Taro.showToast({ title: error.message || '解锁失败', icon: 'none' })
      } finally {
        Taro.hideLoading()
      }
    }, 2000)
  }

  // 分享解锁
  const prepareUnlockByShare = (target: 'main' | 'modal') => {
    const targetAnalysis = target === 'main' ? analysisResult : modalAnalysisResult
    if (!targetAnalysis) return
    setShareUnlockContext({
      kind: target,
      unlockToken: targetAnalysis.unlock_token,
      analysisId: targetAnalysis.analysis_id
    })
  }

  // 加载TODO列表
  const loadTodos = async () => {
    if (!isLoggedIn) return

    try {
      const response = await todoAPI.getList()
      if (response.code === 0) {
        // 云数据库默认字段为 _id，这里转为前端统一的 id
        const list = (response.data || []).map((item: any) => ({
          ...item,
          id: item._id
        }))
        setTodos(list)
      }
    } catch (error) {
      console.error('加载TODO失败:', error)
    }
  }

  // 标记成功
  const handleMarkSuccess = async (wish: WishType) => {
    try {
      const response = await todoAPI.update(wish.id, { status: 1 })
      if (response.code === 0) {
        await loadTodos()
        setSelectedWish(wish)
        setShowPayModal(true)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  // 支付
  const handlePay = async () => {
    if (!selectedWish) return

    try {
      const response = await paymentAPI.createOrder(
        selectedWish.id,
        selectedWish.deity || '',
        selectedWish.wish_text,
        ''
      )

      if (response.code === 0) {
        // 调用微信支付
        await Taro.requestPayment({
          timeStamp: response.data.payment_params.timeStamp,
          nonceStr: response.data.payment_params.nonceStr,
          package: response.data.payment_params.package,
          signType: response.data.payment_params.signType,
          paySign: response.data.payment_params.paySign
        })

        Taro.showToast({ title: '支付成功', icon: 'success' })
        setShowPayModal(false)
      }
    } catch (error: any) {
      if (error.errMsg !== 'requestPayment:fail cancel') {
        Taro.showToast({ title: error.message || '支付失败', icon: 'none' })
      }
    }
  }

  useDidShow(() => {
    if (isLoggedIn) {
      loadTodos()
    }
  })

  // 新增愿望
  const handleCreateWish = async () => {
    if (!isLoggedIn) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!newWish.deity?.trim()) {
      Taro.showToast({ title: '对象为必填', icon: 'none' })
      return
    }
    if (!newWish.wish_text?.trim()) {
      Taro.showToast({ title: '愿望原文为必填', icon: 'none' })
      return
    }

    setCreatingWish(true)
    try {
      const response = await todoAPI.create(newWish)
      if (response.code === 0) {
        Taro.showToast({ title: '记录成功', icon: 'success' })
        setShowAddModal(false)
        setNewWish({
          deity: '',
          wish_text: '',
          time_range: '',
          target_quantify: '',
          way_boundary: '',
          action_commitment: '',
          return_wish: ''
        })
        setModalAnalysisResult(null)
        setModalUnlocked(false)
        await loadTodos()
      } else {
        Taro.showToast({ title: response.msg || '记录失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '记录失败', icon: 'none' })
    } finally {
      setCreatingWish(false)
    }
  }

  // 弹窗内：先分析再解锁，再一键优化
  const handleModalAnalyze = async () => {
    if (!isLoggedIn) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (!newWish.wish_text?.trim()) {
      Taro.showToast({ title: '请先填写愿望原文', icon: 'none' })
      return
    }

    setModalAnalyzing(true)
    try {
      const response = await wishAPI.analyze(newWish.wish_text || '', newWish.deity || '')
      if (response.code === 0) {
        setModalAnalysisResult(response.data)
        setModalUnlocked(false)
        Taro.showToast({ title: '分析完成', icon: 'success' })
      } else {
        Taro.showToast({ title: response.msg || '分析失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '分析失败', icon: 'none' })
    } finally {
      setModalAnalyzing(false)
    }
  }

  const handleModalOptimize = async () => {
    if (!modalAnalysisResult?.analysis_id) {
      Taro.showToast({ title: '请先分析并完成解锁', icon: 'none' })
      return
    }
    if (!modalUnlocked) {
      Taro.showToast({ title: '请先解锁后再一键优化', icon: 'none' })
      return
    }

    setModalOptimizing(true)
    try {
      const response = await wishAPI.optimize(
        newWish.wish_text || '',
        modalAnalysisResult.analysis_id,
        newWish.deity || ''
      )
      if (response.code === 0) {
        setModalAnalysisResult((prev: any) =>
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
      setModalOptimizing(false)
    }
  }

  return (
    <ScrollView className="index-page" scrollY>
      <View className="header">
        <Text className="title">最近许过什么愿？如果没成功我来分析原因！</Text>
        {!isLoggedIn && (
          <Button size="mini" onClick={handleLogin}>登录</Button>
        )}
      </View>

      <View className="card">
        <Textarea
          className="wish-input"
          placeholder="请输入你最近许过但没成功的愿望"
          value={wishText}
          onInput={(e) => setWishText(e.detail.value)}
        />
        <Button
          className="analyze-btn"
          type="primary"
          loading={analyzing}
          onClick={handleAnalyze}
        >
          开始分析
        </Button>
      </View>

      {analysisResult && (
        <View className="card">
          <View className="result-section">
            <Text className="section-title">缺失要素</Text>
            <View className="list">
              {analysisResult.missing_elements?.map((item: string, index: number) => (
                <Text key={index} className="list-item">• {item}</Text>
              ))}
            </View>
          </View>

          <View className="result-section">
            <Text className="section-title">潜在原因</Text>
            <View className="list">
              {analysisResult.possible_reasons?.map((item: string, index: number) => (
                <Text key={index} className="list-item">• {item}</Text>
              ))}
            </View>
          </View>

          {!unlocked && (
            <View className="unlock-section">
              <Text className="section-title">正确姿势（需解锁）</Text>
              <View className="unlock-buttons">
                <Button size="mini" onClick={() => handleUnlockByAd('main')}>看广告解锁</Button>
                <Button size="mini" openType="share" onClick={() => prepareUnlockByShare('main')}>
                  分享解锁
                </Button>
              </View>
            </View>
          )}

          {unlocked && analysisResult.full_result && (
            <View className="result-section">
              <Text className="section-title">正确姿势</Text>
              <Text className="optimized-text">{analysisResult.full_result.optimized_text}</Text>
              <View className="list">
                {analysisResult.full_result.steps?.map((step: string, index: number) => (
                  <Text key={index} className="list-item">{index + 1}. {step}</Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View className="card">
        <View className="todo-header">
          <Text className="section-title">我的愿望（TODO）</Text>
          <Button size="mini" onClick={() => setShowAddModal(true)}>+</Button>
        </View>
        <View className="todo-list">
          {todos.map((wish) => (
            <View key={wish.id} className="todo-item">
              <Checkbox
                checked={wish.status === 1}
                onClick={() => {
                  if (wish.status !== 1) {
                    handleMarkSuccess(wish)
                  }
                }}
              />
              <View className="todo-content">
                <Text className="todo-text">{wish.wish_text}</Text>
                {wish.deity && <Text className="todo-deity">{wish.deity}</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="card disclaimer">
        <Text>
          重要声明：本产品仅提供表达与流程建议，不承诺/保证任何超自然结果；代许愿为服务行为，提供过程记录，不承诺结果。
        </Text>
      </View>

      {/* 新增愿望弹窗 */}
      {showAddModal && (
        <View className="modal">
          <View className="modal-content">
            <Text className="modal-title">新增愿望</Text>
            <View className="form">
              <View className="form-item">
                <Text className="label">对象（必填）</Text>
                <Input
                  className="input"
                  placeholder="例如：财神 / 观音 / 自己"
                  value={newWish.deity || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, deity: e.detail.value }))}
                />
              </View>

              <View className="form-item">
                <Text className="label">愿望原文（必填）</Text>
                <Textarea
                  className="textarea"
                  placeholder="写下你最近许过但没成功的愿望"
                  value={newWish.wish_text || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, wish_text: e.detail.value }))}
                />
              </View>

              <View className="form-item">
                <Text className="label">时间范围（建议）</Text>
                <Input
                  className="input"
                  placeholder="例如：30天内 / 2026年3月前"
                  value={newWish.time_range || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, time_range: e.detail.value }))}
                />
              </View>

              <View className="form-item">
                <Text className="label">目标量化（建议）</Text>
                <Input
                  className="input"
                  placeholder="例如：存到2万元 / 体重下降3kg"
                  value={newWish.target_quantify || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, target_quantify: e.detail.value }))}
                />
              </View>

              <View className="form-item">
                <Text className="label">方式边界（建议）</Text>
                <Input
                  className="input"
                  placeholder="例如：不伤害他人 / 不违法 / 不透支"
                  value={newWish.way_boundary || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, way_boundary: e.detail.value }))}
                />
              </View>

              <View className="form-item">
                <Text className="label">行动承诺（建议）</Text>
                <Input
                  className="input"
                  placeholder="例如：每天学习30分钟 / 每周运动3次"
                  value={newWish.action_commitment || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, action_commitment: e.detail.value }))}
                />
              </View>

              <View className="form-item">
                <Text className="label">还愿/回向（可选）</Text>
                <Textarea
                  className="textarea"
                  placeholder="例如：捐款/做公益/请朋友吃饭等"
                  value={newWish.return_wish || ''}
                  onInput={(e) => setNewWish((prev) => ({ ...prev, return_wish: e.detail.value }))}
                />
              </View>

              {modalAnalysisResult && (
                <View className="card-inner">
                  <Text className="section-title">诊断</Text>
                  <View className="list">
                    {modalAnalysisResult.missing_elements?.map((item: string, index: number) => (
                      <Text key={index} className="list-item">• {item}</Text>
                    ))}
                  </View>
                  <View className="list">
                    {modalAnalysisResult.possible_reasons?.map((item: string, index: number) => (
                      <Text key={index} className="list-item">• {item}</Text>
                    ))}
                  </View>

                  {!modalUnlocked && (
                    <View className="unlock-section">
                      <Text className="section-title">一键 AI 优化（需解锁）</Text>
                      <View className="unlock-buttons">
                        <Button size="mini" onClick={() => handleUnlockByAd('modal')}>看广告解锁</Button>
                        <Button size="mini" openType="share" onClick={() => prepareUnlockByShare('modal')}>
                          分享解锁
                        </Button>
                      </View>
                    </View>
                  )}

                  {modalUnlocked && modalAnalysisResult.full_result && (
                    <View className="result-section">
                      <Text className="section-title">优化结果</Text>
                      <Text className="optimized-text">{modalAnalysisResult.full_result.optimized_text}</Text>
                      <Button
                        size="mini"
                        onClick={() => {
                          Taro.setClipboardData({ data: modalAnalysisResult.full_result.optimized_text || '' })
                        }}
                      >
                        复制许愿稿
                      </Button>
                    </View>
                  )}
                </View>
              )}

              <View className="form-actions">
                <Button type="primary" loading={creatingWish} onClick={handleCreateWish}>
                  确认记录
                </Button>
                <Button loading={modalAnalyzing} onClick={handleModalAnalyze}>
                  开始分析
                </Button>
                <Button loading={modalOptimizing} onClick={handleModalOptimize}>
                  一键 AI 优化（需解锁）
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(false)
                    setModalAnalysisResult(null)
                    setModalUnlocked(false)
                  }}
                >
                  关闭
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 支付弹窗 */}
      {showPayModal && selectedWish && (
        <View className="modal">
          <View className="modal-content">
            <Text className="modal-title">已成功 🎉</Text>
            <Text>恭喜！要不要付 1 元让别人替你许愿/还愿回向？</Text>
            <Text className="disclaimer-text">提供过程记录，不承诺结果。</Text>
            <Button type="primary" onClick={handlePay}>1 元代许愿</Button>
            <Button onClick={() => setShowPayModal(false)}>暂不需要</Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
