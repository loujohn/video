# 角色参考图生成指南

## 一、为什么需要角色参考图

AI 视频/图片生成的最大挑战是**角色一致性**——同一段文字描述可能生成完全不同的面孔。角色参考图是解决这一问题的锚点：

- 锁定角色五官、发型、体型
- 作为 `@Image` 引用传入视频生成模型
- 确保 60 集短剧中角色前后一致

---

## 二、6 角度参考图系统

每个角色造型（character_look）应生成以下 6 张参考图：

| 序号 | 角度 | 用途 | 构图说明 |
|------|------|------|---------|
| 1 | 正面全身 | 锁定整体外观、服装比例、体型 | 人物居中，占画面 70%，头到脚完整 |
| 2 | 正面半身 | 锁定五官、妆容、上身服饰细节 | 腰部以上，面部占画面 30-40% |
| 3 | 侧面（左或右） | 锁定侧脸轮廓、发型侧面、鼻型 | 标准 90° 侧面，清晰展示轮廓线 |
| 4 | 3/4 角度 | 最常用的视角，锁定自然状态外观 | 面部偏转约 45°，最接近实际镜头 |
| 5 | 情绪特写——开心 | 锁定笑容风格、眼神特征 | 面部特写，自然微笑/大笑 |
| 6 | 情绪特写——愤怒/严肃 | 锁定负面情绪表达方式 | 面部特写，皱眉/冷峻 |

---

## 三、角色描述要素

生成参考图前，必须为角色建立完整的**视觉档案**。以下要素缺一不可：

### 必填要素（至少 5 项）

| 要素 | 说明 | 好的写法 | 差的写法 |
|------|------|---------|---------|
| 年龄段 | 具体年龄或年龄范围 | `28-year-old` | `年轻人` |
| 性别 | 明确性别 | `male/female` | （省略） |
| 发型 + 发色 | 具体描述 | `shoulder-length wavy black hair with side bangs` | `长发` |
| 面部特征 | 2-3 个标志性特征 | `sharp jawline, thick eyebrows, deep-set eyes, dimple on right cheek` | `帅气` |
| 服装 | 具体款式、颜色、材质 | `tailored navy blue three-piece suit, white dress shirt, gold watch` | `时尚衣服` |

### 选填要素

| 要素 | 说明 | 示例 |
|------|------|------|
| 气质 | 整体气场 | `authoritative and calm`, `soft and approachable` |
| 肤色 | 皮肤色调 | `fair skin`, `warm olive complexion`, `dark brown skin` |
| 体型 | 身材特征 | `tall and lean`, `athletic build`, `petite` |
| 配饰 | 标志性配件 | `round gold-rimmed glasses`, `silver pendant necklace` |
| 伤疤/纹身 | 特殊标记 | `thin scar across left eyebrow`, `dragon tattoo on right arm` |

---

## 四、提示词模板

### 模板 A：正面全身

```
Full-body front view portrait of [角色描述],
standing in a neutral pose with arms at sides,
solid [light gray / white / dark gray] studio background,
full body visible from head to toe, centered in frame,
even studio lighting, no harsh shadows,
high detail, 8K, photorealistic, character reference sheet style
```

### 模板 B：正面半身

```
Upper-body front view portrait of [角色描述],
natural relaxed posture, looking directly at camera,
solid [background color] studio background,
visible from waist up, face occupying 30-40% of frame,
soft studio lighting with gentle fill light,
high detail, 8K, photorealistic, clear facial features
```

### 模板 C：侧面

```
Side profile view (90-degree) of [角色描述],
[left/right] profile, clear jawline and nose silhouette visible,
solid [background color] studio background,
head and shoulders composition,
even studio lighting highlighting facial contour,
high detail, 8K, photorealistic, character reference sheet style
```

### 模板 D：3/4 角度

```
Three-quarter view portrait of [角色描述],
face turned approximately 45 degrees to [left/right],
natural confident expression, slight eye contact with camera,
solid [background color] studio background,
head and shoulders to waist composition,
soft studio lighting with rim light on far side,
high detail, 8K, photorealistic
```

### 模板 E：情绪特写——开心

```
Close-up portrait of [角色描述],
genuine warm smile, eyes slightly crinkled with joy,
natural expression, [specific smile detail for this character],
solid [background color] background,
face fills 60-70% of frame,
soft warm lighting, catch light in eyes,
high detail, 8K, photorealistic, expressive
```

### 模板 F：情绪特写——愤怒/严肃

