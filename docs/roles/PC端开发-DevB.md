# PC 端开发指引 (Developer B)

> **负责人**: Developer B
> **工作目录**: [src/components/desktop/](file:///c:/Documents/Galgame群活动/与她的海大时光笺/web/src/components/desktop/)
> **核心任务**: 打造“挂在墙上的时光画卷”，专注于大屏视觉表现与鼠标交互。

## 1. 核心组件开发

### 1.1 InteractiveMap (交互式地图)

**设计目标**: 全屏展示海大地图，确保在任意尺寸屏幕上完整显示 (`object-fit: contain`)，不做缩放或平移。

- **布局实现**:
  - 容器: Flex/Grid 居中，高度强制 `h-screen`，宽度 `w-full`。
  - 图片: 使用 Next.js `<Image>`，设置 `object-fit: contain`。
  - 坐标系: 建立 `relative` 容器包裹图片，Pin 点基于此容器 `absolute` 定位。

- **坐标点系统 (Pin System)**:
  - **数据源**: 读取 `LocationPoint[]`，使用百分比坐标 (`x`, `y`)。
  - **渲染逻辑**:
    ```tsx
    <div style={{ left: `${loc.x}%`, top: `${loc.y}%` }} className="absolute ...">
      <MapPin data={loc} />
    </div>
    ```
  - **交互**: 
    - 默认: 半透明 (opacity-90)，尺寸约 48px。
    - Hover: 放大 1.1 倍，不透明，显示 Tooltip。
    - Click: 打开 PostcardModal。

### 1.2 PostcardModal (沉浸式阅读器)

**设计目标**: 左右分栏的大尺寸明信片模态框。

- **模态框样式**:
  - 基础: Shadcn UI `Dialog`。
  - 背景: `backdrop-blur-md` (毛玻璃) + 半透明遮罩。
  - 尺寸: `max-w-6xl`，宽高比约 16:9 或 3:2。

- **左右分栏布局**:
  - **左栏 (视觉区, 60%)**: 
    - 展示 `mainImageUrl`。
    - **胶片滤镜**: 叠加 `div` 使用 `mix-blend-mode: overlay` + 噪点纹理。
  - **右栏 (叙事区, 40%)**:
    - 背景: 米白色 (`#fdfbf7`)。
    - 排版: 顶部 `StampSwitcher`，中部 `storyText` (Leading-loose)，底部作者日期。

### 1.3 StampSwitcher (邮票切换器)

- **功能**: 在同一地点的不同故事间切换。
- **交互**: 
  - 显示当前角色 Q版头像邮票。
  - 点击左右箭头 -> 邮票滑入滑出 -> 同时切换左侧大图和右侧文字。

## 2. 数据获取

直接从 [content.json](file:///c:/Documents/Galgame群活动/与她的海大时光笺/web/src/data/content.json) 导入数据。
```typescript
import data from '@/data/content.json';
// 使用 types.ts 中的 LocationPoint 接口
import type { LocationPoint } from '@/lib/types';
```

## 3. 验收标准

- [ ] 窗口缩放时地图不发生裁剪或偏移。
- [ ] 点击 Pin 点平滑打开模态框。
- [ ] 模态框内切换故事流畅无卡顿。
