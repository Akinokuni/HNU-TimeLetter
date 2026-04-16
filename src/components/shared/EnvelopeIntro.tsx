'use client';

import Image from 'next/image';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────
 * Ribbon SVG — 首屏左侧竖向丝带装饰
 * ──────────────────────────────────────────── */
function TwistedRibbon() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none h-full w-[100px] shrink-0"
    >
      <svg
        className="size-full drop-shadow-[10px_0_24px_rgba(122,22,35,0.18)]"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 100 1080"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 540C75 675 100 810 100 1080H0C0 810 25 675 50 540Z"
          fill="url(#hero-ribbon-bottom)"
        />
        <path
          d="M100 0C100 270 75 405 50 540C25 405 0 270 0 0H100Z"
          fill="url(#hero-ribbon-top)"
        />
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="hero-ribbon-bottom"
            x1="183.315"
            x2="-83.5254"
            y1="16.7419"
            y2="1063.26"
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
            x1="50"
            x2="50"
            y1="-540"
            y2="540"
          >
            <stop stopColor="#D45863" />
            <stop offset="0.58" stopColor="#C23643" />
            <stop offset="1" stopColor="#7A1623" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────
 * 类型 & 工具
 * ──────────────────────────────────────────── */
type Phase = 'loading' | 'entering' | 'idle' | 'opening';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ────────────────────────────────────────────
 * 主组件
 * ──────────────────────────────────────────── */
