# 问题排查指南

## 分析结果弹窗问题

### 问题：弹窗显示不完整，看不到失败案例

#### 已修复的问题

1. **ScrollView 高度问题**
   - 修改了 `.analysis-modal` 使用固定高度 `height: 80vh`
   - 修改了 `.analysis-content` 使用 `flex: 1` 和 `overflow-y: auto`
   - 添加了 `-webkit-overflow-scrolling: touch` 支持 iOS 平滑滚动

2. **AI Prompt 优化**
   - 优化了 `quickAnalyzeWish` 的 prompt，明确要求返回 `case` 和 `posture` 字段
   - 添加了默认值兜底，确保即使 AI 返回为空也有内容显示
   - 添加了调试日志，方便排查问题

3. **数据结构**
   - 确保云函数返回包含 `failure_case` 和 `correct_posture` 字段
   - 前端类型定义已更新

#### 调试步骤

如果弹窗仍然显示不完整，请按以下步骤排查：

1. **检查控制台日志**
   - 打开微信开发者工具的控制台
   - 点击"开始分析"
   - 查看以下日志：
     - `handleAnalyze - response:` - 查看云函数返回的完整数据
     - `handleAnalyze - setting result:` - 查看设置到状态的数据
     - `AnalysisModal - result:` - 查看弹窗组件接收到的数据
     - `quickAnalyzeWish - parsed result:` - 查看云函数解析的结果

2. **检查数据字段**
   - 确认 `failure_case` 和 `correct_posture` 字段是否存在
   - 确认字段值是否为空字符串

3. **检查 ScrollView 滚动**
   - 尝试在弹窗内向下滚动
   - 如果无法滚动，检查 `.analysis-content` 的样式是否正确应用

4. **检查云函数环境变量**
   - 确认 `DEEPSEEK_API_KEY` 已正确配置
   - 确认云函数已重新上传部署

#### 临时解决方案

如果问题仍然存在，可以尝试以下临时方案：

1. **调整弹窗高度**
   - 修改 `frontend/src/components/AnalysisModal/index.scss`
   - 将 `.analysis-modal` 的 `height: 80vh` 改为 `height: 70vh` 或更小

2. **移除 sticky 定位**
   - 修改 `.modal-header` 的 `position: sticky` 为 `position: relative`
   - 这样可以让标题也参与滚动

3. **使用 View 替代 ScrollView**
   - 如果 ScrollView 在小程序中表现异常
   - 可以尝试使用普通 View + `overflow-y: auto`

#### 相关文件

- `frontend/src/components/AnalysisModal/index.tsx` - 弹窗组件
- `frontend/src/components/AnalysisModal/index.scss` - 弹窗样式
- `frontend/cloudfunctions/api/index.js` - 云函数（`quickAnalyzeWish` 函数）
- `frontend/src/types/index.ts` - 类型定义

#### 下一步优化

1. 添加骨架屏加载效果
2. 优化 AI 返回内容的格式化
3. 添加错误重试机制
4. 优化弹窗动画性能
