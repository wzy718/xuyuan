/**
 * Token工具函数
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '2h';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';

/**
 * 生成JWT access_token
 */
function generateAccessToken(userId, openid) {
  return jwt.sign(
    {
      user_id: userId,
      openid: openid
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE
    }
  );
}

/**
 * 生成refresh_token
 */
function generateRefreshToken(userId, openid) {
  return jwt.sign(
    {
      user_id: userId,
      openid: openid,
      type: 'refresh'
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRE
    }
  );
}

/**
 * 生成解锁token
 */
function generateUnlockToken(userId, analysisId) {
  const timestamp = Date.now();
  const data = `${userId}:${analysisId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex');
  
  return `${data}:${signature}`;
}

/**
 * 验证解锁token
 */
function verifyUnlockToken(token, userId, analysisId) {
  try {
    const parts = token.split(':');
    if (parts.length !== 4) {
      return { valid: false, reason: 'token格式错误' };
    }

    const [tokenUserId, tokenAnalysisId, timestamp, signature] = parts;

    if (parseInt(tokenUserId) !== userId || parseInt(tokenAnalysisId) !== analysisId) {
      return { valid: false, reason: 'token不匹配' };
    }

    // 检查过期时间（5分钟）
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 5 * 60 * 1000) {
      return { valid: false, reason: 'token已过期' };
    }

    // 验证签名
    const data = `${tokenUserId}:${tokenAnalysisId}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, reason: 'token签名无效' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'token验证失败' };
  }
}

/**
 * 生成订单号
 */
function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BAIBAI${timestamp}${random}`;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateUnlockToken,
  verifyUnlockToken,
  generateOrderNo
};
