/**
 * 解锁相关路由
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { userRateLimit } = require('../middleware/rateLimiter');
const { Analysis } = require('../db/models');
const { verifyUnlockToken } = require('../utils/token');
const { getRedis } = require('../db/connection');

/**
 * 看广告解锁
 * POST /api/unlock/ad
 */
router.post(
  '/ad',
  authenticate,
  userRateLimit(5, 60 * 60 * 1000), // 每小时最多5次解锁
  async (req, res, next) => {
    try {
      const { unlock_token, analysis_id, ad_info, device_fingerprint } = req.body;
      const userId = req.user.id;

      if (!unlock_token || !analysis_id) {
        return res.status(400).json({
          code: -1,
          msg: '缺少unlock_token或analysis_id'
        });
      }

      // 查找分析记录
      const analysis = await Analysis.findByUnlockToken(unlock_token, userId);

      if (!analysis) {
        return res.status(400).json({
          code: -1,
          msg: '解锁token无效或已过期'
        });
      }

      if (analysis.id !== parseInt(analysis_id)) {
        return res.status(400).json({
          code: -1,
          msg: 'analysis_id不匹配'
        });
      }

      // 风控检查（简化版）
      const redis = await getRedis();
      const unlockKey = `unlock:user:${userId}:${Date.now()}`;
      const recentUnlocks = await redis.keys(`unlock:user:${userId}:*`);
      
      if (recentUnlocks.length > 10) {
        return res.status(429).json({
          code: -1,
          msg: '解锁次数过多，请稍后再试'
        });
      }

      // 标记token已使用
      await Analysis.markTokenUsed(analysis.id);

      // 更新解锁状态
      await Analysis.update(analysis.id, {
        unlocked: true
      });

      // 返回完整结果
      const fullResult = analysis.full_result || {};

      res.json({
        code: 0,
        data: {
          unlocked: true,
          full_result: {
            optimized_text: fullResult.optimized_text || '',
            structured_suggestion: fullResult.structured_suggestion || {},
            steps: fullResult.steps || [],
            warnings: fullResult.warnings || []
          }
        }
      });
    } catch (error) {
      console.error('广告解锁失败:', error);
      next(error);
    }
  }
);

/**
 * 分享解锁
 * POST /api/unlock/share
 */
router.post(
  '/share',
  authenticate,
  userRateLimit(5, 60 * 60 * 1000), // 每小时最多5次解锁
  async (req, res, next) => {
    try {
      const { unlock_token, analysis_id, share_info, device_fingerprint } = req.body;
      const userId = req.user.id;

      if (!unlock_token || !analysis_id) {
        return res.status(400).json({
          code: -1,
          msg: '缺少unlock_token或analysis_id'
        });
      }

      // 查找分析记录
      const analysis = await Analysis.findByUnlockToken(unlock_token, userId);

      if (!analysis) {
        return res.status(400).json({
          code: -1,
          msg: '解锁token无效或已过期'
        });
      }

      if (analysis.id !== parseInt(analysis_id)) {
        return res.status(400).json({
          code: -1,
          msg: 'analysis_id不匹配'
        });
      }

      // 风控检查（简化版）
      const redis = await getRedis();
      const recentUnlocks = await redis.keys(`unlock:user:${userId}:*`);
      
      if (recentUnlocks.length > 10) {
        return res.status(429).json({
          code: -1,
          msg: '解锁次数过多，请稍后再试'
        });
      }

      // 标记token已使用
      await Analysis.markTokenUsed(analysis.id);

      // 更新解锁状态
      await Analysis.update(analysis.id, {
        unlocked: true
      });

      // 返回完整结果
      const fullResult = analysis.full_result || {};

      res.json({
        code: 0,
        data: {
          unlocked: true,
          full_result: {
            optimized_text: fullResult.optimized_text || '',
            structured_suggestion: fullResult.structured_suggestion || {},
            steps: fullResult.steps || [],
            warnings: fullResult.warnings || []
          }
        }
      });
    } catch (error) {
      console.error('分享解锁失败:', error);
      next(error);
    }
  }
);

/**
 * 查询解锁状态
 * GET /api/unlock/status
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const { analysis_id } = req.query;
    const userId = req.user.id;

    if (!analysis_id) {
      return res.status(400).json({
        code: -1,
        msg: '缺少analysis_id'
      });
    }

    const analysis = await Analysis.findById(parseInt(analysis_id));

    if (!analysis || analysis.user_id !== userId) {
      return res.status(404).json({
        code: -1,
        msg: '分析记录不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        unlocked: analysis.unlocked,
        unlock_token: analysis.unlock_token,
        unlock_token_expires_at: analysis.unlock_token_expires_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
