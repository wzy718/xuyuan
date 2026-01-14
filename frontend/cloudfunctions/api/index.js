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

  if (content.length > 300) {
    return { safe: false, reason: '内容过长，请控制在300字以内' };
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

/**
 * 快速分析愿望（用于首页弹窗展示）
 * 返回：缺失要素、失败原因、失败案例、正确姿势
 * 特点：prompt 简洁，响应快速
 */
async function quickAnalyzeWish(wishText, deity = '') {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key未配置');
  }

  const systemPrompt = `你是愿望分析师。分析用户愿望是否符合标准，输出JSON格式：
{"missing":["缺失要素1","缺失要素2"],"reasons":["失败原因1","失败原因2"],"case":"类似失败案例的具体描述","posture":"正确许愿姿势的简短建议","is_qualified":true/false}

评价标准（5个要素）：
1. 时间边界：是否包含明确时间（如"3个月内"、"2026年内"等）
2. 可验证的量化目标：是否包含数字和单位（金额、分数、名次、offer等）
3. 方式与边界：是否包含合法合规、不伤害他人等表述
4. 行动承诺：是否包含"我会"、"我愿意"、"每天"等行动表述
5. 还愿/回向：是否包含还愿、回向、布施等表述（可选，但有助于形成闭环）
6. 明确的许愿人：是否包含明确的许愿人的名字和身份证号，而不是仅仅写“我”

输出要求：
1. 如果愿望符合标准（is_qualified=true）：
   - missing为空数组[]或["基本要素齐全，可进一步润色"]
   - reasons为空数组[]或["表达清晰，建议保持行动承诺并定期复盘"]
   - case给出一个成功案例或正面案例，20-100字
   - posture给出进一步优化建议或鼓励性建议，30字内
   
2. 如果愿望不符合标准（is_qualified=false）：
   - missing列出缺失的要素，2-3条，每条15字内
   - reasons列出失败原因，2-3条，每条15字内
   - case给出一个真实具体的失败案例，包含：谁、许了什么愿、为什么失败、结果如何。字数20-100字
   - posture给出具体可行的建议，30字内

3. 所有内容简洁有力，直击要害`;

  const userPrompt = `${deity ? deity + '：' : ''}${wishText}`;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    
    const isQualified = parsed.is_qualified === true || parsed.is_qualified === 'true';
    
    // 如果符合标准，使用正面反馈
    if (isQualified) {
      const result = {
        missing_elements: parsed.missing && parsed.missing.length > 0 
          ? parsed.missing 
          : ['基本要素齐全，可进一步润色表达'],
        possible_reasons: parsed.reasons && parsed.reasons.length > 0
          ? parsed.reasons
          : ['表达清晰，建议保持行动承诺并定期复盘'],
        failure_case: parsed.case || '某用户许愿"希望在3个月内找到月薪8000元以上的前端开发工作，我会每天投递5份简历并学习新技术，成功后我会还愿并捐款100元"。因为目标明确、时间清晰、行动具体，最终在2个月内成功入职心仪公司。',
        correct_posture: parsed.posture || '您的愿望表达已经很规范，建议继续保持并定期复盘进度，必要时可调整时间或目标'
      };
      
      console.log('quickAnalyzeWish - qualified result:', JSON.stringify(result, null, 2));
      return result;
    }
    
    // 如果不符合标准，使用问题分析
    const result = {
      missing_elements: parsed.missing || [],
      possible_reasons: parsed.reasons || [],
      failure_case: parsed.case || '某用户许愿"希望找到好工作"，但未明确具体岗位、薪资范围和时间期限。半年后仍未找到满意工作，因为目标模糊导致求职方向不明确，投递简历时缺乏针对性，最终只能接受一份并不理想的工作。',
      correct_posture: parsed.posture || '明确目标、设定时间、承诺行动、许下还愿'
    };
    
    console.log('quickAnalyzeWish - unqualified result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('quickAnalyzeWish - parse error:', error, 'content:', content);
    return {
      missing_elements: ['愿望表述不够清晰', '缺少具体目标'],
      possible_reasons: ['缺少时间限制', '没有量化标准'],
      failure_case: '某用户许愿"希望找到好工作"，但未明确具体岗位、薪资范围和时间期限。半年后仍未找到满意工作，因为目标模糊导致求职方向不明确，投递简历时缺乏针对性，最终只能接受一份并不理想的工作。',
      correct_posture: '明确目标金额、设定实现时间、承诺具体行动、许下还愿方式'
    };
  }
}

/**
 * 完整分析愿望（解锁后使用）
 * 返回：优化文案、结构化建议、步骤
 */
