# 分镜设计与关键帧提示词指南

## 一、镜头类型

### 特写（Close-up / CU）

**用途**：强调情绪、关键道具、微表情。

**适用场景**：眼泪、冷笑、戒指、合同签字、手机屏幕。

**情绪效果**：亲密、紧张、压迫感。

**提示词关键词**：`extreme close-up on face`, `tight shot of hands`, `macro detail of [object]`

---

### 中景（Medium Shot / MS）

**用途**：人物上半身，兼顾表情与肢体语言。

**适用场景**：对话、对峙、日常互动。

**情绪效果**：平衡、稳定、叙事主镜头。

**提示词关键词**：`medium shot from waist up`, `two-shot dialogue framing`

---

### 全景（Wide Shot / WS）

**用途**：环境与人物关系，建立空间感。

**适用场景**：场景开场、多人对峙、身份揭晓时的全场反应。

**情绪效果**：疏离、格局、震撼。

**提示词关键词**：`wide establishing shot`, `extreme wide shot showing full environment`

---

### 主观镜头（POV）

**用途**：以角色视角呈现，增强代入感。

**适用场景**：主角看到的场景、他人眼中的主角。

**情绪效果**：代入、窥视、共情。

**提示词关键词**：`first-person POV`, `over-the-shoulder shot`

---

### 建立镜头（Establishing Shot）

**用途**：交代场景、时间、氛围。

**适用场景**：每场戏开场或转场时。

**情绪效果**：定调、过渡。

**提示词关键词**：`wide establishing shot of [location]`, `aerial view of city at [time]`

---

## 二、镜头运动与提示词映射

| 运动方式 | 情绪暗示 | 适用场景 | 提示词写法 |
|----------|----------|----------|-----------|
| 推（Push in） | 聚焦、压迫、逼近真相 | 对峙、揭晓、紧张升级 | `camera slowly pushes in from medium to close-up` |
| 拉（Pull out） | 疏离、格局、落幕 | 身份揭晓、结局、离别 | `camera pulls back to reveal the full scene` |
| 摇（Pan） | 巡视、发现、连接 | 展示环境、跟随动作 | `camera pans smoothly from left to right` |
| 跟（Tracking） | 跟随、参与感 | 追逐、行走、情绪推进 | `camera tracks alongside the subject` |
| 升/降（Crane） | 格局、命运、俯瞰 | 大场面、身份落差 | `camera cranes up to reveal the city below` |
| 手持晃动 | 紧张、真实、不安 | 追逐、冲突、危机 | `handheld camera, slight shake, raw documentary feel` |
| 环绕（Orbit） | 仪式感、全貌展示 | 重要角色出场、决定时刻 | `camera orbits slowly around the subject` |

---

## 三、分镜节奏控制

### 节奏模式

1. **快切**：多镜头快速切换，用于冲突、打斗、情绪爆发。每个镜头 1-3 秒。
2. **长镜头**：单镜头持续，用于情感沉淀、重要对话、身份揭晓。每个镜头 5-10 秒。
3. **留白**：关键反应前的短暂停顿，放大情绪冲击。纯氛围镜头 2-3 秒。
4. **匹配剪辑**：动作/视线连贯性剪辑，保持流畅感。

### 30 秒短视频节奏模板

| 时间段 | 功能 | 建议镜头 |
|--------|------|---------|
| 0-3s | 冲突/悬念——抓注意力 | 特写或主观镜头，动作强烈 |
| 3-10s | 背景交代——建立情境 | 建立镜头 → 中景，交代人物关系 |
| 10-20s | 矛盾升级——推动情节 | 正反打 + 特写交替，节奏加快 |
| 20-27s | 高潮爆发——情感顶点 | 快切 + 特写，手持镜头增强张力 |
| 27-30s | 反转/升华——留下印象 | 全景或特写定格，配合音效骤停 |

---

## 四、剧本场景到分镜的映射

| 剧本元素 | 分镜建议 | 提示词要点 |
|----------|----------|-----------|
| 冲突对话 | 正反打 + 特写交替 | 两组提示词交替：A角正面特写 → B角正面特写，节奏随情绪加快 |
| 身份揭晓 | 全景建立 → 众人反应特写 → 主角中景/特写 | 先 wide shot → cut to → reaction close-up 序列 |
| 打脸瞬间 | 反派特写（震惊）→ 主角中景（从容）→ 全景（局势逆转） | 使用对比构图：仰拍主角 vs 俯拍反派 |
| 情感高潮 | 长镜头或慢推，减少切镜 | `camera slowly pushes in, soft focus, warm lighting` |
| 悬念结尾 | 特写或主观镜头定格 | `freeze frame on close-up, dramatic silence` |

