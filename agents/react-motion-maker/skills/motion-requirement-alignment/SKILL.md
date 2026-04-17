---
name: motion-requirement-alignment
description: 将模糊的 React 动效诉求拆解为明确的动画目标、触发条件、范围边界和验收标准，为后续项目分析与选型提供清晰输入。
license: MIT
metadata:
  author: Aki workspace
  version: "1.0.0"
  category: planning
  estimated_tokens: "1800"
---

# Motion Requirement Alignment

## 目标

把用户对 React 动效的模糊表达整理成可执行的需求结构，明确动效要服务的界面层级、触发方式、性能约束和不可触碰的边界。

## 何时使用

- 用户只说“想要更有动感”“做得更高级一点”
- 用户想做动画，但没有明确说是页面过渡、滚动联动还是微交互
- 准备进入库选型或代码实现前，需要先锁定目标

## 指令

1. 先识别动效的主要目标：
   - 是增强层级感、引导视线、提供反馈，还是做品牌展示
   - 是页面级、区块级、组件级还是元素级动画
2. 明确触发方式：
   - 首屏入场
   - 滚动触发
   - 悬停、点击、拖拽
   - 状态变化、路由切换、列表增删
3. 明确范围边界：
   - 只改单个组件，还是允许改一个页面
   - 是否允许新增依赖
   - 是否必须兼容 SSR
   - 是否要求移动端优先
4. 主动整理非功能约束：
   - 首屏性能预算
   - reduced motion 要求
   - 是否避免大体积素材动画
5. 如果用户表达模糊，优先收敛为最小可行动效目标，而不是扩大范围。
6. 产出结构化需求摘要，供 `react-project-context-analysis` 和 `animation-library-selection` 直接使用。

## 输出格式

```markdown
## Motion Goal
- 目标：
- 层级：
- 触发方式：

## Scope
- 影响范围：
- 是否允许新增依赖：
- 是否需要 SSR 兼容：

## Constraints
- 性能约束：
- 可访问性约束：
- 禁止项：

## Success Criteria
1. ...
2. ...
```

## 常见问题

### Q: 用户只说“做酷一点”怎么办？
A: 优先把“酷”翻译成具体效果，例如更明确的入场节奏、更好的按钮反馈或更顺滑的页面切换，不直接放大为全页复杂动画。

### Q: 什么时候要提前标记高风险？
A: 当需求涉及首屏复杂滚动联动、全页大面积动画、资源型动画或 SSR 场景下的强客户端依赖时。

## 相关技能

- `react-project-context-analysis`
- `animation-library-selection`

## 版本历史

- **v1.0.0** - 初始版本
