/**
 * 分析结果弹窗组件
 * 显示愿望分析结果：缺失要素、失败原因、失败案例、正确姿势
 */
import { View, Text, ScrollView, Button } from '@tarojs/components'
import type { AnalysisResult } from '../../types'
import './index.scss'

interface AnalysisModalProps {
  visible: boolean
  analyzing: boolean
  result: AnalysisResult | null
  onClose: () => void
  onUnlockByAd: () => void
  onUnlockByShare: () => void
  onRecordWish: () => void
  onCopyText: () => void
  unlocked: boolean
}

export default function AnalysisModal({
  visible,
  analyzing,
  result,
  onClose,
  onUnlockByAd,
  onUnlockByShare,
  onRecordWish,
  onCopyText,
  unlocked
}: AnalysisModalProps) {
  if (!visible) return null

  // 调试：打印结果数据
  if (result && !analyzing) {
    console.log('AnalysisModal - result:', JSON.stringify(result, null, 2))
  }

  return (
    <View className="analysis-modal-mask" onClick={onClose}>
      <View className="analysis-modal" onClick={(e) => e.stopPropagation()}>
        {/* 分析中状态 */}
        {analyzing && (
          <View className="analysis-loading">
            <View className="lotus-container">
              <View className="lotus-flower">
                <View className="lotus-petal petal-1" />
                <View className="lotus-petal petal-2" />
                <View className="lotus-petal petal-3" />
                <View className="lotus-petal petal-4" />
                <View className="lotus-petal petal-5" />
                <View className="lotus-petal petal-6" />
                <View className="lotus-petal petal-7" />
                <View className="lotus-petal petal-8" />
                <View className="lotus-center" />
              </View>
              <View className="lotus-ripple ripple-1" />
              <View className="lotus-ripple ripple-2" />
              <View className="lotus-ripple ripple-3" />
            </View>
            <Text className="loading-text">正在分析您的愿望...</Text>
            <Text className="loading-subtext">心诚则灵，请稍候</Text>
          </View>
        )}

        {/* 分析结果 */}
        {!analyzing && result && (
          <ScrollView className="analysis-content" scrollY>
            <View className="modal-header">
              <Text className="modal-title">愿望分析报告</Text>
              <View className="close-btn" onClick={onClose}>
                <Text className="close-icon">×</Text>
              </View>
            </View>

            {/* 缺失要素 */}
            <View className="result-section">
              <View className="section-header">
                <Text className="section-icon">⚠️</Text>
                <Text className="section-title">缺失要素</Text>
              </View>
              <View className="section-content">
                {result.missing_elements?.length > 0 ? (
                  result.missing_elements.map((item, index) => (
                    <View key={index} className="list-item missing">
                      <Text className="item-bullet">•</Text>
                      <Text className="item-text">{item}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="empty-text">暂无缺失要素</Text>
                )}
              </View>
            </View>

            {/* 可能失败的原因 */}
            <View className="result-section">
              <View className="section-header">
                <Text className="section-icon">💭</Text>
                <Text className="section-title">可能导致许愿失败的原因</Text>
              </View>
              <View className="section-content">
                {result.possible_reasons?.length > 0 ? (
                  result.possible_reasons.map((item, index) => (
                    <View key={index} className="list-item reason">
                      <Text className="item-bullet">•</Text>
                      <Text className="item-text">{item}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="empty-text">暂无分析结果</Text>
                )}
              </View>
            </View>

            {/* 类似失败案例 - 强制显示 */}
            <View className="result-section">
              <View className="section-header">
                <Text className="section-icon">📖</Text>
                <Text className="section-title">类似失败案例</Text>
              </View>
              <View className="section-content case-box">
                <Text className="case-text">
                  {result.failure_case || '许愿时缺少明确目标和时间，导致难以实现'}
                </Text>
              </View>
            </View>

            {/* 正确姿势 - 强制显示 */}
            <View className="result-section">
              <View className="section-header">
                <Text className="section-icon">✨</Text>
                <Text className="section-title">正确姿势</Text>
              </View>
              <View className="section-content posture-box">
                <Text className="posture-text">
                  {result.correct_posture || '明确目标、设定时间、承诺行动、许下还愿'}
                </Text>
              </View>
            </View>

            {/* 解锁区域 */}
            {!unlocked && (
              <View className="unlock-section">
                <View className="unlock-hint">
                  <Text className="unlock-icon">🔒</Text>
                  <Text className="unlock-text">解锁完整优化方案</Text>
                </View>
                <View className="unlock-actions">
                  <View className="unlock-btn ad-btn" onClick={onUnlockByAd}>
                    <Text className="btn-icon">📺</Text>
                    <Text className="btn-text">看广告解锁</Text>
                  </View>
                  <Button 
                    className="unlock-btn share-btn" 
                    openType="share" 
                    onClick={onUnlockByShare}
                  >
                    <Text className="btn-icon">📤</Text>
                    <Text className="btn-text">分享解锁</Text>
                  </Button>
                </View>
              </View>
            )}

            {/* 解锁后的完整内容 */}
            {unlocked && result.full_result && (
              <View className="full-result-section">
                <View className="result-section">
                  <View className="section-header">
                    <Text className="section-icon">📝</Text>
                    <Text className="section-title">优化后的许愿稿</Text>
                  </View>
                  <View className="section-content optimized-box">
                    <Text className="optimized-text">{result.full_result.optimized_text}</Text>
                  </View>
                </View>

                {result.full_result.steps?.length > 0 && (
                  <View className="result-section">
                    <View className="section-header">
                      <Text className="section-icon">📋</Text>
                      <Text className="section-title">建议步骤</Text>
                    </View>
                    <View className="section-content">
                      {result.full_result.steps.map((step, index) => (
                        <View key={index} className="list-item step">
                          <Text className="step-number">{index + 1}</Text>
                          <Text className="item-text">{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View className="action-buttons">
                  <View className="action-btn copy-btn" onClick={onCopyText}>
                    <Text className="btn-text">复制许愿稿</Text>
                  </View>
                  <View className="action-btn record-btn" onClick={onRecordWish}>
                    <Text className="btn-text">记录到我的愿望</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  )
}
