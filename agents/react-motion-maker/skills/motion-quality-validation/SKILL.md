---
name: motion-quality-validation
description: 对 React 动效实现做闭环验证，检查性能、SSR、reduced motion、清理逻辑和代码维护性，确保结果适合真实项目交付。
license: MIT
allowed-tools: react-motion-diff-checker react-motion-diff-checker-verifier
metadata:
  author: Aki workspace
  version: "1.0.0"
  category: validation
  estimated_tokens: "2100"
---

# Motion Quality Validation

## 目标

在动效代码生成或修改完成后，验证实现是否真正满足项目要求，而不是只看“能动起来”。

## 何时使用

- React 动效代码已完成
- 刚接入新的动画依赖
- 需要判断结果是否可上线或至少可继续迭代

## 指令

1. 检查性能实现：
   - 是否优先使用 `transform` / `opacity`
   - 是否存在明显 layout thrash 属性动画
   - 滚动联动是否过重
2. 检查可访问性：
   - 是否有 `prefers-reduced-motion` 支持
   - 资源型动画是否有回退方案
   - 高频交互是否避免过强运动
3. 检查框架兼容：
   - 是否存在 SSR / hydration 风险
   - 是否需要 `use client`
   - 是否有 unmount cleanup
4. 检查维护性：
   - 动画参数是否集中
   - 是否存在重复代码
   - 依赖引入是否与收益匹配
5. 运行 `react-motion-diff-checker-verifier`，并将结果整理成可追踪的验证摘要。
6. 如验证失败，明确指出失败点，不要用模糊表述掩盖问题。

## 输出格式

```markdown
## Validation Result
- Performance:
- Accessibility:
- SSR / Runtime:
- Maintainability:

## Remaining Risks
1. ...
2. ...
```

## 常见问题

### Q: reduced motion 什么时候必须有？
A: 只要存在明显位移、缩放、滚动驱动或持续动画，就应优先提供 reduced motion 方案。

### Q: 什么时候应该建议回退到更轻方案？
A: 当引入库的收益不足以覆盖包体积、复杂度或 SSR 风险时。

## 相关技能

- `animation-library-selection`
- `react-motion-implementation`
- `gsap-performance`
- `lottie`
- `remotion-best-practices`

## 版本历史

- **v1.0.0** - 初始版本
