# 短剧生成 SKILL 与图片提示词优化设计

## 概述

对项目的微短剧 AI 编剧 SKILL（`skills/SKILL.md` + 8 个参考文档）和图片生成提示词模板（`mcp/tools/image-tools.ts` 中的 `PROMPT_TEMPLATES`）进行结构性重构与智能化增强。

目标：
1. 将参考文档从理论指南重构为可执行 prompt 模板
2. 引入导演-编剧双层 prompt 架构提升剧本质量
3. 融入微短剧行业最新方法论（3-7-21 规则、付费壁感知架构等）
4. 重构图片提示词系统，支持 Gemini 和即梦两套模型
5. 建立角色/场景/风格连续性锚点系统
6. 增加动态 prompt 组装和质量自检机制

---

## 第一部分：短剧 SKILL 重构

### 1.1 参考文档重构：从理论到可执行模板

**现状问题**：8 个参考文档偏理论化，告诉 AI "应该做什么"但没有告诉"具体怎么做"。

**重构方向**：每个参考文档增加三个新段落：

#### A. Prompt 结构模板

为 AI 提供明确的输出格式。例如 `opening-rules.md` 增加：

```
## 开篇 Prompt 模板

你正在为一部 [GENRE] 题材的微短剧撰写第一集开篇。

### 输出格式

```json
{
  "opening_type": "冲突/悬念/反差/金句/视觉冲击/身份揭晓",
  "hook_3s": "3秒钩子：一句话/一个画面",
  "anchor_7s": "7秒锚定：确立题材与核心冲突",
  "addiction_21s": "21秒上瘾：让观众无法离开的情境",
  "visual_description": "视觉描述（供分镜和图片生成使用）",
  "dialogue": ["对白1", "对白2"],
  "emotion_curve": [5, 4, 5]
}
```

### 约束
- 前 3 秒必须有冲突或悬念
- 不允许旁白超过 10 秒
- 对白单句 ≤ 15 字
- 必须包含视觉描述字段
```

#### B. Few-shot 示例库

每个题材提供 3-5 个高质量剧本片段作为参考。例如：

```
## 示例库

### 霸道总裁 - 冲突开篇
---
hook_3s: 婚礼现场，新娘当众撕毁婚约。
anchor_7s: 新郎冷笑："你以为你还有选择？"全场哗然。
addiction_21s: 新娘转身走向门口，一辆黑色迈巴赫停在教堂外。车门打开，
一只修长的手伸出——"上车。"新娘犹豫一秒，回头看了一眼新郎，
嘴角微微上扬："我有了。"
visual: 教堂内景，白色花瓣散落，新娘红色高跟鞋踩碎玻璃杯的特写。
emotion_curve: [5, 4, 5]

### 甜宠 - 反差开篇
---
hook_3s: 五星酒店门口，穿外卖服的女主被保安拦住。
anchor_7s: "闲人免进。"女主低头看了看自己的衣服，正要转身——
addiction_21s: 一只手搭上她的肩膀。男主出现在身后，西装革履，
对保安说："她是我太太。"保安愣住。女主也愣住。
男主低头在她耳边说："配合我，回去给你加鸡腿。"
visual: 酒店金色旋转门，逆光剪影，男主的手搭在女主肩上的特写。
emotion_curve: [3, 5, 4]
```

#### C. 质量检查清单

每个参考文档末尾增加可执行的自检清单：

```
## 质量自检

生成内容后，逐项检查：
- [ ] 前 3 秒是否有明确钩子？
- [ ] 是否在 7 秒内确立了题材和核心冲突？
- [ ] 对白单句是否 ≤ 15 字？
- [ ] 是否包含视觉描述字段？
- [ ] 情绪曲线是否有起伏（不全是 5 或全是 3）？
- [ ] 开篇类型是否与题材匹配？

如有未通过项，自动修正后重新输出。
```

### 1.2 导演-编剧双层 Prompt 架构

**来源**：IBSEN 导演-演员多智能体框架 + Dramaturge 分层精炼系统。

**架构设计**：

在 `/分集 N` 命令中引入两阶段生成：

#### 阶段一：导演层（Director Pass）

AI 以「节奏导演」角色生成本集的结构骨架：

```
## 导演指令

你是本剧的节奏导演。根据以下信息生成第 N 集的结构骨架：

输入：
- 创作方案（核心概念、冲突结构、爽点设计）
- 角色档案与关系图谱
- 分集目录（本集梗概）
- 前一集结尾悬念
- 当前所处阶段（起势/攀升/风暴/决战）
- 付费壁位置

输出格式：
```json
{
  "episode": N,
  "phase": "起势/攀升/风暴/决战",
  "beats": [
    {
      "time_range": "0-3s",
      "beat_type": "hook",
      "emotion_intensity": 5,
      "director_note": "承接上集悬念，用视觉冲击开场",
      "characters_involved": ["角色A", "角色B"],
      "scene": "场景名称",
      "hook_type": "悬念钩/反转钩/情绪钩/信息钩/危机钩"
    }
  ],
  "cliffhanger": {
    "type": "身份揭晓/情感转折/危机爆发/反转前夕",
    "question": "观众会问的问题",
    "paywall_ready": true/false
  },
  "satisfaction_points": ["打脸 Lv3", "宠溺 Lv2"],
  "quality_check": {
    "has_hook": true,
    "has_cliffhanger": true,
    "emotion_variety": true,
    "connects_previous": true,
    "advances_plot": true
  }
}
```
```

#### 阶段二：编剧层（Writer Pass）

AI 以「剧本写手」角色，根据导演骨架填充具体内容：

