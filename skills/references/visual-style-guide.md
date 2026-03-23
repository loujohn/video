# 视觉风格与 AI 图片生成指南

## 一、题材色彩体系

### 甜宠

**主色**：暖色系——粉、橙、金、米白。

**氛围**：明亮、柔和、梦幻。

**提示词色彩关键词**：`warm pastel tones, soft pink and peach palette, golden hour warmth, dreamy color grading`

**光影**：高饱和度但不刺眼，逆光、柔光营造浪漫感。

**提示词光影关键词**：`soft backlight, warm lens flare, diffused golden sunlight, gentle rim lighting`

---

### 霸道总裁

**主色**：黑、灰、金、深蓝。

**氛围**：冷峻、高级、权力感。

**提示词色彩关键词**：`desaturated cool tones with gold accents, dark luxury palette, muted navy and charcoal`

**光影**：低饱和度主色 + 金色点缀，硬光塑造轮廓。

**提示词光影关键词**：`hard key light, dramatic chiaroscuro, sharp shadow edges, power lighting from above`

---

### 悬疑

**主色**：冷灰、深蓝、墨绿、暗红。

**氛围**：阴郁、压抑、不安。

**提示词色彩关键词**：`cold desaturated grading, deep blue-green shadows, muted crimson accents, noir palette`

**光影**：低照度、高对比，阴影占比大，慎用暖色。

**提示词光影关键词**：`low-key lighting, heavy shadows covering 60% of frame, single harsh light source, volumetric fog`

---

### 战神 / 赘婿 / 逆袭

**主色**：偏冷、低饱和，黑灰为主，金色/红色作点缀。

**氛围**：硬朗、克制、爆发时对比强烈。

**提示词色彩关键词**：`subdued cold tones, desaturated greys, punctuated by vivid gold/red in climax moments`

**光影**：日常偏冷，打脸/逆袭瞬间可突然提亮或加入暖色。

**提示词光影关键词**：`flat cold lighting for daily scenes, dramatic warm burst during reveal moments, contrast shift`

---

### 宫斗 / 穿越

**主色**：朱红、金、青、墨。

**氛围**：华贵、压抑、权谋感。

**提示词色彩关键词**：`imperial red and gold, jade green accents, ink black shadows, traditional Chinese color palette`

**光影**：服饰与环境色彩对比强，光影可戏剧化。

**提示词光影关键词**：`candlelight warmth, dramatic theatrical lighting, rich fabric textures catching light, paper lantern glow`

---

## 二、光线设计原则与提示词

| 原则 | 说明 | 提示词写法示例 |
|------|------|--------------|
| 主光明确 | 每场戏有清晰的主光源方向 | `key light from upper-left at 45 degrees` |
| 轮廓光 | 重要角色用轮廓光分离背景 | `strong rim/edge light separating subject from background` |
| 情绪光 | 暖光=安全，冷光=危机，顶光=压迫 | `warm amber fill light` / `cold blue overhead light` |
| 反差控制 | 冲突场景加大明暗对比 | `high contrast ratio 4:1` / `soft low-contrast fill` |

### 光线类型速查

| 光线类型 | 情绪 | 提示词 |
|---------|------|-------|
| 柔光（Soft） | 温暖、安全、浪漫 | `soft diffused lighting, no harsh shadows` |
| 硬光（Hard） | 紧张、权力、对抗 | `hard directional light, sharp shadow edges` |
| 逆光（Backlight） | 神秘、浪漫、孤独 | `strong backlight creating silhouette/rim glow` |
| 侧光（Side） | 层次、内心挣扎 | `dramatic side lighting, half face in shadow` |
| 顶光（Top） | 压迫、审判、不安 | `overhead harsh light, deep eye shadows` |
| 底光（Under） | 恐怖、诡异 | `underlit face, horror-style upward shadows` |

---

## 三、构图规则与提示词

| 规则 | 说明 | 提示词写法 |
|------|------|-----------|
| 三分法 | 重要元素放在三分线或交点 | `rule of thirds composition, subject placed at right third` |
| 留白 | 情绪高潮时大量留白突出主体 | `minimalist composition, vast negative space around subject` |
| 景深 | 虚化背景突出主体 | `shallow depth of field, f/1.4, creamy bokeh background` |
| 对称 | 权力场景用对称；逆袭时打破 | `symmetrical composition` / `deliberately asymmetric framing` |
| 引导线 | 利用环境线条引导视线 | `leading lines converging on subject, architectural perspective` |
| 框中框 | 利用门窗等形成嵌套构图 | `framed through doorway/window, frame within frame` |

