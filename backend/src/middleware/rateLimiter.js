/**
 * 限流中间件
 */
const rateLimit = require('express-rate-limit');
const { getRedis } = require('../db/connection');

/**
 * 创建限流器
 */
function createLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 默认15分钟
    max: options.max || 100, // 默认最多100次请求
    message: {
      code: -1,
      msg: options.message || '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * 基于Redis的用户级别限流
 */
async function userRateLimit(maxRequests, windowMs) {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    try {
      const redis = await getRedis();
      const key = `rate_limit:user:${req.user.id}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > maxRequests) {
        return res.status(429).json({
          code: -1,
          msg: '请求过于频繁，请稍后再试'
        });
      }

      next();
    } catch (error) {
      console.error('限流中间件错误:', error);
      // Redis错误时放行，避免影响服务
      next();
    }
  };
}

module.exports = {
  createLimiter,
  userRateLimit
};
