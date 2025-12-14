# Mermaid2PPTX（Mermaid → 美化 → 可编辑 PPTX）项目规划文档 v2.0

> 目标：把 Mermaid 图表代码转换成**可编辑**的 PowerPoint（PPTX）文件，并提供主题美化、模板库与计费能力，形成 SaaS（v1 不做多用户协同）。

---

## 0. 一句话定义

**用户粘贴 Mermaid → 实时预览 → 选择主题/品牌套件 → 一键导出 PPTX（节点=形状、线=线条/连接符、文字=文本）**，在 PowerPoint 里可继续编辑。

---

## 1. 项目概述

### 1.1 项目名称
**Mermaid2PPTX**

### 1.2 核心目标（v1：直接做可计费 SaaS，但不做多用户协同）
> v1 目标是“能卖、能跑、导出稳定可编辑”。协同（成员管理/共享编辑/实时协作）全部延期，避免首版被 RBAC/协作复杂度拖慢。

**v1（商业 MVP）必达**
- 登录/注册（Email/第三方任选其一，优先省心）
- Workspace（单人工作区即可）：用于租户隔离、计费归属、Brand Kit 与模板归档
- Mermaid 代码输入 + 实时预览（SVG）
- Flowchart 流程图导出为可编辑 PPTX（节点/线/文字可编辑）
- 至少 3 套预设主题（Default/Corporate/Minimal）
- 导出任务异步化：创建任务、查询状态、下载产物
- 计费开关：订阅状态驱动的功能 gating（是否可导出/导出次数/是否可用 Brand Kit 等）
- 明确“不支持/降级”的提示与导出报告（warnings）

### 1.3 目标用户
- 产品经理、架构师、技术写作者
- 需要将流程图/架构图放进 PPT 的职场用户
- 有统一品牌风格与模板资产管理需求的个人/组织（v1 先不提供协作）

### 1.4 非目标（明确写出，避免范围膨胀）
v1 阶段 **不承诺**：
- 100% 复刻 Mermaid 复杂曲线路由（仅保证视觉近似）
- 所有 Mermaid 图类型（优先 Flowchart；Sequence 作为下一阶段）
- subgraph/复杂 class 样式/HTML label/icon/image/click 等高级特性（可降级或暂不支持）
- 多用户协同相关能力：成员管理、共享编辑、实时协作（CRDT/Yjs）、评论与@（全部延期）

### 1.5 成功标准（Definition of Done / 验收口径，建议写进里程碑）
**可编辑的最低验收（v1 必须达标）**
- PowerPoint 打开后：节点是形状（Shape），文字是文本（Text），连线是线条（Line/Freeform），不是整张图片或单个大 SVG
- 用户可以在 PPT 里：改字、改填充/描边颜色、拖动节点位置、调整线条端点/折点、复制粘贴节点与连线
- 1 张图默认导出 1 页幻灯片（后续再支持多页/分页）

**兼容性验收（建议至少覆盖）**
- Windows PowerPoint 365（主验收）
- macOS PowerPoint 365（次验收）
- WPS（可选，但要明确支持级别）

**一致性验收**
- 预览与导出在配色/字体/线宽/圆角等 Token 层级一致（允许因字体差异出现轻微换行差异）

---

## 2. 关键产品能力与体验

### 2.1 主流程（用户体验）
1. 输入 Mermaid（编辑器 Monaco）
2. 实时预览（Mermaid 渲染 SVG）
3. 选择主题/模板（或 Workspace 品牌套件 Brand Kit）
4. 点击导出
5. 看到导出进度与状态（QUEUED/RUNNING/SUCCEEDED/FAILED）
6. 成功后获取下载（短期签名 URL / redirect）

### 2.3 “可编辑”到底指什么（建议写清楚，避免预期错位）
- 节点：使用 PPT 原生形状（矩形/圆角矩形/菱形/椭圆等），并尽量保持可单独选中
- 文字：使用 PPT 文本框或形状内文本；不把文字烘焙进图片
- 连线：
  - MVP：用多段直线/肘形线模拟路径，确保端点可拖拽（稳定、可控）
  - 高级：真 Connector（端点吸附形状、随形状移动），需要更底层 OpenXML 支持，作为后续增值项