```
## 编剧指令

你是本剧的剧本写手。根据导演提供的结构骨架，撰写完整剧本。

输入：导演骨架 JSON + 角色档案 + 场景信息

约束：
- 每集总字数 500-800 字
- 对白单句 ≤ 15 字
- 每个场景必须包含「视觉描述」字段（供分镜使用）
- 遵循导演指定的情绪强度
- 不得偏离导演指定的节拍类型和钩子类型

输出格式：
```json
{
  "episode": N,
  "scenes": [
    {
      "scene_id": "S1",
      "scene_name": "场景名称",
      "time_range": "0-20s",
      "location": "地点",
      "time_of_day": "日/夜/晨/昏",
      "visual_description": "视觉描述（光线、色调、构图要点）",
      "characters": ["角色A"],
      "dialogues": [
        {"character": "角色A", "line": "台词", "action": "动作/表情"},
        {"type": "voiceover", "character": "角色A", "line": "内心独白"}
      ],
      "emotion_intensity": 5,
      "camera_suggestion": "特写/中景/全景 + 运镜建议"
    }
  ],
  "word_count": 650,
  "cliffhanger_dialogue": "最后一句台词或画面描述"
}
```
```

#### 阶段三：质量自检 + 迭代建议

```
## 自检与迭代

生成完成后，自动执行：

1. 对照导演骨架检查：
   - 每个 beat 是否都有对应场景？
   - 情绪强度是否匹配？
   - 钩子类型是否正确？
   - 悬念结尾是否到位？

2. 对照编剧约束检查：
   - 字数是否在 500-800 范围？
   - 对白单句是否 ≤ 15 字？
   - 是否每个场景都有视觉描述？

3. 提出 3 个改进方向供用户选择：
   - 方向 A: [具体建议]
   - 方向 B: [具体建议]
   - 方向 C: [具体建议]

用户可选择应用改进或跳过。
```

### 1.3 新增 /风格 命令

在创作流程最前端增加风格锁定命令，位于 /开始 之后、/创作方案 之前。

```
### /风格

**Input**：用户确认视觉和文字风格偏好。

**Process**：
1. 加载 `visual-style-guide.md` 参考
2. 调用 `get_project` 获取项目题材
3. 根据题材推荐默认风格组合（可自定义）
4. 锁定以下风格参数并保存到项目：
   - 视觉色调：主色 + 辅色 + 点缀色
   - 光影风格：主光类型 + 情绪光映射
   - 构图偏好：常用景别比例 + 特殊构图规则
   - 对白风格：台词长度 + 语气特征 + 旁白频率
   - 图片生成模型：Gemini 或 即梦
   - 图片风格：realistic / anime / cinematic 等
5. 调用 `update_project` 保存风格配置

**Output**：风格配置摘要，后续所有命令自动应用此风格。
```

### 1.4 重构 /分镜 N 命令 —— 深度整合图片生成

现有的 /分镜 命令只生成分镜描述。重构后自动完成图片提示词生成：

```
### /分镜 N（重构后）

**Process**：
1. 加载 `storyboard-guide.md`、`visual-style-guide.md` 参考
2. 调用 `get_episode_script` 获取第 N 集剧本（结构化 JSON）
3. 调用 `list_characters` 获取角色锚点（identity block）
4. 调用 `list_scenes` 获取场景锚点
5. 获取项目风格配置（/风格 中锁定的参数）
6. 为每个场景生成分镜序列：
   a. 根据剧本的 camera_suggestion 确定镜头类型
   b. 组装图片提示词：
      - Identity Block（角色锚点，固定）
      - Scene Block（场景描述，按场景变化）
      - Style Block（风格锚点，固定）
      - Technical Block（9:16、画质等，固定）
      - Negative Prompt（负面提示词）
   c. 根据模型选择（Gemini/即梦）输出对应格式
7. 调用 `create_storyboard` 创建分镜
8. 调用 `batch_set_image_prompts` 批量保存提示词
9. 执行质量自检
```

### 1.5 强化 /分集 命令的剧本质量

将 3-7-21 规则和 3-15-30 结构融入 /分集 命令：

```
### /分集 N（强化后）

**Process 变更**：
1. 若 N=1：加载 `opening-rules.md`（含 3-7-21 规则和 few-shot 示例）
2. 否则：加载 `rhythm-curve.md`、`hook-design.md`
3. 获取上下文（项目、角色、场景、道具、前集剧本）
4. **阶段一：导演层生成结构骨架**
   - 确定本集所处阶段（起势/攀升/风暴/决战）
   - 规划情绪节拍表（beat sheet）
   - 标注付费壁位置
   - 设计悬念类型和爽点类型
5. **阶段二：编剧层填充具体内容**
   - 按导演骨架撰写对白和场景描述
   - 遵循字数和对白约束
   - 每个场景包含视觉描述字段
6. **阶段三：质量自检 + 迭代建议**
   - 对照检查清单自评
   - 提出 3 个改进方向
7. 调用 `save_episode_script` 保存剧本

**Output 变更**：
- 剧本摘要（含情绪曲线可视化）
- 质量自检结果
- 3 个改进方向供选择
- 提示用户继续 /分集 N+1 或 /分镜 N
```

### 1.6 付费壁感知架构

重构 `paywall-design.md`，从理论指导变为可执行的 5 块结构：

```
## 付费壁感知架构

### 5 块结构

| Block | 集数 | 定位 | 付费策略 |
|-------|------|------|----------|
| Block 1 | 1-10 | 免费层 | 钩住观众，建立世界和赌注 |
| Block 2 | 11-30 | 首个付费壁 | 重大复杂化，关系升级 |
| Block 3 | 31-50 | 中季 | 反转、背叛、副线汇聚 |
| Block 4 | 51-70 | 加速 | 秘密揭露、联盟转变 |
| Block 5 | 71-100 | 高潮与结局 | 所有线索收束 |

### 关键原则
- 付费壁处的悬念只提问不回答
- 重大揭露放在付费壁后 1-2 集
- Block 1 必须有 2 个以上强钩子建立上瘾
- 每个 Block 末尾设置 Block 级悬念（比集级悬念更强）

### /目录 命令集成
在生成分集目录时，自动标注每集所属 Block 和付费壁位置。
```

### 1.7 对白风格库

新增 `references/dialogue-style-guide.md`：

