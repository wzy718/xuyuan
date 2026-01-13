import { useEffect, useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import type { Wish } from '../../types'
import './index.scss'

interface PayWishModalProps {
  open: boolean
  wish: Wish | null
  onClose: () => void
  onPay: (payload: { deity: string; text: string; note: string }) => Promise<void>
}

export default function PayWishModal({ open, wish, onClose, onPay }: PayWishModalProps) {
  const [deity, setDeity] = useState('')
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (open && wish) {
      setDeity(wish.deity || '')
      setText(`弟子/信众感恩${wish.deity || ''}慈悲加持。\n我所求之事「${wish.wish_text}」已如愿达成。\n今特来还愿，感恩诸佛菩萨护佑。\n愿将此功德回向家人及一切众生。`)
      setNote('')
    }
  }, [open, wish])

  const handlePay = async () => {
    if (!wish) return
    setPaying(true)
    try {
      await onPay({ deity, text, note })
    } finally {
      setPaying(false)
    }
  }

  if (!open || !wish) return null

  return (
    <View className="pay-modal">
      <View className="pay-modal__content">
        <View className="pay-modal__title">恭喜达成</View>
        <Text className="pay-modal__desc">
          付 1 元，我们帮你到寺庙代许愿/还愿回向（提供过程记录，不承诺结果）
        </Text>
        <View className="pay-modal__field">
          <Text className="pay-modal__label">对象</Text>
          <Input
            className="pay-modal__input"
            value={deity}
            onInput={(e) => setDeity(e.detail.value)}
          />
        </View>
        <View className="pay-modal__field">
          <Text className="pay-modal__label">还愿稿（可编辑）</Text>
          <Textarea
            className="pay-modal__textarea"
            value={text}
            onInput={(e) => setText(e.detail.value)}
          />
        </View>
        <View className="pay-modal__field">
          <Text className="pay-modal__label">备注（可选）</Text>
          <Input
            className="pay-modal__input"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
        <View className="pay-modal__actions">
          <Button className="bb-btn-primary" loading={paying} onClick={handlePay}>
            1 元代还愿
          </Button>
          <Button className="bb-btn-outline" onClick={onClose}>
            暂不需要
          </Button>
        </View>
        <Text className="pay-modal__hint">免责声明：代许愿为服务行为，提供过程记录，不承诺结果。</Text>
      </View>
    </View>
  )
}
