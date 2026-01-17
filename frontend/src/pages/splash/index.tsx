import { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Splash() {
  const [seconds, setSeconds] = useState(5)
  const [skipButtonStyle, setSkipButtonStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
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
  }, [])

  const handleExit = () => {
    const hasGuide = Taro.getStorageSync('bb_has_guide')
    if (hasGuide) {
      Taro.switchTab({ url: '/pages/index/index' })
    } else {
      Taro.redirectTo({ url: '/pages/guide/index' })
    }
  }

  return (
    <View className="bb-page splash-page">
      <View className="splash-card">
        <Text className="splash-title">开屏广告位</Text>
        <Text className="splash-subtitle">微信广告组件</Text>
      </View>
      <Button className="splash-skip" style={skipButtonStyle} onClick={handleExit}>
        跳过 {seconds}s
      </Button>
    </View>
  )
}
