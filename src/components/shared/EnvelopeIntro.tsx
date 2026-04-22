'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useAnimationControls, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

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
 * Ribbon SVG — 首屏左侧竖向丝带装饰
 * 使用 SVG 内置 feDropShadow 替代 CSS drop-shadow，
 * 避免 GPU 合成导致的边缘半透明伪影。
 * ──────────────────────────────────────────── */
function TwistedRibbon() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none h-full w-[100px] shrink-0"
    >
      <svg
        className="size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 100 1080"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="hero-ribbon-bottom"
            x1="183.315" x2="-83.5254"
            y1="16.7419" y2="1063.26"
          >
            <stop stopColor="#C23643" />
            <stop offset="0.2" stopColor="#AE303C" />
            <stop offset="0.4" stopColor="#86252E" />
            <stop offset="0.5" stopColor="#9A2B35" />
            <stop offset="0.6" stopColor="#86252E" />
            <stop offset="0.8" stopColor="#AE303C" />
            <stop offset="1" stopColor="#C23643" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="hero-ribbon-top"
            x1="50" x2="50"
            y1="-540" y2="540"
          >
            <stop stopColor="#D45863" />
            <stop offset="0.58" stopColor="#C23643" />
            <stop offset="1" stopColor="#7A1623" />
          </linearGradient>
        </defs>
        <g>
          <path
            d="M50 540C75 675 100 810 100 1080H0C0 810 25 675 50 540Z"
            fill="url(#hero-ribbon-bottom)"
            shapeRendering="geometricPrecision"
          />
          <path
            d="M100 0C100 270 75 405 50 540C25 405 0 270 0 0H100Z"
            fill="url(#hero-ribbon-top)"
            shapeRendering="geometricPrecision"
          />
        </g>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────
 * 类型 & 工具
 * ──────────────────────────────────────────── */
type Phase = 'loading' | 'entering' | 'idle' | 'opening';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 计算信纸展开的缩放倍率，使其覆盖整个视口。
 * 信纸实际尺寸 = 信封尺寸 - inset-4 两侧 = 信封尺寸 - 32px
 */
function calcLetterScale(): number {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 信封在不同断点的宽度 (与 className 中的响应式宽度对应)
  let envelopeWidth = 595;
  if (vw < 640) envelopeWidth = 280;
  else if (vw < 768) envelopeWidth = 360;
  else if (vw < 1024) envelopeWidth = 480;

  const envelopeHeight = envelopeWidth * (397 / 595);
  const letterWidth = envelopeWidth - 32;
  const letterHeight = envelopeHeight - 32;

  // 取宽高方向的最大缩放比，再额外增加 20% 确保完全覆盖
  const scaleX = (vw / letterWidth) * 1.2;
  const scaleY = (vh / letterHeight) * 1.2;
  return Math.max(scaleX, scaleY);
}

/**
 * 计算信纸从当前位置移到视口正中心所需的偏移量
 */
