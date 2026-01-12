# 拜拜小程序后端服务

基于 Node.js + Express 的后端API服务。

## 目录结构

```
backend/
├── src/
│   ├── index.js              # 服务入口
│   ├── db/                   # 数据库相关
│   │   ├── connection.js    # 数据库连接
│   │   └── models.js        # 数据模型
│   ├── middleware/          # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   ├── contentSecurity.js  # 内容安全
│   │   ├── errorHandler.js  # 错误处理
│   │   └── rateLimiter.js  # 限流
│   ├── routes/             # 路由
│   │   ├── auth.js        # 认证路由
│   │   ├── wish.js        # 愿望分析路由
│   │   ├── todo.js        # TODO路由
│   │   ├── unlock.js      # 解锁路由
│   │   └── payment.js     # 支付路由
│   ├── services/          # 服务层
│   │   ├── wechat.js     # 微信服务
│   │   └── deepseek.js   # DeepSeek服务
│   └── utils/            # 工具函数
│       └── token.js      # Token工具
├── scripts/
│   └── init-db.js       # 数据库初始化脚本
├── .env.example         # 环境变量模板
└── package.json
```

## 安装和运行

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
npm run init-db

# 开发模式
npm run dev

# 生产模式
npm start
```

## API文档

### 认证相关

#### POST /api/auth/login
微信登录

**请求体：**
```json
{
  "code": "微信登录code",
  "user_info": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  },
  "device_fingerprint": "设备指纹（可选）"
}
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "access_token": "JWT token",
    "refresh_token": "刷新token",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "nickname": "用户昵称",
      "avatar_url": "头像URL"
    }
  }
}
```

#### POST /api/auth/refresh
刷新token

**请求体：**
```json
{
  "refresh_token": "刷新token"
}
```

#### GET /api/auth/profile
获取用户信息（需要认证）

### 愿望分析

#### POST /api/wish/analyze
分析愿望（需要认证）

**请求体：**
```json
{
  "wish_text": "愿望内容",
  "deity": "对象（可选）",
  "profile": {
    "name": "称呼（可选）",
    "city": "城市（可选）"
  },
  "wish_id": 123  // 可选，关联的愿望ID
}
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "analysis_id": 123,
    "missing_elements": ["时间范围", "目标量化"],
    "possible_reasons": ["表达过于抽象"],
    "locked": true,
    "unlock_token": "解锁token",
    "unlock_token_expires_at": 1699999999
  }
}
```

### TODO管理

#### GET /api/todos
获取愿望列表（需要认证）

**查询参数：**
- `status`: 状态筛选（0=未成功，1=已成功）

#### POST /api/todos
新增愿望（需要认证）

**请求体：**
```json
{
  "deity": "对象",
  "wish_text": "愿望原文",
  "time_range": "时间范围（可选）",
  "target_quantify": "目标量化（可选）",
  "way_boundary": "方式边界（可选）",
  "action_commitment": "行动承诺（可选）",
  "return_wish": "还愿/回向（可选）"
}
```

#### PUT /api/todos/:id
更新愿望（需要认证）

#### DELETE /api/todos/:id
删除愿望（需要认证）

### 解锁

#### POST /api/unlock/ad
看广告解锁（需要认证）

**请求体：**
```json
{
  "unlock_token": "解锁token",
  "analysis_id": 123,
  "ad_info": {
    "ad_id": "广告ID",
    "duration": 30,
    "completed": true
  },
  "device_fingerprint": "设备指纹（可选）"
}
```

#### POST /api/unlock/share
分享解锁（需要认证）

### 支付

#### POST /api/payment/create
创建支付订单（需要认证）

**请求体：**
```json
{
  "wish_id": 123,
  "deity": "对象",
  "wish_text": "许愿稿",
  "note": "备注（可选）"
}
```

## 数据库表结构

详见 `scripts/init-db.js`

## 安全特性

1. JWT认证
2. 内容安全审核
3. 限流保护
4. 解锁风控
5. 支付回调验签

## 开发规范

- 使用ESLint检查代码
- 遵循RESTful API设计
- 统一错误响应格式
- 重要操作记录日志
