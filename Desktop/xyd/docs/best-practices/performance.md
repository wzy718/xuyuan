# 性能优化指南

## 性能指标

### 关键指标
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s  
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

### 小程序指标
- **启动时间**: < 2s
- **页面切换**: < 500ms
- **接口响应**: < 1s
- **内存占用**: < 100MB

## 加载性能优化

### 1. 代码分割

```typescript
// 路由懒加载
const UserProfile = lazy(() => import('@/pages/user-profile'))

// 组件懒加载
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'))

// 使用Suspense包裹
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 2. 分包加载（小程序）

```typescript
// app.config.ts
export default {
  pages: [
    'pages/index/index',
    'pages/home/index'
  ],
  subPackages: [
    {
      root: 'packageA',
      pages: [
        'pages/profile/index',
        'pages/settings/index'
      ]
    }
  ],
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['packageA']
    }
  }
}
```

### 3. 预加载策略

```typescript
// 预加载数据
useEffect(() => {
  // 预加载下一页数据
  prefetchNextPageData()
  
  // 预加载图片
  const img = new Image()
  img.src = nextImageUrl
}, [])

// 路由预加载
Taro.preload({
  url: '/pages/detail/index',
  data: { id: 123 }
})
```

## 渲染性能优化

### 1. React优化

```typescript
// ✅ 使用memo避免不必要渲染
const ExpensiveComponent = memo(({ data }) => {
  return <View>{data}</View>
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return prevProps.data.id === nextProps.data.id
})

// ✅ 使用useMemo缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// ✅ 使用useCallback缓存函数
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// ❌ 避免内联函数
<Button onClick={() => handleClick(id)} />  // 每次渲染创建新函数
// ✅ 正确方式
<Button onClick={handleClick} />
```

### 2. 列表优化（分端策略）

#### 小程序/H5 - VirtualList
```typescript
import { VirtualList } from '@tarojs/components/virtual-list'

const Row = memo(({ data, index }) => {
  return <View key={index}>{data.name}</View>
})

<VirtualList
  height={600}
  width='100%'
  itemData={list}
  itemCount={list.length}
  itemSize={100}
  item={Row}
/>
```

#### React Native - FlashList
```typescript
import { FlashList } from '@shopify/flash-list'

const renderItem = ({ item }) => (
  <View style={styles.item}>
    <Text>{item.name}</Text>
  </View>
)

<FlashList
  data={list}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={item => item.id}
  // 性能优化选项
  drawDistance={200}
  recycleEnabled={true}
  removeClippedSubviews={true}
/>

// 长列表分页加载
const [list, setList] = useState([])
const [page, setPage] = useState(1)
const [hasMore, setHasMore] = useState(true)

const loadMore = useCallback(async () => {
  if (!hasMore) return
  
  const newData = await fetchData(page)
  setList(prev => [...prev, ...newData])
  setPage(prev => prev + 1)
  setHasMore(newData.length > 0)
}, [page, hasMore])
```

### 3. 图片优化（分端策略）

#### 小程序/H5
```typescript
import { Image } from '@tarojs/components'

// 小程序端
<Image
  src={imageUrl}
  lazyLoad
  webp  // 基础库2.10.3起支持，自动回退
  mode='aspectFill'
/>

// WebP回退策略
const getImageUrl = (url: string) => {
  // CDN动态格式处理
  if (process.env.TARO_ENV === 'h5') {
    // 检测浏览器WebP支持
    const supportsWebP = window.supportWebP // 需要预先检测
    return supportsWebP ? `${url}?format=webp` : url
  }
  // 小程序自动处理，提供多格式
  return url // CDN应同时提供.webp和.jpg/.png
}
```

#### React Native - FastImage
```typescript
import FastImage from 'react-native-fast-image'

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
  onLoadStart={() => setLoading(true)}
  onLoadEnd={() => setLoading(false)}
/>

// 图片尺寸优化
function getOptimizedImageUrl(url: string, width: number) {
  // CDN图片处理
  return `${url}?w=${width}&q=80&format=webp`
}

// 渐进式加载
const [imageQuality, setImageQuality] = useState('low')

useEffect(() => {
  // 先加载低质量
  loadImage(lowQualityUrl).then(() => {
    // 再加载高质量
    setImageQuality('high')
  })
}, [])
```

## 状态管理优化

### 1. MobX优化

```typescript
// ✅ 细粒度observable
class Store {
  @observable.shallow list = []  // 浅观察
  @observable.ref obj = {}  // 引用观察
  
  @computed get expensiveComputed() {
    // 缓存计算结果
    return this.list.filter(item => item.active)
  }
  
  @action.bound updateBatch(updates) {
    // 批量更新减少渲染
    runInAction(() => {
      updates.forEach(update => {
        this.applyUpdate(update)
      })
    })
  }
}

// ✅ 使用reaction优化副作用
reaction(
  () => store.searchText,
  text => {
    // 防抖搜索
    debounceSearch(text)
  },
  { delay: 300 }
)
```

### 2. 状态拆分

```typescript
// ❌ 大Store
class AppStore {
  user = {}
  products = []
  cart = []
  orders = []
}

