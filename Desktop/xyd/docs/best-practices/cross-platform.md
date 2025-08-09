# 跨端开发最佳实践

## 平台差异处理

### 1. 环境变量判断

```typescript
// 获取当前平台
const platform = process.env.TARO_ENV

// 平台判断常量
const isWeapp = platform === 'weapp'      // 微信小程序
const isAlipay = platform === 'alipay'    // 支付宝小程序
const isH5 = platform === 'h5'            // H5
const isRN = platform === 'rn'            // React Native

// 条件执行
if (isWeapp) {
  // 微信小程序特有逻辑
  Taro.login()
} else if (isH5) {
  // H5特有逻辑
  window.localStorage.setItem('key', 'value')
}
```

### 2. 条件编译

```typescript
// 编译时条件
// #ifdef WEAPP
// 仅在微信小程序中编译
Taro.getSetting()
// #endif

// #ifndef H5
// 除了H5都编译
Taro.getSystemInfo()
// #endif

// 多平台条件
// #ifdef WEAPP || ALIPAY
// 小程序平台代码
// #endif
```

### 3. 平台特定文件

```
// 文件命名规则
component.tsx          // 通用组件
component.weapp.tsx    // 微信小程序
component.h5.tsx       // H5
component.rn.tsx       // React Native

// Taro会自动选择对应平台文件
import Component from './component'  // 自动加载平台文件
```

## API差异处理

### 1. 统一API封装

```typescript
// services/storage.ts
class StorageService {
  // 统一的存储接口
  async set(key: string, value: any) {
    if (process.env.TARO_ENV === 'h5') {
      // H5使用localStorage
      window.localStorage.setItem(key, JSON.stringify(value))
      return Promise.resolve()
    } else {
      // 小程序使用Taro API
      return Taro.setStorage({
        key,
        data: value
      })
    }
  }
  
  async get(key: string) {
    if (process.env.TARO_ENV === 'h5') {
      const value = window.localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } else {
      const { data } = await Taro.getStorage({ key })
      return data
    }
  }
  
  async remove(key: string) {
    if (process.env.TARO_ENV === 'h5') {
      window.localStorage.removeItem(key)
    } else {
      await Taro.removeStorage({ key })
    }
  }
}

export default new StorageService()
```

### 2. 网络请求封装

```typescript
// services/request.ts
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

class Request {
  private baseURL = process.env.API_BASE_URL
  
  async request<T>(config: RequestConfig): Promise<T> {
    const { url, method = 'GET', data, header = {} } = config
    
    // 添加通用header
    const headers = {
      'Content-Type': 'application/json',
      ...header
    }
    
    // 添加token
    const token = await StorageService.get('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    try {
      const response = await Taro.request({
        url: `${this.baseURL}${url}`,
        method,
        data,
        header: headers
      })
      
      // 统一错误处理
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data as T
      } else {
        throw new Error(`请求失败: ${response.statusCode}`)
      }
    } catch (error) {
      // 网络错误处理
      console.error('Network error:', error)
      throw error
    }
  }
  
  get<T>(url: string, params?: any) {
    return this.request<T>({ url, method: 'GET', data: params })
  }
  
  post<T>(url: string, data?: any) {
    return this.request<T>({ url, method: 'POST', data })
  }
}

export default new Request()
```

## 样式差异处理

### 1. 单位转换

```scss
// 设计稿750px宽度
// Taro会自动转换px为rpx（小程序）或rem（H5）

.container {
  width: 750px;  // 全屏宽度
  padding: 32px;  // 自动转换
  
  // 不需要转换的使用PX
  border: 1PX solid #ccc;  // 1物理像素
}

// 平台特定样式
.button {
  padding: 20px;
  
  /* #ifdef H5 */
  // H5特有样式
  cursor: pointer;
  user-select: none;
  /* #endif */
  
  /* #ifdef WEAPP */
  // 小程序特有样式
  button-hover: true;
  /* #endif */
}
```

### 2. 适配方案

```typescript
// utils/style.ts
import Taro from '@tarojs/taro'

// 获取系统信息
const systemInfo = Taro.getSystemInfoSync()

// 设备像素比
export const pixelRatio = systemInfo.pixelRatio || 1

// 屏幕宽度
export const screenWidth = systemInfo.screenWidth

// 屏幕高度
export const screenHeight = systemInfo.screenHeight

// 状态栏高度（用于自定义导航栏）
export const statusBarHeight = systemInfo.statusBarHeight || 0

// 胶囊按钮信息（小程序）
export const getMenuButtonInfo = () => {
  if (process.env.TARO_ENV === 'weapp') {
    return Taro.getMenuButtonBoundingClientRect()
  }
  return null
}

// 动态计算样式
export const getAdaptiveStyle = (baseSize: number) => {
  const ratio = screenWidth / 750  // 基于750设计稿
  return baseSize * ratio
}
```

