/**
 * 格式化工具函数
 */

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm 格式
 * @param dateStr 日期字符串（ISO 格式或其他格式）
 * @returns 格式化后的日期时间字符串，格式：YYYY-MM-DD HH:mm
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化失败:', error)
    return '—'
  }
}
