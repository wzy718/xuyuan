# 代码规范

## 命名规范

### 文件命名
```typescript
// ✅ 正确
user-profile.tsx      // 组件文件（kebab-case）
useAuth.ts           // Hook文件（camelCase）
user.store.ts        // Store文件
api.service.ts       // Service文件
Button.module.scss   // 样式模块

// ❌ 错误
UserProfile.tsx      // 组件文件不用PascalCase
use-auth.ts         // Hook文件不用kebab-case
```

### 变量命名
```typescript
// 常量 - 全大写下划线
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'

// 变量 - 小驼峰
let userCount = 0
const isLoading = false

// 函数 - 小驼峰，动词开头
function getUserInfo() {}
const handleClick = () => {}

// 类/接口 - 大驼峰
class UserService {}
interface UserInfo {}
type ButtonProps = {}

// 枚举 - 大驼峰，值全大写
enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}
```

### 组件命名
```typescript
// 组件 - 大驼峰
const UserProfile: React.FC = () => {}

// Props - 组件名+Props
interface UserProfileProps {
  userId: string
  onUpdate?: () => void
}

// 事件处理 - handle开头
const handleSubmit = () => {}
const handleUserClick = () => {}
```

## TypeScript规范

### 类型定义
```typescript
// ✅ 优先使用interface
interface User {
  id: string
  name: string
  age?: number  // 可选属性
}

// ✅ 复杂类型用type
type Status = 'pending' | 'success' | 'error'
type AsyncFunction<T> = () => Promise<T>

// ❌ 避免any
let data: any  // 错误
let data: unknown  // 正确，需要类型守卫

// ✅ 泛型命名语义化
function fetchData<TResponse>(url: string): Promise<TResponse> {}
```

### 类型导入导出
```typescript
// 类型单独导入
import type { User, Role } from '@/types'
import { useState } from 'react'

// 统一导出
export type { User, UserProps }
export { UserComponent, useUser }
```

## React规范

### 组件结构
```typescript
// ✅ 推荐的组件结构
import { memo, useCallback, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import { observer } from 'mobx-react'
import type { FC } from 'react'
import styles from './index.module.scss'

interface Props {
  title: string
  onConfirm?: () => void
}

const MyComponent: FC<Props> = ({ title, onConfirm }) => {
  // 1. Hooks
  const [count, setCount] = useState(0)
  
  // 2. 计算属性
  const doubleCount = useMemo(() => count * 2, [count])
  
  // 3. 事件处理
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1)
    onConfirm?.()
  }, [onConfirm])
  
  // 4. 副作用
  useEffect(() => {
    console.log('Component mounted')
  }, [])
  
  // 5. 渲染
  return (
    <View className={styles.container}>
      <Text>{title}: {doubleCount}</Text>
    </View>
  )
}

export default memo(observer(MyComponent))
```

### Hooks使用
```typescript
// ✅ 自定义Hook
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  
  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])
  
  const decrement = useCallback(() => {
    setCount(prev => prev - 1)
  }, [])
  
  return { count, increment, decrement }
}

// ✅ 条件使用Hook - 错误示例
if (condition) {
  useState() // ❌ 不能在条件语句中
}

// ✅ 正确方式
const [state, setState] = useState()
if (condition) {
  setState(value) // ✅ 可以条件使用状态
}
```

## MobX规范

### Store设计
```typescript
import { makeAutoObservable, runInAction } from 'mobx'

class UserStore {
  // 1. 状态定义
  user: User | null = null
  loading = false
  error: string | null = null
  
  constructor() {
    makeAutoObservable(this)
  }
  
  // 2. 计算属性
  get isLoggedIn() {
    return !!this.user
  }
  
  // 3. Action方法
  async fetchUser(id: string) {
    this.loading = true
    try {
      const user = await api.getUser(id)
      runInAction(() => {
        this.user = user
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.error = error.message
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }
  
  // 4. 同步Action
  setUser(user: User) {
    this.user = user
  }
}

export default new UserStore()
```

## 样式规范

### CSS Modules
```scss
// Button.module.scss
.container {
  padding: 16px;
  
  &-title {  // BEM命名
    font-size: 18px;
    color: var(--primary-color);  // 使用CSS变量
  }
  
  &.active {  // 状态类
    background: var(--active-bg);
  }
}

// 响应式设计
@media (max-width: 750px) {
  .container {
    padding: 12px;
  }
}
```

### 样式使用
```typescript
import styles from './Button.module.scss'
import classNames from 'classnames'

// 动态类名
<View className={classNames(
  styles.container,
  { [styles.active]: isActive }
)} />
```

## Taro规范

### API使用
```typescript
import Taro from '@tarojs/taro'

// ✅ 使用Taro API
Taro.navigateTo({ url: '/pages/user/index' })
Taro.showToast({ title: '成功' })

// ✅ 平台判断
if (process.env.TARO_ENV === 'weapp') {
  // 微信小程序特有
  Taro.login()
} else if (process.env.TARO_ENV === 'h5') {
  // H5特有
  window.localStorage.setItem('key', 'value')
}
```

### 跨端兼容
```typescript
// ✅ 条件编译
// #ifdef WEAPP
Taro.getSetting()  // 仅小程序编译
// #endif

// ✅ 动态导入
const platform = process.env.TARO_ENV
const Module = require(`./platforms/${platform}`)
```

## 注释规范

### 文件注释
```typescript
/**
 * @description 用户信息组件
 * @author 王哲一
 * @date 2025-01-09
 */
```

### 函数注释
```typescript
/**
 * 计算折扣价格
 * @param price - 原价
 * @param discount - 折扣率(0-1)
 * @returns 折扣后价格
 */
function calculatePrice(price: number, discount: number): number {
  return price * (1 - discount)
}
```

### 复杂逻辑注释
```typescript
// TODO: 优化算法复杂度
// FIXME: 修复边界条件
// NOTE: 这里使用了xxx算法，因为...
```

## Git提交规范

### 提交信息格式
```bash
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型
- **feat**: 新功能
- **fix**: 修复Bug
- **docs**: 文档更新
- **style**: 代码格式（不影响功能）
- **refactor**: 重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建/工具变更

### 示例
```bash
feat(commitment): 添加约定创建功能

- 实现基础表单
- 添加表单验证
- 集成API调用

Closes #123
```

## 代码审查清单

- [ ] 代码符合命名规范
- [ ] TypeScript类型定义完整
- [ ] 没有使用any类型
- [ ] 组件拆分合理
- [ ] 有适当的错误处理
- [ ] 有必要的注释
- [ ] 没有console.log
- [ ] 没有注释掉的代码
- [ ] 性能考虑（memo, useMemo, useCallback）
- [ ] 跨端兼容性

---
*持续更新中...*