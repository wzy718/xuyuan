import { useEffect, useRef, useState } from 'react'
import { View, Text, Textarea, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useRouter } from '@tarojs/taro'
import { authAPI, wishAPI, unlockAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import type { AnalysisResult } from '../../types'
import AnalysisModal from '../../components/AnalysisModal'
import './index.scss'

declare const BANNER_AD_UNIT_ID: string

const LAST_ANALYSIS_STORAGE_KEY = 'bb_last_analysis'
const LAST_ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000

type LastAnalysisCache = {
  wish_text: string
  deity: string
  analysis_result: AnalysisResult
  unlocked: boolean
  modal_visible: boolean
  updated_at: number
}

export default function Index() {
  const router = useRouter()
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
  // openType=share 触发时 setState 可能还未生效，使用 ref 避免分享 path 丢参数
  const shareUnlockContextRef = useRef<{ unlockToken: string; analysisId: string } | null>(null)
  const [pendingAnalyze, setPendingAnalyze] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  // 是否展开“分析结果”区块（以前是弹窗，现在是页面内展示）
  const [showModal, setShowModal] = useState(false)
  // 分享解锁相关：使用 ref 避免 setState 异步与闭包导致的重复弹窗/重复解锁
  const shareUnlockProcessingRef = useRef(false)
  const shareUnlockProcessedKeyRef = useRef<string | null>(null)
  const shareUnlockLoginPromptedKeyRef = useRef<string | null>(null)

  const readLastAnalysisCache = (): LastAnalysisCache | null => {
    try {
      const cache = Taro.getStorageSync(LAST_ANALYSIS_STORAGE_KEY) as LastAnalysisCache
      if (!cache?.analysis_result?.analysis_id) return null
      if (!cache.updated_at) return null
      if (Date.now() - cache.updated_at > LAST_ANALYSIS_TTL_MS) return null
      return cache
    } catch {
      return null
    }
  }

  const writeLastAnalysisCache = (next: Partial<LastAnalysisCache>) => {
    try {
      const prev = (Taro.getStorageSync(LAST_ANALYSIS_STORAGE_KEY) || {}) as Partial<LastAnalysisCache>
      const nextWishText =
        typeof next.wish_text === 'string' && next.wish_text.trim() ? next.wish_text : undefined
      const nextDeity = typeof next.deity === 'string' && next.deity.trim() ? next.deity : undefined
      const merged: LastAnalysisCache = {
        wish_text: nextWishText ?? prev.wish_text ?? '',
        deity: nextDeity ?? prev.deity ?? '',
        analysis_result: (next.analysis_result ?? prev.analysis_result) as AnalysisResult,
        unlocked: next.unlocked ?? prev.unlocked ?? false,
        modal_visible: next.modal_visible ?? prev.modal_visible ?? false,
        updated_at: Date.now()
      }
      // analysis_result 必须存在才写入，避免写入空对象导致后续恢复异常
      if (!merged.analysis_result?.analysis_id) return
      Taro.setStorageSync(LAST_ANALYSIS_STORAGE_KEY, merged)
    } catch {
      // 忽略缓存失败，不影响主流程
    }
  }

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

  const buildShareUnlockKey = (analysisId: string, unlockToken: string) => `${analysisId}__${unlockToken}`

  // 处理分享解锁（用于分享链接自动解锁）
  const handleShareUnlock = async (analysisId: string, unlockToken: string) => {
    if (!analysisId || !unlockToken) return

    const shareKey = buildShareUnlockKey(analysisId, unlockToken)
    
    // 检查是否已登录
    const currentIsLoggedIn = useAppStore.getState().isLoggedIn
    if (!currentIsLoggedIn) {
      // 防止同一个分享链接在多处触发时重复弹登录框
      if (shareUnlockLoginPromptedKeyRef.current === shareKey) return
      shareUnlockLoginPromptedKeyRef.current = shareKey
      Taro.showModal({
        title: '提示',
        content: '需要登录后才能解锁内容，是否立即登录？',
        success: async (res) => {
          if (res.confirm) {
            // 先保存解锁参数到 storage，登录成功后再执行
            Taro.setStorageSync('bb_share_unlock', {
              analysis_id: analysisId,
              unlock_token: unlockToken
            })
            await handleLogin()
            // 登录成功后，useDidShow 会再次触发，检查 storage 中的解锁参数
            // 若登录未成功，放开标记，允许用户再次尝试
            if (!useAppStore.getState().isLoggedIn) {
              shareUnlockLoginPromptedKeyRef.current = null
            }
          } else {
            // 用户取消登录时，放开标记，避免后续无法再次弹窗
            shareUnlockLoginPromptedKeyRef.current = null
          }
        }
      })
      return
    }

    let keepProcessedKey = false
    try {
      // 防止重复请求（例如 useDidShow + 登录状态变化 + 其他监听同时触发）
      if (shareUnlockProcessingRef.current) return
      if (shareUnlockProcessedKeyRef.current === shareKey) return
      shareUnlockProcessingRef.current = true
      shareUnlockProcessedKeyRef.current = shareKey
      shareUnlockLoginPromptedKeyRef.current = null

      // 优先从本地缓存恢复（用于“查看分享页”秒开：先展示缓存，后续再补齐状态）
      const cached = readLastAnalysisCache()
      const cachedResult =
        cached?.analysis_result?.analysis_id === analysisId ? cached.analysis_result : null
      const cachedWishText = cached?.wish_text || wishText
      const cachedDeity = cached?.deity || prefillDeity
      if (cachedWishText && !wishText) setWishText(cachedWishText)
      if (cachedDeity && !prefillDeity) setPrefillDeity(cachedDeity)

      console.log('处理分享链接解锁...', { analysisId, unlockToken })
      
      // 直接尝试解锁（适用于被分享者和分享者本人）
      console.log('执行分享解锁...', { analysisId, unlockToken })
      const response = await unlockAPI.unlockByShare(unlockToken, analysisId)
      if (response.code === 0) {
        keepProcessedKey = true
        // 先用缓存直接展示（不等 getStatus），保证秒开
        const nextResult: AnalysisResult = {
          analysis_id: analysisId,
          missing_elements: cachedResult?.missing_elements || [],
          possible_reasons: cachedResult?.possible_reasons || [],
          failure_case: cachedResult?.failure_case || '',
          correct_posture: cachedResult?.correct_posture || '',
          locked: false,
          unlock_token: unlockToken,
          unlock_token_expires_at: cachedResult?.unlock_token_expires_at || Date.now(),
          full_result: response.data?.full_result || cachedResult?.full_result || null
        }
        setAnalysisResult(nextResult)
        setUnlocked(true)
        setShowModal(true)
        writeLastAnalysisCache({
          wish_text: cachedWishText,
          deity: cachedDeity,
          analysis_result: nextResult,
          unlocked: true,
          modal_visible: true
        })
        Taro.showToast({ 
          title: '解锁成功', 
          icon: 'success',
          duration: 1500
        })

        // 再异步补齐完整状态（仅分享者本人可成功拿到分析结果）
        unlockAPI.getStatus(analysisId).then((statusResponse) => {
          if (statusResponse.code !== 0 || !statusResponse.data) return
          const statusData = statusResponse.data
          const merged: AnalysisResult = {
            ...nextResult,
            missing_elements: statusData.missing_elements || nextResult.missing_elements,
            possible_reasons: statusData.possible_reasons || nextResult.possible_reasons,
            failure_case: statusData.failure_case || nextResult.failure_case,
            correct_posture: statusData.correct_posture || nextResult.correct_posture,
            unlock_token_expires_at: statusData.unlock_token_expires_at || nextResult.unlock_token_expires_at,
            full_result: nextResult.full_result || statusData.full_result
          }
          setAnalysisResult(merged)
          writeLastAnalysisCache({
            wish_text: cachedWishText,
            deity: cachedDeity,
            analysis_result: merged,
            unlocked: true,
            modal_visible: true
          })
        }).catch(() => {
          // 补齐失败不影响主流程（常见于被分享者）
        })
        // 清除 storage 中的解锁参数
        Taro.removeStorageSync('bb_share_unlock')
      } else {
        // 如果解锁失败，可能是token已使用（分享者已解锁）或其他原因
        console.log('解锁失败，错误信息:', response.msg)
        if (response.msg?.includes('无效') || response.msg?.includes('已过期') || response.msg?.includes('不存在')) {
          // token已使用或无效，尝试检查是否是分享者本人查看（通过 getStatus）
          console.log('token无效，尝试检查是否是分享者本人查看...')
          try {
            const statusResponse = await unlockAPI.getStatus(analysisId)
            if (statusResponse.code === 0 && statusResponse.data?.unlocked) {
              keepProcessedKey = true
              // 是分享者本人，且已解锁，直接显示内容
              console.log('是分享者本人，已解锁，直接显示内容')
              const statusData = statusResponse.data
              const nextResult: AnalysisResult = {
                analysis_id: analysisId,
                missing_elements: statusData.missing_elements || [],
                possible_reasons: statusData.possible_reasons || [],
                failure_case: statusData.failure_case || '',
                correct_posture: statusData.correct_posture || '',
                locked: false,
                unlock_token: unlockToken,
                unlock_token_expires_at: statusData.unlock_token_expires_at || Date.now(),
                full_result: statusData.full_result
              }
              setAnalysisResult(nextResult)
              setUnlocked(true)
              setShowModal(true)
              writeLastAnalysisCache({
                wish_text: wishText,
                deity: prefillDeity,
                analysis_result: nextResult,
                unlocked: true,
                modal_visible: true
              })
              Taro.showToast({ 
                title: '内容已解锁', 
                icon: 'success',
                duration: 1500
              })
            } else {
              // 不是分享者本人，或未解锁
              Taro.showToast({ 
                title: '该分享链接已使用或已过期，请重新分享', 
                icon: 'none',
                duration: 2000
              })
            }
          } catch (statusError: any) {
            // getStatus 也失败（可能是非分享者），提示重新分享
            console.error('检查解锁状态失败:', statusError)
            Taro.showToast({ 
              title: '该分享链接已使用或已过期，请重新分享', 
              icon: 'none',
              duration: 2000
            })
          }
        } else {
          Taro.showToast({ title: response.msg || '解锁失败', icon: 'none' })
        }
        Taro.removeStorageSync('bb_share_unlock')
      }
    } catch (error: any) {
      console.error('分享解锁失败:', error)
      Taro.showToast({ title: error.message || '解锁失败', icon: 'none' })
    } finally {
      shareUnlockProcessingRef.current = false
      if (!keepProcessedKey && shareUnlockProcessedKeyRef.current === shareKey) {
        shareUnlockProcessedKeyRef.current = null
      }
    }
  }

  useDidShow(() => {
    console.log('页面显示，检查分享链接参数...', router.params)

    // 1) 处理 URL 参数（从分享链接打开/点击“查看分享页”）
    const params = router.params || {}
    if (params.analysis_id && params.unlock_token) {
      console.log('检测到分享链接参数，准备解锁...', params)
      setTimeout(() => {
        handleShareUnlock(params.analysis_id, params.unlock_token)
      }, 300)
    }

    // 2) 处理 storage 中待执行的解锁（常见于先弹登录再解锁）
    const shareUnlock = Taro.getStorageSync('bb_share_unlock')
    if (shareUnlock?.analysis_id && shareUnlock?.unlock_token) {
      console.log('检测到 storage 中的分享解锁，准备执行...', shareUnlock)
      setTimeout(() => {
        handleShareUnlock(shareUnlock.analysis_id, shareUnlock.unlock_token)
      }, 300)
    }

    // 检查预填充数据
    const prefill = Taro.getStorageSync('bb_analyze_wish')
    if (prefill?.wish_text) {
      setWishText(prefill.wish_text)
      setPrefillDeity(prefill.deity || '')
      setPendingAnalyze(!!prefill.autoAnalyze)
      Taro.removeStorageSync('bb_analyze_wish')
    }

    // 刷新/重启后恢复上一次分析结果，避免“结果只在弹窗里，刷新后没了”
    const lastCache = readLastAnalysisCache()
    if (lastCache?.analysis_result && !analysisResult) {
      setWishText(lastCache.wish_text || '')
      setPrefillDeity(lastCache.deity || '')
      setAnalysisResult(lastCache.analysis_result)
      setUnlocked(!!lastCache.unlocked)
      setShowModal(!!lastCache.modal_visible)
    }
  })

  useEffect(() => {
    if (pendingAnalyze && wishText) {
      setPendingAnalyze(false)
      handleAnalyze()
    }
  }, [pendingAnalyze, wishText])

  // 监听登录状态变化，登录成功后检查是否有待执行的分享解锁
  useEffect(() => {
    if (isLoggedIn) {
      // 优先检查 storage 中的解锁参数（从“需要登录”弹窗进入）
      const shareUnlock = Taro.getStorageSync('bb_share_unlock')
      if (shareUnlock?.analysis_id && shareUnlock?.unlock_token) {
        console.log('登录状态变化，检测到 storage 中的分享解锁，执行解锁...', shareUnlock)
        setTimeout(() => {
          handleShareUnlock(shareUnlock.analysis_id, shareUnlock.unlock_token)
        }, 300)
        return
      }

      // 其次检查 URL 参数（从分享链接打开/点击“查看分享页”）
      const params = router.params || {}
      if (params.analysis_id && params.unlock_token) {
        console.log('登录状态变化，检测到 URL 中的分享解锁参数，执行解锁...', params)
        setTimeout(() => {
          handleShareUnlock(params.analysis_id, params.unlock_token)
        }, 300)
      }
    }
  }, [isLoggedIn, router.params])

  useShareAppMessage(() => {
    // 构建分享路径，包含解锁参数
    let sharePath = '/pages/index/index'
    const ctx = shareUnlockContextRef.current || shareUnlockContext
    if (ctx) {
      sharePath = `/pages/index/index?analysis_id=${ctx.analysisId}&unlock_token=${ctx.unlockToken}`
    } else if (analysisResult?.analysis_id && analysisResult.unlock_token && !unlocked) {
      // 兜底：避免因竞态导致分享链接不带参数
      sharePath = `/pages/index/index?analysis_id=${analysisResult.analysis_id}&unlock_token=${analysisResult.unlock_token}`
    }
    
    return {
      title: '拜拜：愿望分析助手',
      path: sharePath,
      success: async () => {
        const currentCtx =
          shareUnlockContextRef.current ||
          shareUnlockContext ||
          (analysisResult?.analysis_id && analysisResult.unlock_token && !unlocked
            ? { analysisId: analysisResult.analysis_id, unlockToken: analysisResult.unlock_token }
            : null)
        if (!currentCtx) return
        console.log('分享成功，开始执行解锁...', currentCtx)
        // 分享成功后执行解锁
        try {
          const response = await unlockAPI.unlockByShare(
            currentCtx.unlockToken,
            currentCtx.analysisId
          )
          if (response.code === 0) {
            // 更新当前分析结果
            setUnlocked(true)
            setAnalysisResult((prev) => {
              if (!prev) return prev
              const nextResult: AnalysisResult = {
                ...prev,
                locked: false,
                full_result: response.data.full_result
              }
              writeLastAnalysisCache({
                wish_text: wishText,
                deity: prefillDeity,
                analysis_result: nextResult,
                unlocked: true,
                modal_visible: true
              })
              return nextResult
            })
            // 解锁完成后清理分享上下文，避免后续“查看分享页”继续带旧参数
            shareUnlockContextRef.current = null
            setShareUnlockContext(null)
            // 确保弹窗打开，显示解锁后的内容
            setShowModal(true)
            setTimeout(() => {
              Taro.showToast({ 
                title: '分享成功，内容已解锁', 
                icon: 'success',
                duration: 2000
              })
            }, 500)
          } else {
            Taro.showToast({ 
              title: response.msg || '解锁失败', 
              icon: 'none',
              duration: 2000
            })
          }
        } catch (error: any) {
          console.error('分享后解锁失败:', error)
          Taro.showToast({ 
            title: error.message || '解锁失败', 
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: () => {
        // 分享失败时清除上下文
        console.log('分享失败，清除解锁上下文')
        shareUnlockContextRef.current = null
        setShareUnlockContext(null)
      }
    }
  })

  const handleAnalyze = async () => {
    console.log('handleAnalyze 被调用', { wishText, isLoggedIn, analyzing })
    
    // 检查是否正在分析中
    if (analyzing) {
      console.log('正在分析中，忽略重复点击')
      return
    }
    
    // 检查输入内容
    if (!wishText || !wishText.trim()) {
      console.log('输入内容为空')
      Taro.showToast({ title: '请输入愿望内容', icon: 'none', duration: 2000 })
      return
    }
    
    // 检查登录状态
    if (!isLoggedIn) {
      console.log('用户未登录，显示登录提示')
      Taro.showModal({
        title: '提示',
        content: '请先登录后再进行分析',
        confirmText: '立即登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            handleLogin()
          }
        }
      })
      return
    }
    
    console.log('开始分析愿望...', { wishText: wishText.substring(0, 50) + '...', deity: prefillDeity })
    
    // 先显示弹窗和加载动画
    setShowModal(true)
    setAnalyzing(true)
    setUnlocked(false)
    setAnalysisResult(null)
    // 新一轮分析开始时清理上一次分享上下文，避免误用旧 token
    shareUnlockContextRef.current = null
    setShareUnlockContext(null)
    
    try {
      console.log('调用 wishAPI.analyze...')
      const response = await wishAPI.analyze(wishText, prefillDeity || '')
      console.log('handleAnalyze - response:', JSON.stringify(response, null, 2))
      
      if (response.code === 0) {
        console.log('分析成功，设置结果:', JSON.stringify(response.data, null, 2))
        setAnalysisResult(response.data)
        writeLastAnalysisCache({
          wish_text: wishText,
          deity: prefillDeity,
          analysis_result: response.data,
          unlocked: false,
          modal_visible: true
        })
        console.log('结果已设置，弹窗应显示分析结果')
      } else {
        console.error('分析失败，错误码:', response.code, '错误信息:', response.msg)
        Taro.showToast({ 
          title: response.msg || '分析失败，请重试', 
          icon: 'none',
          duration: 3000
        })
        setShowModal(false)
      }
    } catch (error: any) {
      console.error('handleAnalyze - 捕获到异常:', error)
      console.error('错误详情:', {
        message: error.message,
        errMsg: error.errMsg,
        stack: error.stack
      })
      
      // 提供更详细的错误信息
      let errorMsg = '分析失败，请重试'
      if (error.message) {
        if (error.message.includes('云开发未初始化')) {
          errorMsg = '云开发未初始化，请检查配置'
        } else if (error.message.includes('云函数调用失败')) {
          errorMsg = '云函数调用失败，请检查网络或稍后重试'
        } else if (error.message.includes('401')) {
          errorMsg = 'API Key 配置错误，请联系管理员'
        } else {
          errorMsg = error.message
        }
      }
      
      Taro.showToast({ 
        title: errorMsg, 
        icon: 'none',
        duration: 3000
      })
      setShowModal(false)
    } finally {
      setAnalyzing(false)
      console.log('分析流程结束，analyzing 状态已重置')
    }
  }

  const handleUnlockByAd = async () => {
    if (!analysisResult) return
    Taro.showLoading({ title: '正在解锁...' })
    // 模拟广告观看
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
          writeLastAnalysisCache({
            wish_text: wishText,
            deity: prefillDeity,
            analysis_result: {
              ...analysisResult,
              full_result: response.data.full_result
            },
            unlocked: true,
            modal_visible: true
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
    }, 1000)
  }

  const handleUnlockByShare = () => {
    if (!analysisResult) return
    // 设置分享上下文，用于 success 回调
    // 不立即解锁，等待分享成功后再解锁
    const ctx = {
      unlockToken: analysisResult.unlock_token,
      analysisId: analysisResult.analysis_id
    }
    shareUnlockContextRef.current = ctx
    setShareUnlockContext(ctx)
    // 注意：解锁逻辑在分享成功的 success 回调中执行
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
    setShowModal(false)
    Taro.switchTab({ url: '/pages/wishes/index' })
  }

  const handleCopyText = () => {
    if (!analysisResult?.full_result?.optimized_text) return
    Taro.setClipboardData({
      data: analysisResult.full_result.optimized_text,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }

  const handleCloseModal = () => {
    if (!analyzing) {
      setShowModal(false)
      writeLastAnalysisCache({ modal_visible: false })
    }
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
          {/* 横幅广告 - 广告位 ID 在 config/dev.js 或 config/prod.js 中配置 */}
          {typeof BANNER_AD_UNIT_ID !== 'undefined' && BANNER_AD_UNIT_ID !== 'adunit-xxxxxxxxxxxxxxxx' && (
            <ad
              unit-id={BANNER_AD_UNIT_ID}
              ad-intervals={30}
              onLoad={() => console.log('横幅广告加载成功')}
              onError={(e) => console.error('横幅广告加载失败', e)}
            />
          )}
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
          {!!analysisResult && !showModal && (
            <Button
              className="bb-btn-outline index-analyze"
              onClick={() => {
                setShowModal(true)
                writeLastAnalysisCache({ modal_visible: true })
              }}
            >
              查看上次结果
            </Button>
          )}
        </View>
      </View>

      {/* 分析结果（页面内展示，支持刷新恢复） */}
      {showModal && (analyzing || !!analysisResult) && (
        <View className="bb-section">
          <AnalysisModal
            mode="page"
            visible
            analyzing={analyzing}
            result={analysisResult}
            onClose={handleCloseModal}
            onUnlockByAd={handleUnlockByAd}
            onUnlockByShare={handleUnlockByShare}
            onRecordWish={handleRecordWish}
            onCopyText={handleCopyText}
            unlocked={unlocked}
          />
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
