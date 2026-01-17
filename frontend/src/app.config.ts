export default {
  pages: [
    'pages/splash/index',
    'pages/guide/index',
    'pages/index/index',
    'pages/wishes/index',
    'pages/profile/index',
    'pages/wish-detail/index'
  ],
  cloud: true,
  tabBar: {
    color: '#666666',
    selectedColor: '#C9A962',
    backgroundColor: '#FFF8F0',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '愿望分析',
        iconPath: 'assets/tab/tab-1-icon.png',
        selectedIconPath: 'assets/tab/tab-1-icon-active.png'
      },
      {
        pagePath: 'pages/wishes/index',
        text: '我的愿望',
        iconPath: 'assets/tab/tab-2-icon.png',
        selectedIconPath: 'assets/tab/tab-2-icon-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人中心',
        iconPath: 'assets/tab/tab-3-icon.png',
        selectedIconPath: 'assets/tab/tab-3-icon-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFF8F0',
    navigationBarTitleText: '拜拜',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFF8F0'
  }
}
