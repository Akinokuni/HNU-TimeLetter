# 与她的海大时光笺 (HNU-TimeLetter)

> 基于海南大学校园地图的交互式视觉叙事网站

## 项目简介

一个将 Galgame 风格的二次元角色与海南大学校园实景结合的交互式网站，通过「图 + 文 + 开信仪式」的形式呈现校园内的决定性瞬间与背后的故事，并延伸出 `/creation` 创作公示板与 `/admin` 后台管理。

## 技术栈

- **框架**: Next.js 16.1.6（App Router，Turbopack）
- **语言**: TypeScript 5+（Strict Mode）
- **样式**: Tailwind CSS v4 + Radix UI / Shadcn 风格组件
- **动画**: Framer Motion v12
- **平滑滚动**: Lenis（桌面端启封态）
- **状态管理**: Zustand v5
- **CMS**: 飞书多维表格（Feishu Bitable）
- **对象存储**: 阿里云 OSS
- **定时任务**: node-schedule（`/admin` 自动同步）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

Node.js 版本要求 ≥ 20。

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写凭证：

```bash
cp .env.example .env.local  # Linux/Mac
copy .env.example .env.local  # Windows
```

关键变量（详见 [docs/guides/飞书CMS配置.md](./docs/guides/飞书CMS配置.md)）：

- **飞书基础**：`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_APP_TOKEN` / `FEISHU_TABLE_ID` / `FEISHU_VIEW_ID`
- **创作公示板（可选）**：`FEISHU_CREATION_TABLE_ID` / `FEISHU_CREATION_VIEW_ID`
- **阿里云 OSS**：`ALIYUN_OSS_REGION` / `ALIYUN_OSS_BUCKET` / `ALIYUN_OSS_ACCESS_KEY_ID` / `ALIYUN_OSS_ACCESS_KEY_SECRET`
- **后台鉴权**：`ADMIN_PASSWORD`（`/admin` 登录用，未配置时回退 `admin`，上线前务必覆盖）

### 3. 同步数据

从飞书拉取最新数据：

```bash
npm run sync
```

完成后会在 `src/data/` 下生成 `content.json`（首页故事）与 `creation-board.json`（创作公示板）。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。后台管理入口为 [http://localhost:3000/admin](http://localhost:3000/admin)。

## 项目结构

```
src/
├── app/
│   ├── admin/              # /admin 后台（登录 + 受保护分组）
│   ├── api/admin/          # 后台 API（登录、手动同步）
│   ├── creation/           # /creation 创作公示板
│   ├── layout.tsx          # 全局布局 + 本地字体注册
│   ├── page.tsx            # 首页（启封主屏 + 下滚页面群 + 主体验）
│   ├── loading.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                 # Shadcn 风格基础组件
│   ├── shared/             # EnvelopeIntro / GuideLine / CustomScrollbar 等
│   ├── sections/           # AboutProject / AboutUs / Credits / Footer / ScrollSections
│   ├── desktop/            # PC 端组件（Dev B）
│   ├── mobile/             # 移动端组件（Dev C）
│   └── creation/           # 创作公示板便签瀑布流
├── lib/
│   ├── admin/              # 后台鉴权 / 调度器 / 配置读写
│   ├── sync-service.ts     # 飞书 + OSS 同步主服务（CLI 与 API 复用）
│   ├── types.ts            # 核心领域类型（SSOT）
│   ├── store.ts            # Zustand 全局状态
│   ├── hooks.ts
│   ├── useVirtualScroll.ts # Lenis 封装
│   └── content.ts / utils.ts
├── config/                 # admin.json、locations.json 等本地配置
├── data/                   # 同步产物：content.json / creation-board.json
└── scripts/                # sync-feishu.ts + 飞书 / OSS 调试脚本
```

根目录另有 `public/` 静态资源（含 `Alibaba-PuHuiTi-Medium.otf` / `ZouLDFXKAJ.ttf` 本地字体）、`tests/e2e/` Playwright 用例、以及 `agents/` / `.opencode/agents/` 等协作资产目录（不纳入 `src/` 编译边界）。

## 开发分工

- **Developer A**：架构、数据管道与后台管理（[docs/roles/基础设施-DevA.md](./docs/roles/基础设施-DevA.md)）
- **Developer B**：PC 端地图 / 卷轴 / 故事看板（[docs/roles/PC端开发-DevB.md](./docs/roles/PC端开发-DevB.md)）
- **Developer C**：移动端瀑布流与详情页转场（[docs/roles/移动端开发-DevC.md](./docs/roles/移动端开发-DevC.md)）

## 数据模型速览

核心领域类型以 [src/lib/types.ts](./src/lib/types.ts) 为准，包括：

- `Story`：首页展陈故事记录。
- `LocationPoint`：地图 Pin 聚合结构。
- `CreationIdea` / `CreationEntry` / `CreationCard`：创作公示板的原始记录、页面堆叠条目与卡片聚合。

完整字段、来源映射与聚合规则见 [docs/architecture/数据模型.md](./docs/architecture/数据模型.md)。

## 部署

项目默认部署到 Vercel。构建时会自动执行 `npm run sync` 拉取最新数据：

```bash
npm run build
```

生产环境务必通过 Vercel Environment Variables 下发 `ADMIN_PASSWORD`、飞书与 OSS 凭证。

## 文档索引

文档入口：[docs/文档索引.md](./docs/文档索引.md)。常用子文档：

- 架构：[技术栈](./docs/architecture/技术栈.md) · [数据模型](./docs/architecture/数据模型.md)
- 指南：[环境搭建](./docs/guides/环境搭建.md) · [飞书 CMS 配置](./docs/guides/飞书CMS配置.md)
- 设计：[交互设计](./docs/design/交互设计.md) · [创作公示板](./docs/design/创作公示板.md) · [视觉规范](./docs/design/视觉规范.md) · [后台管理系统](./docs/design/后台管理系统.md)
- 进度与评审：[项目进度](./docs/项目进度.md) · [评审报告目录](./docs/review/)

## License

MIT
