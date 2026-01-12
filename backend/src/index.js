/**
 * 拜拜小程序后端服务入口
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/connection');
const authRoutes = require('./routes/auth');
const wishRoutes = require('./routes/wish');
const todoRoutes = require('./routes/todo');
const unlockRoutes = require('./routes/unlock');
const paymentRoutes = require('./routes/payment');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/wish', wishRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/unlock', unlockRoutes);
app.use('/api/payment', paymentRoutes);

// 错误处理
app.use(errorHandler);

// 启动服务
async function start() {
  try {
    // 初始化数据库连接
    await initDatabase();
    console.log('✅ 数据库连接成功');

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

start();
