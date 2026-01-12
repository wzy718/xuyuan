/**
 * 类型定义
 */

export interface User {
  id: number
  nickname?: string
  avatar_url?: string
  created_at?: string
}

export interface Wish {
  id: number
  user_id: number
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
  analysis_id: number
  missing_elements: string[]
  possible_reasons: string[]
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
  id: number
  user_id: number
  wish_id?: number
  amount: number
  status: number
  out_trade_no: string
  transaction_id?: string
  created_at?: string
}
