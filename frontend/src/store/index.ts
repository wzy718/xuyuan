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
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => {
    set({ user: null, isLoggedIn: false })
  }
}))
