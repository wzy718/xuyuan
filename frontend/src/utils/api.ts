/**
 * API 工具函数（纯云开发版）
 *
 * 说明：
 * - 不再通过 HTTP 调用后端，也不再使用 JWT
 * - 统一通过云函数 `api` 分发 action
 */
import Taro from '@tarojs/taro'

type ApiResponse<T> = { code: number; data?: T; msg?: string }

async function callFunction<T = any>(action: string, data?: any): Promise<ApiResponse<T>> {
  try {
    const res = await Taro.cloud.callFunction({
      name: 'api',
      data: { action, data }
    })
    return (res.result || { code: -1, msg: '云函数无返回' }) as ApiResponse<T>
  } catch (error: any) {
    console.error('云函数调用失败:', error)
    throw new Error(error.message || '云函数调用失败')
  }
}

export const authAPI = {
  async login(userInfo?: any) {
    return callFunction<{ user: any }>('auth.login', { user_info: userInfo })
  }
}

export const wishAPI = {
  async analyze(wishText: string, deity?: string, profile?: any, wishId?: string) {
    return callFunction('wish.analyze', {
      wish_text: wishText,
      deity,
      profile,
      wish_id: wishId
    })
  },

  async optimize(
    wishText: string,
    analysisId: string,
    deity?: string,
    profile?: any,
    existingFields?: any
  ) {
    return callFunction('wish.optimize', {
      wish_text: wishText,
      analysis_id: analysisId,
      deity,
      profile,
      existing_fields: existingFields
    })
  }
}

export const todoAPI = {
  async getList(status?: number) {
    return callFunction('todos.list', { status })
  },

  async create(wishData: any) {
    return callFunction('todos.create', wishData)
  },

  async update(wishId: string, updates: any) {
    return callFunction('todos.update', { wish_id: wishId, updates })
  },

  async delete(wishId: string) {
    return callFunction('todos.delete', { wish_id: wishId })
  }
}

export const unlockAPI = {
  async unlockByAd(unlockToken: string, analysisId: string, adInfo?: any, deviceFingerprint?: string) {
    return callFunction('unlock.ad', {
      unlock_token: unlockToken,
      analysis_id: analysisId,
      ad_info: adInfo,
      device_fingerprint: deviceFingerprint
    })
  },

  async unlockByShare(unlockToken: string, analysisId: string, shareInfo?: any, deviceFingerprint?: string) {
    return callFunction('unlock.share', {
      unlock_token: unlockToken,
      analysis_id: analysisId,
      share_info: shareInfo,
      device_fingerprint: deviceFingerprint
    })
  },

  async getStatus(analysisId: string) {
    return callFunction('unlock.status', { analysis_id: analysisId })
  }
}

export const paymentAPI = {
  async createOrder(wishId: string, deity: string, wishText: string, note?: string) {
    return callFunction('payment.create', {
      wish_id: wishId,
      deity,
      wish_text: wishText,
      note
    })
  }
}

export const profileAPI = {
  async getList() {
    return callFunction<Array<any>>('profile.list', {})
  },

  async create(profile: { beneficiary_type: string; beneficiary_desc?: string; deity: string }) {
    return callFunction('profile.create', profile)
  },

  async delete(profileId: string) {
    return callFunction('profile.delete', { profile_id: profileId })
  }
}

export const personAPI = {
  async getList() {
    return callFunction<Array<any>>('person.list', {})
  },

  async create(person: { name: string; category?: string; id_card?: string; phone?: string }) {
    return callFunction('person.create', person)
  },

  async update(personId: string, person: { name: string; category?: string; id_card?: string; phone?: string }) {
    return callFunction('person.update', { person_id: personId, ...person })
  },

  async delete(personId: string) {
    return callFunction('person.delete', { person_id: personId })
  }
}

export const categoryAPI = {
  async getList() {
    return callFunction<Array<any>>('category.list', {})
  },

  async create(category: { value: string; label: string; icon?: string }) {
    return callFunction('category.create', category)
  },

  async update(categoryId: string, category: { label: string; icon?: string }) {
    return callFunction('category.update', { category_id: categoryId, ...category })
  },

  async delete(categoryId: string) {
    return callFunction('category.delete', { category_id: categoryId })
  }
}