```
## 对白风格库

### 通用约束
- 单句 ≤ 15 字
- 避免书面语，使用口语化表达
- 每句台词必须推进剧情或揭示角色

### 题材对白特征

#### 霸道总裁
- 男主：简短、命令式、冷峻中带占有欲
  - "过来。" "你是我的。" "谁允许你走的？"
- 女主：倔强、不服输、偶尔示弱
  - "你管不了我。" "我不需要你可怜。"

#### 甜宠
- 男主：宠溺、撒娇式关心、偶尔吃醋
  - "饿不饿？我给你带了吃的。" "他是谁？"
- 女主：活泼、偶尔小作、甜蜜回应
  - "你又偷看我手机！" "那你亲我一下。"

#### 战神
- 男主：沉稳、霸气、言简意赅
  - "跪下。" "你不配。" "我回来了。"
- 配角：震惊、恐惧、臣服
  - "这不可能……" "是……是战神大人！"

#### 悬疑
- 对白含双关、暗示、信息差
  - "你确定你看到的是真的？" "有些秘密，知道了就回不了头。"

#### 虐恋
- 情感浓度高、欲言又止、误会式对白
  - "你走吧，我不需要你了。"（实际不想让对方走）
  - "如果重来一次……算了。"

#### 宫斗
- 表面恭敬、暗藏机锋
  - "姐姐说的是，妹妹受教了。"（实际在反击）
  - "这茶凉了，换一杯吧。"（暗示失宠）
```

### 1.8 出海模式英文剧本指导

在 `/出海` 命令中增加英文剧本写作风格指导：

```
## 出海模式英文剧本指导

### 对白风格转换
- 不是直译中文台词，而是按英文短剧习惯重写
- 使用简短、有力的英文口语
- 霸总 → Billionaire: "You're mine." "Don't make me say it twice."
- 甜宠 → Sweet Romance: "You're adorable when you're mad." "Did you eat?"
- 战神 → Alpha: "Kneel." "You have no idea who you're dealing with."

### 文化适配
- 家庭冲突 → 个人独立 vs 家族期望
- 面子文化 → 社交媒体曝光/公众形象
- 门当户对 → 阶层差异/old money vs new money

### 叙事节奏差异
- 海外观众更接受直接冲突，减少铺垫
- 内心独白（voiceover）使用更频繁
- 每集可略长（60-120 秒 vs 国内 60-90 秒）
```

---

## 第二部分：图片提示词系统重构

### 2.1 角色锚定系统（Character Anchor System）

**目的**：解决同一角色在不同分镜中外观不一致的问题。

**设计**：

每个角色创建时自动生成一个 `character_anchor` 对象，存储在角色的 `image_prompt` 字段中：

```json
{
  "character_anchor": {
    "identity": "林晚晴, 25岁女性, 鹅蛋脸, 齐肩黑色直发, 小麦色皮肤, 左脸有酒窝",
    "body_type": "纤细, 165cm",
    "default_outfit": "白色衬衫搭深色牛仔裤, 手腕戴旧玉镯",
    "distinctive_features": "左脸酒窝, 手腕旧玉镯",
    "identity_en": "Lin Wanqing, 25-year-old woman, oval face, shoulder-length straight black hair, warm brown skin, dimple on left cheek",
    "body_type_en": "slender, 165cm",
    "default_outfit_en": "white blouse with dark jeans, worn jade bracelet on left wrist",
    "distinctive_features_en": "dimple on left cheek, worn jade bracelet on left wrist"
  }
}
```

**使用规则**：
- 所有涉及该角色的图片提示词，必须以 identity block 开头
- identity block 的措辞在整个项目中保持完全一致
- 服装可按场景变化，但 distinctive_features 始终保留
- 中英文双版本，根据模型选择自动切换

### 2.1.1 角色三视图提示词（Character Turnaround Sheet）

角色创建后，自动生成三视图（正面、侧面、背面）提示词，用于建立角色的视觉基准。三视图是后续所有分镜图片保持角色一致性的基础。

**三视图 Prompt 结构**：

```json
{
  "turnaround_prompts": {
    "front": "正面视图提示词",
    "side": "侧面视图提示词",
    "back": "背面视图提示词",
    "combined": "三合一视图提示词（单张图包含三个角度）"
  }
}
```

**Gemini 三视图模板**：

```
// 三合一版本（推荐，一张图包含三个角度）
"Character turnaround sheet of [IDENTITY_BLOCK], showing front view, right side view, and back view on a clean white background. Full body, neutral standing pose, consistent proportions across all three views. [OUTFIT]. Orthographic projection, character design reference sheet, professional concept art quality. 9:16 vertical layout with three views stacked vertically."

// 单视图版本 - 正面
"Full body front view of [IDENTITY_BLOCK]. Neutral standing pose, arms slightly away from body. [OUTFIT]. Clean white background. Professional character design, detailed features visible. Vertical portrait 9:16."

// 单视图版本 - 侧面
"Full body right side profile view of [IDENTITY_BLOCK]. Neutral standing pose. [OUTFIT]. Clean white background. Professional character design showing depth and silhouette. Vertical portrait 9:16."

// 单视图版本 - 背面
"Full body back view of [IDENTITY_BLOCK]. Neutral standing pose. [OUTFIT]. Clean white background. Professional character design showing hair, outfit details from behind. Vertical portrait 9:16."
```

**即梦三视图模板**：

```
// 三合一版本
"三视图，全身像，正面，侧面，背面，[IDENTITY_BLOCK_CN]，中性站姿，白色背景，[OUTFIT_CN]，角色设定图，高细节，最好的质量，UHD，专业概念设计，竖版排列，9:16比例"

// 单视图版本 - 正面
"全身正面视图，[IDENTITY_BLOCK_CN]，中性站姿，双臂自然下垂，[OUTFIT_CN]，白色背景，角色设定，高细节，8K画质，竖版，9:16比例"

// 单视图版本 - 侧面
"全身右侧面视图，[IDENTITY_BLOCK_CN]，中性站姿，[OUTFIT_CN]，白色背景，角色设定，展示轮廓和层次，高细节，8K画质，竖版，9:16比例"

// 单视图版本 - 背面
"全身背面视图，[IDENTITY_BLOCK_CN]，中性站姿，[OUTFIT_CN]，白色背景，角色设定，展示发型和服装背面细节，高细节，8K画质，竖版，9:16比例"
```

