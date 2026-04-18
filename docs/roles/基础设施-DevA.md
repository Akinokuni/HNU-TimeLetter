# 基础设施与数据管道 (Developer A)

> **负责人**: Developer A
> **核心任务**: 项目基建、数据管道 (ETL)、部署运维。

## 1. 基础设施建设

### 1.1 技术栈与依赖 (Tech Stack)

初始化 Next.js 项目，确保包含以下核心依赖（以 `package.json` 为准）：
- **Framework**: `Next.js 16.1.6` (App Router)
- **Language**: `TypeScript 5+` (Strict Mode)
- **Styling**: `Tailwind CSS v4` + `clsx` + `tailwind-merge`
- **UI Library**: `Radix UI` / Shadcn 风格组件
- **Animation**: `Framer Motion v12`
- **Smooth Scroll**: `Lenis`（桌面端启封态下滚页面群）
- **Icons**: `Lucide React`
- **State**: `Zustand v5` (用于管理全局状态)
- **定时任务**: `node-schedule`（用于 `/admin` 后台管理系统的同步调度）
- **云存储**: `ali-oss`（用于图片永久链接托管）

### 1.2 目录与路径别名

在 `tsconfig.json` 配置路径别名：
```json
"@/*": ["./src/*"]
```

**强制目录结构**（以当前仓库实际为准）：
```
src/
├── app/
│   ├── admin/         # `/admin` 后台（登录 + 受保护分组）
│   ├── api/admin/     # 后台 API (登录 / 手动同步)
│   ├── creation/      # `/creation` 公示板路由
│   ├── layout.tsx
│   └── page.tsx       # 首页（启封主屏 + 下滚页面群 + 主体验）
├── components/
│   ├── ui/            # Shadcn 风格基础组件
│   ├── shared/        # 全局组件（EnvelopeIntro / GuideLine / CustomScrollbar）
│   ├── sections/      # 下滚页面群（AboutProject / AboutUs / Credits / Footer / ScrollSections）
│   ├── desktop/       # Dev B 专用目录
│   ├── mobile/        # Dev C 专用目录
│   └── creation/      # 公示板便签瀑布流
├── lib/
│   ├── admin/         # 后台鉴权 / 调度 / 配置读写
│   ├── sync-service.ts# 飞书 + OSS 同步主服务（被 CLI 与 API 复用）
│   ├── types.ts       # 核心领域类型
│   ├── store.ts       # Zustand 全局状态
│   ├── hooks.ts / useVirtualScroll.ts
│   └── content.ts / utils.ts
├── config/            # admin.json / locations.json
├── data/              # content.json / creation-board.json (同步产物)
└── scripts/           # sync-feishu.ts + 各种飞书/OSS 调试脚本
```

### 1.3 字体配置

在 `src/app/layout.tsx` 中通过 `next/font/local` 加载本地字体：
- **Display (标题)**: `ChillDINGothic_SemiBold.otf`，CSS 变量 `--font-display`，Tailwind 暴露为 `font-serif`
- **Body (正文)**: `ZouLDFXKAJ.ttf`，CSS 变量 `--font-body`，Tailwind 暴露为 `font-sans`
- **Fallback**: `PingFang SC`、`Microsoft YaHei`、系统无衬线

> 视觉 Token 与使用约束详见 [视觉规范](../design/视觉规范.md)。

### 1.4 核心交互组件

- **`EnvelopeIntro`** (`src/components/shared/EnvelopeIntro.tsx`)：
  - 实现启封主屏与开信动画（丝带显影 → 信封飘落 → 火漆碎裂 → 封盖翻开 → 信纸居中放大）。
  - 与 `useAppStore` 中的 `isEnvelopeOpened` / `isTransitioning` 状态双向联动。
- **`ScrollSections`** (`src/components/sections/ScrollSections.tsx`)：
  - 承载“关于企划 / 关于我们 / 鸣谢”三段下滚页面与横跨其间的红色引导线 (`GuideLine`)。
  - 已从 `EnvelopeIntro` 中剥离为独立层，避免 `AnimatePresence exit` 把下滚页面群一起带走。
- **`Footer`** (`src/components/sections/Footer.tsx`)：固定视口底部的揭露式页脚，占位高度由 `FooterSpacer` 动态测量。
- **`CustomScrollbar`** (`src/components/shared/CustomScrollbar.tsx`)：与 Lenis 同步的 DOM 滑块，见 [交互设计 §4.0](../design/交互设计.md#40-全局滚动系统)。
- **响应式分流**：在 `src/app/page.tsx` 内根据 `useIsMobile()` 条件渲染 `InteractiveMap`（桌面）或 `MobileExperience`（移动），不封装为独立 `ResponsiveEntry` 组件。

## 2. 数据管道 (Data Pipeline)

### 2.1 同步服务 (`src/lib/sync-service.ts`)

核心同步逻辑已从脚本提取为可复用服务，`src/scripts/sync-feishu.ts` 只是其 CLI 包装，`/admin` 后台的手动同步 API 也复用同一入口 `syncFeishuData()`。

**详细流程**：
1. **Auth**：使用飞书自建应用 `App ID` + `App Secret` 获取 `tenant_access_token`。
2. **Fetch**：拉取 3 张多维表格：
   - `FEISHU_TABLE_ID` —— 首页故事表（按 `FEISHU_VIEW_ID` 过滤）。
   - `feishuCreationTableId`（可由 `FEISHU_CREATION_TABLE_ID` 覆盖）—— 创作公示板（揭示板 / 收集结果）。
   - `feishuLocationsTableId` —— 地点坐标配置。
3. **Transform & Download**：
   - 将飞书原始数据清洗为 [数据模型](../architecture/数据模型.md) 中的 `Story / LocationPoint / CreationIdea`。
   - **图片处理**：识别附件字段 → 下载流 → 计算 MD5 → 上传 OSS → 获取永久 URL。
   - **URL 回写**：将 OSS URL 分别回填至飞书故事表 `头像OSS_URL / 大图OSS_URL`，创作公示板的参考图则合并回填至 `文本` 字段。
4. **Write**：分别写入 `src/data/content.json` 与 `src/data/creation-board.json`。

### 2.2 自动化构建

`package.json` 中的脚本命令（以 `tsx` 执行，TypeScript 无需额外编译步骤）：
```json
"scripts": {
  "dev": "next dev",
  "build": "npm run sync && next build",
  "start": "next start",
  "lint": "eslint",
  "sync": "tsx src/scripts/sync-feishu.ts"
}
```

## 3. 运维与部署 (DevOps)

### 3.1 环境变量

管理 `.env.local`（本地）和 Vercel Environment Variables（生产）：
- **飞书基础**：`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_APP_TOKEN` / `FEISHU_TABLE_ID` / `FEISHU_VIEW_ID`
- **创作公示板（可选，覆盖默认值）**：`FEISHU_CREATION_TABLE_ID` / `FEISHU_CREATION_VIEW_ID`
- **阿里云 OSS**：`ALIYUN_OSS_REGION` / `ALIYUN_OSS_BUCKET` / `ALIYUN_OSS_ACCESS_KEY_ID` / `ALIYUN_OSS_ACCESS_KEY_SECRET`
- **后台管理**：`ADMIN_PASSWORD`（由 `src/lib/admin/auth.ts` 读取，未配置时默认回退到 `admin`，生产环境务必覆盖）。

### 3.2 部署策略

- **平台**: Vercel
- **模式**: Static Site (默认)
- **缓存**: 利用 Next.js 缓存机制，配合 `npm run sync` 更新内容。
