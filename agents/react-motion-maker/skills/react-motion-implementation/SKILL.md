---
name: react-motion-implementation
description: 将已选定的动画方案映射为 React 组件、页面、样式和依赖改动，直接完成动效代码实现，并保持代码可维护。
license: MIT
allowed-tools: react-motion-diff-checker react-motion-diff-checker-verifier
metadata:
  author: Aki workspace
  version: "1.0.0"
  category: implementation
  estimated_tokens: "2600"
---

# React Motion Implementation

## 目标

把选型结论落实到 React 代码中，完成依赖接入、组件改造和动效实现，同时控制变更范围和维护复杂度。

## 何时使用

- 已明确技术方案
- 需要真正改动 React 组件、页面或样式
- 用户希望直接交付代码，而不是只要建议

## 指令

1. 先确定改动边界：
   - 哪些页面或组件要改
   - 是否新增依赖
   - 是否需要客户端边界
2. 按选型使用对应 vendored skill：
   - Framer Motion：参考 `framer-motion-animator`
   - GSAP：参考 `gsap-core`、`gsap-scrolltrigger`、`gsap-performance`
   - Lottie：参考 `lottie`
   - Remotion：参考 `remotion`、`remotion-best-practices`
3. 保持实现可维护：
   - 抽取可复用的 transition 或 variants
   - 不把大量魔法数字散落在多个组件里
   - 不在不必要时引入命令式复杂逻辑
4. 保持性能友好：
   - 优先 `transform` / `opacity`
   - 对滚动联动、鼠标跟随、长列表动画特别谨慎
5. 保持框架兼容：
   - Next.js 中处理好 `use client`
   - 处理动画 cleanup
   - 避免 hydration 不一致
6. 修改后运行 `react-motion-diff-checker`，确认改动符合选型预期。

## 输出格式

```markdown
## Changed Files
- path/to/file.tsx
- path/to/file.css

## Implementation Summary
1. ...
2. ...

## Dependency Changes
- package-name: reason
```

## 常见问题

### Q: 什么时候应该抽公共动效配置？
A: 当多个组件共享同一套节奏、variants、spring 参数或滚动策略时。

### Q: 什么时候不能直接套外部 skill 示例？
A: 当示例与项目的 SSR、样式体系、组件结构或性能约束不兼容时，必须先适配再落地。

## 相关技能

- `animation-library-selection`
- `motion-quality-validation`
- `framer-motion-animator`
- `gsap-core`
- `gsap-scrolltrigger`
- `gsap-performance`
- `lottie`
- `remotion`
- `remotion-best-practices`

## 版本历史

- **v1.0.0** - 初始版本
