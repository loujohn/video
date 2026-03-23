# AI 视频生成指南（Seedance 2.0 为主）

## 一、生成流水线总览

```
角色参考图（已确认） → 分镜关键帧图 → 图生视频（I2V） → 剪辑合成
```

**前置条件**：开始视频生成前，确保以下素材已就绪：
1. 每个角色至少有一张已确认的正面参考图
2. 每个分镜至少有一张已确认的关键帧图
3. 分镜脚本中已标注镜头类型、时长、运镜

---

## 二、Seedance 2.0 核心能力

| 能力 | 参数 |
|------|------|
| 输出分辨率 | 最高 2K |
| 单段最长时长 | 15 秒 |
| 参考文件上限 | 12 个（最多 9 张图 + 3 个视频 + 3 个音频） |
| 支持宽高比 | 16:9、9:16、1:1、21:9、4:3 |
| 角色一致性 | 正面→正面 95%、正面→侧面 85%、换场景 80% |
| 音视频同步 | 原生对口型，支持 8+ 语言 |

---

## 三、提示词五段式结构

所有视频提示词遵循 **SACSC 结构**：

```
[Subject 主体] + [Action 动作] + [Camera 运镜] + [Style 风格] + [Constraints 约束]
```

### 各段详解

#### 1. Subject（主体）

定义画面中是谁/什么。**前 20-30 个词权重最高**，应立即锁定主体。

**写法**：
```
@Character1 (Lin Mo), a 32-year-old man in charcoal suit, sharp jawline, slicked-back hair
```

**要点**：
- 使用 `@Image` 标签引用角色参考图
- 即使有参考图，仍需文字描述核心特征作为冗余锚定
- 多角色场景：为每个角色分别 @ 标记

#### 2. Action（动作）

描述运动与事件。必须有至少一个描述**主体物理运动**的动词。

**好的写法**：
```
slowly raises his right hand to adjust his tie, then turns his head to look out the window
```

**差的写法**：
```
moves around（太模糊）
```

**要点**：
- 指明运动的起止状态、幅度和速度
- 使用具体动词而非笼统描述
- 标注静止元素：`background remains still, only hair moves in wind`

#### 3. Camera（运镜）

镜头角度、焦距、运动路径。

**常用运镜词汇**：

| 运镜 | 提示词 | 适用场景 |
|------|--------|---------|
| 推 | `camera slowly pushes in from medium to close-up` | 情感揭示、紧张升级 |
| 拉 | `camera pulls back to reveal full environment` | 交代全景、结局 |
| 横摇 | `camera pans smoothly from left to right` | 环境展示 |
| 环绕 | `camera orbits 180 degrees around subject` | 角色出场、仪式感 |
| 跟拍 | `camera tracks alongside subject at walking pace` | 跟随、对话行走 |
| 升降 | `camera cranes up from ground level to aerial view` | 格局、命运 |
| 手持 | `handheld camera, natural slight shake` | 紧张、追逐 |
| 固定 | `static camera, locked off, no movement` | 对话、情感沉淀 |

**要点**：
- 每个镜头只选一种主要运镜
- 指明焦距：`35mm wide angle` / `85mm portrait lens` / `135mm telephoto`
- 运镜速度要与情绪匹配

#### 4. Style（风格）

视觉美学、色调、氛围。

**写法**：
```
cinematic noir style, desaturated cool tones with gold accents, IMAX 70mm quality,
soft volumetric lighting, film grain texture
```

**风格锚点技巧**：可引用知名导演/电影风格来精确定调：
- `in the style of Wong Kar-wai` → 霓虹色、慢动作、孤独感
- `Wes Anderson aesthetic` → 对称构图、糖果色
- `David Fincher cold precision` → 暗调、精确、不安

#### 5. Constraints（约束）

时长、分辨率、物理约束。

```
10 seconds, 16:9 aspect ratio, photorealistic physics, natural dust particles
```

---

## 四、参考系统（@标签语法）

### 图像参考

```
@Image1 — 角色 A 正面参考图（用于锁定身份）
@Image2 — 角色 B 正面参考图
@Image3 — 场景参考图
@Image4 — 关键帧构图参考
```

