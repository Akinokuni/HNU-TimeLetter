'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useAnimationControls, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────
 * 视口尺寸采集 hook
 * 像素级监听 `window.innerWidth/innerHeight`，
 * 为引导线、色块斜底边、Logo 中心点提供可计算的几何基准。
 * ──────────────────────────────────────────── */
function useViewportSize() {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

/* ────────────────────────────────────────────
 * 火漆碎裂碎片组件
 * 将火漆图片拆分为 8 块 clipPath 碎片，
 * 各碎片沿径向飞散并旋转淡出，模拟碎裂效果。
 * ──────────────────────────────────────────── */
interface ShardData {
  id: number;
  clipPath: string;
  x: number;
  y: number;
  rotate: number;
  delay: number;
}

function WaxSealShards({ isShattered, sizeClass }: { isShattered: boolean; sizeClass: string }) {
  const shards = useMemo<ShardData[]>(() => [
    { id: 0, clipPath: 'polygon(30% 0%, 70% 0%, 55% 45%, 45% 45%)', x: 2, y: -90, rotate: -25, delay: 0 },
    { id: 1, clipPath: 'polygon(70% 0%, 100% 0%, 100% 35%, 55% 45%)', x: 80, y: -70, rotate: 35, delay: 0.02 },
    { id: 2, clipPath: 'polygon(100% 35%, 100% 70%, 60% 55%, 55% 45%)', x: 95, y: 15, rotate: 50, delay: 0.04 },
    { id: 3, clipPath: 'polygon(100% 70%, 100% 100%, 65% 100%, 55% 60%)', x: 70, y: 85, rotate: -30, delay: 0.03 },
    { id: 4, clipPath: 'polygon(55% 60%, 65% 100%, 35% 100%, 45% 60%)', x: -5, y: 95, rotate: 15, delay: 0.05 },
    { id: 5, clipPath: 'polygon(0% 100%, 35% 100%, 45% 60%, 40% 55%, 0% 65%)', x: -75, y: 80, rotate: -45, delay: 0.02 },
    { id: 6, clipPath: 'polygon(0% 65%, 40% 55%, 45% 45%, 0% 35%)', x: -90, y: 10, rotate: 40, delay: 0.04 },
    { id: 7, clipPath: 'polygon(0% 0%, 30% 0%, 45% 45%, 0% 35%)', x: -80, y: -75, rotate: -35, delay: 0.01 },
  ], []);

  return (
    <AnimatePresence>
      {isShattered && shards.map((shard) => (
        <motion.div
          key={shard.id}
          className={cn(
            'absolute left-1/2 top-1/2 z-40 pointer-events-none',
            sizeClass
          )}
          style={{ clipPath: shard.clipPath }}
          initial={{ opacity: 1, x: '-50%', y: '-50%', scale: 1, rotate: 0 }}
          animate={{
            opacity: [1, 0.9, 0],
            x: `calc(-50% + ${shard.x}px)`,
            y: `calc(-50% + ${shard.y}px)`,
            scale: [1, 0.85, 0.4],
            rotate: shard.rotate,
          }}
          transition={{
            duration: 0.65,
            delay: shard.delay,
            ease: [0.32, 0, 0.67, 0],
            opacity: { times: [0, 0.4, 1] },
          }}
        >
          <Image
            alt=""
            className="object-contain drop-shadow-[0_10px_16px_rgba(20,53,104,0.35)]"
            fill
            sizes="92px"
            src="/sealing_wax.png"
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────
 * 类型 & 工具
 * ──────────────────────────────────────────── */
type Phase = 'loading' | 'sweeping' | 'entering' | 'idle' | 'opening';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ────────────────────────────────────────────
 * 几何常量 —— 规范见 docs/design/开屏页重构.md
 * ──────────────────────────────────────────── */
const FIELD_BASE = '#ece9e4';     // Base Layer 全局底色
const BLOCK_BASE = '#c23643';     // Base Layer 顶部斜底色块
const FIELD_TOP = '#c23643';      // Top Layer 全局底色（与 Base 互换）
const BLOCK_TOP = '#ece9e4';      // Top Layer 顶部斜底色块（与 Base 互换）
const LOGO_COLOR_BASE = '#ece9e4';
// Top Layer 中 Logo 着色由 SVG `<filter>` `feColorMatrix` 完成（见 §5.2）。

// 引导线宽度（像素）
const GUIDE_STROKE_WIDTH = 100;
const GUIDE_HALF_STROKE = GUIDE_STROKE_WIDTH / 2;

// Logo 中心点：第 4 行 × 第 2 列几何中心 = (30vw, 35vh)
const LOGO_CENTER_X_RATIO = 0.3;
const LOGO_CENTER_Y_RATIO = 0.35;
// Logo 横向铺幅（占视口宽度的比例）；纵向由原始图比例 1023.59:396.03 推导
const LOGO_WIDTH_RATIO = 0.32;
const LOGO_ASPECT = 1023.59 / 396.03;

// 信封中心点：(80vw, 70vh)
const ENVELOPE_CENTER_X_RATIO = 0.8;
const ENVELOPE_CENTER_Y_RATIO = 0.7;

// 入场动效时序（毫秒）
const SWEEP_DURATION_MS = 1000;
const SWEEP_DELAY_MS = 120;

/**
 * 计算信封在不同断点下的像素宽度（与原 className 中的 280 / 360 / 480 / 595 一致）
 */
function pickEnvelopeWidth(vw: number): number {
  if (vw < 640) return 280;
  if (vw < 768) return 360;
  if (vw < 1024) return 480;
  return 595;
}

/**
 * 计算信纸展开的缩放倍率，使其覆盖整个视口。
 * 信纸实际尺寸 = 信封尺寸 - inset-4 两侧 = 信封尺寸 - 32px
 */
function calcLetterScale(): number {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const envelopeWidth = pickEnvelopeWidth(vw);
  const envelopeHeight = envelopeWidth * (397 / 595);
  const letterWidth = envelopeWidth - 32;
  const letterHeight = envelopeHeight - 32;

  // 取宽高方向的最大缩放比，再额外增加 20% 确保完全覆盖
  const scaleX = (vw / letterWidth) * 1.2;
  const scaleY = (vh / letterHeight) * 1.2;
  return Math.max(scaleX, scaleY);
}

/**
 * 计算信纸从 (80vw, 70vh) 中心位置移到视口正中心所需的偏移量
 */
function calcLetterCenterOffset(): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const envelopeCenterX = ENVELOPE_CENTER_X_RATIO * vw;
  const envelopeCenterY = ENVELOPE_CENTER_Y_RATIO * vh;

  const viewportCenterX = vw / 2;
  const viewportCenterY = vh / 2;

  return {
    x: viewportCenterX - envelopeCenterX,
    y: viewportCenterY - envelopeCenterY,
  };
}

/* ────────────────────────────────────────────
 * 主组件
 * ──────────────────────────────────────────── */
export function EnvelopeIntro() {
  const { setEnvelopeOpened, setTransitioning, setIntroReady } = useAppStore();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [isShattered, setIsShattered] = useState(false);
  const [sweepDone, setSweepDone] = useState(false);
  const phaseRef = useRef<Phase>('loading');

  const envelopeControls = useAnimationControls();
  const openControls = useAnimationControls();
  const shellDropControls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  // 卡口：用于异步链路在卸载后短路，避免被 router.push 拽回 /map
  const unmountedRef = useRef(false);

  const { w: vw, h: vh } = useViewportSize();
  const reactId = useId();
  const maskId = `intro-guide-mask-${reactId.replace(/:/g, '')}`;
  const recolorId = `intro-logo-recolor-${reactId.replace(/:/g, '')}`;

  /* ─── 引导线几何 ─── */
  const guide = useMemo(() => {
    const start = { x: vw * 0.6, y: 0 };
    const end = { x: vw * 0.2 - GUIDE_HALF_STROKE, y: vh };
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    return { start, end, length };
  }, [vw, vh]);

  /* ─── Logo / 信封 像素几何 ─── */
  const logoGeometry = useMemo(() => {
    const width = vw * LOGO_WIDTH_RATIO;
    const height = width / LOGO_ASPECT;
    const cx = vw * LOGO_CENTER_X_RATIO;
    const cy = vh * LOGO_CENTER_Y_RATIO;
    return { x: cx - width / 2, y: cy - height / 2, width, height };
  }, [vw, vh]);

  const envelopeWidth = vw > 0 ? pickEnvelopeWidth(vw) : 0;
  const envelopeHeight = envelopeWidth * (397 / 595);

  // 保持 ref 同步，供异步回调中安全读取
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* ─── 入场动画序列 ─── */
  useEffect(() => {
    let cancelled = false;
    let frame2: number | undefined;

    // 每次挂载（含浏览器前进/后退回到 `/`）都重置开屏态，
    // 让 `locked = !isIntroReady` 在入场动画期间重新成立，
    // 避免上一次会话遗留的 `isIntroReady=true` 直接放行滚动。
    setEnvelopeOpened(false);
    setIntroReady(false);
    setSweepDone(false);

    const runEntry = async () => {
      if (cancelled) return;
      // 阶段一：引导线绘制由独立 effect 监听 `sweepDone` 后衔接阶段二
      setPhase('sweeping');

      if (prefersReducedMotion) {
        envelopeControls.set({ y: 0, opacity: 1, rotateX: 0, rotateZ: 0 });
        if (!cancelled) {
          setSweepDone(true);
          setPhase('idle');
          setIntroReady(true);
        }
        return;
      }
    };

    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (!cancelled) runEntry();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame1);
      if (frame2 !== undefined) cancelAnimationFrame(frame2);
    };
  }, [envelopeControls, prefersReducedMotion, setEnvelopeOpened, setIntroReady]);

  /* ─── 阶段二：信封 Spring 飘落（仅在阶段一结束后启动） ─── */
  useEffect(() => {
    if (!sweepDone) return;
    if (prefersReducedMotion) return;
    let cancelled = false;

    const isOpeningPhase = () => (phaseRef.current as Phase) === 'opening';
    (async () => {
      if (cancelled || isOpeningPhase()) return;
      setPhase('entering');

      await envelopeControls.start({
        y: 0,
        x: 0,
        opacity: 1,
        rotateX: 0,
        rotateZ: 0,
        transition: {
          type: 'spring',
          stiffness: 30,
          damping: 12,
          mass: 1.5,
          opacity: { duration: 0.6, ease: 'easeOut' },
        },
      });

      if (cancelled || isOpeningPhase()) return;
      setPhase('idle');
      setIntroReady(true);

      envelopeControls.start({
        y: [0, -8, 0],
        rotate: [0, 0.5, 0, -0.5, 0],
        transition: {
          duration: 5.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [sweepDone, envelopeControls, prefersReducedMotion, setIntroReady]);

  /* ─── 卸载时置位，供 handleOpen 的 await 链在每个副作用前短路 ───
   * 必须在 setup 阶段显式重置为 false：React Strict Mode（Next.js 16 dev 默认开启）
   * 会跑 setup → cleanup → setup，若只在 cleanup 置 true，第二次 setup 后
   * `unmountedRef` 永远卡在 true，导致 handleOpen 的两个 guard 永远命中，
   * 开信动画执行到 `await sleep(500)` 后就停住，`setTransitioning` 与
   * `router.push('/map')` 再也不会触发。 */
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  /* ─── 开信期间锁滚：覆盖「点击蜡封 → 路由到 /map」之间的时间窗 ─── */
  useEffect(() => {
    if (phase !== 'opening') return;
    document.documentElement.classList.add('intro-scroll-locked');
    document.body.classList.add('intro-scroll-locked');
    return () => {
      document.documentElement.classList.remove('intro-scroll-locked');
      document.body.classList.remove('intro-scroll-locked');
    };
  }, [phase]);

  /* ─── 开信交互 ─── */
  const handleOpen = useCallback(async () => {
    if (phaseRef.current === 'opening') return;
    setPhase('opening');

    // 冻结信封在静止位置
    envelopeControls.stop();
    envelopeControls.set({ y: 0, x: 0, rotate: 0, rotateX: 0, rotateZ: 0 });

    // 0. 触发火漆碎裂 (立即)
    setIsShattered(true);

    // 1. 封盖翻开 + 信纸抽出 (1.9s)
    void openControls.start('open');
    await sleep(1900);

    // 2. 信封壳体整体下落 (0.7s) — 保持完整形态
    void shellDropControls.start({
      y: '120vh',
      rotate: 4,
      opacity: 0,
      transition: {
        duration: 0.7,
        ease: [0.55, 0, 1, 0.45],
        opacity: { delay: 0.3, duration: 0.4 },
      },
    });
    await sleep(700);

    // 3. 信纸先移到视口正中心 (0.5s)，再放大铺满屏幕 (0.9s)
    const centerOffset = calcLetterCenterOffset();
    void openControls.start({
      x: centerOffset.x,
      y: centerOffset.y,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    });
    await sleep(500);

    if (unmountedRef.current) return;

    setTransitioning(true);

    const targetScale = calcLetterScale();
    void openControls.start({
      scale: targetScale,
      transition: {
        duration: 0.9,
        ease: [0.4, 0, 0.2, 1],
      },
    });
    await sleep(900);

    if (unmountedRef.current) return;

    // 跳转到 `/map`：由全局导航栏的「地图」激活态驱动胶囊切换，
    // 状态层不再承担「是否显示地图」的判定（交给路由）。
    router.push('/map');
  }, [envelopeControls, openControls, shellDropControls, router, setTransitioning]);

  const isIdle = phase === 'idle';
  const isOpening = phase === 'opening';

  const waxSealSizeClass = 'h-[72px] w-[72px] sm:h-[82px] sm:w-[82px] md:h-[92px] md:w-[92px]';

  return (
    <div className="relative w-full z-50" style={{ background: FIELD_BASE }}>
      <section className="relative h-screen w-full overflow-hidden">
        {/* ───── Base Layer (z=1)：全幅 #ece9e4 + 顶部 #c23643 斜底色块 + 中心 Logo ───── */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{ background: FIELD_BASE, zIndex: 1 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: BLOCK_BASE,
              clipPath: 'polygon(0 0, 100% 0, 100% 70vh, 0 40vh)',
            }}
          />
          {vw > 0 && (
            <div
              className="absolute"
              style={{
                left: `${LOGO_CENTER_X_RATIO * 100}vw`,
                top: `${LOGO_CENTER_Y_RATIO * 100}vh`,
                transform: 'translate(-50%, -50%)',
                width: `${LOGO_WIDTH_RATIO * 100}vw`,
                aspectRatio: `${1023.59} / ${396.03}`,
                backgroundColor: LOGO_COLOR_BASE,
                WebkitMaskImage: 'url(/logo.svg)',
                maskImage: 'url(/logo.svg)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
          )}
        </div>

        {/* ───── Top Layer (z=2)：与 Base 互换主色，仅在引导线遮罩口内可见 ─────
         * 整层以 SVG 渲染：色块 / Logo 重新着色 / 遮罩同处一个绘制空间，
         * 避免 CSS mask + DOM 跨层 z-index 在不同浏览器下的合成差异。*/}
        {vw > 0 && (
          <svg
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 2 }}
            width={vw}
            height={vh}
            viewBox={`0 0 ${vw} ${vh}`}
            preserveAspectRatio="none"
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={vw} height={vh}>
                <rect x="0" y="0" width={vw} height={vh} fill="black" />
                <motion.line
                  x1={guide.start.x}
                  y1={guide.start.y}
                  x2={guide.end.x}
                  y2={guide.end.y}
                  stroke="white"
                  strokeWidth={GUIDE_STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={guide.length}
                  initial={{ strokeDashoffset: guide.length }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: SWEEP_DURATION_MS / 1000,
                          delay: SWEEP_DELAY_MS / 1000,
                          ease: [0.4, 0, 0.2, 1],
                        }
                  }
                  onAnimationComplete={() => setSweepDone(true)}
                />
              </mask>
              {/*  Top Layer 中 Logo 由 #ece9e4 重着色为 #c23643，
                * R/G/B 三通道分别取 194/255、54/255、67/255，alpha 通道保留原值。 */}
              <filter id={recolorId} colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 ${194 / 255}
                           0 0 0 0 ${54 / 255}
                           0 0 0 0 ${67 / 255}
                           0 0 0 1 0`}
                />
              </filter>
            </defs>

            <g mask={`url(#${maskId})`}>
              <rect x="0" y="0" width={vw} height={vh} fill={FIELD_TOP} />
              <polygon
                points={`0,0 ${vw},0 ${vw},${vh * 0.7} 0,${vh * 0.4}`}
                fill={BLOCK_TOP}
              />
              <image
                href="/logo.svg"
                x={logoGeometry.x}
                y={logoGeometry.y}
                width={logoGeometry.width}
                height={logoGeometry.height}
                preserveAspectRatio="xMidYMid meet"
                filter={`url(#${recolorId})`}
              />
            </g>
          </svg>
        )}

        {/* ───── 信封 (z=3)：中心点锚定在 (80vw, 70vh) ───── */}
        {vw > 0 && (
          <motion.div
            className="absolute aspect-[595/397] perspective-1000"
            style={{
              zIndex: 3,
              left: `${ENVELOPE_CENTER_X_RATIO * 100}vw`,
              top: `${ENVELOPE_CENTER_Y_RATIO * 100}vh`,
              width: envelopeWidth,
              height: envelopeHeight,
              marginLeft: -envelopeWidth / 2,
              marginTop: -envelopeHeight / 2,
              transformOrigin: '50% 50%',
            }}
            initial={{ y: '-120vh', opacity: 0, rotateX: 6, rotateZ: -5 }}
            animate={envelopeControls}
          >
            {/* 开信动画容器 */}
            <motion.div
              animate={openControls}
              className="relative h-full w-full preserve-3d"
              variants={{
                open: {
                  scale: 1.08,
                  y: 84,
                  transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
                },
              }}
            >
              {/* ═══ 信封壳体容器 — 整体下落时保持完整形态 ═══ */}
              <motion.div
                className="absolute inset-0"
                animate={shellDropControls}
              >
                {/* 信封背面 */}
                <div className="absolute inset-0 rounded-[10px] bg-[#e8e0d5] shadow-[0_26px_60px_rgba(82,63,54,0.18)]">
                  <div className="absolute inset-0 rounded-[10px] bg-white/10" />
                </div>

                {/* 底部三角折叠 */}
                <div
                  className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[#f0eadd]"
                  style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                />
                {/* 左侧三角折叠 */}
                <div
                  className="absolute inset-y-0 left-0 z-20 w-1/2 bg-[#f5efe4]"
                  style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}
                />
                {/* 右侧三角折叠 */}
                <div
                  className="absolute inset-y-0 right-0 z-20 w-1/2 bg-[#efe8dc]"
                  style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
                />

                {/* 顶部封盖 — 3D 翻转
                 *  祖父 motion.div 使用 shellDropControls 的独立 animate 会打断
                 *  variants 传播链，因此这里直接依据 isOpening 状态驱动 animate。
                 *  zIndex 由 Framer Motion 的 animate + transition.delay 调度，
                 *  在翻转至 90° 附近（0.15s）瞬时从 30 切到 0，避免前半程就被错
                 *  误地放到信纸之后。
                 *  translateZ(-2) 避免 3D 空间内与信纸 z-fighting。
                 */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-1/2 origin-top bg-[#e8e0d5] shadow-md"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{ rotateX: 0, translateZ: 0, zIndex: 30 }}
                  animate={
                    isOpening
                      ? { rotateX: 180, translateZ: -2, zIndex: 0 }
                      : { rotateX: 0, translateZ: 0, zIndex: 30 }
                  }
                  transition={{
                    rotateX: { duration: 0.6, ease: 'easeInOut' },
                    translateZ: { delay: 0.15, duration: 0.1 },
                    zIndex: { delay: 0.15, duration: 0, type: 'tween' },
                  }}
                >
                  <div className="backface-hidden absolute inset-0 rotate-x-180 bg-[#ded6ca]" />
                </motion.div>

                {/* 火漆印按钮 — 静态固定在信封上，逆时针5°倾角 */}
                {!isShattered && (
                  <motion.button
                    className={cn(
                      'absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                      waxSealSizeClass,
                      isOpening && 'pointer-events-none'
                    )}
                    onClick={handleOpen}
                    style={{ rotate: '-5deg' }}
                  >
                    <Image
                      alt="打开信封"
                      className="object-contain drop-shadow-[0_10px_16px_rgba(20,53,104,0.35)]"
                      fill
                      priority
                      sizes="(max-width: 640px) 72px, (max-width: 768px) 82px, 92px"
                      src="/sealing_wax.png"
                    />
                  </motion.button>
                )}

                {/* 火漆碎裂碎片 */}
                <WaxSealShards isShattered={isShattered} sizeClass={waxSealSizeClass} />
              </motion.div>

              {/* ═══ 信纸 — 独立于壳体，壳体下落时信纸留在原位 ═══ */}
              <motion.div
                className="paper-panel absolute inset-4 z-10 flex origin-center flex-col items-center justify-center overflow-hidden p-6 text-center md:p-8"
                variants={{
                  open: {
                    y: -150,
                    transition: { delay: 0.7, duration: 1, type: 'spring', bounce: 0.3 },
                  },
                }}
              >
                {/* 信纸内容 — 展开时快速淡出 */}
                <motion.div
                  className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-border/80 p-4 md:p-[18px]"
                  animate={isOpening ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.4, delay: isOpening ? 2.6 : 0, ease: 'easeIn' }}
                >
                  <h2 className="mb-2 font-serif text-xl tracking-[0.16em] text-foreground md:text-2xl">
                    时光笺
                  </h2>
                  <p className="font-serif text-[11px] uppercase tracking-[0.24em] text-muted-foreground md:text-xs">
                    Hainan University
                  </p>
                  <div className="mt-4 h-px w-12 bg-border" />
                  <p className="mt-4 font-serif text-[11px] italic text-muted-foreground md:text-xs">
                    &quot;献给每一段无法复刻的青春&quot;
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* 点击提示 — 呼吸闪烁 (定位在信封正下方，水平对齐信封中心) */}
        <motion.p
          className="absolute z-10 -translate-x-1/2 text-center font-serif text-[11px] tracking-[0.22em] text-muted-foreground/70 md:text-sm"
          style={{
            left: `${ENVELOPE_CENTER_X_RATIO * 100}vw`,
            bottom: '3%',
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={
            isIdle
              ? { opacity: [0.35, 0.65, 0.35], y: 0 }
              : { opacity: 0, y: 6 }
          }
          transition={
            isIdle
              ? {
                  opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                  y: { duration: 0.5, ease: 'easeOut' },
                }
              : { duration: 0.3 }
          }
        >
          点击开启
        </motion.p>
      </section>
    </div>
  );
}
