/**
 * 云函数 API（聚合入口）
 *
 * 说明：
 * - 使用 cloud.getWXContext() 获取 OPENID 作为用户身份，不再使用 JWT
 * - 数据使用云数据库集合：users / wishes / analyses / orders
 * - DeepSeek Key 通过云函数环境变量配置（DEEPSEEK_API_KEY）
 */
const cloud = require('wx-server-sdk');
const axios = require('axios');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const SENSITIVE_WORDS = ['赌博', '诈骗', '杀人', '伤害', '报复', '诅咒', '违法', '犯罪'];

function ok(data) {
  return { code: 0, data };
}

function fail(msg, code = -1) {
  return { code, msg };
}

function nowDate() {
  return new Date();
}

function ensureString(value) {
  return typeof value === 'string' ? value : '';
}

function checkSensitiveWords(text) {
  const lowerText = ensureString(text).toLowerCase();
  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return { safe: false, reason: `包含敏感词: ${word}` };
    }
  }
  return { safe: true };
}

async function msgSecCheck(text) {
  const content = ensureString(text).trim();
  if (!content) {
    return { safe: false, reason: '内容不能为空' };
  }

  if (content.length > 1000) {
    return { safe: false, reason: '内容过长，请控制在1000字以内' };
  }

  const localCheck = checkSensitiveWords(content);
  if (!localCheck.safe) {
    return localCheck;
  }

  try {
    await cloud.openapi.security.msgSecCheck({ content });
    return { safe: true };
  } catch (error) {
    // 云开发没开通/没权限时兜底：仅使用本地敏感词
    return { safe: true };
  }
}

function generateUnlockToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function analyzeWishByDeepSeek(wishText, deity = '', profile = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key未配置');
  }

  const systemPrompt = `你是一个专业的愿望分析助手。请分析用户提供的愿望，找出缺失的要素和潜在问题，并提供优化建议。

分析维度：
1. 缺失要素：时间范围、目标量化、方式边界、行动承诺、还愿/回向等
2. 潜在原因：表达抽象、目标不可验证、边界不清、与现实约束冲突、过度执念等
3. 优化建议：提供优化后的许愿稿、结构化字段建议、具体步骤

要求：
- 输出JSON格式
- 缺失要素和潜在原因用数组列出
- 优化建议要具体、可操作
- 确保内容合法合规，不涉及伤害他人、违法、赌博等
- 如果检测到不当内容，建议调整为善意、合法的表达

输出格式：
{
  "missing_elements": ["时间范围", "目标量化"],
  "possible_reasons": ["表达过于抽象", "目标不可验证"],
  "optimized_text": "优化后的许愿稿",
  "structured_suggestion": {
    "time_range": "建议时间范围",
    "target_quantify": "建议量化目标",
    "way_boundary": "建议方式边界",
    "action_commitment": "建议行动承诺",
    "return_wish": "建议还愿/回向"
  },
  "steps": ["步骤1", "步骤2", "步骤3"],
  "warnings": ["合规提示"]
}`;

  const userPrompt = `请分析以下愿望：
${deity ? `对象：${deity}\n` : ''}${profile.name ? `称呼：${profile.name}\n` : ''}${
    profile.city ? `城市：${profile.city}\n` : ''
  }
愿望内容：${wishText}

请提供详细的分析和优化建议。`;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(content);
  } catch (error) {
    return {
      missing_elements: [],
      possible_reasons: [],
      optimized_text: content,
      structured_suggestion: {},
      steps: [],
      warnings: []
    };
  }
}

async function ensureUser(openid, userInfo) {
  const users = db.collection('users');
  const now = nowDate();

  const existing = await users.where({ _openid: openid }).limit(1).get();
  if (existing.data && existing.data.length > 0) {
    const current = existing.data[0];
    if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
      await users.doc(current._id).update({
        data: {
          nickname: userInfo.nickName || current.nickname || null,
          avatar_url: userInfo.avatarUrl || current.avatar_url || null,
          updated_at: now
        }
      });
    }
    return { id: current._id, nickname: current.nickname, avatar_url: current.avatar_url };
  }

  const addRes = await users.add({
    data: {
      nickname: userInfo?.nickName || null,
      avatar_url: userInfo?.avatarUrl || null,
      created_at: now,
      updated_at: now
    }
  });

  return { id: addRes._id, nickname: userInfo?.nickName || undefined, avatar_url: userInfo?.avatarUrl || undefined };
}

async function enforceHourlyLimit(openid, collectionName, maxRequests) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const countRes = await db
    .collection(collectionName)
    .where({ _openid: openid, created_at: _.gte(since) })
    .count();
  return countRes.total < maxRequests;
}

async function handleAuthLogin(openid, data) {
  const user = await ensureUser(openid, data?.user_info);
  return ok({ user });
}

