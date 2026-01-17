import { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

// 声明开屏广告位 ID（从配置文件读取）
declare const SPLASH_AD_UNIT_ID: string

// 检查广告位 ID 是否已配置
const isAdUnitIdConfigured = (adUnitId: string | undefined): boolean => {
  return (
    typeof adUnitId !== 'undefined' &&
    adUnitId !== 'adunit-xxxxxxxxxxxxxxxx' &&
    adUnitId.trim() !== ''
  )
}

export default function Splash() {
  const [seconds, setSeconds] = useState(5)
  const [skipButtonStyle, setSkipButtonStyle] = useState<React.CSSProperties>({})

  // 检查开屏广告位 ID 是否已配置
  const splashAdUnitId = typeof SPLASH_AD_UNIT_ID !== 'undefined' ? SPLASH_AD_UNIT_ID : undefined
  const isSplashAdEnabled = isAdUnitIdConfigured(splashAdUnitId)

  useEffect(() => {
    // 如果未配置开屏广告，直接跳过
    if (!isSplashAdEnabled) {
      const hasGuide = Taro.getStorageSync('bb_has_guide')
      if (hasGuide) {
        Taro.switchTab({ url: '/pages/index/index' })
      } else {
        Taro.redirectTo({ url: '/pages/guide/index' })
      }
      return
    }

    // 获取小程序胶囊按钮位置，设置关闭按钮位置
    const menuButtonInfo = Taro.getMenuButtonBoundingClientRect()
    const systemInfo = Taro.getSystemInfoSync()
    if (menuButtonInfo && systemInfo) {
      // 关闭按钮位于胶囊按钮下方，间距 8rpx
      const top = menuButtonInfo.bottom + 8
      // 关闭按钮右边界与胶囊按钮右边界对齐
      const right = systemInfo.windowWidth - menuButtonInfo.right
      setSkipButtonStyle({
        top: `${top}px`,
        right: `${right}px`
      })
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleExit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isSplashAdEnabled])

  const handleExit = () => {
    const hasGuide = Taro.getStorageSync('bb_has_guide')
    if (hasGuide) {
      Taro.switchTab({ url: '/pages/index/index' })
    } else {
      Taro.redirectTo({ url: '/pages/guide/index' })
    }
  }

  // 如果未配置开屏广告，不渲染页面内容
  if (!isSplashAdEnabled) {
    return null
  }

  return (
    <View className="bb-page splash-page">
      <View className="splash-card">
        <Text className="splash-title">开屏广告位</Text>
        <Text className="splash-subtitle">微信广告组件</Text>
        {/* 开屏广告组件 - 仅在广告位 ID 已配置时显示 */}
        {isSplashAdEnabled && splashAdUnitId && (
          <View className="splash-ad-container">
            <ad unit-id={splashAdUnitId} type="banner" />
          </View>
        )}
      </View>
      <Button className="splash-skip" style={skipButtonStyle} onClick={handleExit}>
        跳过 {seconds}s
      </Button>
    </View>
  )
}
