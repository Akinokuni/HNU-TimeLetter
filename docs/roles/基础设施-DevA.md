# 基础设施与数据管道 (Developer A)

> **负责人**: Developer A
> **核心任务**: 项目基建、数据管道 (ETL)、部署运维。

## 1. 基础设施建设

### 1.1 技术栈与依赖 (Tech Stack)

初始化 Next.js 项目，确保包含以下核心依赖：
- **Framework**: `Next.js 14+` (App Router)
- **Language**: `TypeScript` (Strict Mode)
- **Styling**: `Tailwind CSS` + `clsx` + `tailwind-merge`
- **UI Library**: `Shadcn/UI` (Button, Dialog, ScrollArea, Tooltip)
- **Animation**: `Framer Motion`
- **Icons**: `Lucide React`
- **State**: `Zustand` (用于管理全局状态)

### 1.2 目录与路径别名

在 `tsconfig.json` 配置路径别名：
```json
"@/*": ["./src/*"]
```

**强制目录结构**：
```
src/
├── app/              # 路由页面
├── components/
│   ├── ui/           # Shadcn 基础组件
│   ├── shared/       # 全局组件 (Envelope, Loading)
│   ├── desktop/      # Dev B 专用目录
│   └── mobile/       # Dev C 专用目录
├── lib/              # 工具函数与类型定义
├── data/             # 存放 content.json
└── scripts/          # 存放 sync-feishu.ts
```

### 1.3 字体配置

在 `app/layout.tsx` 中引入 Google Fonts：
- **Serif (标题)**: `Noto Serif SC` (变量名 `--font-serif`)
- **Sans (正文)**: `Noto Sans SC` (变量名 `--font-sans`)

### 1.4 核心交互组件

- **`EnvelopeIntro`**: 实现全局开场动画（信封拆开），管理 `isEnvelopeOpened` 状态。
- **`ResponsiveEntry`**: 在 `app/page.tsx` 实现基于屏幕宽度的组件分流。

## 2. 数据管道 (Data Pipeline)

### 2.1 同步脚本 (`scripts/sync-feishu.ts`)

负责将飞书多维表格数据同步为本地静态 JSON。

**详细流程**:
1. **Auth**: 使用飞书自建应用 `App ID` + `App Secret` 获取 `tenant_access_token`。
2. **Fetch**: 调用多维表格 API (List records)。
   - `view_id`: 仅拉取“已发布(Published)”视图的数据。
   - `field_names`: 仅拉取需要的字段。
3. **Transform & Download**: 
   - 将飞书原始数据清洗为符合 [数据模型](../architecture/数据模型.md) 的格式。
   - **图片处理**: 识别附件字段 -> 下载流 -> 计算 MD5 -> 上传 OSS -> 获取永久 URL。
4. **Write**: 将清洗后的数据写入 `src/data/content.json`。

### 2.2 自动化构建

配置 `package.json` 确保构建时数据最新：
```json
"scripts": {
  "sync": "ts-node scripts/sync-feishu.ts",
  "build": "npm run sync && next build"
}
```

## 3. 运维与部署 (DevOps)

### 3.1 环境变量

管理 `.env.local` (本地) 和 Vercel Environment Variables (生产)：
- `FEISHU_APP_ID` / `FEISHU_APP_SECRET`
- `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`
- `OSS_BUCKET` / `OSS_REGION`

### 3.2 部署策略

- **平台**: Vercel
- **模式**: Static Site (默认)
- **缓存**: 利用 Next.js 缓存机制，配合 `npm run sync` 更新内容。
