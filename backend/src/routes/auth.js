/**
 * 认证相关路由
 */
const express = require('express');
const router = express.Router();
const { code2Session } = require('../services/wechat');
const { User } = require('../db/models');
const { UserSession } = require('../db/models');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { authenticate } = require('../middleware/auth');

/**
 * 微信登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code, user_info } = req.body;

    if (!code) {
      return res.status(400).json({
        code: -1,
        msg: '缺少code参数'
      });
    }

    // 调用微信code2session
    const sessionData = await code2Session(code);

    // 查找或创建用户
    const user = await User.findByOpenidOrCreate(sessionData.openid, {
      unionid: sessionData.unionid,
      nickname: user_info?.nickName,
      avatar_url: user_info?.avatarUrl
    });

    // 生成token
    const accessToken = generateAccessToken(user.id, user.openid);
    const refreshToken = generateRefreshToken(user.id, user.openid);

    // 计算过期时间
    const expiresIn = 2 * 60 * 60; // 2小时
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 保存会话
    await UserSession.create(
      user.id,
      user.openid,
      accessToken,
      refreshToken,
      expiresAt,
      req.body.device_fingerprint || null
    );

    res.json({
      code: 0,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    next(error);
  }
});

/**
 * 刷新token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        code: -1,
        msg: '缺少refresh_token'
      });
    }

    // 验证refresh_token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        code: -1,
        msg: '无效的refresh_token'
      });
    }

    // 生成新的access_token
    const accessToken = generateAccessToken(decoded.user_id, decoded.openid);
    const expiresIn = 2 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 更新会话
    const { UserSession } = require('../db/models');
    const db = require('../db/connection').getDb();
    await db.execute(
      'UPDATE user_sessions SET access_token = ?, expires_at = ? WHERE refresh_token = ?',
      [accessToken, expiresAt, refresh_token]
    );

    res.json({
      code: 0,
      data: {
        access_token: accessToken,
        expires_in: expiresIn
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: -1,
        msg: 'refresh_token无效或已过期'
      });
    }
    next(error);
  }
});

/**
 * 获取用户信息
 * GET /api/user/profile
 */
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        code: -1,
        msg: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
