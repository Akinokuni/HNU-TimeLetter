# React 动效制作师 - 架构设计文档

## 当前阶段

- **阶段 1：需求对齐** 已完成
- **阶段 2：架构设计** 已完成
- **阶段 3：文件生成** 已完成
- **阶段 4：闭环验证** 已完成

---

## 1. 需求文档

### 1.1 Agent 概述

- 名称：`react-motion-maker`
- 展示名：`React 动效制作师`
- 描述：面向 React 项目，理解动效需求、分析项目约束、选择合适动画技术栈，并直接输出与修改 React 动效代码
- 目标用户：React / Next.js / Vite 前端开发者、小型团队、产品与设计协作型项目

### 1.2 已确认核心能力

1. 将模糊动效诉求转成明确的动画目标和交互范围
2. 分析 React 项目的上下文，包括框架、SSR、样式体系、依赖和性能约束
3. 对 CSS、WAAPI、Framer Motion、GSAP、Lottie、Remotion 等方案做比较和选择
4. 直接实现并修改 React 动效代码，而不只停留在建议层
5. 在交付后做性能、可访问性和维护性检查

### 1.3 输入与输出

**输入**

- 自然语言动效需求
- 项目代码仓库上下文
- 可选约束：是否允许加依赖、是否允许滚动联动、是否要求 SSR 兼容、是否要移动端优先

**输出**

- 结构化选型结论
- 代码修改摘要
- 如新增依赖则给出包名和用途
- 修改后的验证结果与风险说明

### 1.4 技能需求

- `motion-requirement-alignment`：拆解动效目标、范围和优先级
- `react-project-context-analysis`：识别 React 工程约束与已有技术栈
- `animation-library-selection`：完成动画库选型与替代方案比较
- `react-motion-implementation`：直接修改组件、页面和样式代码
- `motion-quality-validation`：检查性能、SSR 和可访问性

### 1.5 工具需求

- `react-project-context-scanner`
- `react-project-context-scanner-verifier`
- `motion-library-fit-checker`
- `motion-library-fit-checker-verifier`
- `react-motion-diff-checker`
- `react-motion-diff-checker-verifier`

### 1.6 技术栈

- 模型：优先 `gpt-5.4`
- 框架：通用 Agent 目录规范
- 委派模式：`explicit`
- 依赖：本地代码分析、网络检索能力、外部 animation skills

### 1.7 约束条件

- 必须先看项目上下文再做选型
- 必须优先考虑轻量方案
- 必须兼顾 SSR、移动端性能和 reduced motion
- 必须为每个工具设计对应 verifier

### 1.8 非功能需求

- 响应要快，先给可执行方向，再补齐细节
- 结果要稳，避免无依据引入复杂依赖
- 输出要可维护，便于后续继续调参和扩展

---

## 2. 能做与不能做

### 2.1 能做的事

1. 分析 React 项目的动画需求与技术约束
2. 在多个动画方案之间做合理取舍
3. 修改 React 组件、页面、样式和动效相关依赖
4. 为滚动联动、页面过渡、微交互、列表编排和资源动画提供实现
5. 为结果补充性能与可访问性验证

### 2.2 不能做的事

1. 不在没有代码上下文的情况下批量盲改整个前端
2. 不默认接受“越炫越好”而忽略性能和可维护性
3. 不在第一版中覆盖原生 App 动画、3D 引擎或游戏动效
4. 不把社区 skill 结果当作无需验证的权威结论

---

## 3. 外围技能接入策略

### 3.1 已 vendoring 的外围 skills

- `agents/react-motion-maker/skills/gsap-core/`
- `agents/react-motion-maker/skills/gsap-scrolltrigger/`
- `agents/react-motion-maker/skills/gsap-performance/`
- `agents/react-motion-maker/skills/framer-motion-animator/`
- `agents/react-motion-maker/skills/lottie/`
- `agents/react-motion-maker/skills/remotion-best-practices/`

### 3.2 已复制的共享 skill 副本

- `agents/react-motion-maker/skills/remotion/`

### 3.3 接入原则

1. `Framer Motion` 适用于组件级微交互、共享布局、页面切换
2. `GSAP` 适用于时间线、多元素联动、复杂滚动动画
3. `Lottie` 适用于资源型动画和设计导出动画
4. `Remotion` 适用于 React 驱动的视频动效和分镜场景
5. 如果简单 CSS 或 WAAPI 足够，则不强制启用外部 skill

### 3.4 信号强弱说明

1. `GSAP` 和 `Remotion` 来源信号更强，优先作为高可信方案
2. `Framer Motion` 与 `Lottie` 当前采用社区 skill，但仍需结合项目上下文验证
3. `React Spring` 和 `Rive` 结果已检索到，但未纳入默认 vendored 核心集

