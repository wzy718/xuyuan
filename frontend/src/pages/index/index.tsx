import { useEffect, useRef, useState } from 'react'
import { View, Text, Textarea, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useRouter } from '@tarojs/taro'
import { authAPI, wishAPI, unlockAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import type { AnalysisResult } from '../../types'
import AnalysisModal from '../../components/AnalysisModal'
import shareCoverImage from '../../assets/share-cover.png'
import './index.scss'

const LAST_ANALYSIS_STORAGE_KEY = 'bb_last_analysis'
const LAST_ANALYSIS_TTL_MS = 24 * 60 * 60 * 1000

// 默认愿望文案（用户未输入时使用）
const DEFAULT_WISH_TEXTS = [
  '愿我今年暴富赚到 1 个亿',
  '请菩萨保佑我升职加薪，当上总监',
  '赐我一段美好的姻缘吧，对方要对我好，身材也要好，钱也赚的多'
]

// 分享标题文案（随机显示）
const SHARE_TITLES = [
  '快来测测你的愿望能不能实现🎯',
  '愿望没实现？可能是这些原因🔍',
  '分享一个超准的愿望分析工具🌟',
  '测了个我许的愿望，结果惊呆了😳'
]

// 随机获取分享标题
const getRandomShareTitle = () => {
  const randomIndex = Math.floor(Math.random() * SHARE_TITLES.length)
  return SHARE_TITLES[randomIndex]
}

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
  // 初始化时随机选择一个默认文案
  const [defaultWishText] = useState(() => {
    const randomIndex = Math.floor(Math.random() * DEFAULT_WISH_TEXTS.length)
    return DEFAULT_WISH_TEXTS[randomIndex]
  })
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
      // 兼容历史缓存：迁移为新字段（不保留旧字段）
      const ar: any = cache.analysis_result as any
      const normalized: AnalysisResult = {
        analysis_id: String(ar.analysis_id || ''),
        analysis_results: Array.isArray(ar.analysis_results)
          ? ar.analysis_results
          : ([] as string[]).concat(ar.missing_elements || [], ar.possible_reasons || []),
        suggested_deity: String(
          ar.suggested_deity || ar?.full_result?.structured_suggestion?.suggested_deity || ''
        ),
        case: String(ar.case || ar.failure_case || ''),
        posture: String(ar.posture || ar.correct_posture || ''),
        locked: Boolean(ar.locked),
        unlock_token: String(ar.unlock_token || ''),
        unlock_token_expires_at: Number(ar.unlock_token_expires_at) || Date.now(),
        full_result: ar.full_result || null
      } as any
      cache.analysis_result = normalized
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
      const response = await authAPI.login(userInfoRes.userInfo, undefined)
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
      withShareTicket: true
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
        // 解锁接口已返回诊断字段，直接展示（不再额外调用 unlock.status）
        const nextResult: AnalysisResult = {
          analysis_id: analysisId,
          analysis_results: response.data?.analysis_results || cachedResult?.analysis_results || [],
          suggested_deity: response.data?.suggested_deity || cachedResult?.suggested_deity || '',
          case: response.data?.case || cachedResult?.case || '',
          posture: response.data?.posture || cachedResult?.posture || '',
          locked: false,
          unlock_token: unlockToken,
          unlock_token_expires_at:
            response.data?.unlock_token_expires_at || cachedResult?.unlock_token_expires_at || Date.now(),
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
                analysis_results: statusData.analysis_results || [],
                suggested_deity: statusData.suggested_deity || '',
                case: statusData.case || '',
                posture: statusData.posture || '',
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

    // 1) 处理 URL 参数（从分享链接打开/点击"查看分享页"）
    const params = router.params || {}
    if (params.analysis_id && params.unlock_token) {
      console.log('检测到分享链接参数，准备解锁...', params)
      setTimeout(() => {
        handleShareUnlock(String(params.analysis_id), String(params.unlock_token))
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

    // 3) 处理待执行的分享解锁（备用机制：防止分享成功回调未执行）
    const pendingShareUnlock = Taro.getStorageSync('bb_pending_share_unlock')
    if (pendingShareUnlock?.analysis_id && pendingShareUnlock?.unlock_token) {
      // 检查是否在 5 分钟内（防止过期数据）
      const timeDiff = Date.now() - (pendingShareUnlock.timestamp || 0)
      if (timeDiff < 5 * 60 * 1000) {
        console.log('[分享] 检测到待执行的分享解锁（备用机制），准备执行...', pendingShareUnlock)
        // 延迟执行，避免与分享成功回调冲突
        setTimeout(() => {
          handleShareUnlock(pendingShareUnlock.analysis_id, pendingShareUnlock.unlock_token)
          // 执行后清除，避免重复执行
          Taro.removeStorageSync('bb_pending_share_unlock')
        }, 1000)
      } else {
        // 超过 5 分钟，清除过期数据
        console.log('[分享] 待执行的分享解锁已过期，清除...')
        Taro.removeStorageSync('bb_pending_share_unlock')
      }
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
          handleShareUnlock(String(params.analysis_id), String(params.unlock_token))
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
    
    console.log('[分享] 构建分享路径:', sharePath, { ctx, analysisResult: analysisResult?.analysis_id, unlocked })
    
    return {
      title: getRandomShareTitle(), // 随机显示分享标题
      path: sharePath,
      imageUrl: shareCoverImage, // 分享封面图(需要准备 5:4 比例的图片)
      success: async (res: any) => {
        console.log('[分享] 分享成功回调触发', res)
        
        const currentCtx =
          shareUnlockContextRef.current ||
          shareUnlockContext ||
          (analysisResult?.analysis_id && analysisResult.unlock_token && !unlocked
            ? { analysisId: analysisResult.analysis_id, unlockToken: analysisResult.unlock_token }
            : null)
        
        console.log('[分享] 当前解锁上下文:', currentCtx, {
          shareUnlockContextRef: shareUnlockContextRef.current,
          shareUnlockContext,
          analysisResult: analysisResult?.analysis_id,
          unlocked
        })
        
        if (!currentCtx) {
          console.warn('[分享] 缺少解锁上下文，无法执行解锁')
          return
        }
        
        console.log('[分享] 开始执行解锁...', currentCtx)

        // 秒刷新：先乐观更新 UI（若 analyze 阶段已带 full_result，可立即展示）
        console.log('[分享] 乐观更新 UI 状态')
        setUnlocked(true)
        setShowModal(true)
        
        // 确保 analysisResult 存在才更新
        if (analysisResult) {
          setAnalysisResult((prev) => {
            if (!prev) return prev
            console.log('[分享] 更新分析结果状态（乐观更新）')
            const nextResult: AnalysisResult = {
              ...prev,
              locked: false
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
        } else {
          console.warn('[分享] analysisResult 为空，无法乐观更新')
        }

        // 分享成功后执行解锁同步（用于服务端记录/幂等）
        try {
          console.log('[分享] 调用解锁接口...', {
            unlockToken: currentCtx.unlockToken,
            analysisId: currentCtx.analysisId
          })
          
          const response = await unlockAPI.unlockByShare(
            currentCtx.unlockToken,
            currentCtx.analysisId
          )
          
          console.log('[分享] 解锁接口响应:', response)
          
          if (response.code === 0) {
            console.log('[分享] 解锁成功，更新完整结果')
            
            // 如果 analysisResult 为空，需要从缓存恢复或重新构建
            const prevResult = analysisResult || readLastAnalysisCache()?.analysis_result
            
            if (prevResult) {
              setAnalysisResult((prev) => {
                const current = prev || prevResult
                const nextResult: AnalysisResult = {
                  ...current,
                  locked: false,
                  full_result: response.data?.full_result || current.full_result,
                  analysis_results: response.data?.analysis_results || current.analysis_results,
                  suggested_deity: response.data?.suggested_deity || current.suggested_deity
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
            } else {
              // 如果完全没有结果，尝试从服务端数据构建
              console.warn('[分享] 无法找到分析结果，尝试从服务端数据构建')
              if (response.data) {
                const newResult: AnalysisResult = {
                  analysis_id: currentCtx.analysisId,
                  analysis_results: response.data.analysis_results || [],
                  suggested_deity: response.data.suggested_deity || '',
                  case: response.data.case || '',
                  posture: response.data.posture || '',
                  locked: false,
                  unlock_token: currentCtx.unlockToken,
                  unlock_token_expires_at: response.data.unlock_token_expires_at || Date.now(),
                  full_result: response.data.full_result || null
                }
                setAnalysisResult(newResult)
                writeLastAnalysisCache({
                  wish_text: wishText,
                  deity: prefillDeity,
                  analysis_result: newResult,
                  unlocked: true,
                  modal_visible: true
                })
              }
            }
            
            // 解锁完成后清理分享上下文，避免后续"查看分享页"继续带旧参数
            shareUnlockContextRef.current = null
            setShareUnlockContext(null)
            
            // 清除待执行的分享解锁标记（备用机制）
            Taro.removeStorageSync('bb_pending_share_unlock')
            
            // 确保弹窗打开，显示解锁后的内容
            console.log('[分享] 确保弹窗打开')
            setShowModal(true)
            setUnlocked(true)
            
            // 延迟显示提示，避免与微信系统提示冲突
            setTimeout(() => {
              console.log('[分享] 显示解锁成功提示')
              Taro.showToast({ 
                title: '分享成功，内容已解锁', 
                icon: 'success',
                duration: 2000
              })
            }, 800)
          } else {
            console.error('[分享] 解锁失败:', response.msg)
            Taro.showToast({ 
              title: response.msg || '解锁同步失败，请稍后再试', 
              icon: 'none',
              duration: 2000
            })
          }
        } catch (error: any) {
          console.error('[分享] 解锁异常:', error)
          Taro.showToast({ 
            title: error.message || '解锁同步失败，请稍后再试', 
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err: any) => {
        // 分享失败时清除上下文
        console.log('[分享] 分享失败，清除解锁上下文', err)
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
    
    // 检查输入内容，如果为空则使用默认文案
    const finalWishText = (wishText && wishText.trim()) ? wishText.trim() : defaultWishText
    if (!finalWishText) {
      console.log('输入内容为空且无默认文案')
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
    
    console.log('开始分析愿望...', { wishText: finalWishText.substring(0, 50) + '...', deity: prefillDeity })
    
    // 如果使用的是默认文案且用户没有输入，更新 wishText 状态以便后续显示
    if (!wishText || !wishText.trim()) {
      setWishText(finalWishText)
    }
    
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
      const response = await wishAPI.analyze(finalWishText, prefillDeity || '')
      console.log('handleAnalyze - response:', JSON.stringify(response, null, 2))
      
      if (response.code === 0) {
        console.log('分析成功，设置结果:', JSON.stringify(response.data, null, 2))
        setAnalysisResult(response.data)
        writeLastAnalysisCache({
          wish_text: finalWishText,
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
            full_result: response.data.full_result,
            suggested_deity: response.data.suggested_deity || analysisResult.suggested_deity
          })
          writeLastAnalysisCache({
            wish_text: wishText,
            deity: prefillDeity,
            analysis_result: {
              ...analysisResult,
              full_result: response.data.full_result,
              suggested_deity: response.data.suggested_deity || analysisResult.suggested_deity
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
    
    // 备用机制：将解锁信息保存到 storage，防止分享成功回调未执行
    // 在页面显示时会检查并执行解锁
    Taro.setStorageSync('bb_pending_share_unlock', {
      analysis_id: analysisResult.analysis_id,
      unlock_token: analysisResult.unlock_token,
      timestamp: Date.now()
    })
    console.log('[分享] 保存待解锁信息到 storage:', ctx)
    
    // 注意：解锁逻辑在分享成功的 success 回调中执行
  }

  const handleRecordWish = () => {
    if (!analysisResult?.full_result) return
    const suggestedDeityFromFull = analysisResult.full_result.structured_suggestion?.suggested_deity || ''
    const suggestedDeity = suggestedDeityFromFull || analysisResult.suggested_deity || prefillDeity || ''
    const optimizedText = analysisResult.full_result.optimized_text || wishText
    Taro.setStorageSync('bb_prefill_wish', {
      // “向谁许愿”优先使用 AI 的建议对象
      deity: suggestedDeity,
      // “愿望原文”记录为优化后的许愿稿，方便用户直接使用
      wish_text: optimizedText,
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
        <View className="bb-card index-input">
          <Text className="bb-card-title">最近许过什么愿？</Text>
          <Textarea
            className="index-textarea"
            placeholder={defaultWishText}
            value={wishText}
            onInput={(e) => setWishText(e.detail.value)}
            autoHeight
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
            免责声明：本产品仅提供表达与流程建议，不承诺/保证任何超自然结果。
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