**在提示词中引用**：
```
@Image1 as Lin Mo walks into the room where @Image2 as Su Wan is sitting,
the room matches @Image3 environment reference...
```

### 视频参考

```
@Video1 — 运镜参考（模型将复制此视频的镜头运动）
```

### 音频参考

```
@Audio1 — 背景音乐（模型将节奏同步到音频节拍）
@Audio2 — 对白音频（模型将进行对口型）
```

### 参考图选择原则

| 用途 | 选择标准 |
|------|---------|
| 角色锁定 | 清晰正面照，单人，占画面 60-80%，无遮挡 |
| 场景锁定 | 宽幅全景，展示完整空间，光影氛围到位 |
| 运动参考 | 5-15 秒视频片段，展示目标运镜/动作 |
| 构图参考 | 展示目标构图的图片（可以是其他影片截图） |

---

## 五、分镜脚本格式（完整模板）

### 单镜头 I2V 提示词

```
【镜号】01
【类型】中景 → 特写（推镜）
【时长】5s
【宽高比】16:9

@Image1 as Lin Mo, 32-year-old man in charcoal suit,
standing in his office, looking out the floor-to-ceiling window at city skyline,
slowly turns around to face camera, expression shifts from contemplative to cold determination,
camera slowly pushes in from medium shot to close-up on his face,
cinematic noir lighting, hard key light from window creating silhouette edge,
desaturated cool tones with warm city lights in background,
5 seconds, 16:9, photorealistic, shallow depth of field
```

### 多镜头序列脚本

```
【项目】[项目名]
【集数】第 N 集
【场次】第 M 场
【风格】[全局风格锚点]
【总时长】[预估总时长]

=== 镜头 01 ===
时间码：[00:00-00:05]
类型：建立镜头（WS）
参考图：@Image3（场景参考）
提示词：
  Wide establishing shot of a luxury corporate office at night,
  floor-to-ceiling windows overlooking city skyline, minimal furniture,
  cold blue moonlight mixed with warm desk lamp,
  camera slowly pans right to reveal @Image1 (Lin Mo) standing by window,
  5 seconds, 16:9, cinematic, desaturated tones

转场：Cut to

=== 镜头 02 ===
时间码：[00:05-00:10]
类型：中景（MS）
参考图：@Image1（林墨参考图）, @Image2（苏婉参考图）
提示词：
  @Image1 as Lin Mo turns around, @Image2 as Su Wan stands in the doorway,
  medium two-shot, they face each other across the room,
  Lin Mo's expression is cold, Su Wan looks determined,
  camera holds steady, static shot, 85mm lens,
  dramatic side lighting, tension in the framing,
  5 seconds, 16:9, cinematic noir

转场：Cut to

=== 镜头 03 ===
时间码：[00:10-00:15]
类型：特写 → 反应特写（正反打）
参考图：@Image2（苏婉参考图）
提示词：
  Close-up on @Image2 as Su Wan's face,
  her eyes narrow with resolve, lips part slightly as she begins to speak,
  camera slowly pushes in, shallow depth of field,
  warm key light on her face contrasting with dark background,
  5 seconds, 16:9, cinematic, emotional intensity
```

---

## 六、图生视频（I2V）专项技巧

### 关键帧选择标准

| 标准 | 要求 |
|------|------|
| 分辨率 | ≥ 1280×720（推荐 1920×1080+） |
| 主体占比 | 30-70% 画面面积 |
| 动态潜力 | 物体处于即将运动的状态（如手臂微抬、嘴微张） |
| 光影自然 | 色彩饱和度适中，纹理细节清晰 |
| 角度合理 | 避免极端俯仰角（不超过 45°） |
| 空间清晰 | 前后景关系明确 |

### I2V 提示词要点

1. **描述运动方向**：从图片当前状态出发，描述接下来发生的运动
2. **锁定静态元素**：明确哪些应保持不动（`background remains static`）
3. **补充图片未能体现的信息**：氛围、声音暗示、物理效果
4. **保持风格一致**：使用与图片生成时相同的风格关键词

### I2V vs 文生视频（T2V）对比

