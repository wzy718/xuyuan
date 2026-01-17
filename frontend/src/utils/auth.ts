/**
 * 登录工具函数
 *
 * 目标：
 * - 统一 getUserProfile + 云函数登录的行为与错误提示
 * - 对“取消/拒绝授权”给出友好反馈，避免误报为登录失败
 * - 前端不打印/不持久化不必要的用户敏感信息
 */
import Taro from '@tarojs/taro'
import { authAPI } from './api'
import { useAppStore } from '../store'

function isUserCanceledAuth(err: any): boolean {
  const msg = err?.errMsg || err?.message || ''
  if (typeof msg !== 'string') return false
  return msg.includes('cancel') || msg.includes('deny') || msg.includes('auth deny')
}

export async function loginWithUserProfile(options?: {
  desc?: string
  phoneCloudID?: string
}): Promise<{ ok: boolean; user?: any; msg?: string; canceled?: boolean }> {
  try {
    const userInfoRes = await Taro.getUserProfile({
      desc: options?.desc || '用于完善用户资料'
    })

    const response = await authAPI.login(userInfoRes.userInfo, options?.phoneCloudID)
    if (response.code === 0) {
      return { ok: true, user: response.data?.user || null }
    }
    return { ok: false, msg: response.msg || '登录失败' }
  } catch (error: any) {
    if (isUserCanceledAuth(error)) {
      return { ok: false, canceled: true, msg: '已取消登录' }
    }
    console.error('登录失败:', error)
    return { ok: false, msg: error?.message || error?.errMsg || '登录失败，请重试' }
  }
}

export async function ensureLoginSilently(): Promise<boolean> {
  if (useAppStore.getState().isLoggedIn) return true
  try {
    const res = await authAPI.ensure()
    if (res.code === 0) {
      useAppStore.getState().setUser(res.data?.user || null)
      return useAppStore.getState().isLoggedIn
    }
    return false
  } catch (error) {
    console.error('无感登录失败:', error)
    return false
  }
}
