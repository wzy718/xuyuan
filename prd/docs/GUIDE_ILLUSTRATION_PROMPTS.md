# 引导页插图 Midjourney Prompt

## 设计风格要求
- **风格**：禅意中式、简约优雅
- **主色调**：檀金(#C9A962)、朱砂(#C45C4B)、月白(#FFF8F0)、墨色(#2C2C2C)、竹青(#5B8C5A)
- **装饰元素**：祥云纹理、莲花图案、回纹边框
- **用途**：微信小程序引导页插图
- **尺寸建议**：正方形或 4:3 比例，适合移动端显示

---

## 第1页：许愿有方法（莲花/佛手）

### Prompt 1（推荐）
```
A serene Chinese Buddhist illustration, elegant lotus flower with gentle Buddha hand gesture in soft golden light, traditional ink painting style, minimalist composition, warm color palette of antique gold (#C9A962), soft cream (#FFF8F0), and subtle ink black (#2C2C2C), wisps of cloud patterns in background, peaceful and meditative atmosphere, clean white space, suitable for mobile app onboarding, --ar 4:3 --style raw --v 6
```

### Prompt 2（备选）
```
Minimalist Chinese Zen illustration, delicate lotus blossom with graceful hand gesture, traditional Chinese painting aesthetic, soft gradient from golden yellow to cream white, subtle cloud motifs, elegant negative space, peaceful and contemplative mood, clean modern design for mobile interface, --ar 1:1 --style raw --v 6
```

### 关键词说明
- **核心元素**：莲花（lotus）+ 佛手（Buddha hand gesture）
- **风格**：传统中国画风格，简约现代
- **色彩**：檀金、月白、墨色
- **氛围**：宁静、冥想、优雅

---

## 第2页：AI智能优化（香炉/经卷）

### Prompt 1（推荐）
```
Elegant Chinese Zen illustration, ancient incense burner with wisps of smoke, traditional scroll or scripture book partially unrolled, soft golden light, minimalist Chinese ink painting style, warm color palette of antique gold (#C9A962), vermillion red (#C45C4B), and cream white (#FFF8F0), subtle cloud patterns, modern minimalist composition, peaceful and wise atmosphere, clean design for mobile app, --ar 4:3 --style raw --v 6
```

### Prompt 2（备选）
```
Minimalist Chinese illustration, traditional incense burner emitting gentle smoke, ancient scroll with calligraphy, soft lighting, elegant composition, warm golden and cream tones, subtle bamboo green accents (#5B8C5A), traditional Chinese aesthetic with modern simplicity, serene and contemplative mood, suitable for app interface, --ar 1:1 --style raw --v 6
```

### 关键词说明
- **核心元素**：香炉（incense burner）+ 经卷（scroll/scripture）
- **风格**：传统中式，现代简约
- **色彩**：檀金、朱砂、月白、竹青
- **氛围**：智慧、宁静、传统与现代结合

---

## 第3页：记录与追踪（愿望树）

### Prompt 1（推荐）
```
Beautiful Chinese Zen illustration, wish tree with hanging prayer tags or red ribbons, elegant branches with delicate leaves, soft golden and cream tones, traditional Chinese painting style with modern minimalism, warm color palette of antique gold (#C9A962), bamboo green (#5B8C5A), and soft cream (#FFF8F0), subtle cloud patterns in background, peaceful and hopeful atmosphere, clean composition for mobile app, --ar 4:3 --style raw --v 6
```

### Prompt 2（备选）
```
Minimalist Chinese illustration, graceful tree with hanging wish tags, elegant branches reaching upward, soft natural lighting, traditional ink painting aesthetic, warm golden yellow and cream white tones, subtle green accents, wisps of clouds, serene and uplifting mood, modern clean design for app onboarding, --ar 1:1 --style raw --v 6
```

### 关键词说明
- **核心元素**：愿望树（wish tree）+ 许愿签（prayer tags/red ribbons）
- **风格**：传统中国画，现代简约
- **色彩**：檀金、竹青、月白
- **氛围**：希望、成长、见证

---

## 通用优化建议

### 参数调整
- **--ar 4:3** 或 **--ar 1:1**：适合移动端显示
- **--style raw**：更接近真实绘画风格
- **--v 6**：使用 Midjourney v6 版本（最新版本）

### 颜色微调
如果生成的颜色不够准确，可以在 prompt 中添加：
- `color palette: antique gold #C9A962, vermillion #C45C4B, cream white #FFF8F0, ink black #2C2C2C, bamboo green #5B8C5A`

### 风格统一
确保三张插图：
1. 使用相同的艺术风格（传统中国画 + 现代简约）
2. 保持相似的颜色调性
3. 统一的构图比例和留白
4. 一致的祥云纹理装饰

### 后期处理建议
生成后可能需要：
- 调整颜色饱和度以匹配设计规范
- 优化对比度以适应小程序显示
- 确保背景透明或纯色，便于与祥云纹理背景融合

---

## 使用示例

在 Midjourney 中，可以直接复制上述任一 Prompt 使用。例如：

```
/imagine A serene Chinese Buddhist illustration, elegant lotus flower with gentle Buddha hand gesture in soft golden light, traditional ink painting style, minimalist composition, warm color palette of antique gold (#C9A962), soft cream (#FFF8F0), and subtle ink black (#2C2C2C), wisps of cloud patterns in background, peaceful and meditative atmosphere, clean white space, suitable for mobile app onboarding, --ar 4:3 --style raw --v 6
```

如果需要调整，可以：
- 修改 `--ar` 参数调整比例
- 添加 `--no [元素]` 移除不需要的元素
- 使用 `--seed [数字]` 保持风格一致性

---

## 底部导航栏图标 Prompt

### 图标设计要求
- **风格**：简洁线条图标、扁平化设计
- **尺寸**：适合 24x24 到 48x48 像素显示
- **背景**：透明背景（PNG）
- **颜色**：未选中状态（灰色 #999999），选中状态（檀金色 #C9A962）
- **风格**：禅意中式、简约现代
- **用途**：微信小程序底部 Tab 导航栏图标

### ⚠️ 重要说明
**当前 prompt 生成的是基础图标（无特定颜色）**，需要后期处理：
1. 使用 Midjourney 生成基础图标（线条图标，通常是黑色或深色）
2. 在 Figma/Photoshop 中调整颜色，创建两种状态：
   - **未选中状态**：转为灰色（#999999 或 #CCCCCC）
   - **选中状态**：转为檀金色（#C9A962）
3. 导出为对应的文件名（tab-X-icon.png 和 tab-X-icon-active.png）

---

## 图标 1：经卷（首页）

### Prompt 1（推荐 - 线条风格）
```
Minimalist line art icon, traditional Chinese scroll or scripture book, simple elegant lines, flat design style, clean outline, centered composition, transparent background, suitable for mobile app tab bar icon, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

### Prompt 2（备选 - 扁平化）
```
Flat icon design, ancient Chinese scroll unrolled, minimalist geometric style, clean simple shapes, elegant lines, transparent background, app icon style, Chinese traditional element, --ar 1:1 --style raw --v 6
```

### Prompt 3（备选 - 带细节）
```
Simple icon, traditional Chinese scripture scroll with subtle decorative patterns, minimalist line art, clean design, transparent background, suitable for 24x24 pixel display, Chinese Buddhist aesthetic, --ar 1:1 --style raw --v 6
```

### 关键词说明
- **核心元素**：经卷（scroll/scripture book）
- **风格**：线条图标、扁平化
- **背景**：透明
- **用途**：Tab 导航栏图标

---

## 图标 2：莲花（我的愿望）

### Prompt 1（推荐 - 线条风格）
```
Minimalist line art icon, elegant lotus flower, simple clean lines, flat design style, centered composition, transparent background, suitable for mobile app tab bar icon, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

### Prompt 2（备选 - 扁平化）
```
Flat icon design, stylized lotus blossom, minimalist geometric style, clean simple shapes, elegant outline, transparent background, app icon style, Chinese Buddhist symbol, --ar 1:1 --style raw --v 6
```

### Prompt 3（备选 - 带细节）
```
Simple icon, traditional Chinese lotus flower with petals, minimalist line art, clean design, transparent background, suitable for 24x24 pixel display, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

### 关键词说明
- **核心元素**：莲花（lotus flower）
- **风格**：线条图标、扁平化
- **背景**：透明
- **用途**：Tab 导航栏图标

---

## 图标 3：香炉（个人中心）

### Prompt 1（推荐 - 线条风格）
```
Minimalist line art icon, traditional Chinese incense burner, simple elegant lines, flat design style, clean outline, centered composition, transparent background, suitable for mobile app tab bar icon, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

### Prompt 2（备选 - 扁平化）
```
Flat icon design, ancient Chinese incense burner with subtle smoke, minimalist geometric style, clean simple shapes, elegant lines, transparent background, app icon style, Chinese traditional element, --ar 1:1 --style raw --v 6
```

### Prompt 3（备选 - 带细节）
```
Simple icon, traditional Chinese incense burner with decorative details, minimalist line art, clean design, transparent background, suitable for 24x24 pixel display, Chinese Buddhist aesthetic, --ar 1:1 --style raw --v 6
```

### 关键词说明
- **核心元素**：香炉（incense burner）
- **风格**：线条图标、扁平化
- **背景**：透明
- **用途**：Tab 导航栏图标

---

## 图标生成优化建议

### 尺寸与比例
- **--ar 1:1**：正方形，适合图标
- 建议生成 512x512 或 1024x1024 像素，然后缩放到所需尺寸

### 风格统一
确保三个图标：
1. 使用相同的线条粗细
2. 保持相似的视觉重量
3. 统一的构图风格（居中、对称）
4. 一致的细节程度

### 颜色处理
**当前 prompt 生成的是基础图标（通常是黑色/深色线条）**，需要后期处理：

1. **生成基础图标**：使用 Midjourney prompt 生成基础图标（通常是黑色或深色）
2. **创建未选中状态**：
   - 在 Figma/Photoshop 中打开基础图标
   - 将颜色调整为灰色（#999999 或 #CCCCCC）
   - 导出为 `tab-X-icon.png`
3. **创建选中状态**：
   - 在 Figma/Photoshop 中打开基础图标
   - 将颜色调整为檀金色（#C9A962）
   - 导出为 `tab-X-icon-active.png`
4. **确保背景透明**：两种状态都需要透明背景（PNG 格式）

### 快速生成两种状态的 Prompt（可选）
如果想直接生成带颜色的图标，可以在 prompt 中添加颜色关键词：

**未选中状态（灰色）**：
```
Minimalist line art icon, traditional Chinese scroll, simple elegant lines, flat design style, clean outline, centered composition, transparent background, gray color (#999999), suitable for mobile app tab bar icon, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

**选中状态（金色）**：
```
Minimalist line art icon, traditional Chinese scroll, simple elegant lines, flat design style, clean outline, centered composition, transparent background, golden color (#C9A962), suitable for mobile app tab bar icon, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

**注意**：Midjourney 可能无法精确控制颜色，建议还是使用基础图标 + 后期处理的方式。

### 后期处理步骤
1. **导出透明背景**：确保背景完全透明
2. **调整线条粗细**：确保在小尺寸下清晰可见
3. **颜色替换**：创建未选中和选中两种状态
4. **尺寸优化**：生成多尺寸版本（24x24, 48x48, 96x96）
5. **测试显示**：在实际 Tab 栏中测试效果

### 备选方案
如果 Midjourney 生成的图标不够简洁，可以考虑：
- 使用 AI 图标生成工具（如 Iconify、IconScout）
- 手动在 Figma/Sketch 中绘制线条图标
- 参考中国传统纹样进行简化设计

---

## 图标使用示例

在 Midjourney 中生成图标：

```
/imagine Minimalist line art icon, traditional Chinese scroll or scripture book, simple elegant lines, flat design style, clean outline, centered composition, transparent background, suitable for mobile app tab bar icon, Chinese Zen aesthetic, --ar 1:1 --style raw --v 6
```

生成后，建议：
1. 使用 `U` 命令放大单张图片
2. 下载 PNG 格式
3. 在 Figma/Photoshop 中调整颜色和尺寸
4. 导出为多尺寸版本
