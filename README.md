# 与她的海大时光笺 (HNU-TimeLetter)

> 基于海南大学校园地图的交互式视觉叙事网站

## 项目简介

一个将 Galgame 风格的二次元角色与海南大学校园实景结合的交互式网站，通过"图+文"的形式展示校园内的决定性瞬间与背后的故事。

## 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI 组件**: Shadcn/UI
- **动画**: Framer Motion
- **状态管理**: Zustand
- **CMS**: 飞书多维表格

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写飞书凭证：

```bash
cp .env.example .env.local  # Linux/Mac
copy .env.example .env.local  # Windows
```

**获取飞书凭证的步骤：**

1. **获取 APP_ID 和 APP_SECRET**：
   - 登录 [飞书开发者控制台](https://open.feishu.cn/app)
   - 在"凭证与基础信息"中获取

2. **获取 APP_TOKEN**（如果表格在 Wiki 中）：
   ```bash
   npx tsx src/scripts/get-wiki-app-token.ts
   ```

3. **获取 TABLE_ID 和 VIEW_ID**：
   - 从表格 URL 中提取：`?table=tblXXX&view=vewXXX`

4. **添加应用权限**（重要）：
   - 打开飞书多维表格
   - 点击右上角 "..." → "高级权限" → "添加应用"
   - 为应用授予读取权限

详细配置步骤请参考：[飞书集成实施指南](./docs/飞书集成实施指南（HNU-TimeLetter）.md)

### 3. 同步数据

从飞书拉取最新数据：

```bash
npm run sync
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/              # Next.js 路由
│   ├── layout.tsx    # 全局布局（字体配置）
│   ├── page.tsx      # 主页（响应式分流）
│   ├── loading.tsx   # 加载状态
│   └── not-found.tsx # 404 页面
├── components/
│   ├── ui/           # Shadcn 基础组件
│   ├── shared/       # 全局共享组件
│   │   └── EnvelopeIntro.tsx  # 开场信封动画
│   ├── desktop/      # PC 端组件（Developer B）
│   │   └── DesktopExperience.tsx
│   └── mobile/       # 移动端组件（Developer C）
│       └── MobileExperience.tsx
├── lib/
│   ├── types.ts      # TypeScript 类型定义
│   ├── store.ts      # Zustand 状态管理
│   ├── hooks.ts      # 自定义 Hooks
│   └── utils.ts      # 工具函数
├── data/
│   └── content.json          # 生成的真实数据（.gitignore）
└── scripts/
    └── sync-feishu.ts        # 飞书数据同步脚本
```

## 开发分工

- **Developer A**: 架构与数据基建（本仓库负责人）
- **Developer B**: PC 端地图交互与明信片组件
- **Developer C**: 移动端瀑布流与详情页

## 数据结构

### LocationPoint（地点）

```typescript
interface LocationPoint {
  id: string;
  name: string;
  x: number;        // SVG 坐标百分比 (0-100)
  y: number;
  stories: Story[];
}
```

### Story（故事）

```typescript
interface Story {
  id: string;
  characterId: string;
  characterName: string;
  avatarUrl: string;
  mainImageUrl: string;
  content: string;
  author: string;
  date: string;
  locationId: string;
}
```

## 部署

项目配置为自动部署到 Vercel：

```bash
npm run build
```

构建时会自动执行 `npm run sync` 拉取最新数据。

## 文档

- [企划案](./docs/与她的海大时光笺%20企划案_v1.0.md)
- [开发者A文档](./docs/开发者A文档.md)
- [开发者B文档](./docs/开发者B文档.md)
- [开发者C文档](./docs/开发者C文档.md)

## License

MIT
