import { useState } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { authAPI, todoAPI } from '../../utils/api'
import { useAppStore } from '../../store'
import './index.scss'

export default function Profile() {
  const { user, setUser, isLoggedIn, logout } = useAppStore()
  const [stats, setStats] = useState({ total: 0, success: 0, ongoing: 0 })

  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async () => {
    if (loggingIn) return
    
    setLoggingIn(true)
    try {
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })
      const response = await authAPI.login(userInfoRes.userInfo, null)
      if (response.code === 0) {
        setUser(response.data?.user || null)
        Taro.showToast({ title: '登录成功', icon: 'success' })
        loadStats()
      } else {
        Taro.showToast({ title: response.msg || '登录失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoggingIn(false)
    }
  }

  const loadStats = async () => {
    if (!isLoggedIn) return
    const response = await todoAPI.getList()
    if (response.code === 0) {
      const list = response.data || []
      const total = list.length
      const success = list.filter((item: any) => item.status === 1).length
      setStats({ total, success, ongoing: total - success })
    }
  }

  useDidShow(() => {
    loadStats()
  })

  return (
    <ScrollView className="bb-page profile-page" scrollY>
      <View className="bb-section profile-hero">
        <View className="profile-avatar" />
        <Text className="profile-name">{user?.nickname || '未登录用户'}</Text>
        <Text className="profile-id">ID: {user?.id || '—'}</Text>
        {!isLoggedIn && (
          <Button 
            className="bb-btn-outline profile-login" 
            onClick={handleLogin}
            loading={loggingIn}
            disabled={loggingIn}
          >
            登录
          </Button>
        )}
        {isLoggedIn && (
          <Button className="bb-btn-outline profile-login" onClick={logout}>
            退出登录
          </Button>
        )}
      </View>

      <View className="bb-section">
        <View className="bb-card profile-stats">
          <Text className="bb-card-title">我的统计</Text>
          <View className="profile-stats__grid">
            <View className="profile-stat">
              <Text className="profile-stat__num">{stats.total}</Text>
              <Text className="profile-stat__label">总愿望</Text>
            </View>
            <View className="profile-stat">
              <Text className="profile-stat__num">{stats.success}</Text>
              <Text className="profile-stat__label">已成功</Text>
            </View>
            <View className="profile-stat">
              <Text className="profile-stat__num">{stats.ongoing}</Text>
              <Text className="profile-stat__label">进行中</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card profile-menu">
          {['我的订单', '消息通知', '设置', '使用帮助', '意见反馈', '关于我们'].map((item) => (
            <View key={item} className="profile-menu__item">
              <Text>{item}</Text>
              <Text className="profile-menu__arrow">›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card">
          <Text className="bb-muted">
            免责声明：本产品仅提供表达与流程建议，不承诺/保证任何超自然结果；代许愿为服务行为，提供过程记录，不承诺结果。
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
