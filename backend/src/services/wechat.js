/**
 * 微信服务
 */
const axios = require('axios');

/**
 * 获取微信access_token（用于调用微信API）
 */
let accessTokenCache = {
  token: null,
  expiresAt: 0
};

async function getWechatAccessToken() {
  const now = Date.now();
  
  // 如果缓存有效，直接返回
  if (accessTokenCache.token && now < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET
      }
    });

    if (response.data.errcode) {
      throw new Error(`获取access_token失败: ${response.data.errmsg}`);
    }

    // 缓存token，提前5分钟过期
    accessTokenCache.token = response.data.access_token;
    accessTokenCache.expiresAt = now + (response.data.expires_in - 300) * 1000;

    return accessTokenCache.token;
  } catch (error) {
    console.error('获取微信access_token失败:', error);
    throw error;
  }
}

/**
 * 微信登录：code2session
 */
async function code2Session(code) {
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (response.data.errcode) {
      throw new Error(`code2session失败: ${response.data.errmsg}`);
    }

    return {
      openid: response.data.openid,
      session_key: response.data.session_key,
      unionid: response.data.unionid || null
    };
  } catch (error) {
    console.error('微信登录失败:', error);
    throw error;
  }
}

module.exports = {
  getWechatAccessToken,
  code2Session
};