- 分组：可选（例如 subgraph/泳道导出为“背景框 + 内部元素”并成组），但不要牺牲可选中可编辑

### 2.2 MVP 支持范围（Flowchart 子集建议）
**支持：**
- 基本节点形状：矩形、圆角矩形/胶囊、菱形、圆/椭圆、平行四边形（I/O）、圆柱（Database）、Subroutine（双边框）
- 边：实线/虚线/粗线、单向箭头、简单折线
- edge label：放在边中点附近（用独立文本框）
- 多行文本：简单换行与字号策略（避免溢出）

**暂不支持或降级：**
- subgraph/泳道：可先导出为普通分组或背景框（后续增强）
- 精确沿路径的 label 贴边定位
- 曲线边：可用多段折线近似，或统一导出为直线/肘形线
- HTML label / icon / image：降级为纯文本

---

## 3. 推荐总体架构（SaaS 可扩展）

> 核心原则：**Web 进程做轻业务**，导出重计算放 Worker；所有长耗时/高 CPU 都不在 Next.js 中执行。

### 3.1 架构组件（6 个组件）
A. **Next.js Web（主站 + 控制台 + BFF）**
- 落地页/模板市场/文档：SSR/SSG
- 登录后控制台：Workspace、项目、模板、账单
- 轻量 API：创建导出任务、查询任务状态、下载链接、Webhook 等（Route Handlers / Server Actions）

B. **Export Worker（导出专用服务，独立部署）**
- 消费队列任务：渲染 Mermaid → SVG 提取几何 → 生成 PPTX → 上传 → 回写状态
- 独立扩缩容，避免 Next.js 超时/抖动

C. **Postgres（主数据）**
- 用户、Workspace、多租户数据、模板/版本、导出任务、审计日志
- 可选：RLS 或 ORM 强约束隔离

D. **Redis（队列 + 缓存）**
- 队列：BullMQ（推荐）或其他队列
- 缓存：导出状态短缓存、权限/entitlements 缓存

E. **对象存储（S3/R2 等）**
- PPTX/SVG/PNG 产物
- 模板预览图、品牌资产

F. **协作能力（v2+，v1 不做）**
- v1：不提供成员与协作能力（避免 RBAC/共享带来的范围膨胀与安全风险）
- v2+：再考虑成员、共享、权限、版本、编辑锁，最终到实时协作（Yjs）

---

## 4. Next.js 内部边界（该做/不该做）

### ✅ Next.js 适合做
- UI 与页面路由（App Router）
- BFF API：创建任务、查状态、发下载 URL、Webhook
- 简单写操作（重命名模板、保存元数据）：Server Actions（可选）

### ❌ Next.js 不适合直接承担
- Mermaid 渲染 + 布局 + PPTX 生成（长耗时/高 CPU）→ **放 Worker**
- 实时协作 WebSocket/CRDT（v2+ 再评估，且不建议绑在 Web 进程）

---

## 5. 目录结构（App Router 推荐）

```txt
src/app/
  (marketing)/
    page.tsx
    pricing/page.tsx
    templates/page.tsx
    docs/page.tsx
  (app)/
    layout.tsx
    dashboard/page.tsx
    w/[workspaceId]/
      diagrams/page.tsx
      diagrams/[diagramId]/page.tsx
      templates/page.tsx
      billing/page.tsx
      # v1 不做 members

  api/
    exports/route.ts            # POST 创建导出任务（入队）
    jobs/[jobId]/route.ts       # GET 查询任务状态
    downloads/[jobId]/route.ts  # GET 生成短期下载链接 / redirect
    stripe/webhook/route.ts     # Stripe Webhook（验签 + 幂等）
```

**运行时建议：**
- Webhook & 导出任务创建：使用 **Node runtime**（更稳，利于验签/库兼容）
- Edge runtime 仅用于轻量读取/缓存场景

---

## 6. 导出 Worker：协议、状态机、幂等与可观测

### 6.1 为什么需要“协议”
- Web 进程轻量化：只入队/查状态/发下载
- Worker 可扩容：幂等、可重试
- 导出可复现：同 diagramVersion + templateVersion + options → 同结果

### 6.2 Job Payload（队列消息）建议
> 队列消息尽量短：放 ID 与关键 options，大字段从 DB 拉取。

