/**
 * 全局状态管理
 */
import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface User {
  id: string
  nickname?: string
  avatar_url?: string
  has_phone?: boolean
}

const USER_STORAGE_KEY = 'bb_user'

function sanitizeUser(input: any): User | null {
  if (!input || typeof input !== 'object') return null
  const id = typeof input.id === 'string' ? input.id : ''
  if (!id) return null

  const nickname = typeof input.nickname === 'string' && input.nickname.trim() ? input.nickname : undefined
  const avatar_url = typeof input.avatar_url === 'string' && input.avatar_url.trim() ? input.avatar_url : undefined
  const has_phone = typeof input.has_phone === 'boolean' ? input.has_phone : undefined

  return {
    id,
    ...(nickname ? { nickname } : {}),
    ...(avatar_url ? { avatar_url } : {}),
    ...(typeof has_phone === 'boolean' ? { has_phone } : {})
  }
}

interface AppState {
  user: User | null
  isLoggedIn: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // 将登录态持久化：小程序在“查看分享页”等场景可能会重启，避免回来后反复要求登录
  user: (() => {
    try {
      const cached = Taro.getStorageSync(USER_STORAGE_KEY)
      return sanitizeUser(cached)
    } catch {
      return null
    }
  })(),
  isLoggedIn: (() => {
    try {
      const cached = Taro.getStorageSync(USER_STORAGE_KEY)
      return !!sanitizeUser(cached)
    } catch {
      return false
    }
  })(),
  setUser: (user) => {
    set((state) => {
      const incoming = sanitizeUser(user)
      if (!incoming) {
        try {
          Taro.removeStorageSync(USER_STORAGE_KEY)
        } catch {
          // 忽略缓存失败，不影响主流程
        }
        return { user: null, isLoggedIn: false }
      }

      const merged: User = { ...(state.user || {}), ...incoming }

      try {
        // 只缓存必要字段，避免误存手机号等敏感信息
        Taro.setStorageSync(USER_STORAGE_KEY, merged)
      } catch {
        // 忽略缓存失败，不影响主流程
      }

      return { user: merged, isLoggedIn: true }
    })
  },
  logout: () => {
    try {
      Taro.removeStorageSync(USER_STORAGE_KEY)
    } catch {
      // 忽略缓存失败，不影响主流程
    }
    set({ user: null, isLoggedIn: false })
  }
}))
