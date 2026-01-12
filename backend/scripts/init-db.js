/**
 * 数据库初始化脚本
 * 创建所有必要的表结构
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD
  });

  const dbName = process.env.DB_NAME || 'baibai_db';

  try {
    // 创建数据库
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${dbName} 创建成功`);

    await connection.execute(`USE \`${dbName}\``);

    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        openid VARCHAR(64) UNIQUE NOT NULL,
        unionid VARCHAR(64),
        nickname VARCHAR(64),
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_openid (openid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 用户表创建成功');

    // 创建愿望表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wishes (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        deity VARCHAR(32),
        wish_text TEXT NOT NULL,
        time_range VARCHAR(128),
        target_quantify VARCHAR(128),
        way_boundary VARCHAR(128),
        action_commitment VARCHAR(128),
        return_wish TEXT,
        status TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 愿望表创建成功');

    // 创建分析记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analyses (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        wish_id BIGINT,
        wish_text TEXT NOT NULL,
        analysis_result JSON,
        full_result JSON,
        unlocked BOOLEAN DEFAULT FALSE,
        unlock_token VARCHAR(64) UNIQUE,
        unlock_token_expires_at TIMESTAMP,
        unlock_token_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_wish_id (wish_id),
        INDEX idx_unlock_token (unlock_token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (wish_id) REFERENCES wishes(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 分析记录表创建成功');

    // 创建订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        wish_id BIGINT,
        amount INT NOT NULL,
        status TINYINT DEFAULT 0,
        payment_id VARCHAR(64) UNIQUE,
        out_trade_no VARCHAR(64) UNIQUE NOT NULL,
        transaction_id VARCHAR(64),
        callback_received BOOLEAN DEFAULT FALSE,
        callback_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_payment_id (payment_id),
        INDEX idx_out_trade_no (out_trade_no),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (wish_id) REFERENCES wishes(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 订单表创建成功');

    // 创建用户会话表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        openid VARCHAR(64) NOT NULL,
        access_token VARCHAR(128) UNIQUE NOT NULL,
        refresh_token VARCHAR(128) UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        device_fingerprint VARCHAR(128),
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_access_token (access_token),
        INDEX idx_openid (openid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 用户会话表创建成功');

    console.log('\n🎉 数据库初始化完成！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 执行初始化
initDatabase().catch(console.error);