---

## 4. 目录结构

```text
agents/
└── react-motion-maker/
    ├── AGENTS.md
    ├── agent.yaml
    ├── SOUL.md
    ├── RULES.md
    ├── README.md
    ├── architecture.md
    ├── examples/
    │   └── nebula-launch-demo/
    ├── skills/
    │   ├── motion-requirement-alignment/
    │   │   └── SKILL.md
    │   ├── react-project-context-analysis/
    │   │   └── SKILL.md
    │   ├── animation-library-selection/
    │   │   └── SKILL.md
    │   ├── react-motion-implementation/
    │   │   └── SKILL.md
    │   └── motion-quality-validation/
    │       └── SKILL.md
    │   ├── framer-motion-animator/
    │   │   └── SKILL.md
    │   ├── gsap-core/
    │   │   └── SKILL.md
    │   ├── gsap-scrolltrigger/
    │   │   └── SKILL.md
    │   ├── gsap-performance/
    │   │   └── SKILL.md
    │   ├── lottie/
    │   │   └── SKILL.md
    │   ├── remotion/
    │   │   ├── SKILL.md
    │   │   └── references/
    │   └── remotion-best-practices/
    │       ├── SKILL.md
    │       └── rules/
    ├── tools/
    │   ├── react-project-context-scanner.yaml
    │   ├── react-project-context-scanner.py
    │   ├── react-project-context-scanner-verifier.yaml
    │   ├── react-project-context-scanner-verifier.py
    │   ├── motion-library-fit-checker.yaml
    │   ├── motion-library-fit-checker.py
    │   ├── motion-library-fit-checker-verifier.yaml
    │   ├── motion-library-fit-checker-verifier.py
    │   ├── react-motion-diff-checker.yaml
    │   ├── react-motion-diff-checker.py
    │   ├── react-motion-diff-checker-verifier.yaml
    │   └── react-motion-diff-checker-verifier.py
    ├── workflows/
    │   └── react-motion-delivery.yaml
    └── knowledge/
        ├── index.yaml
        └── docs/
            └── library-selection-matrix.md
```

---

## 5. 核心文件设计

### 5.1 `agent.yaml`

- 定义 Agent 名称、模型、技能、工具和运行时约束
- 保持最小可行配置，不提前塞入未生成文件之外的复杂字段

### 5.2 `SOUL.md`

- 定义执行型动效 Agent 的身份、价值观与协作方式
- 强调先看上下文、先轻后重、以产品体验为导向

### 5.3 `RULES.md`

- 固化选型边界、性能约束、SSR 风险和 reduced motion 要求
- 约束不合理的重型实现和炫技式动效

### 5.4 `AGENTS.md`

- 保持精简，只保留核心契约和阶段工作流
- 将详细逻辑下沉到 `skills/`、`tools/` 和 `knowledge/`

### 5.5 `README.md`

- 面向人类读者说明能力、工作流、适用输入与外部技能接入情况

---

## 6. 技能规划

| 技能名称 | 描述 | 优先级 |
|---------|------|--------|
| `motion-requirement-alignment` | 将模糊需求转成具体动效目标、触发点和约束 | 高 |
| `react-project-context-analysis` | 识别 React 框架、SSR、依赖与性能上下文 | 高 |
| `animation-library-selection` | 在候选动画库之间完成比较与选择 | 高 |
| `react-motion-implementation` | 将选型映射为具体代码实现和改动 | 高 |
| `motion-quality-validation` | 验证性能、SSR、可访问性和可维护性 | 高 |

### 技能调用顺序

```text
motion-requirement-alignment
  -> react-project-context-analysis
  -> animation-library-selection
  -> react-motion-implementation
  -> motion-quality-validation
```

---

## 7. 工具与 Verifier 规划

| 工具名称 | 类型 | 描述 |
|---------|------|------|
| `react-project-context-scanner` | 功能工具 | 扫描项目框架、依赖和约束 |
| `react-project-context-scanner-verifier` | Verifier | 验证扫描结果是否完整且可用于选型 |
| `motion-library-fit-checker` | 功能工具 | 对候选动画库进行场景匹配分析 |
| `motion-library-fit-checker-verifier` | Verifier | 验证选型结论是否覆盖关键维度 |
| `react-motion-diff-checker` | 功能工具 | 检查动效代码修改的实现特征 |
| `react-motion-diff-checker-verifier` | Verifier | 验证修改后是否满足性能与可访问性要求 |

### 工具设计原则

1. 每个功能工具必须配套一个 verifier
2. verifier 不负责重新实现功能，只负责验证结论或结果
3. 工具输入输出尽量结构化，便于后续工作流编排