// ✅ 拆分Store
class UserStore {}
class ProductStore {}
class CartStore {}
class OrderStore {}

// 按需引入
const Component = observer(() => {
  const { user } = useUserStore()  // 只订阅需要的
})
```

## 网络优化

### 1. 请求优化

```typescript
// 请求合并
const batchRequest = async (requests: Promise[]) => {
  return Promise.all(requests)
}

// 请求缓存
const cache = new Map()

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url)
  }
  
  const data = await fetch(url)
  cache.set(url, data)
  
  // 设置过期时间
  setTimeout(() => cache.delete(url), 5 * 60 * 1000)
  
  return data
}

// 请求取消
const controller = new AbortController()

fetch(url, { signal: controller.signal })

// 组件卸载时取消请求
useEffect(() => {
  return () => controller.abort()
}, [])
```

### 2. 数据预取

```typescript
// SWR数据预取
import useSWR, { mutate } from 'swr'

// 预取数据
mutate('/api/user', fetchUser())

// 使用预取的数据
const { data } = useSWR('/api/user', fetcher)
```

## 包体积优化

### 1. 依赖优化

```javascript
// webpack配置
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        common: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
}

// Tree Shaking
import { debounce } from 'lodash-es'  // ✅ ES模块
import _ from 'lodash'  // ❌ 全量引入
```

### 2. 动态导入

```typescript
// 按需加载重型库
const loadChart = async () => {
  const { Chart } = await import('chart.js')
  return new Chart(ctx, config)
}

// 条件加载
if (needsPolyfill) {
  await import('polyfill-library')
}
```

## React Native性能优化

### 1. 动画优化
```typescript
// 使用Reanimated 3
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated'

const AnimatedComponent = () => {
  const translateX = useSharedValue(0)
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }))
  
  const handlePress = () => {
    'worklet'  // 在UI线程运行
    translateX.value = withSpring(100)
  }
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress}>
        <Text>点击动画</Text>
      </Pressable>
    </Animated.View>
  )
}
```

### 2. 手势优化
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

const pan = Gesture.Pan()
  .onUpdate((e) => {
    'worklet'
    translateX.value = e.translationX
  })
  .onEnd(() => {
    'worklet'
    translateX.value = withSpring(0)
  })

<GestureDetector gesture={pan}>
  <Animated.View style={animatedStyle} />
</GestureDetector>
```

### 3. 存储优化
```typescript
// MMKV高性能存储
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({
  id: 'user-storage',
  encryptionKey: 'encryption-key',
})

// 同步操作，极快
storage.set('user', JSON.stringify(userData))
const user = JSON.parse(storage.getString('user') || '{}')
```

## 小程序优化

### 1. 数据优化

```typescript
// ✅ 只更新必要数据
this.setData({
  'list[0].name': 'new name'  // 精确更新
})

// ❌ 避免频繁setData
for (let i = 0; i < 100; i++) {
  this.setData({ [`item${i}`]: value })  // 错误
}

// ✅ 批量更新
const updates = {}
for (let i = 0; i < 100; i++) {
  updates[`item${i}`] = value
}
this.setData(updates)  // 一次更新
```

### 2. 组件优化

```typescript
// 使用组件懒加载
Component({
  options: {
    lazyload: true
  }
})

// 自定义组件优化
Component({
  options: {
    pureDataPattern: /^_/,  // 纯数据字段
    multipleSlots: true,    // 多slot支持
    virtualHost: true       // 虚拟化组件节点
  }
})
```

## 监控与分析

### 1. 性能监控

```typescript
// 自定义性能监控
class PerformanceMonitor {
  mark(name: string) {
    performance.mark(name)
  }
  
  measure(name: string, startMark: string, endMark: string) {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    console.log(`${name}: ${measure.duration}ms`)
    
    // 上报性能数据
    this.report({
      name,
      duration: measure.duration
    })
  }
}

// 使用
monitor.mark('fetch-start')
await fetchData()
monitor.mark('fetch-end')
monitor.measure('fetch-time', 'fetch-start', 'fetch-end')
```

### 2. 错误监控

```typescript
// 全局错误捕获
window.addEventListener('unhandledrejection', event => {
  console.error('Promise rejection:', event.reason)
  reportError(event.reason)
})

// React错误边界
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('React error:', error, errorInfo)
    reportError({ error, errorInfo })
  }
}
```

## 优化检查清单

### 加载优化
- [ ] 启用代码分割
- [ ] 配置分包加载
- [ ] 实现预加载
- [ ] 优化首屏资源
- [ ] 使用CDN加速

### 渲染优化
- [ ] 使用React.memo
- [ ] 实现虚拟列表
- [ ] 优化重渲染
- [ ] 图片懒加载
- [ ] 使用Web Workers

### 网络优化
- [ ] 接口合并
- [ ] 数据缓存
- [ ] 请求并发控制
- [ ] 使用HTTP/2
- [ ] 启用Gzip

### 包体积优化
- [ ] Tree Shaking
- [ ] 代码压缩
- [ ] 图片压缩
- [ ] 字体优化
- [ ] 依赖分析

---
*性能优化是持续的过程，需要不断监控和改进*