**在 /角色开发 命令中的集成**：

角色创建完成后，自动为每个主要角色生成三视图提示词：
1. 根据角色的 character_anchor 填充 identity block
2. 根据项目模型选择（Gemini/即梦）选择对应模板
3. 将三视图提示词存储在角色的 `image_prompt` 字段中（JSON 格式，包含 `character_anchor` 和 `turnaround_prompts`）
4. 提示用户可以使用三视图提示词生成参考图，后续分镜将基于此保持一致性

**三视图与分镜的关系**：
- 三视图是「角色锚点」的视觉化表达
- 在即梦中，三视图可作为后续分镜的参考图输入
- 在 Gemini 中，三视图的文字描述（identity block）在所有分镜中保持一致

### 2.2 「风格 × 题材 × 模型」三维提示词矩阵

重构 `PROMPT_TEMPLATES`，从一维（6 风格）扩展为三维：

```
维度 1 - 模型适配：
  gemini: 叙事性段落描述（Gemini 的强项）
  jimeng: 关键词分层排列（即梦的最佳格式）

维度 2 - 题材视觉映射（与 visual-style-guide.md 联动）：
  boss: 冷峻光影、黑灰金色调、仰拍气场
  sweet: 暖色柔光、粉橙金色调、亲密构图
  warrior: 低饱和冷色、爆发时提亮、对比构图
  mystery: 低照度、阴影占比大、窥视感特写
  palace: 华贵戏剧光、朱红金青墨、对称层次
  revenge: 冷暖交替、高对比、逆光剪影
  rebirth: 双时空色调对比、柔焦回忆 vs 锐利现实

维度 3 - 实体类型（保持现有 4 种）：
  character, scene, prop, storyboard
```

### 2.3 Gemini 专属模板

Gemini 的强项是理解叙事性描述，采用完整段落格式：

