import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

declare const CLOUD_ENV_ID: string

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    // 启用云开发能力（需要在微信开发者工具中开通云开发并填写环境ID）
    if (typeof Taro.cloud !== 'undefined') {
      Taro.cloud.init({
        env: typeof CLOUD_ENV_ID !== 'undefined' ? CLOUD_ENV_ID : undefined,
        traceUser: true
      })
    }
  }

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return this.props.children
  }
}

export default App
