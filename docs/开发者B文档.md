作为 PC 端体验负责人，您的核心任务是打造**“挂在墙上的时光画卷”**。您不需要关注繁琐的数据获取逻辑，也不需要处理移动端的触摸手势，您的关注点在于**大屏视觉表现、精细的鼠标交互以及沉浸式的阅读体验**。
项目地址:https://github.com/Akinokuni/HNU-TimeLetter

------

# 开发需求文档：PC 端与地图交互 (Developer B)

> **负责人**: Developer B
>
> **项目代号**: HNU-TimeLetter
>
> **文档版本**: v1.0
>
> **工作目录**: `src/components/desktop/`
>
> **依赖关系**: 依赖 Dev A 提供的 `types.ts` 和 `content.json`（由 `npm run sync` 生成）；依赖设计师提供的 SVG 地图。

## 1. 核心任务概览

您的工作流主要包含三个组件的开发与组装：

1. **InteractiveMap**: 承载 SVG 底图与坐标点系统。
2. **PostcardModal**: 核心阅读器，包含左右分栏布局与胶片滤镜。
3. **StampSwitcher**: 位于阅读器内的控制器，用于在同一地点的不同故事间切换。

------

## 2. 交互式地图开发 (Interactive Map) [P0]

**文件路径**: `src/components/desktop/InteractiveMap.tsx`

**设计目标**: 全屏展示海大地图，确保在任意尺寸的 PC 屏幕上完整显示，不产生滚动条，不做缩放/平移（避免用户迷失）。

### 2.1 布局与适配容器

- **容器样式**: 使用 Flex 或 Grid 居中，高度强制 `h-screen`，宽度 `w-full`。
- **底图渲染**:
  - 使用 Next.js `<Image>` 组件加载地图底图（开发初期可用网上找的海大平面图代替）。
  - **关键属性**: `object-fit: contain`。确保地图永远完整显示在视口内，哪怕两侧留白。
  - **坐标系**: 建立一个 `relative` 定位的容器包裹图片，所有 Pin 点基于此容器进行 `absolute` 定位。

### 2.2 坐标点系统 (Pin System)

我们需要将数据中的百分比坐标映射到屏幕上。

- **数据源**: 读取 `LocationPoint[]` 数组。

- **渲染逻辑**:

  TypeScript

  ```
  {locations.map((loc) => (
    <div
      key={loc.id}
      style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
    >
      <MapPin data={loc} onClick={handlePinClick} />
    </div>
  ))}
  ```

- **MapPin 组件**:

  - 显示最新一个故事的 `avatarUrl` (Q版头像)。
  - **默认状态**: 稍微带有透明度 (opacity-90)，尺寸约 48px。
  - **Hover 状态**: 放大 1.1 倍，完全不透明，显示带有地点名称的 Tooltip (使用 Shadcn `Tooltip` 组件)。
  - **动画**: 使用 Framer Motion 添加轻微的上下浮动 (yoyo effect)，增加生动感。

------

## 3. 沉浸式阅读器 (Postcard Modal) [P0]

**文件路径**: `src/components/desktop/PostcardModal.tsx`

**设计目标**: 点击地图 Pin 点后弹出的模态框。它应当像一张精制的明信片，左侧是视觉冲击，右侧是情感叙事。

### 3.1 模态框架构

- 使用 Shadcn UI 的 `Dialog` 组件作为基础，但需要深度定制样式。
- **背景**: `backdrop-blur-md` (毛玻璃效果) + 半透明黑色遮罩。
- **尺寸**: `max-w-6xl`，宽高比保持在 16:9 或 3:2 左右。

### 3.2 左右分栏布局

- **左栏 (视觉区, 60%)**:
  - 展示高清合成大图 (`mainImageUrl`)。
  - **胶片滤镜**: 在图片上层覆盖一个 `div`，通过 CSS `mix-blend-mode: overlay` 叠加一层噪点纹理 (Noise Texture)，营造回忆感。
- **右栏 (叙事区, 40%)**:
  - 背景色：米白色 (`#fdfbf7`)，模拟信纸质感。
  - **排版**:
    - 顶部：`StampSwitcher` (见下文)。
    - 中部：故事文本 (`storyText`)。字体使用 `Noto Serif SC`，行高 `leading-loose`。
    - 底部：作者与日期信息，右对齐，字号较小，颜色较浅。

------

## 4. 邮票切换逻辑 (Stamp Switcher) [P1]

**文件路径**: `src/components/desktop/StampSwitcher.tsx`

**背景**: 一个地点（如“图书馆”）可能发生过多个故事。用户不需要退出模态框，直接在右侧顶部切换。

### 4.1 UI 构成

- **核心**: 显示当前故事角色的 Q 版头像，设计成邮票样式（带齿孔边框）。
- **导航**: 如果 `stories.length > 1`，在邮票左右两侧显示箭头按钮 (`<` `>`)。

### 4.2 交互逻辑

- **Props**: 接收 `stories: Story[]` 和 `onSwitch: (index: number) => void`。
- **动画**:
  - 点击“下一张”时，当前邮票向左滑出，新邮票从右侧滑入。
  - 利用 Framer Motion 的 `<AnimatePresence>` 和 `variants` 实现。
  - **联动**: 切换邮票的同时，触发左侧大图和下方文字的淡入淡出切换。

------

## 5. 视觉与细节打磨 (Visual Polish) [P2]

**目标**: 让 PC 端体验具有“Galgame”般的精致感。

1. **自定义鼠标 (Custom Cursor)**:
   - 在 CSS 中设置全局 `cursor: url('/images/cursor-default.png'), auto;` (素材需向设计师索要)。
   - Hover 在可交互元素（Pin, 按钮）上时，切换为 `cursor-pointer` 或特定图标。
2. **转场动画**:
   - 模态框打开时，不要生硬弹出。实现一个“信纸展开”或“淡入+放大”的 `easeOut` 效果。

------

## 6. 第一周行动清单 (Action Items)

1. **Day 1**:
   - 拉取 Dev A 的代码，确保能运行。
   - 在 `components/desktop` 下建立组件文件。
   - 找一张海大地图（或任意大图）作为 placeholder，实现 `InteractiveMap` 的全屏适配，确保窗口缩放时图片比例正确。
2. **Day 2**:
   - 引入 `content.json`（确保已运行 `npm run sync` 生成数据）。
   - 实现坐标点渲染逻辑，手动调整几个点的 `x, y` 百分比，确保它们精准地钉在地图的建筑物上。
3. **Day 3**:
   - 开发 `PostcardModal` 静态布局。先别管切换逻辑，先把“左图右文”的样式写得漂亮（字体、间距、圆角）。

## 7. 交付物验收标准

- [ ] PC 浏览器调整大小时，地图始终完整显示，Pin 点紧贴对应的建筑物位置，不发生偏移。
- [ ] 点击 Pin 点能平滑打开模态框。
- [ ] 模态框内点击“下一个”箭头，图片、文字、邮票能同步切换，且有过渡动画。
- [ ] 字体正确应用了宋体 (Noto Serif)，阅读体验舒适。

------

### 技术提示 (Tips)

- **关于图片与坐标**: 如果底图本身比例改变（例如从 16:9 换成 4:3），百分比坐标依然有效，但视觉上可能会错位。因此，**务必在开发早期就确定地图素材的宽高比**（建议锁定为标准比例，如 16:9 或 3440:1440），并告知设计师后续绘图必须保持此比例画布。
- **数据使用**: 在组件中直接 `import data from '@/data/content.json'` 即可（需先运行 `npm run sync`）。