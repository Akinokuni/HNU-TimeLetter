# Test Plan — GlobalNav v3 (/map route + refined open-screen block)

## What changed (user-visible)
1. 新增 `/map` 路由（<ref_file file="/home/ubuntu/repos/HNU-TimeLetter/src/app/map/page.tsx" />）。
2. 导航激活态改为**纯 pathname 驱动**（<ref_snippet file="/home/ubuntu/repos/HNU-TimeLetter/src/components/shared/GlobalNav.tsx" lines="60-65" />）——点击「地图」走 `router.push('/map')`，不再依赖 `isEnvelopeOpened`。
3. 首页开屏红色色块**不再淡入**：`AnimatePresence initial={false}` + `initial={{ opacity: 1 }}`（<ref_snippet file="/home/ubuntu/repos/HNU-TimeLetter/src/components/shared/GlobalNav.tsx" lines="103-125" />）。滚动/回滚仍保留淡入淡出。
4. 色块 `borderBottomLeftRadius: 3.5vw` 与胶囊 rounded-full 等比放大（radius ≈ block-width / 2）。
5. 色块高度从 30vh → 28vh；胶囊 `right: 0.8vw`（更贴边）、`top: 2.5vh`。

## Adversarial primary flow (one recording)

### T1. Red block shows INSTANTLY on first load (no fade-in)
- 硬刷 `http://localhost:3000/`，在 150ms 内截图并读 `getComputedStyle(block).opacity`。
- **Pass**: 刷新后第一帧 opacity === '1'；**Fail**: 观察到 opacity 从 0 平滑升到 1（旧实现）。
- **Would-look-same-if-broken?**: 旧版会有 0.45s 的淡入；录屏慢速回放会肉眼看到 opacity 过渡。新版第一帧即 1，无过渡。

### T2. Block dimensions & radius proportional to pill (等比放大)
- DOM 读取块 & 胶囊 `getBoundingClientRect()`、`borderBottomLeftRadius`、`borderRadius`。
- **Expected (1568×1069 viewport)**:
  - Block width ≈ 110px（7vw, clamp 80–128），block height ≈ 28vh ≈ 299px（clamp 200–320）。
  - Block bottom-left radius ≈ 54.88px（3.5vw）。
  - Pill width ≈ 62.7px（4vw），pill right inset ≈ 0.8vw ≈ 12.5px。
  - 比值：block.radius / block.width ≈ 0.5，等于 pill 的 rounded-full 比值（0.5）。
- **Pass**: 上述值全部命中 ±2px；**Fail**: radius 仍 ~9999px（elliptical 全弧）或 pill 右距 ≥ 1.5vw。

### T3. /map route active switching (核心)
- 路径 `/`，点击胶囊中的「地图」。
- **Expected**: URL 变为 `/map`；activeKey 变为 `'map'`（通过 `aria-current` 检查）；页面渲染 `InteractiveMap`（`<img src="/images/map.svg">` 出现）。
- **Would-look-same-if-broken?**: 旧实现只 `setEnvelopeOpened(true)` 不改 URL，URL 仍是 `/`。新实现 URL 必须切到 `/map`。
- 回到 `/`：点击「主页」，URL 回到 `/`，且重新看到信封（说明 `setEnvelopeOpened(false)` 生效）。

### T4. pathname-only active when state is stale
- 人为手写地址栏 `http://localhost:3000/map`（直接命中路由，无状态 setter）。
- **Expected**: 地图页渲染，`aria-current="page"` 落在「地图」按钮。
- **Would-look-same-if-broken?**: 若旧 `isEnvelopeOpened` 逻辑，直接进 `/map` 时 `isEnvelopeOpened=false`，会错误激活「主页」。新实现必然激活「地图」。

### T5. Cross-route pill geometry consistency (regression)
- 依次 `/` → `/map` → `/creation` 记录 `ul` 的 `getBoundingClientRect`。
- **Pass**: 三个路由下 `x, y, width, height` 全部一致；**Fail**: 任一维度漂移 ≥ 2px。

## Non-goals in this pass
- 不重做 z-stacking / reduced-motion 测试（v2 已覆盖、未改动）。
- 不测 CustomScrollbar 重叠（viewport 未变）。

## Execution notes
- 本地 `npm run dev`（已运行于 `localhost:3000`，Turbopack 热更新）。
- 使用浏览器 console 直读 `getComputedStyle` / `getBoundingClientRect` 做数值断言。
- 一次连续录屏覆盖 T1–T5。
