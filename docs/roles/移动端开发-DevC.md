# 移动端开发指引 (Developer C)

> **负责人**: Developer C
> **工作目录**: [src/components/mobile/](file:///c:/Documents/Galgame群活动/与她的海大时光笺/web/src/components/mobile/)
> **核心任务**: 打造“掌心的时光集邮册”，专注于竖屏体验与手势交互。

## 1. 核心组件开发

### 1.1 StoryFeed (瀑布流列表)

**设计目标**: 手机端放弃交互地图，采用高效的瀑布流列表。

- **布局策略**:
  - 推荐使用 CSS Grid 或 Masonry (Tailwind `columns-2 gap-4`)。
- **卡片组件 (`StoryCard`)**:
  - 显示 `mainImageUrl` (Next.js Image, `placeholder="blur"`).
  - **关键动效**: 给图片容器添加 `layoutId={`story-img-${story.id}`}` (Framer Motion)，这是实现 Magic Motion 转场的关键。

### 1.2 MobileDetailModal (详情模态框)

**设计目标**: 全屏覆盖，但通过共享元素转场消除“新页面”的生硬感。

- **布局架构**:
  - 容器: `fixed inset-0 z-50 bg-background`。
  - **上半部 (Visual)**: 放置高清大图，**必须拥有与列表卡片相同的 `layoutId`**。
  - **下半部 (Content)**: 放置 `StampSwitcher` 和可滚动的文本。

- **手势交互 (Gesture)**:
  - **下拉关闭**: 给容器添加 `drag="y"`，监听 `onDragEnd`，拖拽超过阈值关闭。
  - **左右滑动**: 在内容区监听 Swipe 手势切换故事。

### 1.3 MapFAB (悬浮地图按钮)

- **功能**: 右下角悬浮按钮 (Floating Action Button)。
- **交互**: 点击弹出一张 **纯静态** 海大地图图片 (仅供查看地理位置)。
  - **实现注意**: 虽然名为“静态”，但仍需复用 PC 端的**动态比例计算逻辑**。
  - 使用 `ResizeObserver` 和 `onLoadingComplete` 确保地图容器尺寸与实际渲染图片一致，防止坐标点在不同屏幕比例下偏移。
  - Pin 点渲染逻辑与 PC 端一致 (百分比坐标)。

## 2. 移动端特性适配 (Mobile Quirks)

- **100vh 问题**: 
  - 移动端浏览器地址栏会遮挡底部。
  - **解决方案**: 使用 `dvh` (Dynamic Viewport Height) 单位。例如 `h-[100dvh]`。
- **滚动穿透**: 
  - 打开模态框时，背景列表不应滚动。
  - **解决方案**: 打开 Modal 时给 `body` 添加 `overflow-hidden`。

## 3. 验收标准

- [ ] 列表滑动流畅，无布局抖动。
- [ ] 从列表到详情页的转场动画丝滑 (Shared Layout)。
- [ ] 手势关闭功能手感自然。
