/**
 * 愿望分析相关路由
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { contentSecurityCheck } = require('../middleware/contentSecurity');
const { userRateLimit } = require('../middleware/rateLimiter');
const { analyzeWish } = require('../services/deepseek');
const { Analysis } = require('../db/models');
const { generateUnlockToken } = require('../utils/token');

/**
 * 分析愿望
 * POST /api/wish/analyze
 */
router.post(
  '/analyze',
  authenticate,
  contentSecurityCheck,
  userRateLimit(20, 60 * 60 * 1000), // 每小时最多20次
  async (req, res, next) => {
    try {
      const { wish_text, deity, profile } = req.body;
      const userId = req.user.id;

      // 调用大模型分析（服务端自动降级：GLM→Kimi→DeepSeek）
      const analysisResult = await analyzeWish(wish_text, deity, profile || {});

      // 提取缺失要素和潜在原因（基础结果）
      const missingElements = analysisResult.missing_elements || [];
      const possibleReasons = analysisResult.possible_reasons || [];

      // 生成解锁token（5分钟过期）
      const unlockToken = generateUnlockToken(userId, 0); // analysis_id稍后更新
      const unlockTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // 保存分析记录
      const analysis = await Analysis.create(userId, {
        wish_id: req.body.wish_id || null,
        wish_text: wish_text,
        analysis_result: {
          missing_elements: missingElements,
          possible_reasons: possibleReasons
        },
        unlock_token: unlockToken,
        unlock_token_expires_at: unlockTokenExpiresAt
      });

      // 更新解锁token中的analysis_id（如果需要）
      // 这里简化处理，直接使用生成的token

      // 保存完整结果（加密或单独存储）
      await Analysis.update(analysis.id, {
        full_result: {
          optimized_text: analysisResult.optimized_text || '',
          structured_suggestion: analysisResult.structured_suggestion || {},
          steps: analysisResult.steps || [],
          warnings: analysisResult.warnings || []
        }
      });

      res.json({
        code: 0,
        data: {
          analysis_id: analysis.id,
          missing_elements: missingElements,
          possible_reasons: possibleReasons,
          locked: true,
          unlock_token: unlockToken,
          unlock_token_expires_at: unlockTokenExpiresAt.getTime()
        }
      });
    } catch (error) {
      console.error('分析愿望失败:', error);
      next(error);
    }
  }
);

/**
 * AI优化愿望（需解锁）
 * POST /api/wish/optimize
 */
router.post(
  '/optimize',
  authenticate,
  contentSecurityCheck,
  async (req, res, next) => {
    try {
      const { wish_text, deity, profile, existing_fields, analysis_id } = req.body;
      const userId = req.user.id;

      // PRD 要求：优化能力需要解锁后才能使用
      if (!analysis_id) {
        return res.status(400).json({
          code: -1,
          msg: '缺少analysis_id（请先调用 analyze 并完成解锁）'
        });
      }

      const analysis = await Analysis.findById(parseInt(analysis_id));
      if (!analysis || analysis.user_id !== userId) {
        return res.status(404).json({
          code: -1,
          msg: '分析记录不存在'
        });
      }

      if (!analysis.unlocked) {
        return res.status(403).json({
          code: -1,
          msg: '未解锁，无法使用一键 AI 优化'
        });
      }

      // 调用大模型优化（服务端自动降级：GLM→Kimi→DeepSeek）
      const optimizedResult = await analyzeWish(wish_text, deity, profile || {});

      res.json({
        code: 0,
        data: {
          optimized_text: optimizedResult.optimized_text || '',
          structured_suggestion: optimizedResult.structured_suggestion || {},
          steps: optimizedResult.steps || [],
          warnings: optimizedResult.warnings || []
        }
      });
    } catch (error) {
      console.error('优化愿望失败:', error);
      next(error);
    }
  }
);

module.exports = router;
