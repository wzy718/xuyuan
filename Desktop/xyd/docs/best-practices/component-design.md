# 组件设计最佳实践

## 设计原则

### 1. 单一职责原则 (SRP)
每个组件只负责一个功能，保持简单和可维护。

```typescript
// ❌ 错误：组件职责过多
const UserDashboard = () => {
  // 处理用户数据、订单、设置等多个功能
  return (
    <View>
      {/* 用户信息 */}
      {/* 订单列表 */}
      {/* 系统设置 */}
    </View>
  )
}

// ✅ 正确：拆分为独立组件
const UserDashboard = () => {
  return (
    <View>
      <UserInfo />
      <OrderList />
      <Settings />
    </View>
  )
}
```

### 2. 组件分类

```typescript
// 1. 展示组件 (Presentational)
// 只负责UI展示，通过props接收数据
const Button: FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <View onClick={onClick}>
      <Text>{label}</Text>
    </View>
  )
}

// 2. 容器组件 (Container)
// 负责数据获取和状态管理
const ButtonContainer = () => {
  const { user } = useUserStore()
  const handleClick = () => {/* 业务逻辑 */}
  
  return <Button label={user.name} onClick={handleClick} />
}

// 3. 布局组件 (Layout)
// 负责页面布局结构
const PageLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <View className='layout'>
      <Header />
      <View className='content'>{children}</View>
      <Footer />
    </View>
  )
}
```

## 组件设计模式

### 1. 复合组件模式

```typescript
// 将相关组件组合在一起
const Card = ({ children }) => <View className='card'>{children}</View>
Card.Header = ({ children }) => <View className='card-header'>{children}</View>
Card.Body = ({ children }) => <View className='card-body'>{children}</View>
Card.Footer = ({ children }) => <View className='card-footer'>{children}</View>

// 使用
<Card>
  <Card.Header>标题</Card.Header>
  <Card.Body>内容</Card.Body>
  <Card.Footer>底部</Card.Footer>
</Card>
```

### 2. 渲染属性模式

```typescript
interface DataFetcherProps<T> {
  url: string
  render: (data: T, loading: boolean) => ReactNode
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [url])
  
  return <>{render(data, loading)}</>
}

// 使用
<DataFetcher
  url='/api/user'
  render={(data, loading) => 
    loading ? <Loading /> : <UserInfo data={data} />
  }
/>
```

### 3. 高阶组件模式 (HOC)

```typescript
// 添加通用功能
function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return (props: P) => {
    const { isLoggedIn } = useUserStore()
    
    if (!isLoggedIn) {
      return <LoginPrompt />
    }
    
    return <Component {...props} />
  }
}

// 使用
const ProtectedComponent = withAuth(MyComponent)
```

### 4. 自定义Hook模式

```typescript
// 抽离组件逻辑
function useCommitment(id: string) {
  const [commitment, setCommitment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchCommitment(id)
      .then(setCommitment)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])
  
  return { commitment, loading, error }
}

// 组件中使用
const CommitmentDetail = ({ id }) => {
  const { commitment, loading, error } = useCommitment(id)
  
  if (loading) return <Loading />
  if (error) return <Error />
  return <CommitmentView data={commitment} />
}
```

## Props设计

### 1. Props接口定义

```typescript
interface ButtonProps {
  // 必需属性
  label: string
  
  // 可选属性
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  loading?: boolean
  
  // 事件处理
  onClick?: () => void
  onDoubleClick?: () => void
  
  // 样式扩展
  className?: string
  style?: CSSProperties
  
  // 子元素
  children?: ReactNode
  icon?: ReactNode
  
  // 其他HTML属性
  [key: string]: any
}

// 使用默认值
const Button: FC<ButtonProps> = ({
  size = 'medium',
  variant = 'primary',
  disabled = false,
  loading = false,
  ...rest
}) => {
  // 组件实现
}
```

### 2. Props验证

```typescript
// 运行时类型检查
import PropTypes from 'prop-types'

Button.propTypes = {
  label: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func
}

// TypeScript编译时检查
interface StrictButtonProps {
  label: string
  size: 'small' | 'medium' | 'large'  // 限定值
  count: number  // 必须是数字
  items: string[]  // 数组类型
  config: {  // 对象结构
    enabled: boolean
    timeout: number
  }
}
```

