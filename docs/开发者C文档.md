作为移动端体验负责人，您的核心任务是打造**“掌心的时光集邮册”**。与 PC 端强调“宏大、全览”不同，移动端强调**“私密、高效、丝滑”**。您需要利用 Framer Motion 消除页面跳转的生硬感，让 Web App 拥有原生应用般的手感。
项目地址:https://github.com/Akinokuni/HNU-TimeLetter

------

# 开发需求文档：移动端体验与动效 (Developer C)

> **负责人**: Developer C
>
> **项目代号**: HNU-TimeLetter
>
> **文档版本**: v1.0
>
> **工作目录**: `src/components/mobile/`
>
> **依赖关系**: 依赖 Dev A 的数据结构；依赖 Dev B 的部分图片资源（但逻辑完全隔离）。

## 1. 核心任务概览

您的工作流主要集中在 `components/mobile` 目录下，核心交付物为：

1. **StoryFeed**: 高性能的瀑布流/卡片流列表。
2. **MobileDetailModal**: 支持手势关闭和左右滑动的详情页。
3. **Shared Layout Animation**: 实现从“列表缩略图”到“详情页大图”的无缝变形转场。

------

## 2. 瀑布流列表 (Story Feed) [P0]

**文件路径**: `src/components/mobile/StoryFeed.tsx`

**设计目标**: 既然手机端放弃了交互地图，列表就是用户探索内容的主要方式。它必须加载极快，且滑动流畅。

### 2.1 布局策略

- **结构**: 推荐使用 CSS Grid 或 Masonry 布局。
  - **方案**: 双列瀑布流。如果图片比例不一，建议使用 `columns-2 gap-4` (Tailwind) 来实现简易瀑布流。
- **卡片组件 (`StoryCard`)**:
  - **缩略图**: 显示 `mainImageUrl`。务必使用 Next.js `<Image>` 组件，开启 `placeholder="blur"` (若有 blurDataURL) 或自定义灰色占位符。
  - **信息**: 图片下方简单显示“地点名称”和“Q版头像邮票”。
  - **关键属性**: 给每个图片的容器添加 `layoutId={`story-img-${story.id}`}` (Framer Motion 属性)，这是实现后续神奇转场的关键。

### 2.2 静态地图入口 (FAB)

- **悬浮按钮**: 在屏幕右下角固定一个圆形按钮 (Floating Action Button)。
- **交互**:
  - 点击 FAB -> 弹出一个全屏 Modal (`StaticMapModal`)。
  - **内容**: 仅展示一张**纯静态**的海大地图图片 (不可点击 Pin 点，仅供查看地理位置)。支持双指缩放 (Pinch to Zoom) 最好，如果复杂可暂缓，仅支持单指拖拽查看。

------

## 3. 移动端详情模态框 (Mobile Detail Modal) [P0]

**文件路径**: `src/components/mobile/MobileDetailModal.tsx`

**设计目标**: 这是一个覆盖全屏的模态框，但它不能感觉像是一个“新页面”。

### 3.1 布局架构

- **容器**: `fixed inset-0 z-50 bg-background`。
- **上半部分 (Visual, 50vh)**:
  - 放置高清大图。
  - **关键**: 这里的图片组件也必须拥有与列表卡片相同的 `layoutId={`story-img-${story.id}`}`。
  - **效果**: 当模态框打开时，Framer Motion 会自动计算位置，让图片从列表中的小图位置“飞”到模态框的大图位置。
- **下半部分 (Content, remaining height)**:
  - 放置 `StampSwitcher` (复用组件或移动端特供版) 和故事文本。
  - 支持 `overflow-y-auto` 滚动阅读长文本。

### 3.2 邮票切换 (Mobile Switcher)

- 在图片和文字之间，放置当前角色的 Q 版邮票。
- **左右箭头**: 点击切换同地点的不同故事。
- **联动**: 切换时，上方大图需要有淡入淡出或滑动的过渡。

------

## 4. 手势交互系统 (Gesture System) [P1]

**目标**: 让 Web 网页像 Native App 一样跟手。

### 4.1 详情页手势

使用 Framer Motion 的 `drag` 属性。

- **下拉关闭**:
  - 给模态框容器添加 `drag="y"` 和 `dragConstraints={{ top: 0, bottom: 0 }}` (利用 `dragElastic` 实现阻尼感)。
  - 监听 `onDragEnd`: 如果向下拖拽距离超过阈值 (如 100px)，则关闭模态框，触发布局动画缩回列表。
- **左右滑动切题**:
  - 在内容区域监听 Swipe 手势，触发 `nextStory()` 或 `prevStory()`。

### 4.2 浏览器兼容性 (Mobile Quirks)

- **100vh 问题**: 移动端浏览器的地址栏会遮挡底部。
  - **解决方案**: 在 `globals.css` 或 Tailwind 配置中使用 `dvh` (Dynamic Viewport Height) 单位。例如：`h-[100dvh]` 而不是 `h-screen`。
- **滚动穿透**: 打开模态框时，背景列表不应滚动。
  - **解决方案**: 打开 Modal 时给 `body` 添加 `overflow-hidden` 类，关闭时移除。Shadcn 的 Dialog 组件通常会自动处理这个，如果手动实现需注意。

------

## 5. 第一周行动清单 (Action Items)

1. **Day 1**:
   - 拉取 Dev A 代码，运行项目。
   - 在 `app/page.tsx` 中，确保手机访问时能看到您负责的 `<MobileExperience>` 组件。
   - 使用 `src/data/content.json` 中的数据实现一个基础的双列瀑布流列表 (`StoryFeed`)。
2. **Day 2**:
   - **攻坚 Shared Layout Animation**:
     - 创建一个点击卡片打开全屏 `div` 的 Demo。
     - 调试 `layoutId`，确保图片是从卡片位置放大变换到全屏位置，而不是生硬弹出。
3. **Day 3**:
   - 完善详情页布局 (上图下文)。
   - 添加“右下角 FAB”按钮，点击弹出一张静态图片作为地图示意。

------

## 6. 交付物验收标准

- [ ] 手机端访问，列表加载流畅，图片无布局抖动 (CLS)。
- [ ] **核心**: 点击列表卡片，图片能平滑放大过渡到详情页位置 (Magic Motion)。
- [ ] 详情页大图下方展示文字，超过屏幕高度可滚动。
- [ ] 在详情页向下滑动 (Pull down) 能关闭详情页并缩回列表。
- [ ] 底部导航栏/地址栏不会遮挡页面内容 (正确使用 `dvh`)。

------

### 技术提示 (Tips for Dev C)

- **关于 `layoutId`**: Framer Motion 的共享布局动画要求组件在组件树中的层级尽量保持一致，或者 ID 全局唯一。如果在测试时发现动画是“淡入淡出”而不是“变形”，通常是因为 `layoutId` 不匹配或图片比例差异过大。
- **性能**: 列表页图片建议使用 `width: 50vw` (双列) 的 `sizes` 属性，避免加载原图浪费流量。
- **调试**: 请务必使用 Chrome DevTools 的 "Device Toolbar" 模拟手机，并经常在真机上测试（局域网访问 IP），因为触摸手势在鼠标模拟下往往感觉不同。