export function EnvelopeIntro() {
  const { setEnvelopeOpened } = useAppStore();
  const [phase, setPhase] = useState<Phase>('loading');
  const [ribbonRevealed, setRibbonRevealed] = useState(false);
  const phaseRef = useRef<Phase>('loading');

  const envelopeControls = useAnimationControls();
  const openControls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  // 保持 ref 同步，供异步回调中安全读取
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* ─── 入场动画序列 ─── */
  useEffect(() => {
    let cancelled = false;
    let frame2: number | undefined;

    const runEntry = async () => {
      if (cancelled) return;
      setPhase('entering');
      setRibbonRevealed(true);

      if (prefersReducedMotion) {
        envelopeControls.set({ y: 0, opacity: 1, rotateX: 0, rotateZ: 0 });
        if (!cancelled) setPhase('idle');
        return;
      }

      // 三阶段信封入场：离屏就绪 → 主轴下坠+次级飘动 → 阻尼落定
      const vh = window.innerHeight;
      await envelopeControls.start({
        y: [-1.2 * vh, -0.56 * vh, -0.13 * vh, 5, 0],
        x: [0, 16, -10, 3, 0],
        opacity: [0, 1, 1, 1, 1],
        rotateX: [6, 3, -1, 0.3, 0],
        rotateZ: [-3, -1.2, 1.5, -0.4, 0],
        transition: {
          duration: 2,
          ease: [0.25, 1, 0.5, 1],
          times: [0, 0.36, 0.7, 0.9, 1],
          opacity: { duration: 0.5, ease: 'easeOut' },
        },
      });

      if (cancelled || phaseRef.current === 'opening') return;
      setPhase('idle');

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
    };
  }, [envelopeControls, prefersReducedMotion]);

  /* ─── 开信交互 ─── */
  const handleOpen = useCallback(async () => {
    if (phaseRef.current === 'opening') return;
    setPhase('opening');

    // 冻结信封在静止位置
    envelopeControls.stop();
    envelopeControls.set({ y: 0, x: 0, rotate: 0, rotateX: 0, rotateZ: 0 });

    // 1. 封盖翻开 + 信纸抽出 (1.9s)
    void openControls.start('open');
    await sleep(1900);

    // 2. 信封壳体下落 (0.6s)
    void openControls.start('drop_envelope');
    await sleep(600);

    // 3. 信纸放大铺满屏幕 (0.8s)
    void openControls.start('expand_letter');
    await sleep(800);

    setEnvelopeOpened(true);
  }, [envelopeControls, openControls, setEnvelopeOpened]);

  const isIdle = phase === 'idle';
  const isOpening = phase === 'opening';

  return (
    <motion.div
      className="page-paper fixed inset-0 z-50 overflow-hidden"
      exit={{ opacity: 0 }}
      initial={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      <section className="relative h-screen w-full overflow-hidden">
        {/* 背景噪点纹理 */}
        <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        {/* 背景光晕 */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.45),rgba(255,255,255,0)_28%),radial-gradient(circle_at_82%_50%,rgba(255,255,255,0.22),rgba(255,255,255,0)_26%),linear-gradient(135deg,rgba(255,255,255,0.18),rgba(194,54,67,0.04))]" />

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
            className="col-start-2 flex items-center justify-center self-center"
            initial={{ opacity: 0 }}
            animate={
              isOpening
                ? { opacity: 0, y: -40, filter: 'blur(8px)' }
                : isIdle
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 0, filter: 'blur(0px)' }
            }
            transition={{
              duration: isOpening ? 0.6 : 0.8,
              delay: isIdle && !isOpening ? 0.15 : 0,
              ease: [0.85, 0, 0.15, 1], // quintic ease-in-out
            }}
          >
            <h1
              className="font-serif text-[clamp(26px,3vw,58px)] leading-[1.02] tracking-[0.08em] text-foreground"
              style={{ textOrientation: 'upright', writingMode: 'vertical-rl' }}
            >
              与她的海大时光笺
            </h1>
          </motion.div>

          {/* ── 第3~5列：信封 ── */}
          <motion.div
            className="relative col-span-3 col-start-3 mx-auto aspect-[595/397] w-[280px] perspective-1000 sm:w-[360px] md:w-[480px] lg:w-[595px]"
            initial={{ y: '-120vh', opacity: 0, rotateX: 6, rotateZ: -3 }}
            animate={envelopeControls}
            style={{ transformOrigin: '50% 50%' }}
          >
            {/* 开信动画容器 — 通过 variants 编排子元素 */}
            <motion.div
              animate={openControls}
              className="relative h-full w-full preserve-3d"
              variants={{
                open: {
                  scale: 1.08,
                  y: 84,
                  transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] },
                },
                drop_envelope: {
                  transition: { staggerChildren: 0.02 },
                },
              }}
            >
              {/* 信封背面 */}
              <motion.div
                className="absolute inset-0 rounded-[10px] bg-[#e8e0d5] shadow-[0_26px_60px_rgba(82,63,54,0.18)]"
                variants={{
                  drop_envelope: {
                    y: 1000,
                    opacity: 0,
                    rotate: 6,
                    transition: { duration: 0.6, ease: 'easeIn' },
                  },
                  expand_letter: { y: 1000, opacity: 0, transition: { duration: 0 } },
                }}
              >
                <div className="absolute inset-0 rounded-[10px] bg-white/10" />
              </motion.div>

              {/* 信纸 */}
              <motion.div
                className="paper-panel absolute inset-4 z-10 flex origin-center flex-col items-center justify-center overflow-hidden p-6 text-center md:p-8"
                variants={{
                  open: {
                    y: -150,
                    transition: { delay: 0.7, duration: 1, type: 'spring', bounce: 0.3 },
                  },
                  drop_envelope: {
                    y: -150,
                    transition: { duration: 0.6 },
                  },
                  expand_letter: {
                    scale: 3,
                    y: 0,
                    transition: {
                      duration: 0.8,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  },
                }}
              >
                {/* 信纸内容 — 展开时快速淡出 */}
                <motion.div
                  className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-border/80 p-4 md:p-[18px]"
                  variants={{
                    expand_letter: {
                      opacity: 0,
                      transition: { duration: 0.3, ease: 'easeIn' },
                    },
                  }}
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

              {/* 底部三角折叠 */}
              <motion.div
                className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[#f0eadd]"
                style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                variants={{
                  drop_envelope: {
                    y: 1000,
                    opacity: 0,
                    rotate: -3,
                    transition: { duration: 0.6, ease: 'easeIn' },
                  },
                  expand_letter: { y: 1000, opacity: 0, transition: { duration: 0 } },
                }}
              />
              {/* 左侧三角折叠 */}
              <motion.div
                className="absolute inset-y-0 left-0 z-20 w-1/2 bg-[#f5efe4]"
                style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}
                variants={{
                  drop_envelope: {
                    y: 1000,
                    x: -80,
                    opacity: 0,
                    rotate: -8,
                    transition: { duration: 0.6, ease: 'easeIn' },
                  },
                  expand_letter: { y: 1000, opacity: 0, transition: { duration: 0 } },
                }}
              />
              {/* 右侧三角折叠 */}
              <motion.div
                className="absolute inset-y-0 right-0 z-20 w-1/2 bg-[#efe8dc]"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
                variants={{
                  drop_envelope: {
                    y: 1000,
                    x: 80,
                    opacity: 0,
                    rotate: 8,
                    transition: { duration: 0.6, ease: 'easeIn' },
                  },
                  expand_letter: { y: 1000, opacity: 0, transition: { duration: 0 } },
                }}
              />

              {/* 顶部封盖 — 3D翻转 */}
              <motion.div
                className="absolute inset-x-0 top-0 z-30 h-1/2 origin-top bg-[#e8e0d5] shadow-md"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  transformStyle: 'preserve-3d',
                }}
                variants={{
                  open: {
                    rotateX: 180,
                    zIndex: 0,
                    transition: {
                      rotateX: { duration: 0.6, ease: 'easeInOut' },
                      zIndex: { delay: 0.3 },
                    },
                  },
                  drop_envelope: {
                    y: 1000,
                    opacity: 0,
                    rotate: -5,
                    transition: { duration: 0.6, ease: 'easeIn' },
                  },
                  expand_letter: { y: 1000, opacity: 0, transition: { duration: 0 } },
                }}
              >
                <div className="backface-hidden absolute inset-0 rotate-x-180 bg-[#ded6ca]" />
              </motion.div>

              {/* 火漆印按钮 */}
              <motion.button
                className={cn(
                  'absolute left-1/2 top-1/2 z-40 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer sm:h-[82px] sm:w-[82px] md:h-[92px] md:w-[92px]',
                  isOpening && 'pointer-events-none'
                )}
                onClick={handleOpen}
                variants={{
                  open: {
                    opacity: 0,
                    scale: 1.5,
                    filter: 'blur(4px)',
                    transition: { duration: 0.3 },
                  },
                  drop_envelope: { y: 1000, opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } },
                  expand_letter: { y: 1000, opacity: 0, transition: { duration: 0 } },
                }}
                whileHover={{ rotate: 2, scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
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

              {/* 点击提示 — 呼吸闪烁 */}
              <motion.p
                className="absolute inset-x-0 -bottom-10 text-center font-serif text-[11px] tracking-[0.22em] text-muted-foreground/70 md:text-sm"
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
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
