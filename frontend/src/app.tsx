import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

declare const CLOUD_ENV_ID: string

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    // 启用云开发能力（需要在微信开发者工具中开通云开发并填写环境ID）
    if (typeof Taro.cloud !== 'undefined') {
      const envId = typeof CLOUD_ENV_ID !== 'undefined' ? CLOUD_ENV_ID : undefined
      if (!envId) {
        console.error('⚠️ 云环境ID未配置，请在 frontend/config/dev.js 中设置 CLOUD_ENV_ID')
        Taro.showToast({
          title: '云环境未配置',
          icon: 'none',
          duration: 2000
        })
        return
      }
      console.log('✅ 初始化云开发，环境ID:', envId)
      Taro.cloud.init({
        env: envId,
        traceUser: true
      })
    } else {
      console.error('⚠️ 云开发能力不可用，请确保在微信开发者工具中运行')
    }
  }

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return this.props.children
  }
}

export default App
