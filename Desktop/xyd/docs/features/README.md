# 功能特性

## 核心功能

### 1. 约定管理系统

#### 约定生命周期
```
草稿 → 待确认 → 进行中 → 暂停 → 完成/失败/终止
```

#### 双模式机制
- **软提醒模式**: 温柔提醒，自主完成
- **硬执行模式**: 需上传凭证，见证人验证

#### 见证人系统
- 支持1-3位见证人
- 见证人可查看进度
- 验证完成情况

### 2. 关系型主题系统

#### 💕 情侣关系 - "爱的时光机"
```scss
$couple-primary: #DDA0DD;    // 浪漫紫
$couple-secondary: #B76E79;   // 玫瑰金
$couple-accent: #FFB7C5;      // 樱花粉
```
- 爱心能量条
- 情侣相册
- 每日签到
- 惊喜约定

#### 👨‍👩‍👧 亲子关系 - "成长花园"
```scss
$family-primary: #FFB6C1;     // 温暖粉
$family-secondary: #FFF9E6;   // 淡黄
$family-accent: #98FB98;      // 薄荷绿
```
- 成长树系统
- 勋章墙
- 时光相册
- 语音鼓励

#### 💪 健身伙伴 - "能量竞技场"
```scss
$fitness-primary: #FFA500;    // 活力橙
$fitness-secondary: #4169E1;  // 运动蓝
$fitness-accent: #32CD32;     // 能量绿
```
- 能量环展示
- 排行榜系统
- 数据图表
- 实时PK

#### 📚 读书会 - "知识星球"
```scss
$reading-primary: #4682B4;    // 知性蓝
$reading-secondary: #8B4513;  // 书卷棕
$reading-accent: #2F4F4F;     // 墨水黑
```
- 3D书架
- 笔记分享
- 话题讨论
- 共读进度

### 3. AI智能辅助（RN 端：MVP 走云端 API）

#### 功能特性
- 自然语言转结构化约定
- 智能模板推荐
- 关系类型识别
- 约定建议生成

#### 技术实现
```typescript
// 小程序端 - 云函数
if (process.env.TARO_ENV === 'weapp') {
  const result = await Taro.cloud.callFunction({
    name: 'ai-process',
    data: { input }
  })
}

// H5端 - 服务端API
if (process.env.TARO_ENV === 'h5') {
  const result = await fetch('/api/ai/process', {
    method: 'POST',
    body: JSON.stringify({ input })
  })
}

// RN端 - 云端API调用（MVP方案）
if (process.env.TARO_ENV === 'rn') {
  const result = await api.post('/ai/process', { input })
  // 注：端侧TFLite推理为后续专项，非MVP范围
```

### 4. 数据同步机制

#### 离线优先策略
1. 本地SQLite/Storage存储
2. 后台自动同步
3. 冲突智能解决
4. 增量数据传输

#### 同步流程
```
本地修改 → 缓存队列 → 网络恢复 → 同步服务器 → 更新状态
```

## 特色功能

### 信誉系统
- 完成率统计
- 信誉等级
- 成就徽章
- 历史记录

### 通知系统
- 定时提醒
- 进度通知
- 见证人消息
- 系统公告

### 社交功能
- 好友系统
- 约定分享
- 点赞互动
- 评论鼓励

## 功能规划

### Phase 1 - MVP (当前)
- ✅ 基础架构
- ⬜ 约定CRUD
- ⬜ 用户系统
- ⬜ 基础主题

### Phase 2 - 增强
- ⬜ AI集成
- ⬜ 见证人系统
- ⬜ 数据同步
- ⬜ 通知提醒

### Phase 3 - 社交
- ⬜ 好友系统
- ⬜ 约定广场
- ⬜ 排行榜
- ⬜ 成就系统

## 相关文档
- [AI集成方案](./ai-integration.md)
- [主题系统设计](./theme-system.md)
- [数据同步方案](./data-sync.md)