async function fullAnalyzeWish(wishText, deity = '', profile = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key未配置');
  }

  const systemPrompt = `愿望优化师。输出JSON：
{
  "optimized_text": "优化后的许愿稿",
  "structured_suggestion": {
    "time_range": "时间范围",
    "target_quantify": "量化目标",
    "way_boundary": "方式边界",
    "action_commitment": "行动承诺",
    "return_wish": "还愿/回向"
  },
  "steps": ["步骤1", "步骤2", "步骤3"]
}
要求：简洁实用，步骤3-5条。`;

  const userPrompt = `优化愿望：
${deity ? `对象：${deity}\n` : ''}${profile.name ? `称呼：${profile.name}\n` : ''}${
    profile.city ? `城市：${profile.city}\n` : ''
  }愿望：${wishText}`;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(content);
  } catch (error) {
    return {
      optimized_text: content || wishText,
      structured_suggestion: {},
      steps: [],
      warnings: []
    };
  }
}

// 保留旧函数兼容性
async function analyzeWishByDeepSeek(wishText, deity = '', profile = {}) {
  // 先做快速分析
  const quickResult = await quickAnalyzeWish(wishText, deity);
  // 再做完整分析
  const fullResult = await fullAnalyzeWish(wishText, deity, profile);
  
  return {
    missing_elements: quickResult.missing_elements,
    possible_reasons: quickResult.possible_reasons,
    failure_case: quickResult.failure_case,
    correct_posture: quickResult.correct_posture,
    optimized_text: fullResult.optimized_text,
    structured_suggestion: fullResult.structured_suggestion,
    steps: fullResult.steps,
    warnings: fullResult.warnings || []
  };
}

/**
 * 解密手机号
 * @param {string} encryptedData - 加密数据
 * @param {string} iv - 初始向量
 * @param {string} sessionKey - 会话密钥
 * @returns {string|null} 解密后的手机号
 */
async function decryptPhoneNumber(encryptedData, iv, sessionKey) {
  try {
    // 使用云函数内置的加密解密能力
    const result = cloud.getOpenData({
      list: [
        {
          cloudID: encryptedData,
          data: {
            phoneNumber: 'phoneNumber'
          }
        }
      ]
    });
    
    // 如果上述方法不可用，使用 crypto 解密
    if (!result || !result.list || result.list.length === 0) {
      const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(sessionKey, 'base64'), Buffer.from(iv, 'base64'));
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      const phoneData = JSON.parse(decrypted);
      return phoneData.phoneNumber || null;
    }
    
    return result.list[0].data?.phoneNumber || null;
  } catch (error) {
    console.error('解密手机号失败:', error);
    return null;
  }
}

async function ensureUser(openid, userInfo, phoneNumber) {
  const users = db.collection('users');
  const now = nowDate();

  const existing = await users.where({ _openid: openid }).limit(1).get();
  if (existing.data && existing.data.length > 0) {
    const current = existing.data[0];
    const updateData = {
      updated_at: now
    };
    
    // 更新用户信息
    if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
      updateData.nickname = userInfo.nickName || current.nickname || null;
      updateData.avatar_url = userInfo.avatarUrl || current.avatar_url || null;
    }
    
    // 更新手机号（如果提供了且与现有不同）
    if (phoneNumber && phoneNumber !== current.phone) {
      // 检查手机号是否已被其他用户使用
      const phoneUser = await users.where({ phone: phoneNumber, _openid: _.neq(openid) }).limit(1).get();
      if (phoneUser.data && phoneUser.data.length > 0) {
        throw new Error('该手机号已被其他账号使用');
      }
      updateData.phone = phoneNumber;
    }
    
    if (Object.keys(updateData).length > 1) { // 除了 updated_at 还有其他字段
      await users.doc(current._id).update({ data: updateData });
    }
    
    return { 
      id: current._id, 
      nickname: updateData.nickname || current.nickname, 
      avatar_url: updateData.avatar_url || current.avatar_url,
      phone: updateData.phone || current.phone || null
    };
  }

  // 新用户注册
  // 检查手机号是否已被使用
  if (phoneNumber) {
    const phoneUser = await users.where({ phone: phoneNumber }).limit(1).get();
    if (phoneUser.data && phoneUser.data.length > 0) {
      throw new Error('该手机号已被注册');
    }
  }

  const addRes = await users.add({
    data: {
      nickname: userInfo?.nickName || null,
      avatar_url: userInfo?.avatarUrl || null,
      phone: phoneNumber || null,
      created_at: now,
      updated_at: now
    }
  });

  return { 
    id: addRes._id, 
    nickname: userInfo?.nickName || undefined, 
    avatar_url: userInfo?.avatarUrl || undefined,
    phone: phoneNumber || null
  };
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
  let phoneNumber = null;
  
  // 解密手机号（使用 cloudID 方式）
  if (data?.phone_cloud_id) {
    try {
      // 使用云函数内置能力解密手机号
      // cloudID 是前端通过 Button open-type="getPhoneNumber" 获取的
      // 注意：cloudID 需要是完整的 cloudID 字符串
      const result = await cloud.getOpenData({
        list: [{
          cloudID: data.phone_cloud_id
        }]
      });
      
      if (result && result.list && result.list.length > 0) {
        const phoneData = result.list[0].data;
        phoneNumber = phoneData?.phoneNumber || null;
        console.log('手机号解密成功:', phoneNumber ? `已获取手机号: ${phoneNumber.substring(0, 3)}****${phoneNumber.substring(7)}` : '未获取');
      } else {
        console.warn('手机号解密结果为空');
      }
    } catch (error) {
      console.error('解密手机号失败:', error);
      // 手机号解密失败不影响登录，继续使用其他信息
      // 但记录错误以便排查
      console.error('解密错误详情:', error.message || error);
    }
  }
  
  const user = await ensureUser(openid, data?.user_info, phoneNumber);
  return ok({ user });
}

