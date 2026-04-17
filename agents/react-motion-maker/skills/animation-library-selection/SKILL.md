---
name: animation-library-selection
description: 根据动效目标和 React 项目上下文，在 CSS、WAAPI、Framer Motion、GSAP、Lottie、Remotion 等方案之间做合理取舍，并输出可执行选型结论。
license: MIT
allowed-tools: motion-library-fit-checker motion-library-fit-checker-verifier
metadata:
  author: Aki workspace
  version: "1.0.0"
  category: design
  estimated_tokens: "2600"
---

# Animation Library Selection

## 目标

根据真实场景做选型，而不是固定偏好某个动画库。选型必须兼顾范围、性能、SSR、维护成本和团队现状。

## 何时使用

- 项目上下文已经明确
- 需要在多个动画方案中做取舍
- 用户要求“帮我找合适的动效库并直接做出来”

## 指令

1. 永远先判断轻量方案是否足够：
   - 纯 CSS transition / keyframes
   - WAAPI
   - 已有项目内的轻量工具
2. 在需要库时，按场景判断：
   - `framer-motion-animator`：组件级微交互、页面切换、共享布局
   - `gsap-core`：时间线、多元素同步编排
   - `gsap-scrolltrigger`：滚动触发、pin、scrub、复杂滚动联动
   - `gsap-performance`：GSAP 方案的性能约束和优化
   - `lottie`：资源型动画、设计导出动画、状态动画素材
   - `remotion` / `remotion-best-practices`：React 视频动效、分镜、帧驱动内容
3. 检查以下维度：
   - 场景匹配度
   - 首屏与移动端性能
   - SSR / hydration 风险
   - 新依赖成本
   - 学习和维护成本
4. 用 `motion-library-fit-checker` 形成候选比较，再用 verifier 检查是否覆盖关键维度。
5. 输出时必须同时说明：
   - 为什么选
   - 为什么不选其他主要候选
   - 是否需要额外依赖
   - 如果项目后续扩展，是否仍成立

## 输出格式

```markdown
## Selected Approach
- 方案：
- 原因：
- 是否新增依赖：

## Rejected Options
- CSS/WAAPI:
- Framer Motion:
- GSAP:
- Lottie:
- Remotion:

## Implementation Notes
1. ...
2. ...
```

## 常见问题

### Q: 什么时候默认不上库？
A: 当目标只是简单入场、悬停、按压反馈或少量列表渐入，并且没有复杂编排需求时。

### Q: GSAP 和 Framer Motion 怎么选？
A: 组件级状态动画和共享布局更偏向 Framer Motion；复杂时间线、滚动联动和强控制需求更偏向 GSAP。

## 相关技能

- `react-project-context-analysis`
- `react-motion-implementation`
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