```typescript
const GEMINI_TEMPLATES = {
  boss: {
    character: `A photorealistic vertical portrait in 9:16 format of [IDENTITY_BLOCK]. The scene is illuminated by cold, dramatic side lighting with subtle gold accent highlights, creating an atmosphere of power and quiet authority. Shot from a slightly low angle to emphasize commanding presence. [OUTFIT_OVERRIDE || DEFAULT_OUTFIT]. Expression: [EXPRESSION]. The background is a [ENVIRONMENT] with desaturated tones. Captured with an 85mm portrait lens, shallow depth of field, cinematic color grading with cool shadows and warm highlights. Vertical portrait orientation.`,
    
    storyboard: `A cinematic still frame in vertical 9:16 format. [SHOT_TYPE] of [CHARACTER_ACTION]. [IDENTITY_BLOCK] is [ACTION] in [ENVIRONMENT]. The scene is lit by [LIGHTING_FROM_GENRE: cold dramatic side light with gold accents]. [SCENE_ANCHOR]. Camera: [CAMERA_MOVEMENT]. The mood is tense and powerful. Film grain, anamorphic bokeh, cinematic color grading with desaturated palette and gold highlights. Vertical portrait orientation.`,
    
    scene: `A photorealistic establishing shot in vertical 9:16 format of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. The environment exudes wealth and power — polished surfaces, dark materials, strategic gold accents. Cold dramatic lighting with deep shadows. Cinematic composition with strong vertical lines. Modern Chinese corporate aesthetic. 8K resolution, atmospheric perspective. Vertical portrait orientation.`,
    
    prop: `A cinematic close-up in vertical 9:16 format of [PROP_NAME]. [DESCRIPTION]. Dramatic side lighting with gold rim light. Dark, desaturated background. Shallow depth of field emphasizing texture and detail. The object suggests power and status. Film grain, cinematic color grading. Vertical portrait orientation.`
  },
  
  sweet: {
    character: `A warm, dreamy vertical portrait in 9:16 format of [IDENTITY_BLOCK]. Bathed in soft golden hour light filtering through sheer curtains, creating a romantic, ethereal atmosphere. Shot at eye level with a gentle smile. [OUTFIT_OVERRIDE || DEFAULT_OUTFIT]. Expression: [EXPRESSION]. Soft pink and orange color palette with warm highlights. Captured with an 85mm lens, wide aperture creating creamy bokeh. Skin has a natural, luminous glow. Vertical portrait orientation.`,
    
    storyboard: `A warm, romantic cinematic still frame in vertical 9:16 format. [SHOT_TYPE] of [CHARACTER_ACTION]. [IDENTITY_BLOCK] is [ACTION] in [ENVIRONMENT]. Soft golden hour light with pink and orange tones creates a dreamy atmosphere. [SCENE_ANCHOR]. Camera: [CAMERA_MOVEMENT]. Shallow depth of field with warm bokeh. Film grain, warm color grading. Vertical portrait orientation.`,
    
    scene: `A dreamy establishing shot in vertical 9:16 format of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Warm, inviting atmosphere with soft natural light. Pink, orange, and gold color palette. Cozy details and romantic elements. Soft focus on background elements. 8K resolution. Vertical portrait orientation.`,
    
    prop: `A soft, romantic close-up in vertical 9:16 format of [PROP_NAME]. [DESCRIPTION]. Warm golden light with soft shadows. Pastel background with bokeh. The object feels precious and intimate. Gentle film grain, warm tones. Vertical portrait orientation.`
  },
  
  warrior: {
    character: `A photorealistic vertical portrait in 9:16 format of [IDENTITY_BLOCK]. Low-saturation cold lighting with harsh shadows, conveying restrained power. Shot from a slightly low angle. [OUTFIT_OVERRIDE || DEFAULT_OUTFIT]. Expression: [EXPRESSION]. Desaturated color palette with occasional red or gold accents that hint at hidden strength. Captured with a 50mm lens, moderate depth of field. Gritty texture, cinematic color grading. Vertical portrait orientation.`,
    
    storyboard: `A gritty cinematic still frame in vertical 9:16 format. [SHOT_TYPE] of [CHARACTER_ACTION]. [IDENTITY_BLOCK] is [ACTION] in [ENVIRONMENT]. Low-saturation cold lighting that shifts to dramatic warm highlights during moments of power. [SCENE_ANCHOR]. Camera: [CAMERA_MOVEMENT]. High contrast composition. Film grain, desaturated color grading with strategic warm accents. Vertical portrait orientation.`,
    
    scene: `A stark establishing shot in vertical 9:16 format of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Low-saturation environment with cold tones. Harsh shadows and strong contrast. Minimal warmth except for strategic accent lighting. Industrial or austere aesthetic. 8K resolution. Vertical portrait orientation.`,
    
    prop: `A dramatic close-up in vertical 9:16 format of [PROP_NAME]. [DESCRIPTION]. Cold, harsh lighting with a single warm accent. High contrast, desaturated palette. The object conveys weight and significance. Gritty texture, cinematic grading. Vertical portrait orientation.`
  },
  
  mystery: {
    character: `A moody vertical portrait in 9:16 format of [IDENTITY_BLOCK]. Low-key lighting with deep shadows obscuring parts of the face, creating unease and mystery. [OUTFIT_OVERRIDE || DEFAULT_OUTFIT]. Expression: [EXPRESSION]. Cold gray and deep blue color palette with occasional dark red accents. Shot with a voyeuristic quality — slightly off-center framing. Captured with a 35mm lens for environmental context. Film noir aesthetic. Vertical portrait orientation.`,
    
    storyboard: `A suspenseful cinematic still frame in vertical 9:16 format. [SHOT_TYPE] of [CHARACTER_ACTION]. [IDENTITY_BLOCK] is [ACTION] in [ENVIRONMENT]. Low-key lighting with dominant shadows. [SCENE_ANCHOR]. Camera: [CAMERA_MOVEMENT]. Voyeuristic framing, high contrast, cold color palette. Sound design implied through visual tension. Film grain, noir color grading. Vertical portrait orientation.`,
    
    scene: `A foreboding establishing shot in vertical 9:16 format of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Low lighting with large shadow areas. Cold gray, deep blue, and dark green palette. Oppressive atmosphere. Architectural elements create visual tension. 8K resolution, high contrast. Vertical portrait orientation.`,
    
    prop: `A noir-style close-up in vertical 9:16 format of [PROP_NAME]. [DESCRIPTION]. Single harsh light source creating dramatic shadows. Cold, desaturated palette with dark red accent. The object feels ominous or significant. High contrast, film grain. Vertical portrait orientation.`
  },
  
  palace: {
    character: `A regal vertical portrait in 9:16 format of [IDENTITY_BLOCK]. Theatrical lighting with warm golden key light and cool fill, creating a sense of court intrigue. [OUTFIT_OVERRIDE || DEFAULT_OUTFIT]. Expression: [EXPRESSION]. Rich palette of vermillion, gold, jade green, and ink black. Symmetrical framing suggesting hierarchy. Captured with an 85mm lens, ornate background softly blurred. Traditional Chinese aesthetic with cinematic quality. Vertical portrait orientation.`,
    
    storyboard: `A theatrical cinematic still frame in vertical 9:16 format. [SHOT_TYPE] of [CHARACTER_ACTION]. [IDENTITY_BLOCK] is [ACTION] in [ENVIRONMENT]. Dramatic theatrical lighting with warm gold and cool jade tones. [SCENE_ANCHOR]. Camera: [CAMERA_MOVEMENT]. Symmetrical composition with layered depth. Rich vermillion, gold, and ink palette. Vertical portrait orientation.`,
    
    scene: `A palatial establishing shot in vertical 9:16 format of [SCENE_NAME], [TIME_OF_DAY]. [DESCRIPTION]. Opulent traditional Chinese architecture. Rich vermillion columns, gold accents, jade ornaments. Theatrical lighting creating depth and intrigue. Symmetrical composition with layered foreground elements. 8K resolution. Vertical portrait orientation.`,
    
    prop: `An ornate close-up in vertical 9:16 format of [PROP_NAME]. [DESCRIPTION]. Warm golden light on rich materials. Vermillion, gold, and jade color accents. Traditional Chinese craftsmanship details. Shallow depth of field, theatrical lighting. Vertical portrait orientation.`
  }
}
```

### 2.4 即梦专属模板

即梦的最佳格式是「关键词分层排列」，权重越靠前越高：