async function handleWishAnalyze(openid, data) {
  const wishText = ensureString(data?.wish_text);
  const deity = ensureString(data?.deity);

  const sec = await msgSecCheck(wishText);
  if (!sec.safe) return fail(sec.reason);

  const allowed = await enforceHourlyLimit(openid, 'analyses', 20);
  if (!allowed) return fail('请求过于频繁，请稍后再试', -1);

  // 只做快速分析，返回速度更快
  const quickResult = await quickAnalyzeWish(wishText, deity);

  const unlockToken = generateUnlockToken();
  const unlockTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const now = nowDate();

  const addRes = await db.collection('analyses').add({
    data: {
      wish_id: data?.wish_id || null,
      wish_text: wishText,
      deity: deity,
      analysis_result: {
        missing_elements: quickResult.missing_elements,
        possible_reasons: quickResult.possible_reasons,
        failure_case: quickResult.failure_case,
        correct_posture: quickResult.correct_posture
      },
      full_result: null, // 解锁时再生成
      unlocked: false,
      unlock_token: unlockToken,
      unlock_token_expires_at: unlockTokenExpiresAt,
      unlock_token_used: false,
      created_at: now
    }
  });

  return ok({
    analysis_id: addRes._id,
    missing_elements: quickResult.missing_elements,
    possible_reasons: quickResult.possible_reasons,
    failure_case: quickResult.failure_case,
    correct_posture: quickResult.correct_posture,
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

  // 解锁时生成完整分析结果
  let fullResult = analysis.full_result;
  if (!fullResult || !fullResult.optimized_text) {
    try {
      fullResult = await fullAnalyzeWish(
        analysis.wish_text || '',
        analysis.deity || '',
        {}
      );
    } catch (error) {
      console.error('生成完整分析失败:', error);
      fullResult = {
        optimized_text: analysis.wish_text || '',
        structured_suggestion: {},
        steps: ['明确目标', '设定时间', '采取行动'],
        warnings: []
      };
    }
  }

  await db.collection('analyses').doc(analysis._id).update({
    data: {
      unlocked: true,
      unlock_token_used: true,
      full_result: fullResult
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
    full_result: fullResult
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
  const wishData = {
    beneficiary_type: ensureString(data?.beneficiary_type) || null,
    beneficiary_desc: ensureString(data?.beneficiary_desc) || null,
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
  };
  
  const addRes = await db.collection('wishes').add({
    data: wishData
  });

  // 返回完整的数据，包含 _id
  return ok({
    _id: addRes._id,
    ...wishData
  });
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
    'beneficiary_type',
    'beneficiary_desc',
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

// 许愿人/受益人和对象信息管理
async function handleProfileList(openid, data) {
  const res = await db
    .collection('wish_profiles')
    .where({ _openid: openid })
    .orderBy('updated_at', 'desc')
    .get();
  return ok(res.data || []);
}

async function handleProfileCreate(openid, data) {
  const beneficiaryType = ensureString(data?.beneficiary_type);
  const beneficiaryDesc = ensureString(data?.beneficiary_desc || '');
  const deity = ensureString(data?.deity || '');

  if (!beneficiaryType) return fail('许愿人/受益人类型不能为空');
  if (!deity.trim()) return fail('对象不能为空');

  // 检查是否已存在相同的记录
  const existing = await db
    .collection('wish_profiles')
    .where({
      _openid: openid,
      beneficiary_type: beneficiaryType,
      beneficiary_desc: beneficiaryDesc,
      deity: deity
    })
    .limit(1)
    .get();

  const now = nowDate();
  if (existing.data && existing.data.length > 0) {
    // 更新已存在记录的更新时间
    await db.collection('wish_profiles').doc(existing.data[0]._id).update({
      data: { updated_at: now }
    });
    const updated = await db.collection('wish_profiles').doc(existing.data[0]._id).get();
    return ok(updated.data);
  }

  // 创建新记录
  const addRes = await db.collection('wish_profiles').add({
    data: {
      beneficiary_type: beneficiaryType,
      beneficiary_desc: beneficiaryDesc,
      deity: deity,
      created_at: now,
      updated_at: now
    }
  });

  const doc = await db.collection('wish_profiles').doc(addRes._id).get();
  return ok(doc.data);
}

async function handleProfileDelete(openid, data) {
  const profileId = ensureString(data?.profile_id);
  if (!profileId) return fail('缺少profile_id');

  const doc = await db.collection('wish_profiles').doc(profileId).get().catch(() => null);
  const profile = doc?.data || null;
  if (!profile || profile._openid !== openid) return fail('记录不存在');

  await db.collection('wish_profiles').doc(profileId).remove();
  return ok({ deleted: true });
}

// 人员信息管理
async function handlePersonList(openid, data) {
  const res = await db
    .collection('persons')
    .where({ _openid: openid })
    .orderBy('updated_at', 'desc')
    .get();
  return ok(res.data || []);
}

async function handlePersonCreate(openid, data) {
  const name = ensureString(data?.name || '').trim();
  const category = ensureString(data?.category || '').trim();
  const idCard = ensureString(data?.id_card || '').trim();
  const phone = ensureString(data?.phone || '').trim();

  if (!name) return fail('姓名不能为空');

  // 内容安全检查
  const sec = await msgSecCheck(name);
  if (!sec.safe) return fail(sec.reason);

  if (idCard) {
    const idCardSec = await msgSecCheck(idCard);
    if (!idCardSec.safe) return fail('身份证号包含敏感内容');
  }

  if (phone) {
    const phoneSec = await msgSecCheck(phone);
    if (!phoneSec.safe) return fail('手机号包含敏感内容');
  }

  const now = nowDate();
  const addRes = await db.collection('persons').add({
    data: {
      name: name,
      category: category || null,
      id_card: idCard || null,
      phone: phone || null,
      created_at: now,
      updated_at: now
    }
  });

  const doc = await db.collection('persons').doc(addRes._id).get();
  return ok(doc.data);
}

async function handlePersonUpdate(openid, data) {
  const personId = ensureString(data?.person_id);
  const name = ensureString(data?.name || '').trim();
  const category = ensureString(data?.category || '').trim();
  const idCard = ensureString(data?.id_card || '').trim();
  const phone = ensureString(data?.phone || '').trim();

  if (!personId) return fail('缺少person_id');
  if (!name) return fail('姓名不能为空');

  const doc = await db.collection('persons').doc(personId).get().catch(() => null);
  const person = doc?.data || null;
  if (!person || person._openid !== openid) return fail('人员信息不存在');

  // 内容安全检查
  const sec = await msgSecCheck(name);
  if (!sec.safe) return fail(sec.reason);

  if (idCard) {
    const idCardSec = await msgSecCheck(idCard);
    if (!idCardSec.safe) return fail('身份证号包含敏感内容');
  }

  if (phone) {
    const phoneSec = await msgSecCheck(phone);
    if (!phoneSec.safe) return fail('手机号包含敏感内容');
  }

  const now = nowDate();
  await db.collection('persons').doc(personId).update({
    data: {
      name: name,
      category: category || null,
      id_card: idCard || null,
      phone: phone || null,
      updated_at: now
    }
  });

  const updated = await db.collection('persons').doc(personId).get();
  return ok(updated.data);
}

async function handlePersonDelete(openid, data) {
  const personId = ensureString(data?.person_id);
  if (!personId) return fail('缺少person_id');

  const doc = await db.collection('persons').doc(personId).get().catch(() => null);
  const person = doc?.data || null;
  if (!person || person._openid !== openid) return fail('人员信息不存在');

  await db.collection('persons').doc(personId).remove();
  return ok({ deleted: true });
}

// 分类管理
async function handleCategoryList(openid, data) {
  // 先获取用户自定义分类
  const customRes = await db
    .collection('person_categories')
    .where({ _openid: openid })
    .orderBy('created_at', 'asc')
    .get();
  
  // 默认分类
  const defaultCategories = [
    { value: 'self', label: '自己', icon: '🧑', is_default: true },
    { value: 'family', label: '家人', icon: '👨‍👩‍👧', is_default: true },
    { value: 'child', label: '孩子', icon: '👶', is_default: true },
    { value: 'couple', label: '姻缘', icon: '💑', is_default: true },
    { value: 'other', label: '其他', icon: '👥', is_default: true }
  ];

  // 合并默认分类和自定义分类
  const allCategories = [
    ...defaultCategories.map(cat => ({ ...cat, id: cat.value, _id: cat.value })),
    ...(customRes.data || []).map(cat => ({ ...cat, id: cat._id }))
  ];

  return ok(allCategories);
}

async function handleCategoryCreate(openid, data) {
  const value = ensureString(data?.value || '').trim();
  const label = ensureString(data?.label || '').trim();
  const icon = ensureString(data?.icon || '').trim();

  if (!value) return fail('分类值不能为空');
  if (!label) return fail('分类名称不能为空');

  // 检查是否已存在
  const existing = await db
    .collection('person_categories')
    .where({ _openid: openid, value: value })
    .limit(1)
    .get();

  if (existing.data && existing.data.length > 0) {
    return fail('该分类已存在');
  }

  // 检查默认分类
  const defaultValues = ['self', 'family', 'child', 'couple', 'other'];
  if (defaultValues.includes(value)) {
    return fail('不能使用默认分类值');
  }

  const sec = await msgSecCheck(label);
  if (!sec.safe) return fail(sec.reason);

  const now = nowDate();
  const addRes = await db.collection('person_categories').add({
    data: {
      value: value,
      label: label,
      icon: icon || null,
      is_default: false,
      created_at: now,
      updated_at: now
    }
  });

  const doc = await db.collection('person_categories').doc(addRes._id).get();
  return ok({ ...doc.data, id: doc.data._id });
}

async function handleCategoryUpdate(openid, data) {
  const categoryId = ensureString(data?.category_id);
  const label = ensureString(data?.label || '').trim();
  const icon = ensureString(data?.icon || '').trim();

  if (!categoryId) return fail('缺少category_id');
  if (!label) return fail('分类名称不能为空');

  const doc = await db.collection('person_categories').doc(categoryId).get().catch(() => null);
  const category = doc?.data || null;
  if (!category || category._openid !== openid) return fail('分类不存在');

  if (category.is_default) {
    return fail('默认分类不能修改');
  }

  const sec = await msgSecCheck(label);
  if (!sec.safe) return fail(sec.reason);

  const now = nowDate();
  await db.collection('person_categories').doc(categoryId).update({
    data: {
      label: label,
      icon: icon || null,
      updated_at: now
    }
  });

  const updated = await db.collection('person_categories').doc(categoryId).get();
  return ok({ ...updated.data, id: updated.data._id });
}

async function handleCategoryDelete(openid, data) {
  const categoryId = ensureString(data?.category_id);
  if (!categoryId) return fail('缺少category_id');

  const doc = await db.collection('person_categories').doc(categoryId).get().catch(() => null);
  const category = doc?.data || null;
  if (!category || category._openid !== openid) return fail('分类不存在');

  if (category.is_default) {
    return fail('默认分类不能删除');
  }

  // 检查是否有人员使用该分类
  const personsRes = await db
    .collection('persons')
    .where({ _openid: openid, category: category.value })
    .count();
  
  if (personsRes.total > 0) {
    return fail('该分类下还有人员，无法删除');
  }

  await db.collection('person_categories').doc(categoryId).remove();
  return ok({ deleted: true });
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
    case 'profile.list':
      return handleProfileList(openid, data);
    case 'profile.create':
      return handleProfileCreate(openid, data);
    case 'profile.delete':
      return handleProfileDelete(openid, data);
    case 'person.list':
      return handlePersonList(openid, data);
    case 'person.create':
      return handlePersonCreate(openid, data);
    case 'person.update':
      return handlePersonUpdate(openid, data);
    case 'person.delete':
      return handlePersonDelete(openid, data);
    case 'category.list':
      return handleCategoryList(openid, data);
    case 'category.create':
      return handleCategoryCreate(openid, data);
    case 'category.update':
      return handleCategoryUpdate(openid, data);
    case 'category.delete':
      return handleCategoryDelete(openid, data);
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