## 组件差异处理

### 1. 平台特定组件

```typescript
// components/Image/index.tsx
import { Image as TaroImage, View } from '@tarojs/components'
import { FC } from 'react'

interface ImageProps {
  src: string
  mode?: string
  lazyLoad?: boolean
  className?: string
  onClick?: () => void
}

const Image: FC<ImageProps> = (props) => {
  const { src, mode = 'aspectFill', lazyLoad = true, ...rest } = props
  
  // H5平台特殊处理
  if (process.env.TARO_ENV === 'h5') {
    return (
      <View className={rest.className} onClick={rest.onClick}>
        <img 
          src={src}
          loading={lazyLoad ? 'lazy' : 'eager'}
          style={{ width: '100%', height: '100%', objectFit: mode }}
        />
      </View>
    )
  }
  
  // 小程序和RN使用Taro组件
  return (
    <TaroImage
      src={src}
      mode={mode as any}
      lazyLoad={lazyLoad}
      {...rest}
    />
  )
}

export default Image
```

### 2. 功能降级

```typescript
// 功能检测与降级
const useVibrate = () => {
  const vibrate = useCallback((duration = 100) => {
    // 检测是否支持震动
    if (Taro.vibrateShort) {
      Taro.vibrateShort({ type: 'light' })
    } else if (process.env.TARO_ENV === 'h5' && navigator.vibrate) {
      navigator.vibrate(duration)
    } else {
      // 不支持震动，使用其他反馈
      console.log('Vibration not supported')
    }
  }, [])
  
  return vibrate
}

// 使用
const Component = () => {
  const vibrate = useVibrate()
  
  const handleClick = () => {
    vibrate()
    // 其他逻辑
  }
  
  return <Button onClick={handleClick}>点击</Button>
}
```

## 路由处理

### 1. 统一路由封装

```typescript
// utils/router.ts
class Router {
  // 页面跳转
  navigateTo(url: string, params?: Record<string, any>) {
    const query = this.buildQuery(params)
    const fullUrl = query ? `${url}?${query}` : url
    
    if (process.env.TARO_ENV === 'h5') {
      // H5使用history API
      window.history.pushState(null, '', fullUrl)
    } else {
      Taro.navigateTo({ url: fullUrl })
    }
  }
  
  // 页面重定向
  redirectTo(url: string, params?: Record<string, any>) {
    const query = this.buildQuery(params)
    const fullUrl = query ? `${url}?${query}` : url
    
    if (process.env.TARO_ENV === 'h5') {
      window.location.replace(fullUrl)
    } else {
      Taro.redirectTo({ url: fullUrl })
    }
  }
  
  // 返回
  back(delta = 1) {
    if (process.env.TARO_ENV === 'h5') {
      window.history.go(-delta)
    } else {
      Taro.navigateBack({ delta })
    }
  }
  
  // 构建查询字符串
  private buildQuery(params?: Record<string, any>) {
    if (!params) return ''
    return Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
  }
}

export default new Router()
```

## 权限处理

### 1. 权限申请封装

```typescript
// utils/permission.ts
import { Platform } from 'react-native'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'

class Permission {
  // 相机权限
  async requestCamera() {
    if (process.env.TARO_ENV === 'weapp') {
      const { authSetting } = await Taro.getSetting()
      if (!authSetting['scope.camera']) {
        try {
          await Taro.authorize({ scope: 'scope.camera' })
          return true
        } catch {
          // 引导用户打开设置
          await Taro.openSetting()
          return false
        }
      }
      return true
    } else if (process.env.TARO_ENV === 'h5') {
      // H5请求相机权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        return true
      } catch {
        return false
      }
    } else if (process.env.TARO_ENV === 'rn') {
      // React Native权限处理
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA
      
      const result = await check(permission)
      if (result === RESULTS.GRANTED) {
        return true
      }
      
      const requestResult = await request(permission)
      return requestResult === RESULTS.GRANTED
    }
    return true
  }
  
  // 位置权限
  async requestLocation() {
    if (process.env.TARO_ENV === 'weapp') {
      const { authSetting } = await Taro.getSetting()
      if (!authSetting['scope.userLocation']) {
        try {
          await Taro.authorize({ scope: 'scope.userLocation' })
          return true
        } catch {
          return false
        }
      }
      return true
    } else if (process.env.TARO_ENV === 'h5') {
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        )
      })
    } else if (process.env.TARO_ENV === 'rn') {
      // React Native位置权限
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      
      const result = await check(permission)
      if (result === RESULTS.GRANTED) {
        return true
      }
      
      const requestResult = await request(permission)
      return requestResult === RESULTS.GRANTED
    }
    return true
  }
  
  // 相册权限（RN专用）
  async requestPhotoLibrary() {
    if (process.env.TARO_ENV === 'rn') {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
      
      const result = await check(permission)
      if (result === RESULTS.GRANTED) {
        return true
      }
      
      const requestResult = await request(permission)
      return requestResult === RESULTS.GRANTED
    }
    // 小程序和H5默认有权限
    return true
  }
  
  // 通知权限
  async requestNotification() {
    if (process.env.TARO_ENV === 'weapp') {
      // 小程序订阅消息
      try {
        const res = await Taro.requestSubscribeMessage({
          tmplIds: ['template-id-1', 'template-id-2']
        })
        return res['template-id-1'] === 'accept'
      } catch {
        return false
      }
    } else if (process.env.TARO_ENV === 'rn') {
      // RN推送通知权限
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.NOTIFICATIONS
        : PERMISSIONS.ANDROID.POST_NOTIFICATIONS  // Android 13+
      
      const result = await check(permission)
      if (result === RESULTS.GRANTED) {
        return true
      }
      
      const requestResult = await request(permission)
      return requestResult === RESULTS.GRANTED
    }
    // H5使用Notification API
    if (process.env.TARO_ENV === 'h5' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }
}

export default new Permission()
```

