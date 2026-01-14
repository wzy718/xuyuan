/**
 * 类型定义
 */

export interface User {
  id: string
  nickname?: string
  avatar_url?: string
  created_at?: string
}

export interface Wish {
  id: string
  // 许愿人/受益人
  beneficiary_type?: 'self' | 'family' | 'child' | 'couple' | 'other'
  beneficiary_desc?: string // 具体说明，如"爸爸妈妈"、"我和老公"、"全家人"
  // 对象（向谁许愿）
  deity?: string
  wish_text: string
  time_range?: string
  target_quantify?: string
  way_boundary?: string
  action_commitment?: string
  return_wish?: string
  status: number
  created_at?: string
  updated_at?: string
}

export interface AnalysisResult {
  analysis_id: string
  missing_elements: string[]
  possible_reasons: string[]
  failure_case?: string // 类似失败案例
  correct_posture?: string // 正确姿势
  locked: boolean
  unlock_token: string
  unlock_token_expires_at: number
  full_result?: {
    optimized_text: string
    structured_suggestion: {
      time_range?: string
      target_quantify?: string
      way_boundary?: string
      action_commitment?: string
      return_wish?: string
    }
    steps: string[]
    warnings: string[]
  }
}

export interface Order {
  id: string
  wish_id?: string
  amount: number
  status: number
  out_trade_no: string
  transaction_id?: string
  created_at?: string
}

export interface WishProfile {
  id: string
  beneficiary_type: 'self' | 'family' | 'child' | 'couple' | 'other'
  beneficiary_desc?: string
  deity: string
  created_at?: string
  updated_at?: string
}

export interface Person {
  id: string
  name: string
  category?: 'self' | 'family' | 'child' | 'couple' | 'other' | string // 分类，支持自定义
  id_card?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

export interface PersonCategory {
  id: string
  value: string // 分类值（唯一标识）
  label: string // 分类名称（显示）
  icon?: string // 图标（可选）
  is_default?: boolean // 是否为默认分类
  created_at?: string
  updated_at?: string
}
