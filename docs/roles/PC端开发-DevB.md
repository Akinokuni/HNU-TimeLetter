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
  - **交互**: 
    - 默认: 半透明 (opacity-90)，尺寸约 48px。
    - Hover: 放大 1.1 倍，不透明，显示 Tooltip。
    - Click: 记录地点并渲染故事区，随后通过 `scrollIntoView` 平滑滚动到 **StoryCardStack** 区域。

### 1.2 StoryCardStack (故事卡片堆)

**设计目标**: 替代传统的模态框，使用层叠卡片浏览故事，强调视觉冲击力。

- **布局实现**:
  - **页面结构**: 故事区位于页面上方，地图区位于下方，采用自然文档流排版。
  - **默认状态**: **Hidden** (未选地点时不渲染故事区，首屏展示地图)。
  - **激活状态**: 选中地点后故事区展开并滚动到可视区域。
  - **状态保持**: 用户滚动回地图时不清空故事状态；仅点击新地点时替换内容。

- **卡片堆叠区 (Image Stack)**:
  - **内容**: 纯图片展示 (无文字)，自适应宽高比 (Adaptive Ratio)。
  - **交互**: 
    - **Swipe/Drag**: 左右拖拽顶层卡片飞出，底层卡片弹起 (Spring Animation)。
    - **Click**: 点击顶层卡片，激活下方的 **StoryTextArea**。

- **故事文本区 (StoryTextArea)**:
  - **位置**: 卡片堆正下方，居中。
  - **默认状态**: **Hidden** (隐藏)。
  - **内容**: 
    - 顶部/左上角: **Static Stamp** (静态邮票)。
    - 正文: 故事文本 (Fade In/Out 切换)。
  - **交互**: 
    - 随卡片切换自动更新内容。
    - 点击外部或再次点击卡片可关闭/隐藏。

### 1.3 废弃组件
- ~~PostcardModal~~ (已移除)
- ~~StampSwitcher~~ (已移除)

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