## 组件通信

### 1. 父子组件通信

```typescript
// 父传子：通过props
const Parent = () => {
  const [value, setValue] = useState('')
  return <Child value={value} onChange={setValue} />
}

// 子传父：通过回调函数
const Child = ({ value, onChange }) => {
  return (
    <Input 
      value={value}
      onInput={e => onChange(e.detail.value)}
    />
  )
}
```

### 2. 跨组件通信

```typescript
// 使用Context
const ThemeContext = createContext<ThemeConfig>(defaultTheme)

// Provider
const App = () => {
  const [theme, setTheme] = useState(defaultTheme)
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Layout />
    </ThemeContext.Provider>
  )
}

// Consumer
const ThemedButton = () => {
  const { theme } = useContext(ThemeContext)
  return <Button style={{ color: theme.primary }} />
}

// 使用MobX
const Component = observer(() => {
  const { data } = useStore()
  return <View>{data}</View>
})
```

## 组件优化

### 1. 性能优化

```typescript
// Memo优化
const ExpensiveComponent = memo(
  ({ data }) => {
    // 组件逻辑
  },
  (prevProps, nextProps) => {
    // 返回true跳过渲染
    return prevProps.data.id === nextProps.data.id
  }
)

// useMemo优化计算
const Component = ({ items }) => {
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.value - b.value),
    [items]
  )
  
  return <List items={sortedItems} />
}

// useCallback优化函数
const Component = ({ id }) => {
  const handleClick = useCallback(() => {
    doSomething(id)
  }, [id])
  
  return <Button onClick={handleClick} />
}
```

### 2. 懒加载

```typescript
// 组件懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// 使用Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>

// 条件加载
const Component = () => {
  const [showHeavy, setShowHeavy] = useState(false)
  
  return (
    <>
      <Button onClick={() => setShowHeavy(true)}>加载</Button>
      {showHeavy && <HeavyComponent />}
    </>
  )
}
```

## 组件测试

### 1. 单元测试

```typescript
import { render, fireEvent } from '@testing-library/react'

describe('Button', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Button label='Click' />)
    expect(getByText('Click')).toBeInTheDocument()
  })
  
  it('should handle click', () => {
    const handleClick = jest.fn()
    const { getByRole } = render(
      <Button label='Click' onClick={handleClick} />
    )
    
    fireEvent.click(getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### 2. 快照测试

```typescript
it('should match snapshot', () => {
  const tree = renderer
    .create(<Button label='Test' size='large' />)
    .toJSON()
  expect(tree).toMatchSnapshot()
})
```

## 组件文档

### 1. 组件注释

```typescript
/**
 * 通用按钮组件
 * 
 * @example
 * ```tsx
 * <Button 
 *   label="提交"
 *   size="large"
 *   variant="primary"
 *   onClick={handleSubmit}
 * />
 * ```
 */
export const Button: FC<ButtonProps> = (props) => {
  // ...
}
```

### 2. Storybook文档

```typescript
// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large']
    }
  }
}

export const Primary = {
  args: {
    label: 'Button',
    variant: 'primary'
  }
}

export const AllVariants = () => (
  <>
    <Button variant='primary' label='Primary' />
    <Button variant='secondary' label='Secondary' />
    <Button variant='outline' label='Outline' />
  </>
)
```

## 组件清单

### 基础组件库

```typescript
// 布局组件
- Container    // 容器
- Grid         // 栅格
- Flex         // 弹性布局
- Space        // 间距

// 表单组件
- Input        // 输入框
- Select       // 选择器
- Checkbox     // 复选框
- Radio        // 单选框
- Switch       // 开关
- DatePicker   // 日期选择

// 展示组件
- Card         // 卡片
- List         // 列表
- Table        // 表格
- Avatar       // 头像
- Badge        // 徽标
- Tag          // 标签

// 反馈组件
- Button       // 按钮
- Modal        // 弹窗
- Toast        // 轻提示
- Loading      // 加载
- Empty        // 空状态

// 导航组件
- Tabs         // 标签页
- NavBar       // 导航栏
- Pagination   // 分页
- Steps        // 步骤条
```

---
*组件是应用的基石，良好的组件设计是项目成功的关键*