```typescript
const JIMENG_TEMPLATES = {
  boss: {
    character: `写实风格，竖版肖像，9:16比例，[IDENTITY_BLOCK_CN]，低角度仰拍，冷峻侧光，金色点缀光，黑灰主色调，浅景深，电影质感，穿着[OUTFIT_OVERRIDE || DEFAULT_OUTFIT_CN]，表情[EXPRESSION]，8K画质，精细皮肤纹理，权力感氛围`,
    
    storyboard: `[SHOT_TYPE_CN]，竖版构图，9:16比例，[IDENTITY_BLOCK_CN]，[CHARACTER_ACTION_CN]，[SCENE_ANCHOR_CN]，冷峻侧光，金色点缀，黑灰色调，[CAMERA_CN]，电影胶片质感，浅景深，高级感氛围`,
    
    scene: `写实风格，竖版构图，9:16比例，[SCENE_NAME]，[TIME_OF_DAY_CN]，[DESCRIPTION_CN]，冷峻光影，黑灰金色调，现代都市高端质感，深色材质，金属光泽，8K画质，大气透视`,
    
    prop: `电影特写，竖版构图，9:16比例，[PROP_NAME]，[DESCRIPTION_CN]，冷峻侧光，金色轮廓光，深色背景，浅景深，质感细腻，权力象征，电影调色`
  },
  
  sweet: {
    character: `写实风格，竖版肖像，9:16比例，[IDENTITY_BLOCK_CN]，平视角度，暖色柔光，金色小时光线，粉橙色调，梦幻氛围，浅景深虚化，穿着[OUTFIT_OVERRIDE || DEFAULT_OUTFIT_CN]，表情[EXPRESSION]，自然光泽肌肤，8K画质`,
    
    storyboard: `[SHOT_TYPE_CN]，竖版构图，9:16比例，[IDENTITY_BLOCK_CN]，[CHARACTER_ACTION_CN]，[SCENE_ANCHOR_CN]，暖色柔光，粉橙金色调，浪漫氛围，[CAMERA_CN]，浅景深暖色虚化，电影胶片质感`,
    
    scene: `写实风格，竖版构图，9:16比例，[SCENE_NAME]，[TIME_OF_DAY_CN]，[DESCRIPTION_CN]，暖色柔光，粉橙金色调，温馨浪漫，柔和自然光，8K画质`,
    
    prop: `柔光特写，竖版构图，9:16比例，[PROP_NAME]，[DESCRIPTION_CN]，暖色金光，柔和阴影，粉色调背景虚化，温馨精致，电影质感`
  },
  
  warrior: {
    character: `写实风格，竖版肖像，9:16比例，[IDENTITY_BLOCK_CN]，低角度仰拍，低饱和冷光，硬朗阴影，灰黑主色调，偶尔红金点缀，克制力量感，穿着[OUTFIT_OVERRIDE || DEFAULT_OUTFIT_CN]，表情[EXPRESSION]，粗粝质感，8K画质`,
    
    storyboard: `[SHOT_TYPE_CN]，竖版构图，9:16比例，[IDENTITY_BLOCK_CN]，[CHARACTER_ACTION_CN]，[SCENE_ANCHOR_CN]，低饱和冷光，爆发时暖色提亮，高对比构图，[CAMERA_CN]，粗粝电影质感`,
    
    scene: `写实风格，竖版构图，9:16比例，[SCENE_NAME]，[TIME_OF_DAY_CN]，[DESCRIPTION_CN]，低饱和冷色调，硬朗阴影，高对比，简约粗犷，8K画质`,
    
    prop: `硬朗特写，竖版构图，9:16比例，[PROP_NAME]，[DESCRIPTION_CN]，冷光单点照明，暖色点缀，高对比，低饱和，分量感，粗粝质感`
  },
  
  mystery: {
    character: `写实风格，竖版肖像，9:16比例，[IDENTITY_BLOCK_CN]，偏心构图，低调光影，深色阴影遮挡面部，冷灰深蓝色调，暗红点缀，窥视感，穿着[OUTFIT_OVERRIDE || DEFAULT_OUTFIT_CN]，表情[EXPRESSION]，黑色电影美学，8K画质`,
    
    storyboard: `[SHOT_TYPE_CN]，竖版构图，9:16比例，[IDENTITY_BLOCK_CN]，[CHARACTER_ACTION_CN]，[SCENE_ANCHOR_CN]，低调光影，大面积阴影，冷灰色调，[CAMERA_CN]，窥视感构图，高对比，黑色电影质感`,
    
    scene: `写实风格，竖版构图，9:16比例，[SCENE_NAME]，[TIME_OF_DAY_CN]，[DESCRIPTION_CN]，低照度，大面积阴影，冷灰深蓝墨绿，压抑不安，高对比，8K画质`,
    
    prop: `黑色电影特写，竖版构图，9:16比例，[PROP_NAME]，[DESCRIPTION_CN]，单一强光源，戏剧性阴影，冷色调暗红点缀，不祥感，高对比，胶片颗粒`
  },
  
  palace: {
    character: `写实风格，竖版肖像，9:16比例，[IDENTITY_BLOCK_CN]，对称构图，戏剧光影，暖金主光冷色辅光，朱红金色翠绿墨黑色调，华贵宫廷感，穿着[OUTFIT_OVERRIDE || DEFAULT_OUTFIT_CN]，表情[EXPRESSION]，传统中式美学，8K画质`,
    
    storyboard: `[SHOT_TYPE_CN]，竖版构图，9:16比例，[IDENTITY_BLOCK_CN]，[CHARACTER_ACTION_CN]，[SCENE_ANCHOR_CN]，戏剧光影，暖金冷翠色调，[CAMERA_CN]，对称层次构图，朱红金色墨黑，宫廷权谋氛围`,
    
    scene: `写实风格，竖版构图，9:16比例，[SCENE_NAME]，[TIME_OF_DAY_CN]，[DESCRIPTION_CN]，华贵中式建筑，朱红廊柱金色装饰翠玉点缀，戏剧光影，对称构图，层次纵深，8K画质`,
    
    prop: `华贵特写，竖版构图，9:16比例，[PROP_NAME]，[DESCRIPTION_CN]，暖金光照，朱红金色翠玉色调，传统工艺细节，浅景深，戏剧光影`
  }
}
```

### 2.5 负面提示词系统

为每个模型和风格组合提供对应的负面提示词：

```typescript
const NEGATIVE_PROMPTS = {
  universal: {
    gemini: "Do not include: watermarks, text overlays, logos, horizontal composition, extra fingers, deformed hands, bad anatomy, blurry, low quality, cropped image.",
    jimeng: "水印，文字，logo，横版构图，多余手指，变形，模糊，低画质，裁切"
  },
  realistic: {
    gemini: "Do not include: cartoon style, anime, illustration, painting, drawing, 3D render, CGI look.",
    jimeng: "卡通，动漫，插画，绘画，3D渲染"
  },
  anime: {
    gemini: "Do not include: photorealistic, photograph, 3D render, uncanny valley, realistic skin texture.",
    jimeng: "写实，照片，3D渲染，恐怖谷，真实皮肤纹理"
  }
}
```

### 2.6 连续性锚点系统（Continuity Anchors）

不只是角色一致性，而是整个视觉世界的连续性：

```
四层锚点：

1. 角色锚点（Character Anchor）
   - identity block：面部、体型、标志性特征
   - 整个项目固定不变
   
2. 场景锚点（Scene Anchor）
   - 环境描述块：地点、氛围、关键视觉元素
   - 同一场景的所有分镜共享
   
3. 风格锚点（Style Anchor）
   - 色调、光影、构图偏好
   - 整个项目固定不变（来自 /风格 命令）
   
4. 道具锚点（Prop Anchor）
   - 反复出现的标志性物品描述
   - 如：旧玉镯、金戒指、伤疤
   - 在涉及该道具的所有分镜中保持一致
```