```json
{
  "jobId": "exp_123",
  "workspaceId": "ws_1",
  "diagramId": "dg_9",
  "requestedBy": "usr_3",
  "export": {
    "format": "pptx",
    "slide": { "size": "LAYOUT_WIDE", "marginIn": 0.4 },
    "themeVersionId": "tv_12",
    "render": { "engine": "mermaid-svg", "scale": 1.0 },
    "editable": { "connectors": "lines", "text": "native" }
  },
  "idempotencyKey": "sha256(diagramVersion+themeVersion+options)"
}
```

### 6.3 Job 状态机
- `QUEUED` → `RUNNING` → `SUCCEEDED | FAILED | CANCELED`
- `progress`: 0-100（阶段式推进：渲染 20 / 解析 40 / 生成 80 / 上传 95 / 完成 100）
- 记录：
  - `error_code`、`error_message`
  - `started_at`、`finished_at`
  - `attempt`、`max_attempt`
  - `metrics_json`：节点数、边数、耗时、内存峰值等

### 6.4 幂等策略（强烈建议）
- Web：`POST /api/exports` 先查是否已存在 `idempotency_key` 且 `SUCCEEDED`，存在就复用 jobId/下载
- DB：对 `export_jobs(idempotency_key)` 建唯一约束
- Worker：同 jobId 更新同一行（产物可覆盖同 output_key 或带版本）

### 6.5 重试策略（建议默认）
- 可重试错误（队列重试）：渲染引擎崩溃、对象存储上传失败、临时网络错误
- 不可重试错误：Mermaid 语法错误（解析失败）、不支持的特性（明确 error_code）
- 重试上限：`max_attempt=3`，退避：指数退避 + 抖动

### 6.6 错误码枚举（示例）
- `E_MERMAID_SYNTAX`：Mermaid 语法错误
- `E_RENDER_FAIL`：渲染失败
- `E_SVG_PARSE_FAIL`：SVG 提取失败
- `E_UNSUPPORTED_FEATURE`：不支持的语法/特性
- `E_PPTX_GEN_FAIL`：PPTX 生成失败
- `E_UPLOAD_FAIL`：上传失败
- `E_QUOTA_EXCEEDED`：额度不足（应在 Web 层拦截为主）

---

## 7. Mermaid → PPTX 的技术路线（建议先做可交付 MVP）

### 7.1 MVP 路线（推荐）：SVG 中间态（最稳）
**流程：** Mermaid 渲染 SVG（含布局） → 解析 SVG 得到几何（node/edge bbox/path） → 坐标换算 → 用 PptxGenJS 画 shape/line/text

优势：
- Mermaid 布局可信（flowchart 默认 dagre），你不用先写布局引擎
- 文字测量、节点尺寸已由 SVG 决定，PPT 输出更稳定

### 7.2 渲染引擎选型与“可复现性”（建议在 Spike 阶段就定死）
目标是：同一份 Mermaid + 同一份 Tokens，在任何 Worker 实例上输出尽量一致的几何。

**推荐策略（按稳定性优先）：**
- Worker 端用 Headless Chromium 渲染 SVG（Playwright/Puppeteer 均可），并固定：
  - Mermaid 版本（锁定依赖版本，避免布局/样式漂移）
  - 字体集合（容器内预装字体；否则不同机器的换行会漂）
  - 渲染 viewport、DPI、缩放参数
- 严格禁用/降级 HTML label/image 等高风险特性（MVP 明确不支持），避免渲染注入与不确定性

### 7.2 终极路线（后续）：自研/引入布局引擎
- ELK/dagre/自研算法：更强“咨询风排版”、更少交叉、更聪明泳道
- 工作量大，建议作为 Pro 能力逐步迭代

---

## 8. Flowchart：形状与连线映射（可执行规则）

### 8.1 节点形状映射（建议内部统一成 NodeShape）
| Mermaid 节点语法 | 语义 | PPT 形状建议 |
|---|---|---|
| `(text)` / `([text])` | Terminator（开始/结束） | 圆角胶囊/大圆角矩形 |
| `[text]` | Process | 圆角矩形（或矩形） |
| `[[text]]` | Subprocess | 双边框矩形（外框 + 内框） |
| `{text}` | Decision | 菱形 |
| `((text))` | Event | 圆/椭圆 |
| `[(text)]` | Database | 圆柱体（can/cylinder） |
| `[/text/]`、`\[text\]`（方言） | Input/Output | 平行四边形 |
| `>text]`（方言） | Flag/特殊 | 可映射为 Flag 或降级矩形 |

