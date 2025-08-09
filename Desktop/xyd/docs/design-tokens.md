# Design Token 设计系统

Design Token是跨端统一的设计变量系统，确保各平台视觉一致性。

## 核心理念

Design Token作为单一数据源(Single Source of Truth)，定义所有设计决策，然后映射到不同平台的具体实现：
- **小程序/H5**: 映射到NutUI主题变量
- **React Native**: 映射到React Native Paper主题
- **未来扩展**: 可映射到任何UI框架

## 颜色系统 (Color Tokens)

### 基础色板

```typescript
// 品牌色
export const colors = {
  // 主色调
  primary: {
    50: '#FFF5F5',
    100: '#FED7D7',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56565',
    500: '#FF6B6B',  // 主品牌色
    600: '#E53E3E',
    700: '#C53030',
    800: '#9B2C2C',
    900: '#742A2A',
  },
  
  // 次要色
  secondary: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#4ECDC4',  // 次要色
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
  
  // 中性色
  neutral: {
    0: '#FFFFFF',
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
    1000: '#000000',
  },
  
  // 语义色
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
}

// 关系型主题色
export const relationshipColors = {
  couple: {
    primary: '#DDA0DD',
    secondary: '#B76E79',
    accent: '#FFB7C5',
    background: '#FFF5F5',
  },
  family: {
    primary: '#FFB6C1',
    secondary: '#FFF9E6',
    accent: '#98FB98',
    background: '#F0FFF0',
  },
  fitness: {
    primary: '#FFA500',
    secondary: '#4169E1',
    accent: '#32CD32',
    background: '#F5FFFA',
  },
  reading: {
    primary: '#4682B4',
    secondary: '#8B4513',
    accent: '#2F4F4F',
    background: '#F5F5DC',
  }
}
```

## 字体系统 (Typography Tokens)

```typescript
export const typography = {
  // 字体家族
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei"',
    mono: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  },
  
  // 字号 (px)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // 字重
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // 行高
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  // 字间距
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.02,
  }
}
```

## 间距系统 (Spacing Tokens)

```typescript
// 基于4px网格系统
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
}
```

## 圆角系统 (Border Radius Tokens)

```typescript
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
}
```

## 阴影系统 (Shadow Tokens)

```typescript
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}
```

## 动画系统 (Animation Tokens)

```typescript
export const animation = {
  // 持续时间 (ms)
  duration: {
    instant: 0,
    fast: 150,
    base: 300,
    slow: 500,
    slower: 1000,
  },
  
  // 缓动函数
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
}
```

## 平台映射实现

### NutUI主题映射 (小程序/H5)

```typescript
// utils/theme/nutui.ts
import { colors, typography, spacing } from '../design-tokens'

export const nutUITheme = {
  // 主题色
  primaryColor: colors.primary[500],
  primaryColorEnd: colors.primary[600],
  
  // 辅助色
  helpColor: colors.secondary[500],
  
  // 标题色
  titleColor: colors.neutral[900],
  titleColor2: colors.neutral[700],
  
  // 文本色
  textColor: colors.neutral[800],
  subTextColor: colors.neutral[600],
  disableColor: colors.neutral[400],
  
  // 背景色
  backgroundColor: colors.neutral[50],
  
  // 字体
  fontSizeBase: `${typography.fontSize.base}px`,
  fontSizeLarge: `${typography.fontSize.lg}px`,
  fontSizeSmall: `${typography.fontSize.sm}px`,
  
  // 间距
  paddingBase: `${spacing[4]}px`,
  paddingLarge: `${spacing[6]}px`,
  paddingSmall: `${spacing[2]}px`,
}
```

### React Native Paper主题映射 (RN)

```typescript
// utils/theme/paper.ts
import { colors, typography, spacing } from '../design-tokens'
import { MD3LightTheme, configureFonts } from 'react-native-paper'

const fontConfig = {
  default: {
    regular: {
      fontFamily: 'System',
      fontWeight: typography.fontWeight.normal,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: typography.fontWeight.medium,
    },
    light: {
      fontFamily: 'System',
      fontWeight: typography.fontWeight.light,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: typography.fontWeight.light,
    },
  },
}

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[500],
    primaryContainer: colors.primary[100],
    secondary: colors.secondary[500],
    secondaryContainer: colors.secondary[100],
    tertiary: colors.primary[700],
    tertiaryContainer: colors.primary[200],
    
    surface: colors.neutral[0],
    surfaceVariant: colors.neutral[50],
    surfaceDisabled: colors.neutral[200],
    
    background: colors.neutral[50],
    
    error: colors.semantic.error,
    errorContainer: '#FECACA',
    
    onPrimary: colors.neutral[0],
    onPrimaryContainer: colors.primary[900],
    onSecondary: colors.neutral[0],
    onSecondaryContainer: colors.secondary[900],
    onSurface: colors.neutral[900],
    onSurfaceVariant: colors.neutral[700],
    onSurfaceDisabled: colors.neutral[500],
    onBackground: colors.neutral[900],
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 8, // 对应 borderRadius.base
}
```

## 使用示例

### 在组件中使用

```typescript
// components/Button/index.tsx
import { colors, spacing, borderRadius, typography } from '@/utils/design-tokens'

// 跨端组件样式
const styles = {
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.base,
  },
  text: {
    color: colors.neutral[0],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  }
}

// 平台判断使用不同组件库
if (process.env.TARO_ENV === 'rn') {
  // React Native Paper Button
  return <PaperButton mode="contained">按钮</PaperButton>
} else {
  // NutUI Button
  return <NutButton type="primary">按钮</NutButton>
}
```

### 动态主题切换

```typescript
// stores/theme.store.ts
import { makeAutoObservable } from 'mobx'
import { relationshipColors } from '@/utils/design-tokens'

class ThemeStore {
  currentRelationship = 'couple'
  
  get themeColors() {
    return relationshipColors[this.currentRelationship]
  }
  
  setRelationship(type: string) {
    this.currentRelationship = type
  }
}
```

## 设计工具集成

### Figma变量导出

```javascript
// scripts/export-tokens.js
// 从Figma API导出设计变量到代码
```

### Sketch集成

```javascript
// 使用sketch-to-tokens插件导出
```

## 维护指南

1. **单一数据源**: 所有设计决策都从design-tokens导出
2. **版本控制**: Token变更需要版本记录和变更日志
3. **向后兼容**: 新增Token不影响现有实现
4. **文档同步**: Token变更需同步更新设计文档

---
*Design Token是确保跨端一致性的关键*