/**
 * 认证中间件
 */
const jwt = require('jsonwebtoken');
const { UserSession } = require('../db/models');

/**
 * 验证access_token中间件
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: -1,
        msg: '未提供认证token'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 验证会话是否有效
    const session = await UserSession.findByAccessToken(token);
    if (!session) {
      return res.status(401).json({
        code: -1,
        msg: 'token已过期或无效'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.user_id,
      openid: decoded.openid
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: -1,
        msg: 'token无效或已过期'
      });
    }

    console.error('认证中间件错误:', error);
    return res.status(500).json({
      code: -1,
      msg: '服务器错误'
    });
  }
}

module.exports = {
  authenticate
};