> 注：Mermaid 方言/版本差异较多，解析时建议做“宽松兼容”，不认识的形状降级为矩形并打 warning。

### 8.2 连线映射（MVP）
| Mermaid 连线 | 样式 | PPT 绘制 |
|---|---|---|
| `-->` | 实线箭头 | 线条 + endArrow |
| `---` | 实线无箭头 | 线条 |
| `-.->` | 虚线箭头 | 线条 + dash + endArrow |
| `==>` | 粗线箭头 | 线宽加粗 + endArrow |
| 带 label | 线中间文字 | 独立文本框（靠近边中点） |

### 8.3 “可编辑连接符”分档策略
- **档 1（MVP）**：多段 line（直线/肘形），用户可拖动端点，稳定可控
- **档 2（高级）**：PPT Connector（端点吸附形状），需要更底层 OpenXML 支持或库增强

---

## 9. SVG 提取与坐标系换算

### 9.1 SVG 提取（Worker 内）
- 渲染出 SVG 后，解析 DOM：
  - Node：id、bbox（x/y/width/height）、形状类型、label（tspan）
  - Edge：path `d` 或 polyline points、arrow marker、label 坐标
- 处理 transform：常见有 `translate/scale`，需累乘到最终 bbox/points

### 9.2 坐标换算（SVG px → PPT）
- Slide 尺寸：16:9（默认），支持 4:3 可选
- 版心边距：`marginIn`（默认 0.4 in）
- 缩放策略：
  - `fit`：保持比例，整体居中
  - `fill`：铺满版心（可能裁切，默认不建议）
- 换算函数：`pptX = (svgX - minX) * scale + margin`（Y 同理）

### 9.3 复杂度上限与保护（避免单个图把 Worker 打爆）
建议在 Web 层与 Worker 层都做限制，并把限制写进产品提示：
- 最大节点数/边数（例如 nodes≤200, edges≤300，按真实压测再定）
- 最大 Mermaid 源码长度（例如 ≤200KB）
- Worker 超时（例如 120s）与内存上限（容器限制 + Node 参数）
- 输出 PPT 页元素上限（形状/线条/文本总数），超过则提示用户“请拆图/简化”

---

## 10. 文本策略（决定“高级感”的关键）

### 10.1 基本目标
- 不溢出、不乱跳、不小得看不清
- 中英文换行一致，行距舒服

### 10.2 MVP 文本策略（推荐）
- 字体：默认 Calibri；提供常用中文 fallback（如等线/微软雅黑/苹方等，按平台）
- 节点文本：
  - 以 SVG 提供的换行（tspan）为准优先
  - 若无 tspan：用简单换行策略（英文按词，中文按字符宽度近似）
- 超出最大行数：末行省略号（可选），并记录 warning

---

## 11. 主题与模板系统（Token 化，避免预览/导出不一致）

### 11.1 设计原则
- 自定义一套稳定 **Theme Tokens**
- 预览：tokens → Mermaid themeVariables / CSS
- 导出：tokens → PPT shape fill/line/font
- 保证“预览看起来像什么，导出也像什么”

### 11.2 Theme Tokens 示例
```json
{
  "palette": {
    "bg": "#FFFFFF",
    "nodeFill": "#F7F8FA",
    "nodeStroke": "#D0D5DD",
    "text": "#101828",
    "accent": "#2563EB"
  },
  "typography": { "fontFamily": "Calibri", "fontSize": 14, "lineHeight": 1.2 },
  "shape": { "radius": 8, "strokeWidth": 1.25, "shadow": "subtle" },
  "layout": { "nodePadding": 10, "rankSpacing": 40, "nodeSpacing": 24 },
  "edge": { "strokeWidth": 1.5, "arrow": "triangle", "dash": "short" }
}
```

### 11.3 预设主题（MVP）
- Default（蓝色简洁）
- Corporate（灰白正式）
- Minimal（线条轻、留白多）

> Colorful / Dark 可作为后续增强，优先把“导出一致性”打磨到位。

