/**
 * 分析结果弹窗组件
 * 显示愿望分析结果：分析结果、失败案例、正确姿势
 */
import { View, Text, Button } from '@tarojs/components'
import type { AnalysisResult } from '../../types'
import './index.scss'

declare const INTERSTITIAL_AD_UNIT_ID: string
declare const ENABLE_AD_UNLOCK: string

const QUALIFIED_ANALYSIS_RESULT = '基本要素齐全，可进一步润色表达'

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
  // 展示模式：modal 为遮罩弹窗；page 为页面内结果区块
  mode?: 'modal' | 'page'
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
  unlocked,
  mode = 'modal'
}: AnalysisModalProps) {
  if (!visible) return null

  // 调试：打印结果数据
  if (result && !analyzing) {
    console.log('AnalysisModal - result:', JSON.stringify(result, null, 2))
  }

  const analysisResults = result?.analysis_results || []
  const isQualified =
    analysisResults.length === 1 && analysisResults[0] === QUALIFIED_ANALYSIS_RESULT

  const Content = (
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
          {/* 贴片广告 - 广告位 ID 在 config/dev.js 或 config/prod.js 中配置 */}
          {typeof INTERSTITIAL_AD_UNIT_ID !== 'undefined' &&
            INTERSTITIAL_AD_UNIT_ID !== 'adunit-xxxxxxxxxxxxxxxx' && (
              <View className="interstitial-ad-container">
                <ad
                  unit-id={INTERSTITIAL_AD_UNIT_ID}
                  type="interstitial"
                  onLoad={() => console.log('贴片广告加载成功')}
                  onError={(e) => console.error('贴片广告加载失败', e)}
                />
              </View>
            )}
        </View>
      )}

      {/* 分析结果 */}
      {!analyzing && result && (
        <View className="analysis-content">
          <View className="modal-header">
            <Text className="modal-title">愿望分析报告</Text>
            <View className="close-btn" onClick={onClose}>
              <Text className="close-icon">×</Text>
            </View>
          </View>

          {/* 分析结果 */}
          <View className="result-section">
            <View className="section-header">
              <Text className="section-icon">⚠️</Text>
              <Text className="section-title">分析结果</Text>
            </View>
            <View className="section-content">
              {analysisResults?.length > 0 ? (
                analysisResults.map((item, index) => (
                  <View key={index} className="list-item missing">
                    <Text className="item-bullet">•</Text>
                    <Text className="item-text">{item}</Text>
                  </View>
                ))
              ) : (
                <Text className="empty-text">基本要素齐全，可进一步润色</Text>
              )}
            </View>
          </View>

          {/* 类似失败案例（仅在不达标时展示） */}
          {!isQualified && (
            <View className="result-section">
              <View className="section-header">
                <Text className="section-icon">📖</Text>
                <Text className="section-title">类似失败案例</Text>
              </View>
              <View className="section-content case-box">
                <Text className="case-text">{result.case || '许愿时缺少关键要素，容易被误解'}</Text>
              </View>
            </View>
          )}

          {/* 正确姿势（无论是否达标都会展示，达标时偏向鼓励） */}
          <View className="result-section">
            <View className="section-header">
              <Text className="section-icon">✨</Text>
              <Text className="section-title">正确姿势</Text>
            </View>
            <View className="section-content posture-box">
              <Text className="posture-text">{result.posture || '先补齐时间边界与量化目标'}</Text>
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
                {/* 根据配置决定是否显示广告解锁按钮 */}
                {typeof ENABLE_AD_UNLOCK !== 'undefined' && ENABLE_AD_UNLOCK === 'true' && (
                  <View className="unlock-btn ad-btn" onClick={onUnlockByAd}>
                    <Text className="btn-icon">📺</Text>
                    <Text className="btn-text">看广告解锁</Text>
                  </View>
                )}
                <Button className="unlock-btn share-btn" openType="share" onClick={onUnlockByShare}>
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

              {result.full_result.warnings?.length > 0 && (
                <View className="result-section">
                  <View className="section-header">
                    <Text className="section-icon">🛡️</Text>
                    <Text className="section-title">注意事项</Text>
                  </View>
                  <View className="section-content">
                    {result.full_result.warnings.map((warning, index) => (
                      <View key={index} className="list-item warning">
                        <Text className="item-bullet">•</Text>
                        <Text className="item-text">{warning}</Text>
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
        </View>
      )}
    </View>
  )

  return (
    mode === 'modal' ? (
      <View className="analysis-modal-mask" onClick={onClose}>
        {Content}
      </View>
    ) : (
      <View className="analysis-page">
        {Content}
      </View>
    )
  )
}