### 2.7 动态 Prompt 组装器

在 SKILL 的 /分镜 命令中，AI 不再使用静态模板，而是根据数据自动组装：

```
组装流程：

输入数据：
  ├── 角色数据（list_characters → character_anchor）
  ├── 场景数据（list_scenes → 环境描述）
  ├── 项目风格（get_project → 题材、模型选择、风格配置）
  ├── 剧本场景（get_episode_script → 视觉描述、情绪强度）
  └── 分镜参数（镜头类型、运镜、时间段）

组装步骤：
  1. 提取当前分镜涉及的角色 → 获取 identity block
  2. 提取当前场景 → 获取 scene anchor
  3. 获取项目题材 → 查找题材视觉映射
  4. 获取模型选择 → 选择 Gemini 或即梦模板
  5. 填充占位符：
     - [IDENTITY_BLOCK] ← 角色锚点
     - [SCENE_ANCHOR] ← 场景锚点
     - [SHOT_TYPE] ← 分镜参数
     - [CHARACTER_ACTION] ← 剧本场景描述
     - [CAMERA_MOVEMENT] ← 分镜运镜
     - [EXPRESSION] ← 剧本情绪标注
     - [LIGHTING_FROM_GENRE] ← 题材视觉映射
  6. 追加负面提示词
  7. 输出完整提示词

输出：
  {
    "positive_prompt": "完整的正面提示词",
    "negative_prompt": "负面提示词",
    "model": "gemini/jimeng",
    "aspect_ratio": "9:16",
    "reference_strength": {  // 仅即梦
      "face": 0.9,
      "body": 0.7,
      "outfit": 0.6
    }
  }
```

### 2.8 即梦参考强度参数

针对即梦的特有功能，在分镜提示词中自动计算参考强度：

```
参考强度规则：
- 脸部参考强度：85%-95%（确保五官稳定）
- 体型参考强度：70%-80%（保持身材比例）
- 服饰参考强度：60%-70%（允许轻微变化）

动态调整：
- 特写镜头：脸部 95%，体型 N/A
- 中景镜头：脸部 90%，体型 75%
- 全景镜头：脸部 85%，体型 70%
- 动作差异大时：体型降至 30%-50%
- 多人同框：人物 60% + 场景 40%
```

---

## 第三部分：AI 协作增强机制

### 3.1 质量自检清单系统

每个命令完成后自动执行质量检查：

```
/开始 自检：
- [ ] 题材是否明确？
- [ ] 目标受众是否定义？
- [ ] 是否有竞品参考？

/创作方案 自检：
- [ ] 核心概念是否一句话说清？
- [ ] 冲突结构是否有层次？
- [ ] 爽点设计是否覆盖 5 种类型？
- [ ] 变现策略是否与题材匹配？

/角色开发 自检：
- [ ] 主角是否有清晰的内在冲突？
- [ ] 反派是否有合理动机（非脸谱化）？
- [ ] 角色关系是否有张力？
- [ ] 每个角色是否有标志性视觉特征？
- [ ] character_anchor 是否完整？

/目录 自检：
- [ ] 前 10 集是否有 2+ 付费点？
- [ ] 每集结尾是否有明确悬念？
- [ ] 高潮与缓冲是否交替？
- [ ] 付费壁位置是否合理？
- [ ] Block 结构是否完整？

/分集 自检：
- [ ] 字数是否在 500-800 范围？
- [ ] 对白单句是否 ≤ 15 字？
- [ ] 前 3 秒是否有钩子？
- [ ] 结尾是否有悬念？
- [ ] 每个场景是否有视觉描述？
- [ ] 情绪曲线是否有起伏？
- [ ] 导演骨架是否完整执行？

/分镜 自检：
- [ ] 每场戏是否有建立镜头？
- [ ] 关键情绪是否有特写支撑？
- [ ] 角色锚点是否一致？
- [ ] 场景锚点是否一致？
- [ ] 提示词是否符合目标模型格式？
- [ ] 是否为 9:16 竖屏？
- [ ] 负面提示词是否包含？
```

### 3.2 迭代优化机制

每个命令完成后，AI 自动提出 3 个改进方向：

```
格式：

## 改进建议

自检结果：X/Y 项通过

### 方向 A: [具体改进]
- 当前：[现状描述]
- 建议：[改进内容]
- 预期效果：[改进后的效果]

### 方向 B: [具体改进]
...

### 方向 C: [具体改进]
...

请选择要应用的改进（A/B/C/跳过）：
```

### 3.3 跨命令上下文传递

确保每个命令都能获取前序命令的完整上下文：

```
上下文链：
/开始 → 项目基础信息（题材、受众）
  ↓
/风格 → 视觉和文字风格配置
  ↓
/创作方案 → 故事骨架、冲突结构、爽点设计
  ↓
/角色开发 → 角色档案、关系图谱、character_anchor
  ↓
/目录 → 分集目录、付费壁布局、Block 结构
  ↓
/分集 N → 导演骨架 + 编剧剧本（结构化 JSON）
  ↓
/分镜 N → 分镜序列 + 图片提示词（自动组装）
```

每个命令开始时，自动加载所有前序上下文。

---

## 文件变更清单

### 修改的文件

