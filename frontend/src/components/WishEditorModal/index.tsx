import { useEffect, useRef, useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { wishAPI, unlockAPI, profileAPI, personAPI, categoryAPI } from '../../utils/api'
import type { Wish, AnalysisResult, WishProfile, Person, PersonCategory } from '../../types'
import shareCoverImage from '../../assets/share-cover.png'
import './index.scss'

declare const ENABLE_AD_UNLOCK: string

interface WishEditorModalProps {
  open: boolean
  title: string
  confirmText?: string
  initialWish?: Partial<Wish>
  onClose: () => void
  onSubmit: (wish: Partial<Wish>) => Promise<void>
}

const emptyWish: Partial<Wish> = {
  beneficiary_type: 'self',
  beneficiary_desc: '',
  deity: '',
  wish_text: '',
  time_range: '',
  target_quantify: '',
  way_boundary: '',
  action_commitment: '',
  return_wish: ''
}

// 分享标题文案（随机显示）
const SHARE_TITLES = [
  '快来测测你的愿望能不能实现🎯',
  '愿望没实现？可能是这些原因🔍',
  '分享一个超准的愿望分析工具🌟',
  '测了个我许的愿望，结果惊呆了😳'
]

// 随机获取分享标题
const getRandomShareTitle = () => {
  const randomIndex = Math.floor(Math.random() * SHARE_TITLES.length)
  return SHARE_TITLES[randomIndex]
}

const BENEFICIARY_OPTIONS = [
  { value: 'self', label: '自己', icon: '🧑' },
  { value: 'family', label: '家人', icon: '👨‍👩‍👧' },
  { value: 'child', label: '孩子', icon: '👶' },
  { value: 'couple', label: '姻缘', icon: '💑' },
  { value: 'other', label: '其他', icon: '👥' }
]

// 常用图标列表
const ICON_OPTIONS = [
  '🧑', '👨', '👩', '👨‍👩‍👧', '👶', '👧', '👦', '👴', '👵',
  '💑', '👫', '👥', '👤', '👪', '👨‍👩‍👦', '👨‍👩‍👧‍👦',
  '👔', '👗', '👘', '👙', '👚', '👕', '👖', '👞', '👟',
  '🎓', '👑', '💼', '👜', '👝', '👛', '👠', '👡', '👢',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
  '⭐', '🌟', '✨', '💫', '🔥', '💥', '⚡', '☀️', '🌙',
  '🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀', '🌱',
  '🎁', '🎀', '🎊', '🎉', '🎈', '🎂', '🍰', '🍭', '🍬',
  '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏧', '🏨',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
  '📱', '💻', '⌚', '📷', '📹', '📺', '📻', '🎧', '🎤',
  '💰', '💴', '💵', '💶', '💷', '💸', '💳', '💎', '💍'
]

export default function WishEditorModal({
  open,
  title,
  confirmText = '确认记录',
  initialWish,
  onClose,
  onSubmit
}: WishEditorModalProps) {
  const [wish, setWish] = useState<Partial<Wish>>(emptyWish)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [shareUnlockContext, setShareUnlockContext] = useState<{
    unlockToken: string
    analysisId: string
  } | null>(null)
  // openType=share 触发时 setState 可能还未生效，使用 ref 避免分享 path 丢参数
  const shareUnlockContextRef = useRef<{ unlockToken: string; analysisId: string } | null>(null)
  const [profiles, setProfiles] = useState<WishProfile[]>([])
  const [showProfileSelector, setShowProfileSelector] = useState<'beneficiary' | 'deity' | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [showPersonManager, setShowPersonManager] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [personForm, setPersonForm] = useState({ name: '', category: '', id_card: '', phone: '' })
  const [categories, setCategories] = useState<PersonCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PersonCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({ value: '', label: '', icon: '' })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPersonSelector, setShowPersonSelector] = useState(false)

  const beneficiaryOptions =
    categories.length > 0
      ? categories.map((c) => ({ value: c.value, label: c.label, icon: c.icon || '' }))
      : BENEFICIARY_OPTIONS

  const getBeneficiaryLabel = (beneficiaryType?: string) => {
    if (!beneficiaryType) return ''
    const fromCategories = categories.find((c) => c.value === beneficiaryType)?.label
    if (fromCategories) return fromCategories
    return BENEFICIARY_OPTIONS.find((opt) => opt.value === beneficiaryType)?.label || beneficiaryType
  }

  useEffect(() => {
    if (open) {
      setWish({ ...emptyWish, ...initialWish })
      setAnalysisResult(null)
      setUnlocked(false)
      loadProfiles()
      loadPersons()
      loadCategories()
    }
  }, [open, initialWish])

  const loadProfiles = async () => {
    try {
      const response = await profileAPI.getList()
      if (response.code === 0) {
        // 将云数据库返回的 _id 映射为 id
        const profiles = (response.data || []).map((item: any) => ({
          ...item,
          id: item._id || item.id
        }))
        setProfiles(profiles)
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }

  const handleSelectProfile = (profile: WishProfile) => {
    if (showProfileSelector === 'deity') {
      // 只填充对象字段
      setWish((prev) => ({
        ...prev,
        deity: profile.deity
      }))
    } else {
      // 填充许愿人/受益人相关字段
      setWish((prev) => ({
        ...prev,
        beneficiary_type: profile.beneficiary_type,
        beneficiary_desc: profile.beneficiary_desc || ''
      }))
    }
    setShowProfileSelector(null)
  }

  const loadPersons = async () => {
    try {
      const response = await personAPI.getList()
      if (response.code === 0) {
        const persons = (response.data || []).map((item: any) => ({
          ...item,
          id: item._id || item.id
        }))
        setPersons(persons)
      }
    } catch (error) {
      console.error('加载人员列表失败:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getList()
      if (response.code === 0) {
        const categories = (response.data || []).map((item: any) => ({
          ...item,
          id: item._id || item.id
        }))
        setCategories(categories)
      }
    } catch (error) {
      console.error('加载分类列表失败:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!wish.beneficiary_type || !wish.deity?.trim()) {
      Taro.showToast({ title: '请先填写许愿人/受益人和对象', icon: 'none' })
      return
    }
    try {
      const response = await profileAPI.create({
        beneficiary_type: wish.beneficiary_type,
        beneficiary_desc: wish.beneficiary_desc || '',
        deity: wish.deity
      })
      if (response.code === 0) {
        Taro.showToast({ title: '已保存', icon: 'success' })
        await loadProfiles()
      } else {
        Taro.showToast({ title: response.msg || '保存失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  }

  const handleOpenPersonManager = (preferredCategory?: string | null) => {
    const initialCategory =
      preferredCategory !== undefined
        ? preferredCategory
        : wish.beneficiary_type && wish.beneficiary_type !== 'self'
          ? wish.beneficiary_type
          : null
    setShowPersonManager(true)
    setEditingPerson(null)
    setPersonForm({ name: '', category: initialCategory || '', id_card: '', phone: '' })
    setSelectedCategory(initialCategory)
    loadCategories()
  }

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person)
    setPersonForm({
      name: person.name || '',
      category: person.category || '',
      id_card: person.id_card || '',
      phone: person.phone || ''
    })
    setSelectedCategory(person.category || null)
    setShowPersonManager(true)
    loadCategories()
  }

  const handleSelectPersonCategory = (categoryValue: string | null) => {
    // 顶部分类既用于筛选列表，也作为“新增/编辑人员”的分类归属
    setSelectedCategory(categoryValue)
    setPersonForm((prev) => ({ ...prev, category: categoryValue || '' }))
  }

  const handleSavePerson = async () => {
    if (!personForm.name.trim()) {
      Taro.showToast({ title: '姓名不能为空', icon: 'none' })
      return
    }
    const categoryValue = selectedCategory || ''
    try {
      const response = editingPerson
        ? await personAPI.update(editingPerson.id, {
            name: personForm.name.trim(),
            category: categoryValue || undefined,
            id_card: personForm.id_card.trim() || undefined,
            phone: personForm.phone.trim() || undefined
          })
        : await personAPI.create({
            name: personForm.name.trim(),
            category: categoryValue || undefined,
            id_card: personForm.id_card.trim() || undefined,
            phone: personForm.phone.trim() || undefined
          })
      if (response.code === 0) {
        Taro.showToast({ title: editingPerson ? '更新成功' : '添加成功', icon: 'success' })
        await loadPersons()
        setEditingPerson(null)
        setPersonForm({ name: '', category: '', id_card: '', phone: '' })
      } else {
        Taro.showToast({ title: response.msg || '操作失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.label.trim()) {
      Taro.showToast({ title: '分类名称不能为空', icon: 'none' })
      return
    }
    try {
      // 分类值自动生成（时间戳 + 随机数）
      const autoValue = editingCategory
        ? editingCategory.value
        : `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      const response = editingCategory
        ? await categoryAPI.update(editingCategory.id, {
            label: categoryForm.label.trim(),
            icon: categoryForm.icon.trim() || undefined
          })
        : await categoryAPI.create({
            value: autoValue,
            label: categoryForm.label.trim(),
            icon: categoryForm.icon.trim() || undefined
          })
      if (response.code === 0) {
        Taro.showToast({ title: editingCategory ? '更新成功' : '添加成功', icon: 'success' })
        await loadCategories()
        setShowCategoryManager(false)
        setEditingCategory(null)
        setCategoryForm({ value: '', label: '', icon: '' })
      } else {
        Taro.showToast({ title: response.msg || '操作失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个分类吗？',
      confirmText: '删除',
      cancelText: '取消'
    })
    if (!res.confirm) return

    try {
      const response = await categoryAPI.delete(categoryId)
      if (response.code === 0) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        await loadCategories()
      } else {
        Taro.showToast({ title: response.msg || '删除失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '删除失败', icon: 'none' })
    }
  }

  const handleEditCategory = (category: PersonCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      value: category.value || '',
      label: category.label || '',
      icon: category.icon || ''
    })
    setShowCategoryManager(true)
  }

  const getCategoryLabel = (categoryValue?: string) => {
    if (!categoryValue) return ''
    const category = categories.find((c) => c.value === categoryValue)
    return category?.label || categoryValue
  }

  const getCategoryIcon = (categoryValue?: string) => {
    if (!categoryValue) return ''
    const category = categories.find((c) => c.value === categoryValue)
    return category?.icon || ''
  }

  const filteredPersons = selectedCategory
    ? persons.filter((p) => p.category === selectedCategory)
    : persons

  const handleDeletePerson = async (personId: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条人员信息吗？',
      confirmText: '删除',
      cancelText: '取消'
    })
    if (!res.confirm) return

    try {
      const response = await personAPI.delete(personId)
      if (response.code === 0) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        await loadPersons()
      } else {
        Taro.showToast({ title: response.msg || '删除失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '删除失败', icon: 'none' })
    }
  }

  const handleSelectPerson = (person: Person) => {
    // 根据人员信息自动填充 beneficiary_desc
    setWish((prev) => ({
      ...prev,
      beneficiary_desc: person.name
    }))
    setShowPersonSelector(false)
  }

  const handleSelectBeneficiaryType = (type: string) => {
    setWish((prev) => {
      const newWish = { ...prev, beneficiary_type: type }
      
      // 如果选择"自己"，自动清空描述，不需要选择人员
      if (type === 'self') {
        newWish.beneficiary_desc = ''
        return newWish
      }
      
      // 如果选择其他分类，先清空描述，等待用户选择人员
      newWish.beneficiary_desc = ''
      
      // 延迟显示选择器，让UI更新完成
      setTimeout(() => {
        setShowPersonSelector(true)
      }, 100)
      
      return newWish
    })
  }

  // 根据当前选择的分类筛选人员
  const getFilteredPersonsForSelection = () => {
    if (!wish.beneficiary_type || wish.beneficiary_type === 'self') {
      return []
    }

    // beneficiary_type 与人员 category 使用同一套分类 value（默认 + 自定义）
    return persons.filter((p) => p.category === wish.beneficiary_type)
  }

  // 当人员列表更新时，如果当前选择的分类有人员，自动选择第一个（可选）
  useEffect(() => {
    if (
      wish.beneficiary_type &&
      wish.beneficiary_type !== 'self' &&
      !wish.beneficiary_desc &&
      persons.length > 0
    ) {
      const filtered = getFilteredPersonsForSelection()
      // 不自动选择，让用户主动选择
    }
  }, [persons, wish.beneficiary_type])

  useShareAppMessage(() => {
    // 分享后点"查看分享页"会打开这里配置的 path；为了避免回到首页后看不到要解锁的内容，
    // 这里将解锁所需的参数带到 Tab1（愿望分析页），由页面自行处理并展示解锁结果。
    let sharePath = '/pages/index/index'
    const ctx = shareUnlockContextRef.current || shareUnlockContext
    if (ctx) {
      sharePath = `/pages/index/index?analysis_id=${ctx.analysisId}&unlock_token=${ctx.unlockToken}`
    } else if (analysisResult?.analysis_id && analysisResult.unlock_token && !unlocked) {
      // 兜底：避免因竞态导致分享链接不带参数
      sharePath = `/pages/index/index?analysis_id=${analysisResult.analysis_id}&unlock_token=${analysisResult.unlock_token}`
    }
    return {
      title: getRandomShareTitle(), // 随机显示分享标题
      path: sharePath,
      imageUrl: shareCoverImage, // 分享封面图(需要准备 5:4 比例的图片)
      success: async () => {
        const currentCtx =
          shareUnlockContextRef.current ||
          shareUnlockContext ||
          (analysisResult?.analysis_id && analysisResult.unlock_token && !unlocked
            ? { analysisId: analysisResult.analysis_id, unlockToken: analysisResult.unlock_token }
            : null)
        if (!currentCtx) return
        console.log('分享成功，开始解锁...', currentCtx)

        // 秒刷新：先乐观更新 UI（若 analyze 阶段已带 full_result，可立即展示）
        setUnlocked(true)
        setAnalysisResult((prev) =>
          prev
            ? {
                ...prev,
                locked: false
              }
            : prev
        )

        try {
          const response = await unlockAPI.unlockByShare(
            currentCtx.unlockToken,
            currentCtx.analysisId
          )
          console.log('解锁响应:', response)
          if (response.code === 0) {
            // 立即更新状态，显示解锁后的内容
            setAnalysisResult((prev) =>
              prev
                ? {
                    ...prev,
                    locked: false,
                    full_result: response.data.full_result || prev.full_result,
                    analysis_results: response.data.analysis_results || prev.analysis_results
                  }
                : prev
            )
            // 延迟显示提示，避免与微信系统弹窗冲突
            setTimeout(() => {
              Taro.showToast({ 
                title: '分享成功，内容已解锁', 
                icon: 'success',
                duration: 2000
              })
            }, 500)
            // 解锁完成后清理分享上下文，避免后续继续带旧参数
            shareUnlockContextRef.current = null
            setShareUnlockContext(null)
          } else {
            Taro.showToast({ 
              title: response.msg || '解锁同步失败，请稍后再试', 
              icon: 'none',
              duration: 2000
            })
          }
        } catch (error: any) {
          console.error('解锁失败:', error)
          Taro.showToast({ 
            title: error.message || '解锁同步失败，请稍后再试', 
            icon: 'none',
            duration: 2000
          })
        } finally {
          // 不清除 shareUnlockContext，以便用户再次分享时仍能解锁
          // setShareUnlockContext(null)
        }
      },
      fail: () => {
        // 分享失败时清除上下文
        console.log('分享失败，清除解锁上下文')
        shareUnlockContextRef.current = null
        setShareUnlockContext(null)
      }
    }
  })

  const handleAnalyze = async () => {
    if (!wish.wish_text?.trim()) {
      Taro.showToast({ title: '请先填写愿望原文', icon: 'none' })
      return
    }
    setAnalyzing(true)
    try {
      const response = await wishAPI.analyze(wish.wish_text || '', wish.deity || '')
      if (response.code === 0) {
        setAnalysisResult(response.data)
        setUnlocked(false)
        Taro.showToast({ title: '分析完成', icon: 'success' })
      } else {
        Taro.showToast({ title: response.msg || '分析失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '分析失败', icon: 'none' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUnlockByAd = async () => {
    if (!analysisResult) return
    Taro.showLoading({ title: '观看广告中...' })
    setTimeout(async () => {
      try {
        const response = await unlockAPI.unlockByAd(
          analysisResult.unlock_token,
          analysisResult.analysis_id
        )
        if (response.code === 0) {
          setUnlocked(true)
          setAnalysisResult({
            ...analysisResult,
            full_result: response.data.full_result
          })
          Taro.showToast({ title: '解锁成功', icon: 'success' })
        } else {
          Taro.showToast({ title: response.msg || '解锁失败', icon: 'none' })
        }
      } catch (error: any) {
        Taro.showToast({ title: error.message || '解锁失败', icon: 'none' })
      } finally {
        Taro.hideLoading()
      }
    }, 1200)
  }

  const handleUnlockByShare = () => {
    if (!analysisResult) return
    const ctx = {
      unlockToken: analysisResult.unlock_token,
      analysisId: analysisResult.analysis_id
    }
    shareUnlockContextRef.current = ctx
    setShareUnlockContext(ctx)
  }

  const handleOptimize = async () => {
    if (!analysisResult?.analysis_id) {
      Taro.showToast({ title: '请先分析', icon: 'none' })
      return
    }
    if (!unlocked) {
      Taro.showToast({ title: '请先解锁后再一键优化', icon: 'none' })
      return
    }
    setOptimizing(true)
    try {
      const response = await wishAPI.optimize(
        wish.wish_text || '',
        analysisResult.analysis_id,
        wish.deity || '',
        undefined,
        {
          time_range: wish.time_range,
          target_quantify: wish.target_quantify,
          way_boundary: wish.way_boundary,
          action_commitment: wish.action_commitment,
          return_wish: wish.return_wish
        }
      )
      if (response.code === 0) {
        setAnalysisResult((prev) =>
          prev
            ? {
                ...prev,
                full_result: response.data
              }
            : prev
        )
        Taro.showToast({ title: '优化完成', icon: 'success' })
      } else {
        Taro.showToast({ title: response.msg || '优化失败', icon: 'none' })
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '优化失败', icon: 'none' })
    } finally {
      setOptimizing(false)
    }
  }

  const handleSubmit = async () => {
    if (!wish.beneficiary_type) {
      Taro.showToast({ title: '请选择许愿人/受益人', icon: 'none' })
      return
    }
    // 如果选择的是非"自己"的分类，需要选择具体人员
    if (wish.beneficiary_type !== 'self' && !wish.beneficiary_desc?.trim()) {
      Taro.showToast({ title: '请选择具体人员', icon: 'none' })
      return
    }
    if (!wish.deity?.trim()) {
      Taro.showToast({ title: '对象为必填', icon: 'none' })
      return
    }
    if (!wish.wish_text?.trim()) {
      Taro.showToast({ title: '愿望原文为必填', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await onSubmit(wish)
      // 提交成功后自动保存到历史记录
      if (wish.beneficiary_type && wish.deity?.trim()) {
        await profileAPI.create({
          beneficiary_type: wish.beneficiary_type,
          beneficiary_desc: wish.beneficiary_desc || '',
          deity: wish.deity
        })
        await loadProfiles()
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <View className="wish-modal">
      <View className="wish-modal__content">
        <View className="wish-modal__header">
          <Text className="wish-modal__title">{title}</Text>
          <Text className="wish-modal__close" onClick={onClose}>
            ×
          </Text>
        </View>
        <View className="wish-modal__body">
          <View className="wish-modal__field">
            <View className="wish-modal__field-header">
              <Text className="wish-modal__label">👤 许愿人/受益人（必填）</Text>
              <View className="wish-modal__field-actions">
                <Text
                  className="wish-modal__manage-btn"
                  onClick={handleOpenPersonManager}
                >
                  管理
                </Text>
                {profiles.length > 0 && (
                  <Text
                    className="wish-modal__history-btn"
                    onClick={() => setShowProfileSelector('beneficiary')}
                  >
                    历史记录
                  </Text>
                )}
              </View>
            </View>
            <Text className="wish-modal__hint">这个愿望是为谁许的？</Text>
            <View className="wish-modal__beneficiary-options">
              {beneficiaryOptions.map((option) => (
                <View
                  key={option.value}
                  className={`wish-modal__beneficiary-option ${
                    wish.beneficiary_type === option.value ? 'is-active' : ''
                  }`}
                  onClick={() => handleSelectBeneficiaryType(option.value)}
                >
                  <Text className="wish-modal__beneficiary-icon">{option.icon}</Text>
                  <Text className="wish-modal__beneficiary-label">{option.label}</Text>
                </View>
              ))}
            </View>
            {/* 显示已选择的人员信息 */}
            {wish.beneficiary_type && (
              <View className="wish-modal__selected-person">
                {wish.beneficiary_type === 'self' ? (
                  <View className="wish-modal__selected-person-info">
                    <Text className="wish-modal__selected-person-label">已选择：自己</Text>
                  </View>
                ) : wish.beneficiary_desc ? (
                  <View className="wish-modal__selected-person-info">
                    <Text className="wish-modal__selected-person-label">
                      已选择：{wish.beneficiary_desc}
                    </Text>
                    <Text
                      className="wish-modal__selected-person-change"
                      onClick={() => setShowPersonSelector(true)}
                    >
                      更换
                    </Text>
                  </View>
                ) : (
                  <View className="wish-modal__selected-person-info">
                    <Text className="wish-modal__selected-person-hint">请选择具体人员</Text>
                    <Text
                      className="wish-modal__selected-person-btn"
                      onClick={() => setShowPersonSelector(true)}
                    >
                      选择人员
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View className="wish-modal__field">
            <View className="wish-modal__field-header">
              <Text className="wish-modal__label">🏛 对象（必填）</Text>
              {profiles.length > 0 && (
                <Text
                  className="wish-modal__history-btn"
                  onClick={() => setShowProfileSelector('deity')}
                >
                  历史记录
                </Text>
              )}
            </View>
            <Text className="wish-modal__hint">向谁许愿？</Text>
            <View className="wish-modal__input-wrapper">
              <Input
                className="wish-modal__input"
                placeholder="例如：观音菩萨 / 财神 / 文殊菩萨 / 药师佛 / 月老 / 自己"
                value={wish.deity || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, deity: e.detail.value }))}
              />
              {wish.deity?.trim() && (
                <Text className="wish-modal__save-btn" onClick={handleSaveProfile}>
                  保存
                </Text>
              )}
            </View>
          </View>
          <View className="wish-modal__field">
            <Text className="wish-modal__label">📝 愿望原文（必填）</Text>
            <Textarea
              className="wish-modal__textarea"
              placeholder="写下你的愿望..."
              value={wish.wish_text || ''}
              onInput={(e) => setWish((prev) => ({ ...prev, wish_text: e.detail.value }))}
            />
          </View>

          <View className="wish-modal__field">
            <Text className="wish-modal__label wish-modal__label--section">📋 补充信息（选填，可帮助分析）</Text>
          </View>
          <View className="wish-modal__grid">
            <View className="wish-modal__field">
              <Text className="wish-modal__label">时间范围</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：3个月内"
                value={wish.time_range || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, time_range: e.detail.value }))}
              />
            </View>
            <View className="wish-modal__field">
              <Text className="wish-modal__label">目标量化</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：月薪≥15K"
                value={wish.target_quantify || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, target_quantify: e.detail.value }))}
              />
            </View>
            <View className="wish-modal__field">
              <Text className="wish-modal__label">方式边界</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：合法合规"
                value={wish.way_boundary || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, way_boundary: e.detail.value }))}
              />
            </View>
            <View className="wish-modal__field">
              <Text className="wish-modal__label">行动承诺</Text>
              <Input
                className="wish-modal__input"
                placeholder="例如：每天投递5份简历"
                value={wish.action_commitment || ''}
                onInput={(e) => setWish((prev) => ({ ...prev, action_commitment: e.detail.value }))}
              />
            </View>
          </View>
          <View className="wish-modal__field">
            <Text className="wish-modal__label">🎁 还愿（可选）</Text>
            <Input
              className="wish-modal__input"
              placeholder="例如：捐款/做公益/回向家人"
              value={wish.return_wish || ''}
              onInput={(e) => setWish((prev) => ({ ...prev, return_wish: e.detail.value }))}
            />
          </View>

          {analysisResult && (
            <View className="wish-modal__analysis">
              <Text className="bb-card-title">诊断结果</Text>
              <View className="wish-modal__analysis-row">
                <View className="wish-modal__analysis-card">
                  <Text className="wish-modal__analysis-title">分析结果</Text>
                  {(analysisResult.analysis_results || []).map((item, index) => (
                    <Text key={index} className="wish-modal__analysis-item">
                      • {item}
                    </Text>
                  ))}
                </View>
                <View className="wish-modal__analysis-card">
                  <Text className="wish-modal__analysis-title">建议</Text>
                  <Text className="wish-modal__analysis-item">
                    • {analysisResult.posture || '先补齐时间边界与量化目标'}
                  </Text>
                  {!!analysisResult.suggested_deity && (
                    <Text className="wish-modal__analysis-item">• 建议对象：{analysisResult.suggested_deity}</Text>
                  )}
                </View>
              </View>
              {!unlocked && (
                <View className="wish-modal__unlock">
                  <Text className="wish-modal__analysis-title">一键 AI 优化（需解锁）</Text>
                  <View className="wish-modal__unlock-actions">
                    {/* 根据配置决定是否显示广告解锁按钮 */}
                    {typeof ENABLE_AD_UNLOCK !== 'undefined' && ENABLE_AD_UNLOCK === 'true' && (
                      <Button className="bb-btn-outline" onClick={handleUnlockByAd}>
                        看广告解锁
                      </Button>
                    )}
                    <Button
                      className="bb-btn-outline"
                      openType="share"
                      onClick={handleUnlockByShare}
                    >
                      分享解锁
                    </Button>
                  </View>
                </View>
              )}
              {unlocked && analysisResult.full_result && (
                <View className="wish-modal__optimize">
                  <Text className="wish-modal__analysis-title">优化结果</Text>
                  <Text className="wish-modal__optimize-text">
                    {analysisResult.full_result.optimized_text}
                  </Text>
                  {analysisResult.full_result.warnings?.length > 0 && (
                    <View className="wish-modal__warnings">
                      <Text className="wish-modal__analysis-title">注意事项</Text>
                      {analysisResult.full_result.warnings.map((item, index) => (
                        <Text key={index} className="wish-modal__warnings-item">
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}
                  <Button
                    className="bb-btn-ghost"
                    onClick={() =>
                      Taro.setClipboardData({
                        data: analysisResult.full_result?.optimized_text || ''
                      })
                    }
                  >
                    复制许愿稿
                  </Button>
                </View>
              )}
            </View>
          )}

          {/* 历史记录选择弹窗 */}
          {showProfileSelector && (
            <View className="wish-modal__profile-selector">
              <View className="wish-modal__profile-selector-header">
                <Text className="wish-modal__profile-selector-title">选择历史记录</Text>
                <Text
                  className="wish-modal__profile-selector-close"
                  onClick={() => setShowProfileSelector(null)}
                >
                  关闭
                </Text>
              </View>
              <View className="wish-modal__profile-list">
                {profiles.length === 0 ? (
                  <Text className="wish-modal__profile-empty">暂无历史记录</Text>
                ) : (
                  profiles.map((profile) => {
                    const beneficiaryLabel = getBeneficiaryLabel(profile.beneficiary_type)
                    const displayText =
                      showProfileSelector === 'beneficiary'
                        ? `${beneficiaryLabel}${profile.beneficiary_desc ? ` - ${profile.beneficiary_desc}` : ''}`
                        : profile.deity
                    return (
                      <View
                        key={profile.id}
                        className="wish-modal__profile-item"
                        onClick={() => handleSelectProfile(profile)}
                      >
                        <Text className="wish-modal__profile-text">{displayText}</Text>
                        {showProfileSelector === 'deity' && profile.beneficiary_desc && (
                          <Text className="wish-modal__profile-desc">
                            {getBeneficiaryLabel(profile.beneficiary_type)}
                            {profile.beneficiary_desc ? ` - ${profile.beneficiary_desc}` : ''}
                          </Text>
                        )}
                      </View>
                    )
                  })
                )}
              </View>
            </View>
          )}

        </View>
        <View className="wish-modal__footer">
          <Button className="bb-btn-primary" loading={saving} onClick={handleSubmit}>
            {confirmText}
          </Button>
        </View>
      </View>

      {/* 人员管理弹窗 - 独立弹窗，样式与新增愿望弹窗一致 */}
      {showPersonManager && (
        <View className="wish-modal">
          <View className="wish-modal__content">
            <View className="wish-modal__header">
              <Text className="wish-modal__title">
                {editingPerson ? '编辑人员信息' : '人员信息管理'}
              </Text>
              <Text
                className="wish-modal__close"
                onClick={() => {
                  setShowPersonManager(false)
                  setEditingPerson(null)
                  setPersonForm({ name: '', category: '', id_card: '', phone: '' })
                  setSelectedCategory(null)
                }}
              >
                ×
              </Text>
            </View>
            <View className="wish-modal__body">
              {/* 分类管理 */}
              <View className="wish-modal__field">
                <View className="wish-modal__field-header">
                  <Text className="wish-modal__label">分类</Text>
                  <Text
                    className="wish-modal__manage-btn"
                    onClick={() => {
                      setShowCategoryManager(true)
                      setEditingCategory(null)
                      setCategoryForm({ value: '', label: '', icon: '' })
                      loadCategories()
                    }}
                  >
                    分类管理
                  </Text>
                </View>
                <View className="wish-modal__category-options">
                  <View
                    className={`wish-modal__category-option ${selectedCategory === null ? 'is-active' : ''}`}
                    onClick={() => handleSelectPersonCategory(null)}
                  >
                    <Text className="wish-modal__category-label">全部</Text>
                  </View>
                  {categories.map((category) => (
                    <View
                      key={category.id}
                      className={`wish-modal__category-option ${
                        selectedCategory === category.value ? 'is-active' : ''
                      }`}
                      onClick={() => handleSelectPersonCategory(category.value)}
                    >
                      {category.icon && (
                        <Text className="wish-modal__category-icon">{category.icon}</Text>
                      )}
                      <Text className="wish-modal__category-label">{category.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 添加/编辑表单 */}
              <View className="wish-modal__field">
                <Text className="wish-modal__label wish-modal__label--section">添加/编辑人员</Text>
              </View>
              <View className="wish-modal__field">
                <Text className="wish-modal__label">姓名（必填）</Text>
                <Input
                  className="wish-modal__input"
                  placeholder="请输入姓名"
                  value={personForm.name}
                  onInput={(e) => setPersonForm((prev) => ({ ...prev, name: e.detail.value }))}
                />
              </View>
              <View className="wish-modal__field">
                <Text className="wish-modal__label">身份证号（可选）</Text>
                <Input
                  className="wish-modal__input"
                  placeholder="请输入身份证号"
                  value={personForm.id_card}
                  onInput={(e) => setPersonForm((prev) => ({ ...prev, id_card: e.detail.value }))}
                />
              </View>
              <View className="wish-modal__field">
                <Text className="wish-modal__label">手机号（可选）</Text>
                <Input
                  className="wish-modal__input"
                  type="number"
                  placeholder="请输入手机号"
                  value={personForm.phone}
                  onInput={(e) => setPersonForm((prev) => ({ ...prev, phone: e.detail.value }))}
                />
              </View>

              {/* 人员列表 */}
              <View className="wish-modal__field">
                <Text className="wish-modal__label wish-modal__label--section">已保存的人员</Text>
                {filteredPersons.length === 0 ? (
                  <Text className="wish-modal__person-empty">暂无人员信息</Text>
                ) : (
                  <View className="wish-modal__person-list">
                    {filteredPersons.map((person) => (
                      <View key={person.id} className="wish-modal__person-item">
                        <View
                          className="wish-modal__person-info"
                          onClick={() => handleSelectPerson(person)}
                        >
                          <View className="wish-modal__person-header">
                            <Text className="wish-modal__person-name">{person.name}</Text>
                            {person.category && (
                              <View className="wish-modal__person-category-tag">
                                {getCategoryIcon(person.category) && (
                                  <Text className="wish-modal__person-category-icon">
                                    {getCategoryIcon(person.category)}
                                  </Text>
                                )}
                                <Text className="wish-modal__person-category-label">
                                  {getCategoryLabel(person.category)}
                                </Text>
                              </View>
                            )}
                          </View>
                          {person.id_card && (
                            <Text className="wish-modal__person-detail">身份证：{person.id_card}</Text>
                          )}
                          {person.phone && (
                            <Text className="wish-modal__person-detail">手机：{person.phone}</Text>
                          )}
                        </View>
                        <View className="wish-modal__person-actions">
                          <Text
                            className="wish-modal__person-edit"
                            onClick={() => handleEditPerson(person)}
                          >
                            编辑
                          </Text>
                          <Text
                            className="wish-modal__person-delete"
                            onClick={() => handleDeletePerson(person.id)}
                          >
                            删除
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <View className="wish-modal__footer">
              <Button className="bb-btn-primary" onClick={handleSavePerson}>
                {editingPerson ? '更新' : '添加'}
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 分类管理弹窗 */}
      {showCategoryManager && (
        <View className="wish-modal">
          <View className="wish-modal__content">
            <View className="wish-modal__header">
              <Text className="wish-modal__title">
                {editingCategory ? '编辑分类' : '分类管理'}
              </Text>
              <Text
                className="wish-modal__close"
                onClick={() => {
                  setShowCategoryManager(false)
                  setEditingCategory(null)
                  setCategoryForm({ value: '', label: '', icon: '' })
                }}
              >
                ×
              </Text>
            </View>
            <View className="wish-modal__body">
              {/* 默认分类显示 */}
              <View className="wish-modal__field">
                <Text className="wish-modal__label wish-modal__label--section">默认分类</Text>
                <View className="wish-modal__category-options">
                  {categories
                    .filter((c) => c.is_default)
                    .map((category) => (
                      <View key={category.id} className="wish-modal__category-option">
                        {category.icon && (
                          <Text className="wish-modal__category-icon">{category.icon}</Text>
                        )}
                        <Text className="wish-modal__category-label">{category.label}</Text>
                      </View>
                    ))}
                </View>
              </View>

              {/* 添加/编辑表单 */}
              <View className="wish-modal__field">
                <Text className="wish-modal__label wish-modal__label--section">
                  {editingCategory ? '编辑分类' : '添加自定义分类'}
                </Text>
              </View>
              <View className="wish-modal__field">
                <Text className="wish-modal__label">分类名称（必填）</Text>
                <View className="wish-modal__category-name-input">
                  <View
                    className="wish-modal__icon-picker"
                    onClick={() => setShowEmojiPicker(true)}
                  >
                    {categoryForm.icon ? (
                      <Text className="wish-modal__icon-display">{categoryForm.icon}</Text>
                    ) : (
                      <View className="wish-modal__icon-default">
                        <View className="wish-modal__icon-outline">
                          <View className="wish-modal__icon-eye"></View>
                          <View className="wish-modal__icon-eye"></View>
                          <View className="wish-modal__icon-mouth"></View>
                        </View>
                      </View>
                    )}
                  </View>
                  <Input
                    className="wish-modal__input wish-modal__input--with-icon"
                    placeholder="例如：朋友、同事"
                    value={categoryForm.label}
                    onInput={(e) => setCategoryForm((prev) => ({ ...prev, label: e.detail.value }))}
                  />
                </View>
              </View>

              {/* 自定义分类列表 */}
              <View className="wish-modal__field">
                <Text className="wish-modal__label wish-modal__label--section">自定义分类</Text>
                {categories.filter((c) => !c.is_default).length === 0 ? (
                  <Text className="wish-modal__person-empty">暂无自定义分类</Text>
                ) : (
                  <View className="wish-modal__person-list">
                    {categories
                      .filter((c) => !c.is_default)
                      .map((category) => (
                        <View key={category.id} className="wish-modal__person-item">
                          <View className="wish-modal__person-info">
                            <View className="wish-modal__person-header">
                              {category.icon && (
                                <Text className="wish-modal__person-category-icon">{category.icon}</Text>
                              )}
                              <Text className="wish-modal__person-name">{category.label}</Text>
                            </View>
                          </View>
                          <View className="wish-modal__person-actions">
                            <Text
                              className="wish-modal__person-edit"
                              onClick={() => handleEditCategory(category)}
                            >
                              编辑
                            </Text>
                            <Text
                              className="wish-modal__person-delete"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              删除
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </View>
            <View className="wish-modal__footer">
              <Button className="bb-btn-primary" onClick={handleSaveCategory}>
                {editingCategory ? '更新' : '添加'}
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Emoji 选择器弹窗 */}
      {showEmojiPicker && (
        <View
          className="wish-modal__emoji-picker"
          onClick={() => setShowEmojiPicker(false)}
        >
          <View
            className="wish-modal__emoji-picker-content"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <View className="wish-modal__emoji-picker-header">
              <Text className="wish-modal__emoji-picker-title">所有表情</Text>
              <Text
                className="wish-modal__emoji-picker-close"
                onClick={() => setShowEmojiPicker(false)}
              >
                关闭
              </Text>
            </View>
            <View className="wish-modal__emoji-grid">
              {ICON_OPTIONS.map((emoji, index) => (
                <View
                  key={index}
                  className={`wish-modal__emoji-item ${
                    categoryForm.icon === emoji ? 'is-selected' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    // 选择图标后关闭弹窗，避免遮挡后续输入
                    setCategoryForm((prev) => ({ ...prev, icon: emoji }))
                    setShowEmojiPicker(false)
                  }}
                >
                  <Text className="wish-modal__emoji-text">{emoji}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 人员选择器弹窗 */}
      {showPersonSelector && wish.beneficiary_type && wish.beneficiary_type !== 'self' && (
        <View
          className="wish-modal__person-selector"
          onClick={() => setShowPersonSelector(false)}
        >
          <View
            className="wish-modal__person-selector-content"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <View className="wish-modal__person-selector-header">
              <Text className="wish-modal__person-selector-title">
                选择{getBeneficiaryLabel(wish.beneficiary_type)}
              </Text>
              <Text
                className="wish-modal__person-selector-close"
                onClick={() => setShowPersonSelector(false)}
              >
                关闭
              </Text>
            </View>
            <View className="wish-modal__person-selector-list">
              {getFilteredPersonsForSelection().length === 0 ? (
                <View className="wish-modal__person-selector-empty">
                  <Text className="wish-modal__person-selector-empty-text">
                    该分类下暂无人员信息
                  </Text>
                  <Text className="wish-modal__person-selector-empty-hint">
                    请先在"管理"中添加人员信息
                  </Text>
                  <Button
                    className="bb-btn-outline"
                    onClick={() => {
                      setShowPersonSelector(false)
                      handleOpenPersonManager()
                    }}
                  >
                    去添加
                  </Button>
                </View>
              ) : (
                getFilteredPersonsForSelection().map((person) => (
                  <View
                    key={person.id}
                    className={`wish-modal__person-selector-item ${
                      wish.beneficiary_desc === person.name ? 'is-selected' : ''
                    }`}
                    onClick={() => handleSelectPerson(person)}
                  >
                    <View className="wish-modal__person-selector-info">
                      <Text className="wish-modal__person-selector-name">{person.name}</Text>
                      {person.id_card && (
                        <Text className="wish-modal__person-selector-detail">
                          身份证：{person.id_card}
                        </Text>
                      )}
                      {person.phone && (
                        <Text className="wish-modal__person-selector-detail">手机：{person.phone}</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