async function handleWishAnalyze(openid, data) {
  const wishText = ensureString(data?.wish_text);
  const deity = ensureString(data?.deity);
  const profile = data?.profile || {};

  const sec = await msgSecCheck(wishText);
  if (!sec.safe) return fail(sec.reason);

  const allowed = await enforceHourlyLimit(openid, 'analyses', 20);
  if (!allowed) return fail('请求过于频繁，请稍后再试', -1);

  const analysisResult = await analyzeWishByDeepSeek(wishText, deity, profile);
  const missingElements = analysisResult.missing_elements || [];
  const possibleReasons = analysisResult.possible_reasons || [];

  const unlockToken = generateUnlockToken();
  const unlockTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const now = nowDate();

  const addRes = await db.collection('analyses').add({
    data: {
      wish_id: data?.wish_id || null,
      wish_text: wishText,
      analysis_result: {
        missing_elements: missingElements,
        possible_reasons: possibleReasons
      },
      full_result: {
        optimized_text: analysisResult.optimized_text || '',
        structured_suggestion: analysisResult.structured_suggestion || {},
        steps: analysisResult.steps || [],
        warnings: analysisResult.warnings || []
      },
      unlocked: false,
      unlock_token: unlockToken,
      unlock_token_expires_at: unlockTokenExpiresAt,
      unlock_token_used: false,
      created_at: now
    }
  });

  return ok({
    analysis_id: addRes._id,
    missing_elements: missingElements,
    possible_reasons: possibleReasons,
    locked: true,
    unlock_token: unlockToken,
    unlock_token_expires_at: unlockTokenExpiresAt.getTime()
  });
}

async function findAnalysisForUnlock(openid, unlockToken) {
  const res = await db
    .collection('analyses')
    .where({
      _openid: openid,
      unlock_token: unlockToken,
      unlock_token_used: false,
      unlock_token_expires_at: _.gt(nowDate())
    })
    .limit(1)
    .get();
  return res.data?.[0] || null;
}

async function handleUnlock(openid, data) {
  const unlockToken = ensureString(data?.unlock_token);
  const analysisId = ensureString(data?.analysis_id);
  if (!unlockToken || !analysisId) return fail('缺少unlock_token或analysis_id');

  // 解锁频控（简化）
  const allowed = await enforceHourlyLimit(openid, 'unlock_logs', 10);
  if (!allowed) return fail('解锁次数过多，请稍后再试');

  const analysis = await findAnalysisForUnlock(openid, unlockToken);
  if (!analysis) return fail('解锁token无效或已过期');
  if (analysis._id !== analysisId) return fail('analysis_id不匹配');

  await db.collection('analyses').doc(analysis._id).update({
    data: {
      unlocked: true,
      unlock_token_used: true
    }
  });

  await db.collection('unlock_logs').add({
    data: {
      analysis_id: analysis._id,
      created_at: nowDate()
    }
  });

  return ok({
    unlocked: true,
    full_result: analysis.full_result || {
      optimized_text: '',
      structured_suggestion: {},
      steps: [],
      warnings: []
    }
  });
}

async function handleUnlockStatus(openid, data) {
  const analysisId = ensureString(data?.analysis_id);
  if (!analysisId) return fail('缺少analysis_id');

  const doc = await db.collection('analyses').doc(analysisId).get().catch(() => null);
  const analysis = doc?.data || null;
  if (!analysis || analysis._openid !== openid) return fail('分析记录不存在', -1);

  return ok({
    unlocked: !!analysis.unlocked,
    unlock_token: analysis.unlock_token,
    unlock_token_expires_at: analysis.unlock_token_expires_at
      ? new Date(analysis.unlock_token_expires_at).getTime()
      : null
  });
}

async function handleWishOptimize(openid, data) {
  const wishText = ensureString(data?.wish_text);
  const deity = ensureString(data?.deity);
  const profile = data?.profile || {};
  const analysisId = ensureString(data?.analysis_id);

  if (!analysisId) return fail('缺少analysis_id（请先调用 analyze 并完成解锁）');

  const doc = await db.collection('analyses').doc(analysisId).get().catch(() => null);
  const analysis = doc?.data || null;
  if (!analysis || analysis._openid !== openid) return fail('分析记录不存在');
  if (!analysis.unlocked) return fail('未解锁，无法使用一键 AI 优化', -1);

  const sec = await msgSecCheck(wishText);
  if (!sec.safe) return fail(sec.reason);

  const optimizedResult = await analyzeWishByDeepSeek(wishText, deity, profile);

  return ok({
    optimized_text: optimizedResult.optimized_text || '',
    structured_suggestion: optimizedResult.structured_suggestion || {},
    steps: optimizedResult.steps || [],
    warnings: optimizedResult.warnings || []
  });
}

