# 架构设计

## 技术选型

### 核心框架
- **Taro 3.6**: 小程序/H5统一开发框架
- **React 18**: UI框架
- **React Native 0.72**: 原生App框架
- **TypeScript**: 类型安全
- **MobX 6**: 状态管理（全端通用）

### UI组件库矩阵
| 平台 | 组件库 | 说明 |
|-----|-------|------|
| 小程序/H5 | NutUI React | 京东风格组件库 |
| React Native | React Native Paper | Material Design 3 |
| 统一 | Design Token | 跨端设计变量 |

## 项目结构

```
src/
├── app.tsx                 # 应用入口
├── app.config.ts          # 应用配置
├── app.scss               # 全局样式
│
├── pages/                 # 页面组件
│   ├── index/            # 首页
│   ├── commitment/       # 约定管理
│   ├── relationship/     # 关系管理
│   └── profile/          # 个人中心
│
├── components/            # 公共组件
│   ├── common/           # 通用组件
│   ├── commitment/       # 约定组件
│   └── relationship/     # 关系组件
│
├── stores/               # 状态管理
│   ├── user.store.ts    # 用户状态
│   ├── commitment.store.ts # 约定状态
│   └── theme.store.ts   # 主题状态
│
├── services/             # API服务
├── utils/                # 工具函数
├── hooks/                # 自定义Hooks
├── constants/            # 常量定义
└── types/                # 类型定义
```

## 设计模式

### 组件设计原则
1. **单一职责**: 每个组件只负责一个功能
2. **组合优于继承**: 使用组合模式构建复杂组件
3. **Props接口清晰**: 明确定义组件接口

### 状态管理策略
- **全局状态**: MobX Store（用户、主题、约定）
- **组件状态**: useState/useReducer
- **服务端状态**: SWR/React Query（可选）

### 数据流
```
用户操作 → Action → Store → View更新
         ↓
      API调用 → 数据持久化
```

## 跨端适配

### 条件编译
```typescript
// 平台特定代码
if (process.env.TARO_ENV === 'weapp') {
  // 微信小程序
} else if (process.env.TARO_ENV === 'h5') {
  // H5
}
```

### API适配
```typescript
// 统一API封装
class StorageService {
  set(key: string, value: any) {
    return Taro.setStorage({ key, data: value })
  }
  
  get(key: string) {
    return Taro.getStorage({ key })
  }
}
```

## 性能优化

### 代码分割
- 路由懒加载
- 动态导入组件
- 分包加载（小程序）

### 渲染优化
- React.memo 优化组件
- useMemo/useCallback 优化计算
- 虚拟列表（长列表）

### 资源优化
- 图片懒加载
- WebP格式（支持的平台）
- CDN加速

## 安全考虑

### 数据安全
- 本地数据加密存储
- HTTPS传输
- Token认证

### 代码安全
- 输入验证
- XSS防护
- 敏感信息不暴露

## React Native基础设施

### 导航系统
```typescript
// React Navigation 6
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
```

### 动画与手势
```typescript
// Reanimated 3
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated'

// Gesture Handler
import { GestureHandlerRootView } from 'react-native-gesture-handler'
```

### 长列表优化
```typescript
// FlashList (Shopify)
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
/>
```

### 存储方案
```typescript
// MMKV (高性能KV存储)
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()
storage.set('key', 'value')
```

### 图片优化
```typescript
// FastImage
import FastImage from 'react-native-fast-image'

<FastImage
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 权限管理
```typescript
// React Native Permissions
import { check, request, PERMISSIONS } from 'react-native-permissions'

const cameraPermission = await request(
  Platform.OS === 'ios' 
    ? PERMISSIONS.IOS.CAMERA 
    : PERMISSIONS.ANDROID.CAMERA
)
```

## 相关文档
- [开发指南](../development/README.md)
- [组件设计](./components.md)
- [状态管理](./state-management.md)
- [Design Token](../design-tokens.md)