---

## 8. 工作流设计

```yaml
name: react-motion-delivery
description: Analyze project constraints, choose animation approach, implement motion, and validate results.
version: 1.0.0

triggers:
  - user_requests_react_motion_work

steps:
  align_requirement:
    skill: motion-requirement-alignment
    outputs: [motion_goal, scope, constraints]

  inspect_project:
    skill: react-project-context-analysis
    depends_on: [align_requirement]
    outputs: [project_context, dependency_summary, runtime_constraints]

  choose_library:
    skill: animation-library-selection
    depends_on: [inspect_project]
    outputs: [selected_approach, rejected_options, package_changes]

  implement_motion:
    skill: react-motion-implementation
    depends_on: [choose_library]
    outputs: [changed_files, implementation_summary]

  validate_motion:
    skill: motion-quality-validation
    depends_on: [implement_motion]
    outputs: [validation_result, remaining_risks]

error_handling:
  on_failure: halt
```

---

## 9. 风险控制与选型边界

### 9.1 高风险实现

以下情况默认进入显式风险提示模式：

1. 在 SSR 项目中引入强客户端依赖且没有边界控制
2. 在首屏关键区域加入复杂滚动联动或大体积动画资源
3. 动画实现依赖大量 layout thrash 属性
4. 未提供 reduced motion 策略却默认在高频交互上使用强动效

### 9.2 低风险实现

以下情况通常可直接推进：

1. 单组件入场动画
2. 列表 stagger 动画
3. 简单悬停和按压反馈
4. 已存在库内的小范围复用性增强

### 9.3 修改前强制检查

1. 是否已识别项目框架和运行环境
2. 是否已确认选型理由和替代项
3. 是否明确新依赖接入影响
4. 是否存在 reduced motion 方案
5. 是否具备修改后验证路径

---

## 10. 文件生成批次计划

### 第一批：核心文件

- `C:/aki/AI/Agents/agents/react-motion-maker/agent.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/SOUL.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/README.md`

### 第二批：规则与说明

- `C:/aki/AI/Agents/agents/react-motion-maker/RULES.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/AGENTS.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/architecture.md`

### 第三批：技能文件

- `C:/aki/AI/Agents/agents/react-motion-maker/skills/motion-requirement-alignment/SKILL.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/skills/react-project-context-analysis/SKILL.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/skills/animation-library-selection/SKILL.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/skills/react-motion-implementation/SKILL.md`
- `C:/aki/AI/Agents/agents/react-motion-maker/skills/motion-quality-validation/SKILL.md`

### 第四批：工具与验证器

- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-project-context-scanner.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-project-context-scanner.py`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-project-context-scanner-verifier.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-project-context-scanner-verifier.py`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/motion-library-fit-checker.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/motion-library-fit-checker.py`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/motion-library-fit-checker-verifier.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/motion-library-fit-checker-verifier.py`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-motion-diff-checker.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-motion-diff-checker.py`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-motion-diff-checker-verifier.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/tools/react-motion-diff-checker-verifier.py`

### 第五批：工作流与知识库

- `C:/aki/AI/Agents/agents/react-motion-maker/workflows/react-motion-delivery.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/knowledge/index.yaml`
- `C:/aki/AI/Agents/agents/react-motion-maker/knowledge/docs/library-selection-matrix.md`

### 第六批：Demo 与测试产物

- `C:/aki/AI/Agents/agents/react-motion-maker/examples/nebula-launch-demo/package.json`
- `C:/aki/AI/Agents/agents/react-motion-maker/examples/nebula-launch-demo/src/App.jsx`
- `C:/aki/AI/Agents/agents/react-motion-maker/examples/nebula-launch-demo/src/styles.css`
- `C:/aki/AI/Agents/agents/react-motion-maker/examples/nebula-launch-demo/agent-test/*.json`

---

## 11. 审查检查点

- [ ] `react-motion-maker` 路径命名符合规范
- [ ] 选型逻辑体现“先轻后重”
- [ ] 技能拆分覆盖需求、上下文、选型、实现、验证
- [ ] 每个工具都设计了对应 verifier
- [ ] 已 vendoring 的外围 skills 被正确纳入架构说明
- [ ] Demo 能成功安装依赖并完成构建
- [ ] Agent 工具链能对 Demo 产出有效测试结果

---

## 12. 待确认假设

1. 第一版默认服务 Web React 项目，不覆盖 React Native
2. 第一版默认可引入依赖，但会显式说明依赖影响
3. 第一版把 `GSAP`、`Framer Motion`、`Lottie`、`Remotion` 作为主要候选
4. `React Spring` 和 `Rive` 先保留为可扩展选项，不作为默认核心路径