function calcLetterCenterOffset(): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 信封在五列网格中的位置：col-start-3 col-span-3，mx-auto
  // 信封中心大约在视口的 (3/5 + 3/10) * vw = 0.6 * vw 处（第3-5列中心）
  // 更精确：网格5列等分，第3列起始 = 2/5 * vw，跨3列中心 = (2/5 + 3/10) * vw = 7/10 * vw
  // 但 mx-auto 会让信封在这3列中居中
  const gridColStart = (2 / 5) * vw;
  const gridColSpan = (3 / 5) * vw;
  const envelopeCenterX = gridColStart + gridColSpan / 2;
  const envelopeCenterY = vh / 2;

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
  const [ribbonRevealed, setRibbonRevealed] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [isShattered, setIsShattered] = useState(false);
  const phaseRef = useRef<Phase>('loading');

  const envelopeControls = useAnimationControls();
  const openControls = useAnimationControls();
  const shellDropControls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  // 组件是否已卸载的格卡——`handleOpen` 内的 await sleep 链总计 ~4s，
  // 期间用户若点击 GlobalNav 跳转到 `/creation` 等路由，EnvelopeIntro 会卸载。
  // 如果不拦截，末尾的 `setTransitioning(true)` + `router.push('/map')` 仍会执行，
  // 将用户从他们选中的页面拽回地图。
  const unmountedRef = useRef(false);

  // 保持 ref 同步，供异步回调中安全读取
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* ─── 入场动画序列 ─── */
  useEffect(() => {
    let cancelled = false;
    let frame2: number | undefined;
    let titleTimer: ReturnType<typeof setTimeout> | undefined;

    // 每次挂载（含浏览器前进/后退回到 `/`）都重置开屏态，
    // 让 `locked = !isIntroReady` 在入场动画期间重新成立，
    // 避免上一次会话遗留的 `isIntroReady=true` 直接放行滚动。
    setEnvelopeOpened(false);
    setIntroReady(false);

    const runEntry = async () => {
      if (cancelled) return;
      setPhase('entering');
      setRibbonRevealed(true);

      // 标题在丝带 clip-path 动画（1400ms）结束后淡入
      titleTimer = setTimeout(() => {
        if (!cancelled) setTitleVisible(true);
      }, 1400);

      if (prefersReducedMotion) {
        envelopeControls.set({ y: 0, opacity: 1, rotateX: 0, rotateZ: 0 });
        if (!cancelled) {
          setTitleVisible(true);
          setPhase('idle');
          setIntroReady(true);
        }
        return;
      }

      if (cancelled || phaseRef.current === 'opening') return;

      // 信封与丝带同时以 Spring 物理弹簧自上方飘落
      // 从屏幕上方 120% 处下落，带左右摇摆的飘落感
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

      // phaseRef.current 可在 await 期间被异步更新为 'opening'
      if (cancelled || (phaseRef as React.RefObject<Phase>).current === 'opening') return;
      setPhase('idle');
      setIntroReady(true);

      // 闲置呼吸浮动 — 赋予信封生命感
      envelopeControls.start({
        y: [0, -8, 0],
        rotate: [0, 0.5, 0, -0.5, 0],
        transition: {
          duration: 5.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    };

    // 双层 rAF 确保首帧渲染稳定后再触发动画
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (!cancelled) runEntry();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame1);
      if (frame2 !== undefined) cancelAnimationFrame(frame2);
      if (titleTimer !== undefined) clearTimeout(titleTimer);
    };
  }, [envelopeControls, prefersReducedMotion, setEnvelopeOpened, setIntroReady]);

  /* ─── 卸载时置位，供 handleOpen 的 await 链在每个副作用前短路 ─── */
  useEffect(() => {
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
        ease: [0.55, 0, 1, 0.45], // 加速下落
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

    // 激活过渡遮罩 — 在信纸放大前就显示，防止过渡期间页脚露出
    setTransitioning(true);

    const targetScale = calcLetterScale();
    void openControls.start({
      scale: targetScale,
      transition: {
        duration: 0.9,
        ease: [0.4, 0, 0.2, 1],
      },
    });
    // 信纸内容同步淡出
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
    <div className="page-paper relative w-full z-50">
      <section className="relative h-screen w-full overflow-hidden">
        {/* 背景：纯色 #ece9e4 由 page-paper 提供 */}

        {/* 五列网格主布局 */}
        <div className="relative z-10 grid h-full w-full grid-cols-5 items-center">
          {/* ── 第1列：丝带 ── */}
          <div
            className={cn(
              'hero-ribbon-clip col-start-1 flex h-full items-center justify-end overflow-visible',
              ribbonRevealed && 'hero-ribbon-revealed'
            )}
          >
            <TwistedRibbon />
          </div>

          {/* ── 第2列：标题 ── */}
          <motion.div
            className="col-start-2 flex items-center justify-end self-center"
            initial={{ opacity: 0 }}
            animate={
              isOpening
                ? { opacity: 0, y: -40, filter: 'blur(8px)' }
                : titleVisible
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 0, filter: 'blur(0px)' }
            }
            transition={{
              duration: isOpening ? 0.6 : 0.8,
              ease: [0.85, 0, 0.15, 1],
            }}
          >
            <Image
              alt="与她的海大时光笺"
              src="/logo.svg"
              width={27}
              height={120}
              className="object-contain"
              style={{ height: '60vh', width: 'auto' }}
              priority
            />
          </motion.div>

          {/* ── 第3~5列：信封 ── */}
          <motion.div
            className="relative col-span-3 col-start-3 mx-auto aspect-[595/397] w-[280px] perspective-1000 sm:w-[360px] md:w-[480px] lg:w-[595px]"
            initial={{ y: '-120vh', opacity: 0, rotateX: 6, rotateZ: -5 }}
            animate={envelopeControls}
            style={{ transformOrigin: '50% 50%' }}
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
                    // 在翻转至 ~90° 时同步切换 zIndex，使翻盖在越过信纸（z-10）后立即回落
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
        </div>

        {/* 点击提示 — 呼吸闪烁 (定位在信封正下方，水平对齐信封中心) */}
        <motion.p
          className="absolute bottom-[3%] left-[70%] z-10 -translate-x-1/2 text-center font-serif text-[11px] tracking-[0.22em] text-muted-foreground/70 md:text-sm"
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
