# Test Plan — Global Navigation Bar (PR #27)

## What changed (user-visible)
- 全站右上角新增一个竖向胶囊导航（主页 / 地图 / 公示板），跨路由常驻。
- 首页未滚动时，胶囊下方显示一块红色长方形色块（仅左下角圆角）；滚动后淡出。
- 选中态为内嵌红色胶囊，切换时使用 layout animation 平滑滑动，而非硬切换。

## Feature entry paths (from code)
- Component: `src/components/shared/GlobalNav.tsx`
- Mounted at: `src/app/layout.tsx` (in `<body>`)
- Active logic:
  - `/creation` → board
  - `/` + `isEnvelopeOpened === false` → home
  - `/` + `isEnvelopeOpened === true` → map
- Homepage red block shown only when `pathname === '/' && scrollY <= 1`

## Primary flow (one recording, port http://localhost:3000)

### T1. Homepage open-screen variant (critical)
- **Action**: Navigate to `/`.
- **Assertions (pass ⇢ expected values)**:
  - 右上角出现竖向胶囊：宽度约 7vw（~95px @1366 width），带 `#c23643` 红色 1px 描边。
  - 选中项是「主页」：其内部为实心红色胶囊 `#c23643`，文字白色 `#ffffff`。「地图」「公示板」文字为 `#5a4748`，无红底。
  - 胶囊正下方有红色色块：宽度≈胶囊宽度；高度≈视口 30%；**仅左下角圆角**，其余三角为直角。色块顶部紧贴胶囊底边。
- **Would-look-identical-if-broken check**: 如果没有实现红色色块，胶囊下方会是透明的页面纸色；如果选中态没实现，三项都是灰字无红底；如果 layoutId 失败，滑动切换将瞬移而非滑动。

### T2. Scroll-fade of homepage red block (critical — distinguishes variant logic)
- **Action**: 向下滚动首页（使用鼠标滚轮或 PageDown）≥ 200px。
- **Assertions**:
  - 红色色块 opacity 平滑从 1→0 消失；不留白边或截断。
  - 胶囊本体保持位置与外观不变（描边、磨砂玻璃、选中红胶囊仍在「主页」）。
- **Would-look-identical-if-broken**: 若没做 scroll 监听，色块不会消失；若淡出没接 AnimatePresence，会发生闪烁。

### T3. 选中态 layout animation（主页→地图）
- **Action**: 回到页面顶部，点击胶囊中的「地图」项。
- **Assertions**:
  - 红色实心胶囊从「主页」位置平滑滑动到「地图」位置（有可见的移动过渡，而非一闪）。
  - 点击后触发 `setEnvelopeOpened(true)`，首页应切换到地图主体验（地图渲染）。
  - 滚动位置变化：滚动后红色色块不再出现（非首页开屏态 — 但仍在 `/` 路由，故只要 `scrollY > 1` 即应无色块；若滚到顶部仍会再显示，这是预期）。
- **Would-look-identical-if-broken**: 若未用 `layoutId`，红色胶囊会直接消失再出现（瞬切）而非滑动。

### T4. 选中态 layout animation（地图→公示板）+ 跨路由位置一致
- **Action**: 从地图状态点击「公示板」。
- **Assertions**:
  - 路由跳转到 `/creation`；胶囊位置（右上角距视口 top/right 的偏移）与首页完全一致，不偏移不缩放。
  - 红色实心胶囊滑动至「公示板」位置（layout animation，非硬切）。
  - `/creation` 下胶囊容器宽/高不变，描边依然为红色。
  - 不出现首页开屏红色色块（非 `/` 路由）。
- **Would-look-identical-if-broken**: 若 `GlobalNav` 没挂在 layout 而挂在某单页，`/creation` 将完全没有导航；若宽度不固定，切页后会有尺寸跳变。

### T5. 返回主页视觉阶段
- **Action**: 在 `/creation` 上点击「主页」。
- **Assertions**:
  - 路由回到 `/`，信封态重置（`isEnvelopeOpened=false` → 信封可见）。
  - 红色实心胶囊滑动回「主页」。
  - 开屏态再次出现下方红色色块（回到首页 + `scrollY<=1`）。
- **Would-look-identical-if-broken**: 若点击「主页」没清 `isEnvelopeOpened`，用户会看到地图态而非开屏；若 `scrolled` state 未重置，色块不出现。

## Out of scope
- 移动端表现（视口 ≤768px 下的 GlobalNav 行为不是本 PR 明确目标）。
- 后台 `/admin` 路由（组件内已通过 pathname 判断隐藏，仅做一次 smoke check）。
