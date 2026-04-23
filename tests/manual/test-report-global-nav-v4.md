# GlobalNav v4 — 信封 → `/map` 路由迁移：测试报告

- 分支：`devin/1776882591-global-nav`（随 PR #27 已合入 main）
- 录屏：`rec-015c012d-8270-4705-855a-48d9c1186b8e-edited.mp4`
- 会话：https://app.devin.ai/sessions/e751d438804f494f9258e6a6690b9e11

## 一句话结论
点击信封开封动画末尾已替换为 `router.push('/map')`，URL、胶囊激活状态、地图 DOM 三处同时切换；浏览器后退回 `/` 时入场动画完整重演、滚动锁重新成立——Devin Review #3126387521 指出的状态污染也一并修复。

## 结果
- T1. 点击火漆 → 跳转 `/map` + 胶囊激活「地图」 — **passed**
- T2. 浏览器后退回 `/`，`isIntroReady` 被重置、滚动锁重新闭合 — **passed**

## 证据

### T1：`/ → /map`（胶囊联动）

Console 断言（点击火漆后 ~3s）：
```json
{"pathname":"/map","introLocked":false,"active":"地图","hasMap":true}
```

| 🟢 点击前 `/` | 🟢 点击后 `/map` |
|---|---|
| ![/ before click](https://app.devin.ai/attachments/bd5ed71d-643d-4069-834b-c612e5c1db3b/screenshot_27dad7606aac4fb79e8f7f3c892c98aa.png) | ![/map after click](https://app.devin.ai/attachments/10deeaa2-80fa-42eb-9e8c-7b5e5fcd246f/screenshot_bb646cf317be40d5ab139398fa965b46.png) |
| URL=`/`，胶囊「主页」active，火漆按钮存在 | URL=`/map`，胶囊「地图」active（红色椭圆落在中间），`img[src="/images/map.svg"]` 已挂载 |

### T2：后退 `/`，入场重放 + 锁滚动

MutationObserver 监听 `<html>` 的 `class` 变更（t0 = 调 `history.back()` 的瞬间）：
```json
{
  "pathname": "/",
  "log": [
    {"dt": 102,  "locked": true},
    {"dt": 1574, "locked": false}
  ],
  "sawLock": true
}
```

- dt=102ms：`intro-scroll-locked` 被加回（`EnvelopeIntro` 挂载 → `setIntroReady(false)` → `page.tsx` 的 lock effect 触发加类）。
- dt=1574ms：入场动画结束，`setIntroReady(true)`，锁释放。

如果状态污染未修（bot #3126387521 指出的老行为），`sawLock` 会是 `false`，意味着 Lenis/滚动条在入场动画期间已启用。此处 `sawLock=true` 即为修复成立的决定性证据。

| 🟢 后退回 `/` 后 |
|---|
| ![back to / after /map](https://app.devin.ai/attachments/a96357ac-87d5-4294-861c-9fac189255af/screenshot_0d004731a2ab4b449b57e40abf9ae7f9.png) |
| 信封 + 丝带重新挂载，标题重新竖排揭示，胶囊「主页」active |

## 不在本轮回归范围（v3 已证）
- 首页红色色块几何（7vw × 28vh、`border-bottom-left-radius=3.5vw ≈ 0.5×width`）
- 胶囊在 `/`、`/map`、`/creation` 三路由下 `boundingRect` 一致
- `AnimatePresence initial={false}` 首帧无淡入

## 环境
- 本轮在 `localhost:3000` 本地 dev server 验证（Vercel preview 需登录，不做 UI 断言）。
- Dev server 指向分支最新提交（已并入 main）。
