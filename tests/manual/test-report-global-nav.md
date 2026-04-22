# Test Report — Global Navigation Bar (PR #27)

**How tested**: Ran the frontend locally (`npm run dev` @ `localhost:3000`) and exercised the primary cross-route flow end-to-end via GUI. One continuous recording captures all test cases.

## Escalations
- None blocking. One spec-interpretation note: when the user clicks 「地图」 via the nav, the page enters the map experience on `/`. Because the app is still on `/` with `scrollY === 0`, the **homepage open-screen red block is still rendered** per the current spec (「首页（`/`）的导航栏根据滚动状态呈现两种视觉形态」). If the intent was that the red block should only appear in the envelope / scroll-sections visual stage and not in the map stage, this needs a doc clarification — let me know and I'll gate it on `!isEnvelopeOpened` as well.

## Results

- **T1. Homepage open-screen pill + red block** — passed
- **T2. Red block fades out on scroll, reappears on scroll-to-top** — passed
- **T3. 主页 → 地图 layoutId animation + enter map state** — passed
- **T4. 地图 → 公示板 (route change /creation) + cross-route position consistency** — passed
- **T5. 公示板 → 主页 resets envelope + red block re-appears** — passed

## Evidence

| Step | Screenshot |
|---|---|
| 🟢 T1 Homepage open-screen: 主页 active, red block (bottom-left rounded) below pill | ![Homepage open-screen](https://app.devin.ai/attachments/ed91cf25-c259-420a-ad97-c5223b9f8d6e/screenshot_zoom_187754876e694909afa32053a4247e0d.png) |
| 🟢 T2 After scroll: red block gone, pill unchanged | ![Scrolled](https://app.devin.ai/attachments/dc00418e-3874-4a11-9ba5-93054aae3e57/screenshot_zoom_66f4689e0127422caa06ee4812f53183.png) |
| 🟢 T3 After clicking 地图: active pill moved down, map rendered | ![Map active](https://app.devin.ai/attachments/8b1b6360-81ac-4585-a891-6b0f293a5eac/screenshot_zoom_b1802588054c4550bbadfa4c8cf20ff1.png) |
| 🟢 T4 `/creation`: 公示板 active, no red block, same nav position | ![Creation active](https://app.devin.ai/attachments/150d3908-924e-4958-9a3d-c7d23ad07e2b/screenshot_zoom_ea0be90c11a94ef68d6b23be0c407b3b.png) |
| 🟢 T5 Back on `/`: envelope visible, 主页 active, red block re-appears | ![Back home](https://app.devin.ai/attachments/39e0d568-9c2f-4edc-8379-7007af39a2da/screenshot_zoom_1254512866c542449d0afd0a3d14c866.png) |

Recording (video) is attached to the message — it shows the `layoutId` spring animation between each selection and the AnimatePresence fade on the red block, which are not visible in still frames.
