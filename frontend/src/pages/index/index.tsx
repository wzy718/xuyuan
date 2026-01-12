/**
 * 主页面
 */
import { useState, useEffect } from 'react'
import { View, Text, Textarea, Button, Checkbox, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { authAPI, wishAPI, todoAPI, unlockAPI, paymentAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import './index.scss'

interface Wish {
  id: number
  deity?: string
  wish_text: string
  time_range?: string
  target_quantify?: string
  status: number
}

export default function Index() {
  const { user, setUser, isLoggedIn } = useAppStore()
  const [wishText, setWishText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [todos, setTodos] = useState<Wish[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null)

  // 微信登录
  const handleLogin = async () => {
    try {
      const loginRes = await Taro.login()
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })

      const response = await authAPI.login(loginRes.code, userInfoRes.userInfo)
      
      if (response.code === 0) {
        Taro.setStorageSync('access_token', response.data.access_token)
        Taro.setStorageSync('refresh_token', response.data.refresh_token)
        setUser(response.data.user)
        Taro.showToast({ title: '登录成功', icon: 'success' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    }
  }

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
  const handleUnlockByAd = async () => {
    if (!analysisResult) return

    // 这里应该调用微信激励视频广告API
    // 示例：使用模拟
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
    }, 2000)
  }

  // 分享解锁
  const handleUnlockByShare = async () => {
    if (!analysisResult) return

    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    // 分享后回调处理
    // 实际应该在onShareAppMessage中处理
    try {
      const response = await unlockAPI.unlockByShare(
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
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '解锁失败', icon: 'none' })
    }
  }

  // 加载TODO列表
  const loadTodos = async () => {
    if (!isLoggedIn) return

    try {
      const response = await todoAPI.getList()
      if (response.code === 0) {
        setTodos(response.data || [])
      }
    } catch (error) {
      console.error('加载TODO失败:', error)
    }
  }

  // 标记成功
  const handleMarkSuccess = async (wish: Wish) => {
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
                <Button size="mini" onClick={handleUnlockByAd}>看广告解锁</Button>
                <Button size="mini" onClick={handleUnlockByShare}>分享解锁</Button>
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
                onChange={() => handleMarkSuccess(wish)}
              />
              <View className="todo-content">
                <Text className="todo-text">{wish.wish_text}</Text>
                {wish.deity && <Text className="todo-deity">{wish.deity}</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 新增愿望弹窗 */}
      {showAddModal && (
        <View className="modal">
          <View className="modal-content">
            <Text className="modal-title">新增愿望</Text>
            {/* 这里应该实现完整的表单 */}
            <Button onClick={() => setShowAddModal(false)}>关闭</Button>
          </View>
        </View>
      )}

      {/* 支付弹窗 */}
      {showPayModal && selectedWish && (
        <View className="modal">
          <View className="modal-content">
            <Text className="modal-title">已成功 🎉</Text>
            <Text>恭喜！要不要付 1 元让别人替你许愿/还愿回向？</Text>
            <Button type="primary" onClick={handlePay}>1 元代许愿</Button>
            <Button onClick={() => setShowPayModal(false)}>暂不需要</Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
