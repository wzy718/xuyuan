/**
 * 大模型服务（自动降级：GLM → Kimi → DeepSeek）
 *
 * 说明：
 * - 该后端为可选方案，默认以云开发云函数为准
 * - 为避免改动路由引用，这里保留文件名与导出函数名
 */
const axios = require('axios');
const crypto = require('crypto');

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'auto').toLowerCase();

// GLM（智谱，OpenAI 兼容）
const ZHIPU_API_URL = process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-4.5-flash';

// Moonshot（Kimi，OpenAI 兼容）
const MOONSHOT_API_URL = process.env.MOONSHOT_API_URL || 'https://api.moonshot.cn/v1/chat/completions';
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_MODEL = process.env.MOONSHOT_MODEL || 'kimi-latest';

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

function base64UrlEncodeBuffer(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlEncodeJson(obj) {
  return base64UrlEncodeBuffer(Buffer.from(JSON.stringify(obj), 'utf8'));
}

function createZhipuAuthToken(apiKey, ttlMs = 60 * 1000) {
  const key = String(apiKey || '').trim();
  const parts = key.split('.');
  const apiKeyId = String(parts[0] || '').trim();
  const apiKeySecret = String(parts.slice(1).join('.') || '').trim();
  if (!apiKeyId || !apiKeySecret) {
    throw new Error('GLM API Key 格式错误，请检查环境变量 ZHIPU_API_KEY');
  }

  const now = Date.now();
  const header = { alg: 'HS256', sign_type: 'SIGN' };
  const payload = { api_key: apiKeyId, exp: now + ttlMs, timestamp: now };
  const base = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;
  const sign = base64UrlEncodeBuffer(crypto.createHmac('sha256', apiKeySecret).update(base).digest());
  return `${base}.${sign}`;
}

function getZhipuAuthHeaders(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) return [];

  // 参考 BigModel 文档：Authorization: Bearer <your api key>
  // 兼容旧格式（id.secret）需要签名 token 的情况：先直连 Bearer Key，401 再尝试签名 token
  const headers = [`Bearer ${key}`];
  if (key.includes('.')) {
    try {
      headers.push(`Bearer ${createZhipuAuthToken(key)}`);
    } catch {
      // 忽略：若格式不符合签名要求，仍可走 Bearer Key 的方式
    }
  }
  return headers;
}

function normalizeProviderName(provider) {
  const p = String(provider || '').toLowerCase();
  if (p === 'glm' || p === 'zhipu') return 'zhipu';
  if (p === 'kimi' || p === 'moonshot') return 'moonshot';
  if (p === 'deepseek') return 'deepseek';
  if (p === 'auto') return 'auto';
  return 'auto';
}

function getProviderConfig(provider) {
  if (provider === 'zhipu') {
    if (!ZHIPU_API_KEY || ZHIPU_API_KEY.trim() === '') {
      throw new Error('GLM API Key未配置，请设置 ZHIPU_API_KEY');
    }
    return { provider: 'zhipu', apiUrl: ZHIPU_API_URL, apiKey: ZHIPU_API_KEY, model: ZHIPU_MODEL };
  }

  if (provider === 'moonshot') {
    if (!MOONSHOT_API_KEY || MOONSHOT_API_KEY.trim() === '') {
      throw new Error('Moonshot API Key未配置，请设置 MOONSHOT_API_KEY');
    }
    return { provider: 'moonshot', apiUrl: MOONSHOT_API_URL, apiKey: MOONSHOT_API_KEY, model: MOONSHOT_MODEL };
  }

  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.trim() === '') {
    throw new Error('DeepSeek API Key未配置，请设置 DEEPSEEK_API_KEY');
  }
  return { provider: 'deepseek', apiUrl: DEEPSEEK_API_URL, apiKey: DEEPSEEK_API_KEY, model: DEEPSEEK_MODEL };
}