```
Close-up portrait of [角色描述],
[angry frown / cold stern expression / intense glare],
[specific angry expression detail for this character],
solid [background color] background,
face fills 60-70% of frame,
dramatic side lighting, deeper shadows,
high detail, 8K, photorealistic, intense expression
```

---

## 五、完整示例

### 角色：林墨（霸道总裁）

**视觉档案：**
- 年龄：32 岁男性
- 发型：后梳黑色短发，两侧推短
- 面部：轮廓分明、浓眉、深邃双眼、右嘴角有一颗小痣
- 服装：炭灰色三件套西装、白色衬衫、金色袖扣
- 气质：冷峻、自信、掌控感
- 体型：高挑精瘦，185cm

**6 张提示词：**

**1. 正面全身：**
```
Full-body front view portrait of a 32-year-old East Asian male,
slicked-back short black hair with tapered sides, sharp jawline, thick eyebrows,
deep-set eyes, small mole near right corner of mouth,
wearing a tailored charcoal three-piece suit, white dress shirt, gold cufflinks,
tall lean build (185cm), standing in a neutral confident pose with arms at sides,
solid light gray studio background, full body from head to toe,
even studio lighting, high detail, 8K, photorealistic, character reference sheet
```

**2. 正面半身：**
```
Upper-body front view portrait of a 32-year-old East Asian male,
slicked-back short black hair with tapered sides, sharp jawline, thick eyebrows,
deep-set eyes, small mole near right corner of mouth,
wearing charcoal three-piece suit with gold cufflinks,
cold confident expression, looking directly at camera,
solid light gray studio background, waist up,
soft studio lighting with gentle fill, high detail, 8K, photorealistic
```

**3. 侧面：**
```
Right side profile view (90-degree) of a 32-year-old East Asian male,
slicked-back short black hair with tapered sides, clear sharp jawline visible,
strong nose bridge, small mole near right corner of mouth,
wearing charcoal suit jacket collar visible,
solid light gray studio background, head and shoulders,
even studio lighting highlighting facial contour, 8K, photorealistic
```

**4. 3/4 角度：**
```
Three-quarter view portrait of a 32-year-old East Asian male,
face turned 45 degrees to the left, slicked-back black hair,
sharp jawline, thick eyebrows, deep-set eyes, slight smirk,
wearing charcoal three-piece suit, white shirt,
solid light gray studio background, head to waist,
soft studio lighting with rim light on far side, 8K, photorealistic
```

**5. 开心特写：**
```
Close-up portrait of a 32-year-old East Asian male,
slicked-back black hair, sharp jawline, thick eyebrows, deep-set eyes,
rare genuine smile, one corner of mouth raised slightly higher (near the mole),
eyes warm with subtle crinkles,
solid light gray background, face fills 65% of frame,
soft warm lighting, catch light in eyes, 8K, photorealistic
```

**6. 严肃特写：**
```
Close-up portrait of a 32-year-old East Asian male,
slicked-back black hair, sharp jawline, thick eyebrows, deep-set eyes,
cold intense glare, eyebrows slightly drawn together, lips pressed firm,
small mole near right corner of mouth,
solid light gray background, face fills 65% of frame,
dramatic side lighting from left, half face in shadow, 8K, photorealistic
```

---

## 六、参考图审核清单

生成后逐张审核，不合格则重新生成：

- [ ] 面部五官是否与描述一致（特别是标志性特征如痣、酒窝、疤痕）？
- [ ] 发型发色是否跨所有角度保持一致？
- [ ] 服装是否与描述完全匹配？
- [ ] 肤色是否在所有图中一致？
- [ ] 体型比例是否合理？
- [ ] 不同角色之间是否有足够的视觉区分度？
- [ ] 画面质量是否足够清晰，可作为视频生成的参考图？

---

## 七、参考图在下游的使用

### 在分镜图中引用

```
@Character1_front as Lin Mo standing at the office window...
```

### 在 Seedance 2.0 视频生成中引用

```
@Image1 (Lin Mo reference) walks confidently into the boardroom...
```

### 多角色场景

每个角色上传各自的正面参考图，在提示词中分别 @ 标记：

```
@Character1 as Lin Mo and @Character2 as Su Wan,
they face each other across the conference table...
```

**注意**：双角色一致性表现良好，三个以上角色同框时建议分组拍摄后合成。

---

## 八、换装处理

当角色需要换装时：

1. 为新服装创建独立的 `character_look`（如"林墨-休闲装"、"林墨-运动装"）
2. 为每个 look 重新生成 6 张参考图
3. 在对应场次的分镜中引用正确的 look 参考图
4. 面部特征保持完全相同，仅修改服装描述部分