### 11.4 “公司 PPT 模板导入”路线（建议作为 Pro，但要提前预埋概念）
很多组织希望“导出的页直接落在公司的母版/字体/页眉页脚体系里”。这里建议拆两步走：

- 阶段 A（MVP）：纯代码生成 PPTX（靠 tokens 对齐视觉），不承诺完全继承用户的现有母版
- 阶段 B（Pro）：支持用户上传 `template.pptx` 作为基底（含母版/主题），导出时把图形注入指定版式的 slide 中
  - 技术上可能需要从“仅 PptxGenJS”升级为“OpenXML 注入/模板合成”能力（Zip 解包 + 修改 `ppt/slides/*.xml`）

---

## 12. 数据库设计（多租户 + 模板库 + 计费 + 审计）

### 12.1 最小可用表（建议）
- `users(id, email, name, avatar_url, created_at)`
- `workspaces(id, name, owner_user_id, created_at)`
- `workspace_owners(workspace_id, user_id, created_at)` // v1 可简化：仅 owner（也可直接用 workspaces.owner_user_id）
- `brand_kits(id, workspace_id, name, tokens_json, created_at)`
- `templates(id, workspace_id, name, is_public, created_at)`
- `template_versions(id, template_id, version, tokens_json, created_at)`
- `diagrams(id, workspace_id, title, mermaid_source, template_version_id, updated_at)`
- `diagram_versions(id, diagram_id, version, mermaid_source, updated_by, created_at)`
- `export_jobs(id, workspace_id, diagram_id, format, status, progress, file_key, idempotency_key, input_hash, created_by, created_at)`
- `billing_accounts(workspace_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)`
- `workspace_entitlements(workspace_id, ent_json, updated_at)`  // 快照表
- `usage_reservations(id, workspace_id, period_yyyymm, type, job_id, amount, created_at)` // 额度预占
- `stripe_events(event_id, received_at, processed_at)` // webhook 幂等
- `audit_logs(id, workspace_id, actor_user_id, action, entity, entity_id, metadata_json, created_at)` // v1 可选，但建议保留（排障与客服）

---

## 13. 租户隔离 + 计费 gating（v1 无成员/无协作）

### 13.1 三层校验模型
1) AuthN：你是谁（userId）
2) Workspace Owner：你是否是该 workspace 的 owner（v1 仅 owner）
3) Entitlements：workspace 允许做什么（功能开关 + 限额）

### 13.2 AccessContext 结构
```ts
type AccessContext = {
  userId: string
  workspaceId: string
  isOwner: boolean
  ent: {
    canExportPptx: boolean
    canUseBrandKit: boolean
    maxExportsPerMonth: number
    maxPrivateTemplates: number
  }
}
```

### 13.3 Guard（强制统一入口）
- `requireOwner(ctx)`
- `requireEntitlement(ctx, "canExportPptx")`
- `requireQuota(ctx, "exportsPerMonth", 1)`（用量计费启用时）

### 13.4 Quota 扣减（推荐“预占额度”）
- 创建导出任务时写 `usage_reservations`（强一致，避免并发超额）
- Job 失败是否退回：按策略决定（可先不退回，简单可控）

---

## 14. API 设计（BFF）

### 14.1 导出
- `POST /api/exports`
  - 入参：workspaceId、diagramId、themeVersionId、options
  - 逻辑：鉴权/entitlements/quota → 创建 export_jobs → 入队
  - 返回：`jobId`

- `GET /api/jobs/{jobId}`
  - 返回：status、progress、error、finishedAt、fileKey（若成功）

- `GET /api/downloads/{jobId}`
  - 若成功：生成短期签名 URL 并 redirect 或返回 url

### 14.2 Stripe
- `POST /api/stripe/webhook`
  - 幂等：`stripe_events.event_id UNIQUE`
  - 更新：`billing_accounts` + 计算并写入 `workspace_entitlements`

---

## 15. 测试与质量保证

### 15.1 单元测试
- Mermaid 解析（子集规则）：输入 → 期望 node/edge 语义
- SVG 提取：固定 SVG fixture → 期望 bbox/points
- PPTX 生成：生成后解包（OpenXML）检查关键节点存在（shape/line/text 数量）

### 15.2 E2E（Playwright）
- 编辑 → 预览 → 导出 → 下载
- 失败场景：语法错误、超额、无权限

