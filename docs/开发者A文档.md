作为项目的 Tech Lead，您的核心任务是**“修路”**——为 Developer B 和 C 提供稳固的开发环境、统一的数据源以及全局的基础设施。
项目地址:https://github.com/Akinokuni/HNU-TimeLetter

------

# 开发需求文档：架构与数据基建 (Developer A)

> **负责人**: Developer A
>
> **项目代号**: HNU-TimeLetter
>
> **文档版本**: v1.0
>
> **依赖关系**: 上游对接飞书 API，下游为 Dev B/C 提供数据与组件

## 1. 工程初始化 (Project Setup) [P0]

**目标**: 建立统一的代码规范与开发环境，确保三人协作无冲突。

### 1.1 技术栈安装

初始化 Next.js 项目，必须包含以下依赖：

- **Framework**: `Next.js 14+` (App Router)
- **Language**: `TypeScript` (Strict Mode)
- **Styling**: `Tailwind CSS` + `clsx` + `tailwind-merge`
- **UI Library**: `Shadcn/UI` (Button, Dialog, ScrollArea, Tooltip)
- **Animation**: `Framer Motion`
- **Icons**: `Lucide React`
- **State**: `Zustand` (用于管理“信封是否已拆开”等全局状态)

### 1.2 目录与路径别名

在 `tsconfig.json` 配置路径别名，强制团队使用绝对路径引用：

JSON

```
"@/*": ["./src/*"]
```

**强制目录结构**：

Bash

```
src/
├── app/              # 路由页面
├── components/
│   ├── ui/           # Shadcn 基础组件 (禁止手动修改)
│   ├── shared/       # 您负责的全局组件 (Envelope, Loading)
│   ├── desktop/      # Dev B 专用目录
│   └── mobile/       # Dev C 专用目录
├── lib/              # 工具函数与类型定义
├── data/             # 存放 content.json
└── scripts/          # 存放 sync-feishu.ts
```

### 1.3 字体配置

在 `app/layout.tsx` 中引入 Google Fonts (通过 `next/font/google`)：

- **Serif (标题/叙事)**: `Noto Serif SC` (变量名 `--font-serif`)
- **Sans (UI/正文)**: `Noto Sans SC` (变量名 `--font-sans`)

------

## 2. 数据管道开发 (Data Pipeline) [P0]

**目标**: 实现“飞书表格 -> 本地 JSON”的自动化同步，这是项目的**生命线**。

### 2.1 飞书同步脚本 (`scripts/sync-feishu.ts`)

编写一个 Node.js 脚本（使用 `ts-node` 运行），逻辑如下：

1. **Auth**: 使用飞书自建应用 `App ID` + `App Secret` 获取 `tenant_access_token`。
2. **Fetch**: 调用多维表格 API (List records)，参数：
   - `view_id`: 仅拉取“已发布(Published)”视图的数据。
   - `field_names`: 仅拉取需要的字段。
3. **Transform**: 将飞书的原始数据清洗为符合 `types.ts` 定义的格式。
   - *注意*: 飞书的图片附件通常是临时链接。如果企划案决定使用 OSS，请读取表格中的 `OSS_URL` 文本字段；如果直接用飞书图床，需实现“下载图片 -> 存入 `public/images` -> 替换 JSON 路径”的逻辑（推荐后者，因为是静态站点，不依赖外部图床更稳定）。
4. **Write**: 将清洗后的数据写入 `src/data/content.json`。

### 2.2 数据类型定义 (`lib/types.ts`)

您需要定义并 `export` 以下接口供全员使用：

TypeScript

```
// 故事实体 (对应飞书一行)
export interface Story {
  id: string;
  characterId: string;
  characterName: string;
  avatarUrl: string;      // Q版头像路径
  mainImageUrl: string;   // 高清大图路径
  content: string;        // 故事文本
  author: string;
  date: string;
  locationId: string;     // 关联的地点ID
}

// 地点实体 (前端聚合用)
export interface LocationPoint {
  id: string;
  name: string;
  x: number;              // 0-100%
  y: number;              // 0-100%
  stories: Story[];       // 该地点包含的故事
}
```

### 2.3 生成 Mock 数据

在脚本完成前，~~必须~~（已废弃）手动编写一份 `src/data/content.json`，包含至少 3 个地点和 5 个故事，提交到 Git，以便 Dev B 和 Dev C 立即开始 UI 开发。

> **更新**：目前已实现飞书数据同步，请直接运行 `npm run sync` 生成真实数据。

------

## 3. 核心交互与路由 (Core Interaction) [P1]

### 3.1 响应式入口分流 (`app/page.tsx`)

实现一个由 JavaScript 控制的响应式入口，解决服务端渲染 (SSR) 的 Hydration 问题。

- **逻辑**: 检测屏幕宽度。
- **输出**:
  - 若宽度 > 768px (`md`): 渲染 `<DesktopExperience />` (Import form `@/components/desktop`)
  - 若宽度 <= 768px: 渲染 `<MobileExperience />` (Import form `@/components/mobile`)
- **技术点**: 需编写一个 `useMediaQuery` Hook，并确保组件仅在 Client 端挂载，避免 SSR 时的闪烁。

### 3.2 开场信封动画 (`components/shared/EnvelopeIntro.tsx`)

这是用户进入网站的第一印象。

- **状态管理**: 使用 `Zustand` 创建 `useAppStore`，存储 `{ isOpened: boolean }`。
- **交互**:
  1. 全屏展示信封（SVG/图片）。
  2. 点击信封 -> 播放 Framer Motion 动画（火漆碎裂 -> 信纸抽出 -> 整体淡出）。
  3. 动画结束后，设置 `isOpened = true`，展示地图/列表主界面。

### 3.3 全局 Loading 与 404

- `app/loading.tsx`: 设计一个带有海大元素的 Loading Spinner。
- `app/not-found.tsx`: 简单的 404 页面，引导返回首页。

------

## 4. 部署与运维 (DevOps) [P2]

### 4.1 环境变量配置

创建 `.env.local` 和 `.env.example`，管理敏感信息：

Bash

```
FEISHU_APP_ID=xxx
FEISHU_APP_SECRET=xxx
FEISHU_TABLE_ID=xxx
```

### 4.2 Vercel 构建配置

在 `package.json` 中修改 build 命令，确保每次部署都拉取最新数据：

JSON

```
"scripts": {
  "sync": "ts-node scripts/sync-feishu.ts",
  "dev": "npm run sync && next dev",
  "build": "npm run sync && next build",  // 关键：构建前先同步数据
  "start": "next start"
}
```

------

## 5. 第一周行动清单 (Action Items)

1. **Day 1 (上午)**: 完成 `create-next-app`，配置好 Tailwind 和 Shadcn，推送到 GitHub `main` 分支。
2. **Day 1 (下午)**: 编写 `types.ts` 和 `src/data/mock-content.json`，通知 Dev B/C 拉取代码。
3. **Day 2**: 攻克 `sync-feishu.ts` 脚本，跑通“从飞书读取一行文字并在控制台打印”的流程。
4. **Day 3**: 实现 `EnvelopeIntro` 组件的基础布局（暂用色块代替设计素材）。

## 6. 交付物验收标准

- [ ] 项目无 ESLint 报错，Build 通过。
- [ ] 执行 `npm run sync` 能成功生成合法的 `content.json`。
- [ ] 手机和电脑访问 `localhost:3000` 能分别看到不同的占位文字（"Mobile View" / "Desktop View"）。
- [ ] 开场动画流畅，点击后能正确切换到主界面。