## 调试技巧

### 1. 平台特定调试

```typescript
// utils/debug.ts
class Debug {
  log(...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      const platform = process.env.TARO_ENV
      console.log(`[${platform}]`, ...args)
    }
  }
  
  error(...args: any[]) {
    const platform = process.env.TARO_ENV
    console.error(`[${platform} ERROR]`, ...args)
    
    // 错误上报
    if (process.env.NODE_ENV === 'production') {
      this.reportError(args)
    }
  }
  
  private reportError(error: any[]) {
    // 上报到监控平台
  }
}

export default new Debug()
```

### 2. 调试工具配置

```javascript
// config/dev.js
module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    __DEV__: true
  },
  mini: {
    debugReact: true,  // 开启React调试
    webpackChain(chain) {
      // 添加source-map
      chain.merge({
        devtool: 'source-map'
      })
    }
  },
  h5: {
    devServer: {
      hot: true,
      host: '0.0.0.0',
      port: 10086
    }
  }
}
```

## 性能优化

### 1. 平台特定优化

```typescript
// 小程序分包
// app.config.ts
export default {
  pages: ['pages/index/index'],
  subPackages: [
    {
      root: 'packageA',
      pages: ['pages/detail/index']
    }
  ],
  // 分包预下载
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['packageA']
    }
  }
}

// H5代码分割
const HeavyComponent = process.env.TARO_ENV === 'h5'
  ? lazy(() => import('./HeavyComponent'))
  : require('./HeavyComponent').default
```

### 2. 资源优化

```typescript
// 图片资源处理
// 注：RN 端需要引入 Platform
// import { Platform } from 'react-native'
const getImageUrl = (name: string, options?: { size?: string; format?: string }) => {
  const platform = process.env.TARO_ENV
  const { size = '2x', format } = options || {}
  
  // CDN地址
  const cdnUrl = 'https://cdn.example.com/images'
  
  // 智能格式选择
  const getFormat = () => {
    if (format) return format
    
    if (platform === 'h5') {
      // H5检测WebP支持
      const supportsWebP = typeof window !== 'undefined' && window.supportWebP
      return supportsWebP ? 'webp' : 'jpg'
    } else if (platform === 'weapp') {
      // 小程序基础库2.10.3+支持WebP，CDN提供多格式
      return 'webp'  // CDN自动回退到jpg
    } else if (platform === 'rn') {
      // React Native根据平台选择
      return Platform.OS === 'ios' ? 'jpg' : 'webp'
    }
    return 'jpg'
  }
  
  const imageFormat = getFormat()
  return `${cdnUrl}/${name}@${size}.${imageFormat}`
}

// WebP检测（H5）
if (process.env.TARO_ENV === 'h5' && typeof window !== 'undefined') {
  const checkWebP = () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const result = canvas.toDataURL('image/webp').indexOf('image/webp') === 5
    window.supportWebP = result
    return result
  }
  checkWebP()
}
```

## 测试策略

### 1. 多平台测试

```typescript
// 测试用例
describe('Cross-platform Storage', () => {
  it('should work in weapp', () => {
    process.env.TARO_ENV = 'weapp'
    // 测试小程序存储
  })
  
  it('should work in h5', () => {
    process.env.TARO_ENV = 'h5'
    // 测试H5存储
  })
})
```

---
*跨端开发需要充分考虑各平台特性和限制*