| 文件 | 变更内容 |
|------|----------|
| `skills/SKILL.md` | 重构命令流程，增加 /风格 和 /视频 命令，强化 /分集、/分镜、/角色开发 |
| `skills/references/opening-rules.md` | 增加 3-7-21 规则、prompt 模板、few-shot 示例、自检清单 |
| `skills/references/rhythm-curve.md` | 增加 3-15-30 结构、导演层模板、beat sheet 格式 |
| `skills/references/hook-design.md` | 增加钩子 prompt 模板、few-shot 示例 |
| `skills/references/paywall-design.md` | 重构为 5 块付费壁感知架构 |
| `skills/references/satisfaction-matrix.md` | 增加爽点 prompt 模板、与导演层集成 |
| `skills/references/villain-design.md` | 增加反派 prompt 模板、few-shot 示例 |
| `skills/references/storyboard-guide.md` | 增加动态 prompt 组装指南、20-60-20 构图规则、视频提示词指南 |
| `skills/references/visual-style-guide.md` | 增加题材视觉映射表、模型适配指南 |
| `skills/references/genre-guide.md` | 增加对白风格特征、出海文化适配 |
| `mcp/tools/image-tools.ts` | 重构 PROMPT_TEMPLATES 为三维矩阵，增加负面提示词、三视图模板 |
| `app/core/types/storyboard.ts` | 新增 `video_prompt` 字段 |
| `app/core/models/storyboard.model.ts` | 新增 `video_prompt` 字段 |
| `server/schemas/storyboard.ts` | 新增 `video_prompt` 字段 |

### 新增的文件

| 文件 | 内容 |
|------|------|
| `skills/references/dialogue-style-guide.md` | 对白风格库（按题材分类） |
| `skills/references/overseas-writing-guide.md` | 出海模式英文剧本写作指导 |
| `migrations/YYYYMMDD_add_video_prompt.ts` | 为 storyboard 表添加 video_prompt 字段 |

---

## 第四部分：AI 视频片段管理

### 4.1 问题分析

当前平台的创作流程是：剧本 → 分镜 → 图片提示词。但在实际 AI 短剧制作中，每集由多个 AI 生成的视频片段组成，这些视频片段需要管理和追踪。

现有的分镜（storyboard）数据模型已经包含了镜头的基本信息（shot_type、camera_angle、duration_seconds 等），但缺少视频生成和管理的环节。

### 4.2 视频片段与分镜的关系

```
分集剧本（Episode Script）
  └── 场景（Scene）
       └── 分镜（Storyboard）—— 已有
            ├── 图片提示词（image_prompt）—— 已有
            ├── 图片资源（通过 entity_assets 关联）—— 已有
            └── 视频提示词（video_prompt）—— 新增
                 └── 视频资源（通过 entity_assets 关联）—— 利用现有资源系统
```

每个分镜可以关联：
- 1 张参考图片（已有 `reference_image_url` 字段）
- 1 个图片生成提示词（已有 `image_prompt` 字段）
- 多张生成的图片（通过 `entity_assets` 关联，已有）
- 1 个视频生成提示词（**新增 `video_prompt` 字段**）
- 多个生成的视频片段（通过 `entity_assets` 关联，已有资源系统支持）

### 4.3 视频提示词设计

在分镜数据中新增 `video_prompt` 字段，用于存储 AI 视频生成的提示词。

**视频提示词结构**：

```json
{
  "video_prompt": {
    "positive": "视频生成正面提示词",
    "negative": "视频生成负面提示词",
    "duration": 3,
    "motion_description": "运动描述",
    "camera_movement": "推/拉/摇/跟/升降/手持",
    "reference_image": "参考图片URL（从分镜图片中选择）",
    "model": "jimeng/runway/kling"
  }
}
```

**Gemini 视频提示词模板**（用于描述，实际视频生成可能使用其他模型）：

```
"[DURATION]s video clip. [IDENTITY_BLOCK] [ACTION_DESCRIPTION]. Camera: [CAMERA_MOVEMENT]. [SCENE_ANCHOR]. [LIGHTING_FROM_GENRE]. Smooth motion, cinematic quality. 9:16 vertical format."
```

**即梦视频提示词模板**：

```
"[DURATION]秒视频，[IDENTITY_BLOCK_CN]，[ACTION_DESCRIPTION_CN]，[CAMERA_MOVEMENT_CN]，[SCENE_ANCHOR_CN]，[LIGHTING_CN]，流畅运动，电影质感，竖版9:16"
```

### 4.4 在 SKILL 中的集成

#### /分镜 N 命令扩展

在生成分镜的图片提示词之后，自动为每个分镜生成视频提示词：

```
/分镜 N（扩展后）

Process 新增步骤：
...（原有步骤 1-9）
10. 为每个分镜生成视频提示词：
    a. 基于图片提示词 + 分镜的 action_direction 生成运动描述
    b. 根据分镜的 camera_movement 字段确定镜头运动
    c. 根据分镜的 duration_seconds 确定时长
    d. 输出视频提示词并保存
11. 输出每集的视频片段概览表
```

#### 新增 /视频 N 命令

```
### /视频 N

**Input**：用户指定集数 N，可附带视频生成重点或修改意见。

**Process**：
1. 调用 `list_storyboards` 获取第 N 集所有分镜
2. 检查每个分镜是否已有视频提示词
3. 为缺少视频提示词的分镜生成提示词
4. 输出第 N 集的完整视频制作清单：
   - 分镜序号 | 时长 | 镜头类型 | 运镜 | 视频提示词 | 状态
5. 提示用户可以：
   - 修改某个分镜的视频提示词
   - 导出所有视频提示词（用于批量生成）
   - 标记已生成的视频片段

**Output**：第 N 集视频制作清单，提示用户生成视频或继续下一集。
```

### 4.5 视频资源管理

利用现有的资源管理系统（`entity_assets`）来关联视频文件：

```
工作流：
1. AI 生成视频片段（在外部工具中完成）
2. 用户上传视频到平台（upload_asset）
3. 关联视频到对应分镜（link_entity_asset，entity_type: storyboard）
4. 在分镜卡片中展示关联的视频和图片

资源类型标记：
- 图片资源：mime_type 为 image/*
- 视频资源：mime_type 为 video/*
- 现有的 asset 系统已支持 mime_type 区分
```

### 4.6 数据模型变更

**需要新增的字段**：

```
storyboard 表新增：
- video_prompt: text | null  —— 视频生成提示词（JSON 字符串）
```

这是本 spec 中唯一需要修改数据库 schema 的地方。需要一个新的 migration 文件。

---

## 不在范围内

- 不修改前端 UI（视频片段的展示可在后续迭代中处理）
- 不涉及实际的 AI 视频生成调用（只生成提示词，实际生成在外部工具完成）
- 不修改认证、团队管理等非创作相关功能