function getLLMConfigsInOrder() {
  const selectedProvider = normalizeProviderName(LLM_PROVIDER);
  if (selectedProvider !== 'auto') {
    return [getProviderConfig(selectedProvider)];
  }

  const candidates = [];
  if (ZHIPU_API_KEY && ZHIPU_API_KEY.trim() !== '') candidates.push(getProviderConfig('zhipu'));
  if (MOONSHOT_API_KEY && MOONSHOT_API_KEY.trim() !== '') candidates.push(getProviderConfig('moonshot'));
  if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY.trim() !== '') candidates.push(getProviderConfig('deepseek'));
  if (candidates.length === 0) {
    throw new Error('未配置任何大模型 API Key，请设置 ZHIPU_API_KEY / MOONSHOT_API_KEY / DEEPSEEK_API_KEY 之一');
  }
  return candidates;
}

function getProviderDisplayName(provider) {
  if (provider === 'zhipu') return 'GLM';
  if (provider === 'moonshot') return 'Moonshot';
  return 'DeepSeek';
}

function normalizeModelMessageContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && typeof item.text === 'string') return item.text;
        try {
          return JSON.stringify(item);
        } catch {
          return '';
        }
      })
      .join('');
  }
  if (content == null) return '';
  return String(content);
}

async function callChatCompletion({ systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2000, timeoutMs = 15000 }) {
  const cfgList = getLLMConfigsInOrder();
  const errors = [];

  for (const cfg of cfgList) {
    const providerName = getProviderDisplayName(cfg.provider);
    const chosenModel = cfg.model;

    try {
      const authHeaders =
        cfg.provider === 'zhipu' ? getZhipuAuthHeaders(cfg.apiKey) : [`Bearer ${cfg.apiKey}`];
      const requestBody = {
        model: chosenModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens
      };

      let lastError;
      for (const authHeader of authHeaders) {
        try {
          const response = await axios.post(cfg.apiUrl, requestBody, {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json'
            },
            timeout: timeoutMs
          });
          const message = response?.data?.choices?.[0]?.message || {};
          return normalizeModelMessageContent(message?.content);
        } catch (err) {
          lastError = err;
          const status = err?.response?.status;
          if (cfg.provider === 'zhipu' && status === 401 && authHeaders.length > 1) {
            console.warn('[LLM] GLM auth retry due to 401');
            continue;
          }
          throw err;
        }
      }

      throw lastError || new Error('GLM API 调用失败');
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.code;
      const message = String(error?.message || '未知错误');
      console.error(`${providerName} API调用失败:`, status, error?.response?.data, message);
      errors.push({ provider: providerName, status, code, message });

      if (cfgList.length === 1) {
        throw new Error(`${providerName} API调用失败: ${message}`);
      }
      console.warn('[LLM] fallback to next provider:', { failedProvider: providerName, status, code });
    }
  }

  const tried = errors.map((e) => e.provider).join(' → ');
  const last = errors[errors.length - 1];
  throw new Error(`大模型调用失败（已尝试：${tried}）：${last?.provider || '未知'} ${last?.status || ''} ${last?.message || ''}`.trim());
}

/**
 * 分析愿望
 */
async function analyzeWish(wishText, deity = null, profile = {}) {
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
${deity ? `对象：${deity}\n` : ''}${profile.name ? `称呼：${profile.name}\n` : ''}${profile.city ? `城市：${profile.city}\n` : ''}
愿望内容：${wishText}

请提供详细的分析和优化建议。`;

  try {
    const content = await callChatCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2000,
      timeoutMs: 15000
    });
    
    // 尝试解析JSON
    try {
      // 如果返回的是JSON字符串，先解析
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (parseError) {
      // 如果解析失败，返回文本格式的结果
      console.warn('模型返回的不是标准JSON，使用文本解析');
      return {
        missing_elements: [],
        possible_reasons: [],
        optimized_text: content,
        structured_suggestion: {},
        steps: [],
        warnings: []
      };
    }
  } catch (error) {
    console.error('大模型调用失败:', error);
    throw error;
  }
}

module.exports = {
  analyzeWish
};