---

## 四、题材视觉差异速查表

| 题材 | 色调 | 光线 | 构图特点 | 核心提示词后缀 |
|------|------|------|----------|--------------|
| 甜宠 | 暖、柔 | 柔光、逆光 | 双人同框多，亲密距离 | `warm romantic, soft focus, pastel tones, golden hour` |
| 霸道总裁 | 冷、金 | 硬光、轮廓光 | 男主多仰拍，显气场 | `cinematic noir, luxury, desaturated with gold, low angle` |
| 悬疑 | 冷、暗 | 低照度、阴影 | 特写多，窥视感 | `dark thriller, deep shadows, cold blue-green, voyeuristic angle` |
| 战神/赘婿 | 低饱和 | 日常冷，爆发时亮 | 打脸时多用对比构图 | `muted tones, contrast burst in climax, power dynamics` |
| 宫斗 | 华贵 | 戏剧光 | 对称、层次、服饰抢眼 | `imperial Chinese aesthetic, rich textures, dramatic theatrical light` |

---

## 五、AI 图片生成提示词模板

### 通用结构

所有 AI 图片生成提示词遵循 **六要素公式**：

```
[主体描述] + [动作/表情] + [环境/场景] + [镜头/构图] + [光影] + [风格/氛围]
```

### 角色图提示词模板

```
[角色描述：年龄、性别、发型、发色、面部特征、服装、气质],
[姿势/表情],
[背景环境],
[镜头类型, 焦距],
[光线设计],
[视觉风格, 色调, 品质标签]
```

**示例（霸道总裁）：**
```
A 32-year-old East Asian male CEO, sharp jawline, thick eyebrows, slicked-back black hair,
wearing a tailored charcoal three-piece suit with gold cufflinks,
cold confident expression with slight smirk, arms crossed,
standing in a floor-to-ceiling glass office overlooking city skyline at dusk,
medium shot, 85mm lens, shallow depth of field,
hard key light from upper left, strong rim light, deep shadows,
cinematic noir style, desaturated cool tones with warm gold accents, 8K, photorealistic
```

### 场景图提示词模板

```
[场景类型与空间描述],
[关键道具/家具/元素],
[时间段与天气],
[构图角度],
[光影设计],
[风格与色调]
```

**示例（悬疑审讯室）：**
```
A dimly lit interrogation room, concrete walls with peeling paint,
single metal table and two chairs, one-way mirror on the wall,
scattered case files and a cold coffee cup,
nighttime, harsh fluorescent overhead light creates stark shadows,
wide establishing shot, 24mm lens, deep focus,
cold blue-green color grading, high contrast, gritty texture, cinematic thriller aesthetic
```

---

## 六、角色一致性维护方法

角色一致性是 AI 短剧生成的核心挑战。以下方法确保同一角色在不同镜头中保持外貌一致：

### 参考图锚定法

1. **生成角色参考图**：为每个角色生成 6 角度参考图（见 `character-image-guide.md`）
2. **确认并锁定**：审核参考图质量，确认后标记为 `confirmed`
3. **所有后续图片引用参考图**：在分镜图和视频提示词中使用 `@CharacterRef` 语法

### 提示词锚定法（无参考图时）

在每个镜头的提示词中重复角色的 **5 个以上核心外貌特征**：

```
[角色名]: [年龄段] [性别], [发型+发色], [标志性面部特征], [服装], [气质]
```

**关键原则**：
- 每次提及角色都使用完全相同的特征描述词
- 使用具体词汇而非模糊形容词（`柳叶眉、杏眼、右颊酒窝` > `漂亮的女人`）
- 服装保持固定，需要换装时为每套服装单独建一个 character_look
- 角色间保持高区分度——发色、服装、配饰必须明显不同
- 同一角色全程使用同一生成模型/种子值（如工具支持）

---

## 七、项目风格圣经（Style Bible）

每个项目在开始视觉生成前，应建立一份**风格圣经**，确保全项目视觉统一。风格圣经作为提示词的**固定后缀**，附加在所有图片和视频提示词末尾。

### 风格圣经模板