async function handleTodosList(openid, data) {
  const status = data?.status;
  const where = { _openid: openid };
  if (status !== undefined && status !== null) where.status = Number(status);

  const res = await db.collection('wishes').where(where).orderBy('created_at', 'desc').get();
  return ok(res.data || []);
}

async function handleTodosCreate(openid, data) {
  const wishText = ensureString(data?.wish_text);
  if (!wishText.trim()) return fail('愿望原文不能为空');

  const sec = await msgSecCheck(wishText);
  if (!sec.safe) return fail(sec.reason);

  const now = nowDate();
  const addRes = await db.collection('wishes').add({
    data: {
      deity: ensureString(data?.deity) || null,
      wish_text: wishText,
      time_range: ensureString(data?.time_range) || null,
      target_quantify: ensureString(data?.target_quantify) || null,
      way_boundary: ensureString(data?.way_boundary) || null,
      action_commitment: ensureString(data?.action_commitment) || null,
      return_wish: ensureString(data?.return_wish) || null,
      status: 0,
      created_at: now,
      updated_at: now
    }
  });

  const doc = await db.collection('wishes').doc(addRes._id).get();
  return ok(doc.data);
}

async function handleTodosUpdate(openid, data) {
  const wishId = ensureString(data?.wish_id);
  const updates = data?.updates || {};
  if (!wishId) return fail('缺少wish_id');

  const doc = await db.collection('wishes').doc(wishId).get().catch(() => null);
  const wish = doc?.data || null;
  if (!wish || wish._openid !== openid) return fail('愿望不存在');

  const nextData = {};
  const allowedFields = [
    'deity',
    'wish_text',
    'time_range',
    'target_quantify',
    'way_boundary',
    'action_commitment',
    'return_wish',
    'status'
  ];
  for (const key of allowedFields) {
    if (updates[key] !== undefined) nextData[key] = updates[key];
  }
  nextData.updated_at = nowDate();

  if (nextData.wish_text) {
    const sec = await msgSecCheck(nextData.wish_text);
    if (!sec.safe) return fail(sec.reason);
  }

  await db.collection('wishes').doc(wishId).update({ data: nextData });
  const updated = await db.collection('wishes').doc(wishId).get();
  return ok(updated.data);
}

async function handleTodosDelete(openid, data) {
  const wishId = ensureString(data?.wish_id);
  if (!wishId) return fail('缺少wish_id');

  const doc = await db.collection('wishes').doc(wishId).get().catch(() => null);
  const wish = doc?.data || null;
  if (!wish || wish._openid !== openid) return fail('愿望不存在');

  await db.collection('wishes').doc(wishId).remove();
  return ok({ deleted: true });
}

function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BAIBAI${timestamp}${random}`;
}

async function handlePaymentCreate(openid, data) {
  const wishId = data?.wish_id || null;
  const now = nowDate();
  const outTradeNo = generateOrderNo();

  const addRes = await db.collection('orders').add({
    data: {
      wish_id: wishId,
      amount: 100,
      status: 0,
      out_trade_no: outTradeNo,
      created_at: now,
      updated_at: now
    }
  });

  // 纯云开发下支付对接需要额外配置商户与回调，这里保留模拟参数，便于前端联调
  return ok({
    order_id: addRes._id,
    out_trade_no: outTradeNo,
    amount: 100,
    payment_params: {
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: Math.random().toString(36).substring(2, 15),
      package: `prepay_id=wx${Date.now()}`,
      signType: 'RSA',
      paySign: 'mock_sign'
    }
  });
}

async function route(action, openid, data) {
  switch (action) {
    case 'auth.login':
      return handleAuthLogin(openid, data);
    case 'wish.analyze':
      return handleWishAnalyze(openid, data);
    case 'wish.optimize':
      return handleWishOptimize(openid, data);
    case 'unlock.ad':
    case 'unlock.share':
      return handleUnlock(openid, data);
    case 'unlock.status':
      return handleUnlockStatus(openid, data);
    case 'todos.list':
      return handleTodosList(openid, data);
    case 'todos.create':
      return handleTodosCreate(openid, data);
    case 'todos.update':
      return handleTodosUpdate(openid, data);
    case 'todos.delete':
      return handleTodosDelete(openid, data);
    case 'payment.create':
      return handlePaymentCreate(openid, data);
    default:
      return fail(`未知 action: ${action}`);
  }
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const action = ensureString(event?.action);
    const data = event?.data || {};

    if (!openid) return fail('无法获取用户身份');
    if (!action) return fail('缺少action');

    return await route(action, openid, data);
  } catch (error) {
    console.error('云函数错误:', error);
    return fail(error.message || '服务器错误');
  }
};

