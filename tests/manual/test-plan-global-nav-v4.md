# GlobalNav v4 — 信封 → `/map` 路由迁移（visual regression）

## 改动回顾（人话）
- 旧：点击信封 `setEnvelopeOpened(true)`，`/` 页内切换到地图。URL 不变，导航胶囊仍停在「主页」。
- 新：点击信封末尾 `router.push('/map')`。`/` 只渲染信封/开屏，地图体验由 `/map` 路由唯一渲染。
- 顺带：`/map/page.tsx` 不再写入全局 zustand；`EnvelopeIntro` 挂载时重置 `isEnvelopeOpened/isIntroReady`；`phase='opening'` 期间独立锁滚动；过渡遮罩升至 layout（`TransitionOverlay`）。

## Preview
`https://hnu-timeletter-git-devin-17768825-c1b997-akis-projects-777634d9.vercel.app`

## 单一核心流（信封 → /map）
硬刷 preview 根路径，等入场动画结束后点火漆开封，观察：

| # | 动作 | 期望（具体可测） |
|---|---|---|
| A1 | 刷新 `/` | URL=`/`；头像胶囊（GlobalNav）中「主页」为 active（`aria-current="page"`），首屏红色色块可见（即视觉预期保留） |
| A2 | 等入场动画完成（≤3s） | `isIntroReady` 最终为 true（通过可滚动状态/可 hover 火漆来侧证；无法直接断言私有 state，用 DOM：`document.documentElement.classList.contains('intro-scroll-locked') === false`） |
| A3 | 点击 `<button>` 火漆（EnvelopeIntro.tsx:499） | `<TransitionOverlay>` 的 `.page-paper.fixed.inset-0` 遮罩出现（`document.querySelectorAll('[aria-hidden="true"].page-paper.fixed.inset-0').length >= 1`） |
| A4 | 等 ~3s | `location.pathname === '/map'`；`<img src="/images/map.svg">` 存在于 DOM；导航胶囊中「地图」变 active（对应 `<a aria-current="page" href="/map">`） |
| A5 | 浏览器后退（history.back）| `location.pathname === '/'`；信封入场动画从头播放（`phase: loading → entering → idle`）——侧证：2s 内 `document.documentElement.classList.contains('intro-scroll-locked') === true`，说明 `isIntroReady` 已被重置为 false（这是迁移后的关键修复，若 `MapPage` 仍污染状态，`/` 挂载时 `isIntroReady === true`，类不会被加） |
| A6 | 再次等 ~3s 入场完 | 跟 A2 相同：滚动锁解除 |

## 关键断言一次性看清
- **路由会变**：A4 的 `location.pathname === '/map'` — 这是修复本次 bug 的**单点判据**。如果破的，会留在 `/`，胶囊也不会切换。
- **胶囊会切**：A4 的 `aria-current="page"` 落在「地图」`<a>` 上。由 GlobalNav 的 `pathname === '/map' ? 'map' : …` 驱动，`location.pathname` 是唯一输入。
- **状态不污染**：A5 回 `/` 时 `intro-scroll-locked` 类**必须**出现（>= 1 帧），否则说明 `isIntroReady` 残留 true，就回到了 bot 指出的 bug。
- **会挂回 /**：A5 URL 回到 `/`，且 `EnvelopeIntro` 的丝带/信封 DOM 重新出现（DOM 重新挂载：`document.querySelector('button[aria-label*=打开信封], button:has(img[src="/sealing_wax.png"])')` 存在）。

## 「如果破的会长什么样」对照
| 改坏回 `setEnvelopeOpened(true)` | 观察 |
|---|---|
| 不做 `router.push` | A4 `location.pathname` 仍 `/`（fail） |
| 把 `/map/page.tsx` 的 setter 加回 | A5 `intro-scroll-locked` 类不出现（fail） |
| 胶囊 active 仍按 `isEnvelopeOpened` 判定 | A4 即使 URL 到 /map 也不会切到「地图」（fail） |

## 不在本轮范围
- 首页红色色块几何/圆角（v3 已证，未变）
- 胶囊在 `/creation` 下位置一致性（v3 已证，未变）
- `prefers-reduced-motion` 下的分支（EnvelopeIntro 既有逻辑，未动）

## Evidence
- 录屏一段，时间轴标注 A1–A6。
- `computer.console` 在 A2/A4/A5 各 dump 一次：`{ pathname, introLocked: document.documentElement.classList.contains('intro-scroll-locked'), active: document.querySelector('[aria-current="page"]')?.textContent?.trim() }`。