```json
{
  "project_style_bible": {
    "visual_style": "cinematic realism / anime / 2D illustration / ...",
    "color_grading": "desaturated cool tones with warm gold accents",
    "lighting_mood": "dramatic side lighting, high contrast ratio",
    "film_reference": "in the style of [director/film]",
    "quality_tags": "8K, photorealistic, film grain, shallow depth of field",
    "aspect_ratio": "16:9",
    "negative_constraints": "no text, no watermark, no extra limbs, no deformation"
  }
}
```

### 使用方式

将风格圣经存入项目的创作方案（`save_creative_plan`），在每个提示词末尾自动附加：

```
[具体场景提示词],
[project_style_bible.color_grading],
[project_style_bible.lighting_mood],
[project_style_bible.quality_tags]
```

### 示例：霸道总裁剧的风格圣经后缀

```
cinematic noir style, desaturated cool tones with warm gold accents,
dramatic side lighting with high contrast, 8K, photorealistic,
subtle film grain, shallow depth of field, IMAX quality
```

此后缀附加在该项目所有角色图、场景图、分镜图、视频提示词的末尾。

---

## 八、道具变体图片提示词模板

道具变体（prop_variant）的图片提示词与角色/场景不同，侧重物件细节和材质质感。

### 通用结构

```
[道具名称与类型] + [材质/颜色/尺寸] + [关键细节/装饰] + [摆放/展示方式] + [光影] + [风格]
```

### 示例

**关键道具：传家戒指**
```
A vintage gold signet ring with a dark ruby cabochon center,
intricate vine engravings along the band, slightly worn patina showing age,
placed on a dark velvet cushion, top-down product photography angle,
soft spotlight from upper right, dark moody background,
macro photography, extreme detail, 8K, photorealistic
```

**功能道具：角色手机（显示关键信息）**
```
Modern smartphone (iPhone style) lying face-up on a dark wooden desk,
screen displaying a text message conversation with alarming content,
screen brightness illuminating the surrounding desk surface,
overhead camera angle, shallow depth of field focused on screen text,
cold blue screen light contrasting warm ambient desk lamp,
cinematic close-up, 8K, photorealistic
```

**氛围道具：宫殿烛台**
```
Ornate golden candelabra with five lit candles, melted wax dripping,
elaborate dragon motif base, Chinese imperial palace style,
placed on a dark lacquered wooden table, warm candlelight glow,
dramatic chiaroscuro, rich textures, traditional Chinese aesthetic, 8K
```

---

## 九、反向约束（避免模式）

### Seedance 2.0 的正向约束法

Seedance 2.0 **不支持 negative prompt**，需使用正向表述替代。对照表：

| 想避免的问题 | 错误写法（负向） | 正确写法（正向约束） |
|-------------|----------------|-------------------|
| 模糊 | `no blur` | `sharp focus, crisp details` |
| 变形 | `no deformation` | `anatomically correct proportions` |
| 多余肢体 | `no extra limbs` | `natural human anatomy, exactly two arms and two legs` |
| 水印/文字 | `no watermark` | `clean image, no text overlay` |
| AI塑料感 | `no plastic skin` | `natural skin texture with pores and subtle imperfections` |
| 平光 | `no flat lighting` | `dramatic directional lighting with clear shadows` |
| 背景杂乱 | `no messy background` | `clean, intentional background composition` |

### 支持负向提示词的工具（Midjourney/SD/Pika）

控制在 5-8 个关键词，按优先级排列：

```
--no text, watermark, extra fingers, deformed hands, blurry, low quality, oversaturated
```

**反向提示词占比**：保持在总 token 数的 20-30%，过多会限制创意空间。

---

## 十、常见提示词失败原因与修复

| 失败原因 | 表现 | 修复方法 |
|---------|------|---------|
| 描述太模糊 | 生成结果随机、不可控 | 用具体可观察细节替换形容词 |
| 缺少光影指令 | 画面平淡、无氛围 | 补充光线类型、方向、色温 |
| 矛盾指令 | 画面混乱 | 每个提示词选择一个明确方向 |
| 风格锚点缺失 | 多张图风格不统一 | 使用项目风格圣经作为固定后缀 |
| 角色特征遗漏 | 角色外貌不一致 | 每次都完整列出 5+ 核心特征 |
| 构图不明确 | 主体位置/比例不受控 | 明确指定镜头类型和焦距 |
| 正负向冲突 | 结果不伦不类 | 确保正向与负向提示词不矛盾 |
| 提示词过长 | 模型忽略后半段 | 核心信息放在前 30 词，其余为补充 |
| 缺少运动指令 | 视频静止感强 | 至少包含一个主体运动动词 + 一个运镜指令 |
