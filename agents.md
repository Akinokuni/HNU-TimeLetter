使用中文与用户对话
所有操作均以文档为核心依据，推进文档引领的开发流程
行动之前检查先检查有没有能使用的skill，有的话就先使用skill
**git提交一定要使用中文描述！**

## Skills
以下为当前项目内可用 skills（来源：`.trae/skills`）：

### Available skills
- `canvas-design`: 创建高质量视觉设计作品（海报/艺术图/静态设计）
  - 路径：`.trae/skills/canvas-design/SKILL.md`
- `doc-coauthoring`: 结构化文档共创流程（需求文档/提案/技术方案）
  - 路径：`.trae/skills/doc-coauthoring/SKILL.md`
- `frontend-design`: 构建高设计质量前端界面与页面
  - 路径：`.trae/skills/frontend-design/SKILL.md`
- `git-commit-specification`: Git 提交规范（commit/分支/PR）
  - 路径：`.trae/skills/git-commit-specification/SKILL.md`
- `web-artifacts-builder`: 复杂 Web Artifact 构建（React/Tailwind/shadcn）
  - 路径：`.trae/skills/web-artifacts-builder/SKILL.md`
- `webapp-testing`: 基于 Playwright 的 Web 应用测试
  - 路径：`.trae/skills/webapp-testing/SKILL.md`

### How to use skills
- 触发规则：用户显式提到 skill 名称，或任务与 skill 描述明显匹配时，必须优先使用对应 skill。
- 执行顺序：如多个 skill 同时适用，选最小覆盖集合并说明使用顺序。
- 文件解析：先读取对应 `SKILL.md`，按其中流程执行；引用相对路径时先相对 skill 目录解析。
- 失败回退：若 skill 缺失或不可读，简要说明并使用最佳替代方案继续执行。
