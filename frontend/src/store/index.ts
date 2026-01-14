/**
 * 全局状态管理
 */
import { create } from 'zustand'
import Taro from '@tarojs/taro'

interface User {
  id: string
  nickname?: string
  avatar_url?: string
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
      const cached = Taro.getStorageSync('bb_user') as User | null
      if (cached && typeof (cached as any).id === 'string') return cached
      return null
    } catch {
      return null
    }
  })(),
  isLoggedIn: (() => {
    try {
      const cached = Taro.getStorageSync('bb_user') as User | null
      return !!(cached && typeof (cached as any).id === 'string')
    } catch {
      return false
    }
  })(),
  setUser: (user) => {
    try {
      if (user) {
        Taro.setStorageSync('bb_user', user)
      } else {
        Taro.removeStorageSync('bb_user')
      }
    } catch {
      // 忽略缓存失败，不影响主流程
    }
    set({ user, isLoggedIn: !!user })
  },
  logout: () => {
    try {
      Taro.removeStorageSync('bb_user')
    } catch {
      // 忽略缓存失败，不影响主流程
    }
    set({ user: null, isLoggedIn: false })
  }
}))