| | I2V 图生视频 | T2V 文生视频 |
|---|---|---|
| 构图控制 | 精确（继承图片构图） | 较难控制 |
| 角色一致性 | 高（图片锚定） | 较低 |
| 适用场景 | 有明确关键帧的分镜 | 快速原型、氛围探索 |
| 工作量 | 需先生成关键帧图 | 直接文字生成 |

---

## 七、常用转场效果

| 转场 | 提示词 | 适用场景 |
|------|--------|---------|
| 硬切 | `Cut to` | 对话正反打、紧张节奏 |
| 淡入淡出 | `Fade to black, then fade in` | 时间跳跃、场景大切换 |
| 溶解 | `Dissolve to` | 回忆、平滑过渡 |
| 擦除 | `Wipe right/left to` | 同场景不同时间 |
| 匹配剪辑 | `Match cut from [A] to [B]` | 动作连续、类比 |

**原则**：同一短剧内转场风格保持统一。日常叙事多用硬切，情感段落可用溶解/淡出。

---

## 八、工具适配参数

### Seedance 2.0

| 参数 | 推荐值 |
|------|--------|
| 时长 | 5s 或 10s（按镜头内容选择） |
| 宽高比 | 16:9（横屏短剧） / 9:16（竖屏短剧） |
| 参考图 | 必须包含角色正面参考图 |
| 提示词语言 | 英文（更精确） |

### Kling（可灵）

| 参数 | 推荐值 |
|------|--------|
| 时长 | 5s |
| 分辨率 | 1080p |
| 运镜控制 | 使用运镜预设（推/拉/摇/固定） |
| 角色一致性 | 使用"角色锁定"功能上传参考图 |

### Pika

| 参数 | 推荐值 |
|------|--------|
| 时长 | 3-4s |
| 强度 | 0.6-0.8（保留原图构图的同时允许适度运动） |
| 提示词重点 | 运动描述（Pika 对运动描述敏感） |

---

## 九、视频生成自检清单

- [ ] 每个镜头是否有且仅有一个主要运镜？
- [ ] 角色参考图是否已 @ 标记？
- [ ] 提示词是否至少包含一个运动动词？
- [ ] 时长和宽高比是否标注？
- [ ] 风格关键词是否跨所有镜头保持一致？
- [ ] 转场标记是否清晰？
- [ ] 时间码是否连贯，总时长是否合理？
- [ ] 关键帧图分辨率是否达标（≥1280×720）？
- [ ] 静态元素是否有 "remains still" 标注？
- [ ] 多角色场景是否控制在 2 个角色以内？

---

## 十、完整示例：从分镜到视频脚本

### 输入：分镜描述

> 镜头 5：林墨从办公室落地窗前转身，看到苏婉站在门口。两人对视，气氛紧张。

### 输出：视频生成脚本

```
=== 镜头 05 ===
时间码：[00:20-00:30]
类型：中景 → 双人镜头
关键帧：storyboard_05_keyframe.png
参考图：@Image1（林墨正面参考图）, @Image2（苏婉正面参考图）

--- I2V 提示词 ---

@Image1 as Lin Mo, 32-year-old man in charcoal suit, standing by floor-to-ceiling window,
slowly turns around 180 degrees to face the doorway,
@Image2 as Su Wan, 26-year-old woman in cream blouse, stands in the doorway holding a folder,
their eyes meet, Lin Mo's jaw tightens, Su Wan lifts her chin defiantly,
camera starts behind Lin Mo's shoulder (over-the-shoulder), then slowly widens to medium two-shot,
luxury office at night, cold blue window light vs warm interior lamp,
cinematic tension, shallow depth of field shifting between subjects,
10 seconds, 16:9, desaturated noir tones, dramatic side lighting

--- 音频提示 ---
BGM：低沉弦乐渐强
音效：皮鞋转身的摩擦声、高跟鞋脚步声
对白：无（纯视觉叙事）

--- 转场 ---
Cut to 镜头 06
```

---

## 十一、提示词迭代与质量评估

### 迭代工作流

生成 AI 视频/图片不是一次成功的过程，需要系统性地迭代优化：

```
初始提示词 → 生成 2-3 个变体 → 评估 → 调整提示词 → 再次生成 → 确认
```

