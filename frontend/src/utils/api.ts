/**
 * API工具函数
 */
import Taro from '@tarojs/taro'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'

/**
 * 获取存储的token
 */
function getToken(): string | null {
  return Taro.getStorageSync('access_token') || null
}

/**
 * 设置token
 */
function setToken(token: string): void {
  Taro.setStorageSync('access_token', token)
}

/**
 * 清除token
 */
function clearToken(): void {
  Taro.removeStorageSync('access_token')
  Taro.removeStorageSync('refresh_token')
}

/**
 * API请求封装
 */
async function request<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    data?: any
    header?: Record<string, string>
    needAuth?: boolean
  } = {}
): Promise<{ code: number; data?: T; msg?: string }> {
  const { method = 'GET', data, header = {}, needAuth = true } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header
  }

  // 添加认证token
  if (needAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      method: method as any,
      data,
      header: headers
    })

    // token过期，尝试刷新
    if (response.statusCode === 401 && needAuth) {
      const refreshToken = Taro.getStorageSync('refresh_token')
      if (refreshToken) {
        try {
          const refreshResponse = await Taro.request({
            url: `${API_BASE_URL}/auth/refresh`,
            method: 'POST',
            data: { refresh_token: refreshToken }
          })

          if (refreshResponse.data.code === 0) {
            setToken(refreshResponse.data.data.access_token)
            // 重试原请求
            headers['Authorization'] = `Bearer ${refreshResponse.data.data.access_token}`
            const retryResponse = await Taro.request({
              url: `${API_BASE_URL}${url}`,
              method: method as any,
              data,
              header: headers
            })
            return retryResponse.data as any
          }
        } catch (error) {
          // 刷新失败，清除token
          clearToken()
          Taro.redirectTo({ url: '/pages/index/index' })
          throw new Error('登录已过期，请重新登录')
        }
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data as any
    }

    throw new Error(response.data?.msg || '请求失败')
  } catch (error: any) {
    console.error('API请求失败:', error)
    throw error
  }
}

/**
 * 用户相关API
 */
export const authAPI = {
  /**
   * 微信登录
   */
  async login(code: string, userInfo?: any) {
    return request('/auth/login', {
      method: 'POST',
      data: { code, user_info: userInfo },
      needAuth: false
    })
  },

  /**
   * 获取用户信息
   */
  async getProfile() {
    return request('/auth/profile', {
      method: 'GET'
    })
  }
}

/**
 * 愿望分析API
 */
export const wishAPI = {
  /**
   * 分析愿望
   */
  async analyze(wishText: string, deity?: string, profile?: any, wishId?: number) {
    return request('/wish/analyze', {
      method: 'POST',
      data: {
        wish_text: wishText,
        deity,
        profile,
        wish_id: wishId
      }
    })
  },

  /**
   * AI优化愿望
   */
  async optimize(wishText: string, deity?: string, profile?: any, existingFields?: any) {
    return request('/wish/optimize', {
      method: 'POST',
      data: {
        wish_text: wishText,
        deity,
        profile,
        existing_fields: existingFields
      }
    })
  }
}

/**
 * TODO相关API
 */
export const todoAPI = {
  /**
   * 获取愿望列表
   */
  async getList(status?: number) {
    return request('/todos', {
      method: 'GET',
      data: status !== undefined ? { status } : undefined
    })
  },

  /**
   * 新增愿望
   */
  async create(wishData: any) {
    return request('/todos', {
      method: 'POST',
      data: wishData
    })
  },

  /**
   * 更新愿望
   */
  async update(wishId: number, updates: any) {
    return request(`/todos/${wishId}`, {
      method: 'PUT',
      data: updates
    })
  },

  /**
   * 删除愿望
   */
  async delete(wishId: number) {
    return request(`/todos/${wishId}`, {
      method: 'DELETE'
    })
  }
}

/**
 * 解锁相关API
 */
export const unlockAPI = {
  /**
   * 看广告解锁
   */
  async unlockByAd(unlockToken: string, analysisId: number, adInfo?: any, deviceFingerprint?: string) {
    return request('/unlock/ad', {
      method: 'POST',
      data: {
        unlock_token: unlockToken,
        analysis_id: analysisId,
        ad_info: adInfo,
        device_fingerprint: deviceFingerprint
      }
    })
  },

  /**
   * 分享解锁
   */
  async unlockByShare(unlockToken: string, analysisId: number, shareInfo?: any, deviceFingerprint?: string) {
    return request('/unlock/share', {
      method: 'POST',
      data: {
        unlock_token: unlockToken,
        analysis_id: analysisId,
        share_info: shareInfo,
        device_fingerprint: deviceFingerprint
      }
    })
  },

  /**
   * 查询解锁状态
   */
  async getStatus(analysisId: number) {
    return request('/unlock/status', {
      method: 'GET',
      data: { analysis_id: analysisId }
    })
  }
}

/**
 * 支付相关API
 */
export const paymentAPI = {
  /**
   * 创建支付订单
   */
  async createOrder(wishId: number, deity: string, wishText: string, note?: string) {
    return request('/payment/create', {
      method: 'POST',
      data: {
        wish_id: wishId,
        deity,
        wish_text: wishText,
        note
      }
    })
  }
}
