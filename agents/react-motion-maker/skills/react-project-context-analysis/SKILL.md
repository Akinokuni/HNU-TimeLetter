---
name: react-project-context-analysis
description: 分析 React 项目的框架、依赖、SSR 边界、样式体系和已有动画能力，形成后续动画库选型与实现的技术上下文。
license: MIT
allowed-tools: react-project-context-scanner react-project-context-scanner-verifier
metadata:
  author: Aki workspace
  version: "1.0.0"
  category: design
  estimated_tokens: "2200"
---

# React Project Context Analysis

## 目标

在改动代码前，先建立 React 项目的技术画像，避免脱离上下文进行错误选型或引入不必要依赖。

## 何时使用

- 需求已经收敛，准备选型
- 不确定项目是否是 Next.js、Vite、CSR 或 SSR
- 需要确认项目里是否已经有 Framer Motion、GSAP、Lottie 或类似能力

## 指令

1. 扫描项目技术栈：
   - React 版本
   - Next.js / Vite / CRA / 其他
   - TypeScript 与样式体系
   - 路由方案与页面组织方式
2. 扫描已有依赖和可复用能力：
   - 是否已有 `motion` / `framer-motion`
   - 是否已有 `gsap`
   - 是否已有 `@lottiefiles`、`lottie-react`
   - 是否已有 Remotion 工程结构
3. 分析运行时约束：
   - 是否有 SSR 或 App Router
   - 是否需要 `use client`
   - 是否存在 hydration 风险点
4. 分析性能与实现边界：
   - 首屏区域是否敏感
   - 是否在低性能列表或长页面中实施
   - 是否适合滚动联动或资源型动画
5. 运行 `react-project-context-scanner` 并用对应 verifier 检查输出完整性。
6. 输出结构化上下文摘要，明确后续选型的推荐方向和禁区。

## 输出格式

```json
{
  "framework": "nextjs",
  "react_version": "19.x",
  "typescript": true,
  "styling": ["tailwind"],
  "existing_motion_libs": ["gsap"],
  "ssr": true,
  "sensitive_surfaces": ["hero", "home-above-the-fold"],
  "implementation_notes": [
    "avoid client-heavy animation on first paint"
  ]
}
```

## 常见问题

### Q: 已经装了动画库，还要重新选型吗？
A: 要。已有依赖会影响优先级，但不代表任何场景都必须继续使用同一个库。

### Q: 什么时候要特别警惕 SSR？
A: 在 Next.js、RSC、App Router 或任何需要首屏服务端渲染的项目里，都要优先检查客户端动效边界。

## 相关技能

- `motion-requirement-alignment`
- `animation-library-selection`
- `react-motion-implementation`

## 版本历史

- **v1.0.0** - 初始版本
