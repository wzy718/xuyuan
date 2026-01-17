import { View, Text, Swiper, SwiperItem, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

// 引导页插图路径
import guide1Image from '../../assets/guide/guide-1-lotus.png'
import guide2Image from '../../assets/guide/guide-2-incense.png'
import guide3Image from '../../assets/guide/guide-3-wish-tree.png'

const slides = [
  {
    title: '许愿有方法',
    desc: '分析你的愿望表达，找出缺失的关键要素',
    image: guide1Image
  },
  {
    title: 'AI 智能优化',
    desc: '一键生成规范许愿稿，让心愿表达更清晰',
    image: guide2Image
  },
  {
    title: '记录与追踪',
    desc: '管理你的每一个愿望，见证心愿逐一实现',
    image: guide3Image
  }
]

export default function Guide() {
  const handleFinish = () => {
    Taro.setStorageSync('bb_has_guide', true)
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className="bb-page guide-page">
      <Swiper className="guide-swiper" circular>
        {slides.map((item, index) => (
          <SwiperItem key={item.title}>
            <View className="guide-slide">
              <View className="guide-ornament">祥云纹理</View>
              <View className="guide-illustration">
                <Image 
                  src={item.image} 
                  mode="aspectFit"
                  className="guide-image"
                />
              </View>
              <Text className="guide-title">「{item.title}」</Text>
              <Text className="guide-desc">{item.desc}</Text>
              {index === slides.length - 1 && (
                <Button className="bb-btn-primary guide-cta" onClick={handleFinish}>
                  开始使用
                </Button>
              )}
            </View>
          </SwiperItem>
        ))}
      </Swiper>
    </View>
  )
}
