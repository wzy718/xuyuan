/**
 * 数据库连接配置
 */
const mysql = require('mysql2/promise');
const redis = require('redis');

let dbPool = null;
let redisClient = null;

/**
 * 初始化MySQL连接池
 */
async function initDatabase() {
  if (dbPool) {
    return dbPool;
  }

  dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'baibai_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // 测试连接
  try {
    const connection = await dbPool.getConnection();
    console.log('✅ MySQL连接成功');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL连接失败:', error.message);
    throw error;
  }

  return dbPool;
}

/**
 * 初始化Redis连接
 */
async function initRedis() {
  if (redisClient) {
    return redisClient;
  }

  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis连接错误:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis连接成功');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * 获取数据库连接池
 */
function getDb() {
  if (!dbPool) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return dbPool;
}

/**
 * 获取Redis客户端
 */
async function getRedis() {
  if (!redisClient) {
    await initRedis();
  }
  return redisClient;
}

module.exports = {
  initDatabase,
  initRedis,
  getDb,
  getRedis
};
