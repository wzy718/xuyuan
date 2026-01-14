module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    CLOUD_ENV_ID: '"cloud1-7gtd04o5108a99dd"',
    // 广告位配置 - 需要在微信公众平台创建广告位后填写
    BANNER_AD_UNIT_ID: '"adunit-xxxxxxxxxxxxxxxx"', // 横幅广告位 ID
    INTERSTITIAL_AD_UNIT_ID: '"adunit-xxxxxxxxxxxxxxxx"', // 贴片广告位 ID
    // 是否启用广告解锁功能（需要先开通流量主并配置广告位 ID）
    ENABLE_AD_UNLOCK: 'false' // 设置为 true 启用，false 禁用（无流量主资格时设为 false）
  },
  mini: {},
  h5: {}
}
