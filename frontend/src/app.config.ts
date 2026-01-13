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
        iconPath: 'assets/tab/icon.png',
        selectedIconPath: 'assets/tab/icon-active.png'
      },
      {
        pagePath: 'pages/wishes/index',
        text: '我的愿望',
        iconPath: 'assets/tab/icon.png',
        selectedIconPath: 'assets/tab/icon-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人中心',
        iconPath: 'assets/tab/icon.png',
        selectedIconPath: 'assets/tab/icon-active.png'
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
