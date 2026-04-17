# React 动效制作师

`react-motion-maker` 是一个面向 **React 项目** 的动效执行型 Agent，用于把“页面要更有动感”“想做滚动联动”“想加更高级的过渡”这类需求，转成可落地的动画库选型、组件级实现方案和实际代码修改。

## 核心能力

1. 拆解动效需求，明确目标场景、触发条件和交互层级
2. 分析项目上下文，例如 React 版本、Next.js、SSR、TypeScript、Tailwind 和依赖约束
3. 比较并选择合适技术方案，包括 CSS、WAAPI、Framer Motion、GSAP、Lottie 和 Remotion
4. 直接输出并修改 React 动效代码，而不只停留在建议层
5. 对实现结果进行性能、可访问性和维护性检查

## 默认选型原则

- 简单入场、悬停、列表渐入：优先考虑 CSS、WAAPI 或轻量 motion 能力
- 组件级微交互、页面切换、共享布局：优先考虑 Framer Motion
- 时间线编排、复杂滚动联动、多元素同步控制：优先考虑 GSAP
- 资源型动画或设计稿导出的动画素材：优先考虑 Lottie
- React 驱动的视频动效和分镜：优先考虑 Remotion

## 已 vendored 的外围技能

以下 skills 已复制到本地 `agents/react-motion-maker/skills/`，这个 Agent 会优先使用这些本地副本：

- `agents/react-motion-maker/skills/framer-motion-animator/SKILL.md`
- `agents/react-motion-maker/skills/gsap-core/SKILL.md`
- `agents/react-motion-maker/skills/gsap-scrolltrigger/SKILL.md`
- `agents/react-motion-maker/skills/gsap-performance/SKILL.md`
- `agents/react-motion-maker/skills/lottie/SKILL.md`
- `agents/react-motion-maker/skills/remotion/SKILL.md`
- `agents/react-motion-maker/skills/remotion-best-practices/SKILL.md`

其中 `remotion` 来自工作区共享技能库的本地副本，`remotion-best-practices` 保留了完整的 `rules/` 子目录。

## 工作流

```text
需求拆解
  -> 项目上下文分析
  -> 动画库选型
  -> React 动效实现
  -> 质量验证
```

## 目录结构

```text
agents/react-motion-maker/
├── AGENTS.md
├── agent.yaml
├── architecture.md
├── examples/
├── README.md
├── RULES.md
├── SOUL.md
├── skills/
├── tools/
├── workflows/
└── knowledge/
```

## 适合的输入

- “帮我给这个 React 登录页做更高级的入场动效，但不要影响首屏性能”
- “这个 Next.js 页面需要滚动联动和数字递增效果，帮我选库并直接改代码”
- “把这组卡片改成更有节奏的微交互，保留移动端流畅度”
- “我有一个 Lottie 资源，帮我合理接进 React 组件并做降级处理”

## 不适合的输入

- “随便加点炫酷动画就行”
- “不考虑性能和维护性，怎么花哨怎么来”
- “在没有项目上下文的情况下批量改整个前端所有页面”

## 验证原则

每次交付至少检查以下几点：

1. 选型是否与场景匹配
2. 是否兼顾 SSR、包体积和移动端性能
3. 是否支持 `prefers-reduced-motion`
4. 修改后的代码是否仍然易于维护和继续扩展

## Demo

- `agents/react-motion-maker/examples/nebula-launch-demo/`

这个 Demo 用 `Framer Motion + GSAP` 做了一页可构建的演示站点，并在 `agent-test/` 下保留了扫描、选型和 diff 验证结果，用来测试该 Agent 的能力闭环。