---

## 五、分镜脚本格式（Seedance 2.0 兼容）

为确保分镜可直接用于 AI 视频生成，采用带时间码的分镜脚本格式：

### 单镜头格式

```
【镜头 01】特写 | 3s
主体：@Character1 林墨（25岁男性，黑色西装，冷峻表情）
动作：缓缓抬起头，目光直视镜头，嘴角微微上扬
运镜：camera slowly pushes in from medium to extreme close-up
光影：侧光，高对比度，面部一半明一半暗
氛围：紧张、压迫、悬疑
```

### 多镜头序列格式（带时间码）

```
【风格】新黑色电影，高对比度，去饱和冷色调
【总时长】15s

[00:00-00:03] 镜头01：建立镜头（WS）
阴雨夜晚的城市天际线，霓虹灯倒映在湿润的路面
camera slowly cranes down to street level

[00:03-00:08] 镜头02：中景（MS）
@Character1 穿着黑色风衣从巷子里走出，手插在口袋里
camera tracks alongside, handheld slight shake
Cut to —

[00:08-00:12] 镜头03：特写（CU）
@Character1 的手从口袋里掏出一封信，信封上有红色火漆印
camera pushes in to macro detail of the wax seal

[00:12-00:15] 镜头04：反应特写（CU）
@Character1 看完信后表情从冷峻变为震惊，瞳孔微缩
camera holds steady, shallow depth of field, background blurs
```

### 关键规范

- **@标签**：所有角色引用必须使用 `@Character1` 格式，与角色参考图对应
- **时间码**：精确到秒，告诉模型每个动作的确切时刻
- **转场标记**：镜头间使用 `Cut to`、`Dissolve to`、`Fade to black` 等标准转场词
- **运镜用英文**：AI 视频模型对英文运镜指令理解更准确

---

## 六、关键帧图片提示词结构

每个分镜的关键帧图片提示词应遵循 **五段式结构**：

```
[主体] + [动作/表情] + [镜头/构图] + [光影/氛围] + [风格锚点]
```

### 示例

**霸道总裁对峙场景：**
```
@Character1, a 30-year-old CEO in tailored black suit, standing with arms crossed,
looking down at @Character2 with cold contempt,
low-angle medium shot, 35mm lens, dramatic depth of field,
hard key light from upper left casting sharp shadows, dark office background with city lights,
cinematic noir style, desaturated cool tones with gold accents, IMAX quality
```

**甜宠约会场景：**
```
@Character1 and @Character2 sitting close on a park bench,
she rests her head on his shoulder while he reads a book, gentle smiles,
medium two-shot, 85mm lens, shallow depth of field with bokeh,
golden hour warm backlight, soft lens flare, cherry blossoms falling,
soft romantic style, warm pastel tones, film grain texture
```

---

## 七、提示词质量约束

### 权重分布原则

AI 模型对提示词有位置权重偏好：

- **前 20-30 词**：权重最高，必须放主体和核心动作
- **中段**：运镜、光影、环境细节
- **末尾**：风格后缀、品质标签、项目风格圣经

### Seedance 2.0 正向约束

由于 Seedance 2.0 不支持负向提示词，使用正向表述确保质量：

```
sharp focus, natural proportions, clean composition,
anatomically correct, consistent lighting throughout
```

将这些约束融入风格后缀，而非单独列出。

### 多镜头一致性检查

连续镜头之间需保持以下一致：
- 角色服装、发型不变（除非剧情要求换装）
- 光线方向一致（同一场景内日光/灯光方向不变）
- 色调一致（使用项目风格圣经后缀保证）
- 环境连贯（同一场景不同角度的背景元素应匹配）

---

## 八、分镜自检清单

### 叙事层面
- [ ] 每场戏是否有建立镜头？
- [ ] 关键情绪是否有特写支撑？
- [ ] 身份揭晓/打脸是否有足够的反应镜头？
- [ ] 节奏是否符合剧本情绪曲线？
- [ ] 转场是否清晰，观众能否理解时空变化？

### 提示词层面
- [ ] 所有角色是否使用了 `@Character` 标签引用参考图？
- [ ] 运镜指令是否具体（避免"移动摄影机"这种模糊表述）？
- [ ] 主体描述是否在前 30 词内？
- [ ] 每个镜头是否只有一个主要运镜动作（避免矛盾指令）？
- [ ] 项目风格圣经后缀是否附加在每个提示词末尾？

### 技术层面
- [ ] 时间码是否连贯，总时长是否合理？
- [ ] 多镜头序列是否使用了明确的转场词？
- [ ] 连续镜头的光线方向是否一致？
- [ ] 同场景不同角度的背景元素是否匹配？