### 15.3 Golden Tests（强烈建议）
- 维护一组“样例 Mermaid”与对应导出 pptx 的结构断言，防止回归

### 15.4 人工兼容性测试清单（每次发版至少过一遍）
- Windows PowerPoint：打开、编辑文本、拖动节点、调整线条端点、另存为
- macOS PowerPoint：同上（尤其关注字体/换行差异）
- 大图压力：100+ 节点、200+ 边的图能否在时限内导出
- 失败提示：语法错误/不支持特性/超限时，是否给出可操作的提示与定位信息

---

## 16. 可观测性与排障

- `export_jobs.metrics_json`：耗时、内存峰值、节点/边数、SVG 尺寸、缩放比例
- 结构化日志：jobId/workspaceId/diagramId
- 失败自动保留中间态（可选）：
  - SVG 产物（便于复现）
  - 解析结果 JSON（node/edge）

---

## 17. 部署与扩缩容

### 17.1 部署建议
- Next.js Web：Vercel 或容器化
- Worker：容器化服务（Fly.io/Render/K8s）按队列长度水平扩容
- Redis/Postgres/对象存储：优先托管（降低运维成本）

### 17.2 扩容策略
- Worker 根据 Redis 队列 backlog 自动扩容
- 任务超时：为渲染/生成设上限（例如 60-120s），超时失败并提示用户“图太大/不支持特性”

---

## 18. 里程碑（更稳的排期：先 Spike 后铺 UI）

### Week 0-1：技术 Spike（必须前置，决定项目成败）
- 选 5 个典型 Flowchart 样例
- 走通：Mermaid → SVG → 提取 → PPTX（可编辑）→ PowerPoint 打开验证
- 确认：坐标换算、文本换行、线条样式可接受
- 产出：成功标准对照表（哪些 Mermaid 语法支持/降级/报错）

### Week 2：v1 SaaS 骨架（先把“能付费使用”跑通）
- Next.js App Router 布局、登录后控制台骨架
- 登录/注册 + workspace 创建（单人）
- Stripe：Checkout/Portal + webhook 幂等 + entitlements 快照

### Week 3：导出任务链路（SaaS 模式）
- `POST /api/exports` 入队
- Worker 基础跑通（生成可下载 PPTX）
- `GET /api/jobs/:id` 状态轮询、下载 redirect
- 在 Web 层做订阅 gating 与额度预占

### Week 4：主题系统（MVP 3 套）
- Tokens 统一，预览与导出对齐
- 基础 Brand Kit（workspace 层）

### Week 5：打磨与上线准备
- audit_logs/metrics_json 用于排障
- 限制与错误提示（语法错误/不支持/超限）
- Golden tests + 人工兼容性测试

### Week 6：发布与监控
- 性能优化（Worker 并发、缓存）
- 上线与监控（失败率、耗时分位、队列 backlog）

---

## 19. 附录：文件结构（建议更新版）

```txt
mermaid2pptx/
  src/
    app/
      (marketing)/
      (app)/
      api/
    components/
    lib/
      mermaid/
        render.ts            # 预览端渲染/配置
      export/
        job.ts               # job 协议/错误码/状态机
        worker-client.ts     # 入队/查询封装
      parser/
        flowchart.ts         # 语义解析（轻量）
      svg/
        extract.ts           # SVG DOM 提取几何
        transform.ts         # transform 解析与矩阵运算
      pptx/
        build.ts             # PPTX 生成入口
        shapes.ts
        lines.ts
        text.ts
        coords.ts
      themes/
        tokens.ts
        presets/
    store/
    tests/
  worker/
    src/
      index.ts               # worker entry
      render-svg.ts          # Mermaid → SVG
      extract.ts             # SVG → graph geometry
      build-pptx.ts          # geometry → PPTX
      upload.ts              # 上传对象存储
      observe.ts             # metrics/logging
```

---

## 20. 结语：先交付“稳定可编辑”，再做“更聪明更美的布局”
MVP 的胜负手不是“支持所有 Mermaid”，而是：
- **导出稳定**
- **样式一致**
- **PPT 里真的好改**
- **SaaS 体系（租户/权限/计费）不返工**

以上 v2.0 文档已把“Web/Worker 边界、导出协议、幂等、权限/计费 gating”作为骨架，便于直接开工与验收。
