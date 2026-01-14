import { useEffect, useState } from 'react'
import { View, Text, Textarea, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage } from '@tarojs/taro'
import { authAPI, wishAPI, unlockAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import type { AnalysisResult } from '../../types'
import './index.scss'

export default function Index() {
  const { setUser, isLoggedIn } = useAppStore()
  const [wishText, setWishText] = useState('')
  const [prefillDeity, setPrefillDeity] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [shareUnlockContext, setShareUnlockContext] = useState<{
    unlockToken: string
    analysisId: string
  } | null>(null)
  const [pendingAnalyze, setPendingAnalyze] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async () => {
    if (loggingIn) return // 防止重复点击
    
    setLoggingIn(true)
    try {
      console.log('开始登录流程...')
      
      // 获取用户信息
      console.log('正在获取用户信息...')
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })
      console.log('用户信息获取成功:', userInfoRes.userInfo)
      
      // 调用登录接口（手机号授权改为可选，在云函数中处理）
      console.log('正在调用登录接口...')
      const response = await authAPI.login(userInfoRes.userInfo, null)
      console.log('登录接口响应:', response)
      
      if (response.code === 0) {
        setUser(response.data?.user || null)
        Taro.showToast({ title: '登录成功', icon: 'success' })
        console.log('登录成功，用户信息:', response.data?.user)
      } else {
        console.error('登录失败，错误码:', response.code, '错误信息:', response.msg)
        Taro.showToast({ 
          title: response.msg || '登录失败', 
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error: any) {
      console.error('登录过程出错:', error)
      const errorMsg = error.message || error.errMsg || '登录失败，请重试'
      console.error('错误详情:', error)
      Taro.showToast({ 
        title: errorMsg, 
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoggingIn(false)
    }
  }

  useEffect(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }, [])

  useDidShow(() => {
    const prefill = Taro.getStorageSync('bb_analyze_wish')
    if (prefill?.wish_text) {
      setWishText(prefill.wish_text)
      setPrefillDeity(prefill.deity || '')
      setPendingAnalyze(!!prefill.autoAnalyze)
      Taro.removeStorageSync('bb_analyze_wish')
    }
  })

  useEffect(() => {
    if (pendingAnalyze && wishText) {
      setPendingAnalyze(false)
      handleAnalyze()
    }
  }, [pendingAnalyze, wishText])

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
      const response = await wishAPI.analyze(wishText, prefillDeity || '')
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
    }, 1500)
  }

  const handleUnlockByShare = () => {
    if (!analysisResult) return
    setShareUnlockContext({
      unlockToken: analysisResult.unlock_token,
      analysisId: analysisResult.analysis_id
    })
  }

  const handleRecordWish = () => {
    if (!analysisResult?.full_result) return
    Taro.setStorageSync('bb_prefill_wish', {
      deity: prefillDeity || '',
      wish_text: wishText,
      time_range: analysisResult.full_result.structured_suggestion?.time_range || '',
      target_quantify: analysisResult.full_result.structured_suggestion?.target_quantify || '',
      way_boundary: analysisResult.full_result.structured_suggestion?.way_boundary || '',
      action_commitment: analysisResult.full_result.structured_suggestion?.action_commitment || '',
      return_wish: analysisResult.full_result.structured_suggestion?.return_wish || ''
    })
    Taro.switchTab({ url: '/pages/wishes/index' })
  }

  return (
    <ScrollView className="bb-page index-page" scrollY>
      <View className="index-hero">
        <View>
          <Text className="index-title">心诚则灵，愿有所成</Text>
          <Text className="index-subtitle">输入愿望，我们帮你找出缺失要素与正确姿势</Text>
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

      <View className="bb-section">
        <View className="bb-card index-banner">
          <Text className="index-banner__text">横幅广告位（微信广告组件）</Text>
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card index-input">
          <Text className="bb-card-title">最近许过什么愿？</Text>
          <Textarea
            className="index-textarea"
            placeholder="请输入你最近许过但没成功的愿望..."
            value={wishText}
            onInput={(e) => setWishText(e.detail.value)}
          />
          <Button className="bb-btn-primary index-analyze" loading={analyzing} onClick={handleAnalyze}>
            开始分析
          </Button>
        </View>
      </View>

      {analysisResult && (
        <View className="bb-section">
          <View className="bb-card index-result">
            <Text className="bb-card-title">分析结果</Text>
            <View className="index-result__grid">
              <View className="index-result__panel">
                <Text className="index-result__title">缺失要素</Text>
                {analysisResult.missing_elements?.map((item, index) => (
                  <Text key={index} className="index-result__item">
                    • {item}
                  </Text>
                ))}
              </View>
              <View className="index-result__panel">
                <Text className="index-result__title">潜在原因</Text>
                {analysisResult.possible_reasons?.map((item, index) => (
                  <Text key={index} className="index-result__item">
                    • {item}
                  </Text>
                ))}
              </View>
            </View>

            {!unlocked && (
              <View className="index-unlock">
                <Text className="index-result__title">正确姿势（需解锁）</Text>
                <View className="index-unlock__actions">
                  <Button className="bb-btn-outline" onClick={handleUnlockByAd}>
                    看广告解锁
                  </Button>
                  <Button className="bb-btn-outline" openType="share" onClick={handleUnlockByShare}>
                    分享解锁
                  </Button>
                </View>
              </View>
            )}

            {unlocked && analysisResult.full_result && (
              <View className="index-full">
                <Text className="index-result__title">优化后的许愿稿</Text>
                <Text className="index-full__text">{analysisResult.full_result.optimized_text}</Text>
                <Text className="index-result__title">建议步骤</Text>
                {analysisResult.full_result.steps?.map((step, index) => (
                  <Text key={index} className="index-result__item">
                    {index + 1}. {step}
                  </Text>
                ))}
                <View className="index-full__actions">
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
                  <Button className="bb-btn-primary" onClick={handleRecordWish}>
                    记录到我的愿望
                  </Button>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      <View className="bb-section">
        <View className="bb-card index-disclaimer">
          <Text className="bb-muted">
            免责声明：本产品仅提供表达与流程建议，不承诺/保证任何超自然结果；代许愿为服务行为，提供过程记录，不承诺结果。
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
