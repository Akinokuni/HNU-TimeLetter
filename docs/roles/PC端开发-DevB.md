# PC 端开发指引 (Developer B)

> **负责人**: Developer B
> **工作目录**: [src/components/desktop/](file:///c:/Documents/Galgame群活动/与她的海大时光笺/web/src/components/desktop/)
> **核心任务**: 打造“挂在墙上的时光画卷”，专注于大屏视觉表现与鼠标交互。

## 1. 核心组件开发

### 1.1 InteractiveMap (交互式地图)

**设计目标**: 全屏展示海大地图，确保在任意尺寸屏幕上完整显示 (`object-fit: contain`)，不做缩放或平移。

- **布局实现**:
  - 容器: Flex/Grid 居中，高度强制 `h-screen`，宽度 `w-full`。
  - **动态容器计算**: 为了避免 `object-fit: contain` 在非标准比例窗口下产生的留白导致坐标偏移，需要使用 `ResizeObserver` 计算**实际渲染地图**的尺寸。
  - 图片: 使用 Next.js `<Image>`，监听 `onLoadingComplete` 获取实际宽高比，不再硬编码比例。
  - 坐标系: 建立一个与“实际渲染地图”等大的 `relative` 内部容器，Pin 点基于此容器 `absolute` 定位。

- **坐标点系统 (Pin System)**:
  - **数据源**: 读取 `LocationPoint[]`，使用百分比坐标 (`x`, `y`)。
  - **渲染逻辑**:
    ```tsx
    <div style={{ width: mapSize.width, height: mapSize.height }} className="relative ...">
      <Image ... />
      {/* 坐标点基于实际地图尺寸定位 */}
      <div style={{ left: `${loc.x}%`, top: `${loc.y}%` }} className="absolute ...">
        <MapPin data={loc} />
      </div>
    </div>
    ```
  - **InteractiveMap (核心逻辑)**:
    - **状态驱动**: 使用 `Phase` 状态机 (`idle` | `rolling` | `rolled` | `unrolling`) 驱动复杂的异步动画。
    - **卷起动画**: 地图容器 `width` 从 `100%` 动画至 `56px`。使用 `overflow-hidden` 配合内层 `100vw` 右锚定容器，确保收纳过程中 Pin 点坐标不偏移。
    - **视觉强化**: 米黄色卷轴条 (`#ede6d9`)，具备 `5px` 扩散的深褐色投影及模拟纸质横纹。
    - **图层顺序**: 设置 `z-index: 10`，作为背景层存在。

  ### 1.2 StoryCardStack (故事看板)

  **设计目标**: 地图卷起后在左侧展示的沉浸式故事空间。

  - **层级逻辑**: 
  - **置顶显示**: `z-index: 30`。通过将看板层级提升至卷轴之上，并移除 `overflow-hidden`，确保卡片在拖拽飞出时可以自由覆盖卷轴条。
  - **动画时序**:
  - **顺序加载**: 监听地图 `Phase`，仅在 `rolled` (完全卷起) 状态下挂载故事看板，实现“卷完再出”的精致感。
  - **进场效果**: 采用 `spring` 弹簧动画从下方弹出，移除内部延迟以获得即时响应。
  - **卡片堆叠交互**: 
  - **Swipe/Drag**: 左右拖拽顶层卡片飞出，底层卡片弹起 (Spring Animation)。
  - **Click**: 点击顶层卡片，激活下方的 **StoryTextArea**。

  ### 1.3 卷轴条 (Scroll Strip)
  - **功能**: 作为返回地图的唯一入口，点击触发 `unrolling`。
  - **执行顺序**: 
  1. 触发故事看板 `exit` 动画。
  2. 在 `onExitComplete` 回调中启动地图展开。
  3. 待地图展开完成后重置状态。

  ### 1.4 废弃逻辑
  - ~~scrollIntoView 垂直滚动~~ (已改为水平卷起)
  - ~~上下排版布局~~ (已改为左右收纳布局)
## 2. 数据获取

直接从 [content.json](file:///c:/Documents/Galgame群活动/与她的海大时光笺/web/src/data/content.json) 导入数据。
```typescript
import data from '@/data/content.json';
// 使用 types.ts 中的 LocationPoint 接口
import type { LocationPoint } from '@/lib/types';
```

## 3. 验收标准

- [ ] 窗口缩放时地图不发生裁剪或偏移。
- [ ] 点击 Pin 点后平滑滚动至卡片堆，且不依赖图层 `transform` 切换。
- [ ] 卡片堆叠效果自然，拖拽手势流畅。
- [ ] 文本区点击显示/隐藏逻辑正确，内容切换无闪烁。
- [ ] 页面无底部横向滚动条，横向溢出被全局抑制。
