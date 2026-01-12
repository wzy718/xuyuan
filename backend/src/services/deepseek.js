/**
 * DeepSeek API服务
 */
const axios = require('axios');

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * 分析愿望
 */
async function analyzeWish(wishText, deity = null, profile = {}) {
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
${deity ? `对象：${deity}\n` : ''}${profile.name ? `称呼：${profile.name}\n` : ''}${profile.city ? `城市：${profile.city}\n` : ''}
愿望内容：${wishText}

请提供详细的分析和优化建议。`;

  try {
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
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
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
      console.warn('DeepSeek返回的不是标准JSON，使用文本解析');
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
    console.error('DeepSeek API调用失败:', error);
    if (error.response) {
      throw new Error(`DeepSeek API错误: ${error.response.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

module.exports = {
  analyzeWish
};
