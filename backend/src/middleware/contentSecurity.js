/**
 * 内容安全审核中间件
 */
const axios = require('axios');

/**
 * 敏感词库（示例，实际应使用更完善的词库）
 */
const SENSITIVE_WORDS = [
  '赌博', '诈骗', '杀人', '伤害', '报复', '诅咒', '违法', '犯罪'
];

/**
 * 检查敏感词
 */
function checkSensitiveWords(text) {
  const lowerText = text.toLowerCase();
  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        safe: false,
        reason: `包含敏感词: ${word}`
      };
    }
  }
  return { safe: true };
}

/**
 * 调用微信内容安全API（需要接入微信小程序服务端API）
 */
async function checkWechatContentSecurity(text) {
  // 这里需要接入微信的 msgSecCheck API
  // 由于需要access_token，实际实现时需要先获取token
  // 示例代码：
  /*
  try {
    const accessToken = await getWechatAccessToken();
    const response = await axios.post(
      `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
      {
        content: text
      }
    );
    
    if (response.data.errcode === 0) {
      return { safe: true };
    } else {
      return {
        safe: false,
        reason: '内容不符合安全规范'
      };
    }
  } catch (error) {
    console.error('微信内容安全检查失败:', error);
    // 失败时使用本地检查作为兜底
    return checkSensitiveWords(text);
  }
  */
  
  // 暂时使用本地检查
  return checkSensitiveWords(text);
}

/**
 * 内容安全审核中间件
 */
async function contentSecurityCheck(req, res, next) {
  const wishText = req.body.wish_text || req.body.text || '';

  if (!wishText || wishText.trim().length === 0) {
    return res.status(400).json({
      code: -1,
      msg: '愿望内容不能为空'
    });
  }

  // 长度限制
  if (wishText.length > 1000) {
    return res.status(400).json({
      code: -1,
      msg: '愿望内容过长，请控制在1000字以内'
    });
  }

  // 本地敏感词检查
  const localCheck = checkSensitiveWords(wishText);
  if (!localCheck.safe) {
    return res.status(400).json({
      code: -1,
      msg: localCheck.reason
    });
  }

  // 微信内容安全检查（可选，需要配置）
  if (process.env.ENABLE_WECHAT_SEC_CHECK === 'true') {
    const wechatCheck = await checkWechatContentSecurity(wishText);
    if (!wechatCheck.safe) {
      return res.status(400).json({
        code: -1,
        msg: wechatCheck.reason || '内容不符合安全规范'
      });
    }
  }

  next();
}

module.exports = {
  contentSecurityCheck,
  checkSensitiveWords,
  checkWechatContentSecurity
};
