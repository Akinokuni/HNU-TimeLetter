# Test Plan — Global Navigation Bar Fix (PR #27, revision 2)

## What changed (user-visible)
- 导航栏整体钉视口右上角，**紧贴边缘**，z-index 高于 CustomScrollbar (z-1000)。
- 首页开屏态红色背景块从「并排在胶囊下方」改为「位于胶囊**背后**」（z 堆叠），并**比胶囊更宽**，视觉上包裹胶囊。
- 胶囊**收窄**到 ~4vw，内嵌于 7vw 的红色背景中（水平居中）。
- 新增 `useReducedMotion` 守门：`prefers-reduced-motion: reduce` 时关闭 spring 与 fade，保留最终态。

## Primary flow (one recording)

### T1. Homepage 开屏态布局（关键）
- 导航到 `/`。
- **Assertions**:
  - 红色背景块紧贴视口右、顶边（right:0, top:0），覆盖原 CustomScrollbar 顶部 ~30vh 区域。
  - 胶囊比红色背景窄（视觉上红色在胶囊左右两侧各有可见余量）。
  - 胶囊顶部与红色顶边之间留有红色余量（~3vh），证明红色背景**在胶囊下层**（非并排）。
  - 红色背景只有左下角圆角，其余三角为直角。
  - 胶囊内「主页」为实心红激活态。
- **Would-look-identical-if-broken check**: 如果还是并排或等宽，会看到红色块顶边在胶囊下方、宽度与胶囊一致 — 此时 fail。

### T2. 滚动淡出红色背景
- 向下滚动 ≥ 200px。
- **Assertions**:
  - 红色背景块 opacity → 0 消失；胶囊位置/尺寸/描边保持不变。
- **Would-look-identical-if-broken**: 若 scroll 监听坏了，红块不会消失。

### T3. `主页 → 地图` layoutId 动画 + 进入地图态
- 回到顶部，点击胶囊中的「地图」。
- **Assertions**:
  - 选中红色小胶囊**平滑滑动**到「地图」位置（可见位移）。
  - 页面从信封态切到地图主体验（map svg 渲染）。
  - 胶囊本身尺寸/位置不变。
- **Would-look-identical-if-broken**: 无 `layoutId` → 瞬切；未调 `setEnvelopeOpened(true)` → 页面仍是信封。

### T4. `/creation` 跨路由位置/尺寸一致
- 点击「公示板」。
- **Assertions**:
  - 路由跳转 `/creation`，「公示板」激活。
  - 胶囊位置（右上角视口偏移）与 `/` 一致；宽度不变（仍 ~4vw）。
  - 不显示红色背景块（非 `/` 路由）。

### T5. 滚动条层级关系
- 回到 `/`，滚动页面使 CustomScrollbar 的红色拇指可见。
- **Assertions**:
  - 在滚动条轨道与胶囊重叠的区域，**胶囊视觉上覆盖滚动条**（因为 nav 容器 z-1100 > scrollbar 1000）。
- **Would-look-identical-if-broken**: 若 z < 1000，滚动条红色拇指会叠在胶囊之上。

### T6. `prefers-reduced-motion: reduce` 下无弹簧动画（关键 accessibility 约束）
- 运行前置（不在录屏里做）：通过 DevTools > Rendering > Emulate CSS media feature 启用 reduce。
- 在胶囊中点击「地图」→「公示板」→「主页」。
- **Assertions**:
  - 红色激活胶囊在点击后**立即**出现在新位置（无可见 spring 位移）；红色背景块也**立即**出现/消失（无 fade）。
- **Would-look-identical-if-broken**: 仍能看到弹簧滑动/淡入淡出。

## 执行方式
- 本地 `npm run dev` @ `localhost:3000` 直接覆盖；一次录屏覆盖 T1–T5；T6 用 DevTools 辅助单独截图 + 断言。