**核心原则**：每次迭代只修改 1-2 个变量，以便定位哪个修改生效。

### 迭代策略

| 迭代轮次 | 关注点 | 修改内容 |
|---------|--------|---------|
| 第 1 轮 | 主体正确性 | 确认角色、场景、道具是否与描述匹配 |
| 第 2 轮 | 构图与运镜 | 调整镜头类型、焦距、运镜路径 |
| 第 3 轮 | 光影与氛围 | 微调光线方向、色温、对比度 |
| 第 4 轮 | 细节打磨 | 表情、手势、物理效果、背景元素 |

### 质量评估标准

每段生成的视频/图片按以下维度 1-5 分评估：

| 维度 | 1 分（不可用） | 3 分（可接受） | 5 分（优秀） |
|------|-------------|-------------|-------------|
| 角色一致性 | 面部完全不同 | 大致相似，细节有偏差 | 与参考图高度一致 |
| 运动自然度 | 抽搐、变形、穿模 | 基本自然，偶有僵硬 | 流畅自然如实拍 |
| 构图准确度 | 与描述不符 | 大致正确 | 精确匹配分镜 |
| 光影一致性 | 与项目风格不符 | 基本匹配 | 完美匹配风格圣经 |
| 物理合理性 | 严重穿模/违反物理 | 偶有小问题 | 符合物理规律 |

**通过阈值**：所有维度 ≥ 3 分即可使用，关键镜头（特写、高潮）应达到 4+ 分。

### 常见问题修复对照表

| 生成结果问题 | 可能原因 | 修复方向 |
|------------|---------|---------|
| 角色面部变形 | 参考图质量低或遮挡 | 更换清晰正面参考图 |
| 运动幅度不足 | 动作描述太温和 | 增强动作动词："slowly" → "decisively" |
| 运动幅度过大 | 动作描述太激烈 | 添加约束："gentle", "subtle", "controlled" |
| 背景意外变化 | 缺少静态约束 | 添加 "background remains completely static" |
| 角色数量错误 | 提示词中角色引用混乱 | 简化为最多 2 个角色，明确 @ 标记 |
| 运镜不生效 | 运镜描述位置靠后 | 将运镜指令提到提示词前 30 词内 |
| 画面风格不统一 | 未使用风格圣经后缀 | 附加项目风格圣经后缀 |

---

## 十二、后期合成指导

### 合成流水线

```
AI 生成片段 → 粗剪（顺序拼接） → 精剪（节奏调整） → 配音/字幕 → 音效/BGM → 调色 → 输出
```

### 各阶段要点

**1. 粗剪（拼接）**
- 按分镜脚本时间码顺序拼接所有视频片段
- 检查镜头间过渡是否自然
- 标记需要重新生成的问题片段

**2. 精剪（节奏）**
- 调整每个镜头的入点和出点
- 控制节奏：高潮段落加快切换，情感段落延长停留
- 删除运动起始/结束的不自然帧（AI视频首尾帧常有瑕疵）

**3. 配音与字幕**
- AI 配音工具：使用 TTS 工具生成角色对白
- 字幕：自动生成 SRT 后人工校对
- 对口型：如使用 Seedance 2.0 的 `@Audio` 功能，需在视频生成阶段就传入音频

**4. 音效与 BGM**
- BGM 与情绪曲线匹配：紧张段落用低沉弦乐，甜宠段落用轻快钢琴
- 环境音效：脚步声、开门声、雨声等增强真实感
- 音效节奏与画面动作同步

**5. 调色**
- 确保全片色调与项目风格圣经一致
- AI 生成片段间可能存在轻微色差，需统一调色
- 使用 LUT 或调色预设保持一致

### 推荐工具

| 阶段 | 工具 |
|------|------|
| 视频剪辑 | 剪映/CapCut、Premiere Pro、DaVinci Resolve |
| AI 配音 | 11ElevenLabs、通义听悟、剪映 TTS |
| 字幕生成 | 剪映自动字幕、Whisper |
| 音效库 | Epidemic Sound、Freesound |
| 调色 | DaVinci Resolve、Premiere Pro Lumetri |
