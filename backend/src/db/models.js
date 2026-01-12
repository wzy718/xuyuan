/**
 * 数据库模型和查询方法
 */
const { getDb } = require('./connection');

/**
 * 用户模型
 */
const User = {
  /**
   * 根据openid查找或创建用户
   */
  async findByOpenidOrCreate(openid, userInfo = {}) {
    const db = getDb();
    const [users] = await db.execute(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );

    if (users.length > 0) {
      return users[0];
    }

    // 创建新用户
    const [result] = await db.execute(
      `INSERT INTO users (openid, unionid, nickname, avatar_url) 
       VALUES (?, ?, ?, ?)`,
      [openid, userInfo.unionid || null, userInfo.nickname || null, userInfo.avatar_url || null]
    );

    const [newUser] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    return newUser[0];
  },

  /**
   * 根据ID查找用户
   */
  async findById(userId) {
    const db = getDb();
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    return users[0] || null;
  },

  /**
   * 更新用户信息
   */
  async update(userId, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(userId);
    await db.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(userId);
  }
};

/**
 * 愿望/TODO模型
 */
const Wish = {
  /**
   * 创建愿望
   */
  async create(userId, wishData) {
    const db = getDb();
    const [result] = await db.execute(
      `INSERT INTO wishes (user_id, deity, wish_text, time_range, target_quantify, 
        way_boundary, action_commitment, return_wish, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId,
        wishData.deity || null,
        wishData.wish_text,
        wishData.time_range || null,
        wishData.target_quantify || null,
        wishData.way_boundary || null,
        wishData.action_commitment || null,
        wishData.return_wish || null
      ]
    );

    return this.findById(result.insertId);
  },

  /**
   * 根据ID查找愿望
   */
  async findById(wishId) {
    const db = getDb();
    const [wishes] = await db.execute(
      'SELECT * FROM wishes WHERE id = ?',
      [wishId]
    );
    return wishes[0] || null;
  },

  /**
   * 获取用户的愿望列表
   */
  async findByUserId(userId, status = null) {
    const db = getDb();
    let sql = 'SELECT * FROM wishes WHERE user_id = ?';
    const params = [userId];

    if (status !== null) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const [wishes] = await db.execute(sql, params);
    return wishes;
  },

  /**
   * 更新愿望
   */
  async update(wishId, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(wishId);
    await db.execute(
      `UPDATE wishes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(wishId);
  },

  /**
   * 删除愿望
   */
  async delete(wishId, userId) {
    const db = getDb();
    const [result] = await db.execute(
      'DELETE FROM wishes WHERE id = ? AND user_id = ?',
      [wishId, userId]
    );
    return result.affectedRows > 0;
  }
};

/**
 * 分析记录模型
 */
const Analysis = {
  /**
   * 创建分析记录
   */
  async create(userId, analysisData) {
    const db = getDb();
    const unlockToken = analysisData.unlock_token || null;
    const unlockTokenExpiresAt = analysisData.unlock_token_expires_at || null;

    const [result] = await db.execute(
      `INSERT INTO analyses (user_id, wish_id, wish_text, analysis_result, 
        unlock_token, unlock_token_expires_at, unlocked) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        analysisData.wish_id || null,
        analysisData.wish_text,
        JSON.stringify(analysisData.analysis_result || {}),
        unlockToken,
        unlockTokenExpiresAt,
        false
      ]
    );

    return this.findById(result.insertId);
  },

  /**
   * 根据ID查找分析记录
   */
  async findById(analysisId) {
    const db = getDb();
    const [analyses] = await db.execute(
      'SELECT * FROM analyses WHERE id = ?',
      [analysisId]
    );
    if (analyses.length === 0) return null;

    const analysis = analyses[0];
    if (analysis.analysis_result) {
      analysis.analysis_result = JSON.parse(analysis.analysis_result);
    }
    if (analysis.full_result) {
      analysis.full_result = JSON.parse(analysis.full_result);
    }
    return analysis;
  },

  /**
   * 根据解锁token查找分析记录
   */
  async findByUnlockToken(unlockToken, userId) {
    const db = getDb();
    const [analyses] = await db.execute(
      `SELECT * FROM analyses 
       WHERE unlock_token = ? 
         AND user_id = ? 
         AND unlock_token_expires_at > NOW()
         AND unlock_token_used = FALSE
       FOR UPDATE`,
      [unlockToken, userId]
    );

    if (analyses.length === 0) return null;

    const analysis = analyses[0];
    if (analysis.analysis_result) {
      analysis.analysis_result = JSON.parse(analysis.analysis_result);
    }
    if (analysis.full_result) {
      analysis.full_result = JSON.parse(analysis.full_result);
    }
    return analysis;
  },

  /**
   * 更新分析记录
   */
  async update(analysisId, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'analysis_result' || key === 'full_result') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      }
    });

    if (fields.length === 0) return null;

    values.push(analysisId);
    await db.execute(
      `UPDATE analyses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(analysisId);
  },

  /**
   * 标记解锁token为已使用
   */
  async markTokenUsed(analysisId) {
    const db = getDb();
    await db.execute(
      'UPDATE analyses SET unlock_token_used = TRUE WHERE id = ?',
      [analysisId]
    );
  }
};

/**
 * 用户会话模型
 */
const UserSession = {
  /**
   * 创建会话
   */
  async create(userId, openid, accessToken, refreshToken, expiresAt, deviceFingerprint) {
    const db = getDb();
    await db.execute(
      `INSERT INTO user_sessions (user_id, openid, access_token, refresh_token, expires_at, device_fingerprint) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, openid, accessToken, refreshToken, expiresAt, deviceFingerprint || null]
    );
  },

  /**
   * 根据access_token查找会话
   */
  async findByAccessToken(accessToken) {
    const db = getDb();
    const [sessions] = await db.execute(
      'SELECT * FROM user_sessions WHERE access_token = ? AND expires_at > NOW()',
      [accessToken]
    );
    return sessions[0] || null;
  },

  /**
   * 删除过期会话
   */
  async deleteExpired() {
    const db = getDb();
    await db.execute(
      'DELETE FROM user_sessions WHERE expires_at <= NOW()'
    );
  }
};

/**
 * 订单模型
 */
const Order = {
  /**
   * 创建订单
   */
  async create(userId, orderData) {
    const db = getDb();
    const [result] = await db.execute(
      `INSERT INTO orders (user_id, wish_id, amount, status, out_trade_no) 
       VALUES (?, ?, ?, 0, ?)`,
      [
        userId,
        orderData.wish_id || null,
        orderData.amount,
        orderData.out_trade_no
      ]
    );

    return this.findById(result.insertId);
  },

  /**
   * 根据ID查找订单
   */
  async findById(orderId) {
    const db = getDb();
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    return orders[0] || null;
  },

  /**
   * 根据商户订单号查找订单
   */
  async findByOutTradeNo(outTradeNo) {
    const db = getDb();
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE out_trade_no = ?',
      [outTradeNo]
    );
    return orders[0] || null;
  },

  /**
   * 更新订单
   */
  async update(orderId, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(orderId);
    await db.execute(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(orderId);
  }
};

module.exports = {
  User,
  Wish,
  Analysis,
  UserSession,
  Order
};
