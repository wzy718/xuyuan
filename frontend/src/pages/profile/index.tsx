import { useMemo, useState } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { authAPI, todoAPI } from '../../utils/api'
import { ensureLoginSilently, loginWithUserProfile } from '../../utils/auth'
import { useAppStore } from '../../store'
import './index.scss'

export default function Profile() {
  const { user, setUser, isLoggedIn, logout } = useAppStore()
  const [stats, setStats] = useState({ total: 0, success: 0, ongoing: 0 })

  const [loggingIn, setLoggingIn] = useState(false)
  const [bindingPhone, setBindingPhone] = useState(false)

  const displayName = useMemo(() => {
    if (user?.nickname) return user.nickname
    if (isLoggedIn) return '点击头像设置昵称'
    return '未登录用户'
  }, [user?.nickname, isLoggedIn])

  const handleLogin = async () => {
    if (loggingIn) return
    
    setLoggingIn(true)
    try {
      const result = await loginWithUserProfile()
      if (result.ok) {
        setUser(result.user || null)
        Taro.showToast({ title: '已更新头像昵称', icon: 'success' })
        loadStats()
      } else {
        Taro.showToast({ title: result.msg || '登录失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoggingIn(false)
    }
  }

  const handleAvatarClick = async () => {
    if (loggingIn) return
    if (!user?.nickname || !user?.avatar_url) {
      await handleLogin()
      return
    }
    Taro.showActionSheet({
      itemList: ['更新微信头像昵称'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          await handleLogin()
        }
      }
    })
  }

  const handleBindPhone = async (e: any) => {
    if (bindingPhone) return
    setBindingPhone(true)
    try {
      const detail = e?.detail || {}
      const errMsg = detail?.errMsg || ''
      if (typeof errMsg === 'string' && (errMsg.includes('cancel') || errMsg.includes('deny'))) {
        Taro.showToast({ title: '已取消绑定', icon: 'none' })
        return
      }

      const phoneCloudID = detail?.cloudID || detail?.cloudId
      const phoneCode = detail?.code
      if (!phoneCloudID && !phoneCode) {
        Taro.showToast({ title: '获取手机号失败', icon: 'none' })
        return
      }

      const res = await authAPI.bindPhone({
        phone_cloud_id: phoneCloudID,
        phone_code: phoneCode
      })
      if (res.code === 0) {
        setUser(res.data?.user || null)
        Taro.showToast({ title: '绑定成功', icon: 'success' })
      } else {
        Taro.showToast({ title: res.msg || '绑定失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error?.message || '绑定失败', icon: 'none' })
    } finally {
      setBindingPhone(false)
    }
  }

  const loadStats = async () => {
    const currentIsLoggedIn = useAppStore.getState().isLoggedIn
    if (!currentIsLoggedIn) return
    const response = await todoAPI.getList()
    if (response.code === 0) {
      const list = response.data || []
      const total = list.length
      const success = list.filter((item: any) => item.status === 1).length
      setStats({ total, success, ongoing: total - success })
    }
  }

  useDidShow(() => {
    void (async () => {
      await ensureLoginSilently()
      await loadStats()
    })()
  })

  const handleCopyXiaohongshu = async () => {
    const xiaohongshuId = '9190973703'
    try {
      await Taro.setClipboardData({
        data: xiaohongshuId
      })
      Taro.showToast({
        title: '复制成功，去小红书搜索就能找到我',
        icon: 'none',
        duration: 3000,
        mask: false
      })
    } catch (error: any) {
      Taro.showToast({
        title: '复制失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  }

  return (
    <ScrollView className="bb-page profile-page" scrollY>
      <View className="bb-section profile-hero">
        <View
          className="profile-avatar is-clickable"
          onClick={handleAvatarClick}
        >
          {user?.avatar_url ? (
            <Image className="profile-avatar__img" src={user.avatar_url} mode="aspectFill" />
          ) : (
            <Text className="profile-avatar__placeholder">点我</Text>
          )}
        </View>
        <Text className={`profile-name ${user?.nickname ? '' : 'is-placeholder'}`.trim()}>
          {displayName}
        </Text>
        {(!user?.nickname || !user?.avatar_url) && (
          <Button 
            className="bb-btn-outline profile-login" 
            onClick={handleLogin}
            loading={loggingIn}
            disabled={loggingIn}
          >
            微信授权
          </Button>
        )}
        {isLoggedIn && !user?.has_phone && (
          <Button
            className="bb-btn-outline profile-login"
            openType="getPhoneNumber"
            onGetPhoneNumber={handleBindPhone}
            loading={bindingPhone}
            disabled={bindingPhone}
          >
            绑定手机号
          </Button>
        )}
        {isLoggedIn && user?.has_phone && <Text className="bb-muted">手机号：已绑定</Text>}
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
          <View className="profile-menu__item">
            <Text>意见反馈&联系我</Text>
            <Text className="profile-menu__arrow">›</Text>
          </View>
          <View className="profile-xiaohongshu" onClick={handleCopyXiaohongshu}>
            <Text className="profile-xiaohongshu__label">小红书号：</Text>
            <Text className="profile-xiaohongshu__id">9190973703</Text>
          </View>
        </View>
      </View>

      <View className="bb-section">
        <View className="bb-card">
          <Text className="bb-muted">
            免责声明：本产品仅提供表达与流程建议，不承诺/保证任何超自然结果。
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
