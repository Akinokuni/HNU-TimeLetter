'use client';

import Image from 'next/image';
import { motion, useAnimationControls, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ShardData {
  id: number;
  clipPath: string;
  x: number;
  y: number;
  rotate: number;
  delay: number;
}

function WaxSealShards({ isShattered, sizeClass }: { isShattered: boolean; sizeClass: string }) {
  const shards = useMemo<ShardData[]>(
    () => [
      { id: 0, clipPath: 'polygon(30% 0%, 70% 0%, 55% 45%, 45% 45%)', x: 2, y: -90, rotate: -25, delay: 0 },
      { id: 1, clipPath: 'polygon(70% 0%, 100% 0%, 100% 35%, 55% 45%)', x: 80, y: -70, rotate: 35, delay: 0.02 },
      { id: 2, clipPath: 'polygon(100% 35%, 100% 70%, 60% 55%, 55% 45%)', x: 95, y: 15, rotate: 50, delay: 0.04 },
      { id: 3, clipPath: 'polygon(100% 70%, 100% 100%, 65% 100%, 55% 60%)', x: 70, y: 85, rotate: -30, delay: 0.03 },
      { id: 4, clipPath: 'polygon(55% 60%, 65% 100%, 35% 100%, 45% 60%)', x: -5, y: 95, rotate: 15, delay: 0.05 },
      { id: 5, clipPath: 'polygon(0% 100%, 35% 100%, 45% 60%, 40% 55%, 0% 65%)', x: -75, y: 80, rotate: -45, delay: 0.02 },
      { id: 6, clipPath: 'polygon(0% 65%, 40% 55%, 45% 45%, 0% 35%)', x: -90, y: 10, rotate: 40, delay: 0.04 },
      { id: 7, clipPath: 'polygon(0% 0%, 30% 0%, 45% 45%, 0% 35%)', x: -80, y: -75, rotate: -35, delay: 0.01 },
    ],
    []
  );

  return (
    <AnimatePresence>
      {isShattered &&
        shards.map((shard) => (
          <motion.div
            key={shard.id}
            className={cn('pointer-events-none absolute left-1/2 top-1/2 z-40', sizeClass)}
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

function TwistedRibbon() {
  return (
    <div aria-hidden="true" className="pointer-events-none h-full w-[100px] shrink-0">
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
          <linearGradient gradientUnits="userSpaceOnUse" id="hero-ribbon-top" x1="50" x2="50" y1="-540" y2="540">
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

type Phase = 'loading' | 'entering' | 'idle' | 'opening';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function calcLetterScale(): number {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let envelopeWidth = 595;
  if (viewportWidth < 640) envelopeWidth = 280;
  else if (viewportWidth < 768) envelopeWidth = 360;
  else if (viewportWidth < 1024) envelopeWidth = 480;

  const envelopeHeight = envelopeWidth * (397 / 595);
  const letterWidth = envelopeWidth - 32;
  const letterHeight = envelopeHeight - 32;

  const scaleX = (viewportWidth / letterWidth) * 1.2;
  const scaleY = (viewportHeight / letterHeight) * 1.2;

  return Math.max(scaleX, scaleY);
}

function calcLetterCenterOffset(): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const gridColumnStart = (2 / 5) * viewportWidth;
  const gridColumnSpan = (3 / 5) * viewportWidth;
  const envelopeCenterX = gridColumnStart + gridColumnSpan / 2;
  const envelopeCenterY = viewportHeight / 2;

  return {
    x: viewportWidth / 2 - envelopeCenterX,
    y: viewportHeight / 2 - envelopeCenterY,
  };
}

export function EnvelopeIntro() {
  const { setEnvelopeOpened, setTransitioning } = useAppStore();
  const [phase, setPhase] = useState<Phase>('loading');
  const [ribbonRevealed, setRibbonRevealed] = useState(false);
  const [isShattered, setIsShattered] = useState(false);
  const phaseRef = useRef<Phase>('loading');

  const envelopeControls = useAnimationControls();
  const openControls = useAnimationControls();
  const flapControls = useAnimationControls();
  const letterControls = useAnimationControls();
  const shellDropControls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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

      await sleep(1500);
      const currentPhase = phaseRef.current as Phase;
      if (cancelled || currentPhase === 'opening') return;

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

      if (cancelled || phaseRef.current === 'opening') return;
      setPhase('idle');

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

  const handleOpen = useCallback(async () => {
    if (phaseRef.current === 'opening') return;
    setPhase('opening');

    window.scrollTo({ top: 0, behavior: 'auto' });

    envelopeControls.stop();
    envelopeControls.set({ y: 0, x: 0, rotate: 0, rotateX: 0, rotateZ: 0 });
    openControls.stop();
    openControls.set({ x: 0, y: 0, scale: 1 });
    flapControls.stop();
    flapControls.set({ rotateX: 0, zIndex: 30 });
    letterControls.stop();
    letterControls.set({ y: 0, opacity: 1 });
    shellDropControls.stop();
    shellDropControls.set({ y: 0, rotate: 0, opacity: 1 });
    setIsShattered(true);

    if (prefersReducedMotion) {
      setTransitioning(true);
      setEnvelopeOpened(true);
      return;
    }

    await sleep(120);

    await flapControls.start({
      rotateX: 180,
      zIndex: 0,
      transition: {
        rotateX: { duration: 0.48, ease: [0.32, 0.72, 0, 1] },
        zIndex: { delay: 0.22, duration: 0, type: 'tween' },
      },
    });

    await sleep(80);

    await letterControls.start({
      y: -172,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    });

    const centerOffset = calcLetterCenterOffset();

    await Promise.all([
      shellDropControls.start({
        y: '105vh',
        rotate: 6,
        opacity: 0,
        transition: {
          duration: 0.92,
          ease: [0.55, 0, 1, 0.45],
          opacity: { delay: 0.56, duration: 0.24 },
        },
      }),
      openControls.start({
        x: centerOffset.x,
        y: centerOffset.y - 24,
        scale: 1.04,
        transition: {
          duration: 0.78,
          ease: [0.22, 1, 0.36, 1],
        },
      }),
    ]);

    setTransitioning(true);

    await openControls.start({
      scale: calcLetterScale(),
      transition: {
        duration: 0.82,
        ease: [0.22, 1, 0.36, 1],
      },
    });

    setEnvelopeOpened(true);
  }, [
    envelopeControls,
    flapControls,
    letterControls,
    openControls,
    prefersReducedMotion,
    setEnvelopeOpened,
    setTransitioning,
    shellDropControls,
  ]);

  const isIdle = phase === 'idle';
  const isOpening = phase === 'opening';
  const waxSealSizeClass = 'h-[72px] w-[72px] sm:h-[82px] sm:w-[82px] md:h-[92px] md:w-[92px]';

  return (
    <div className="page-paper relative z-50 w-full">
      <section className="relative h-screen w-full overflow-hidden">
        <div className="relative z-10 grid h-full w-full grid-cols-5 items-center">
          <div
            className={cn(
              'hero-ribbon-clip col-start-1 flex h-full items-center justify-end overflow-visible',
              ribbonRevealed && 'hero-ribbon-revealed'
            )}
          >
            <TwistedRibbon />
          </div>

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
              ease: [0.85, 0, 0.15, 1],
            }}
          >
            <h1
              className="font-serif text-[clamp(26px,3vw,58px)] leading-[1.02] tracking-[0.08em] text-foreground"
              style={{ textOrientation: 'upright', writingMode: 'vertical-rl' }}
            >
              与她的海大时光笺
            </h1>
          </motion.div>

          <motion.div
            className="relative col-span-3 col-start-3 mx-auto aspect-[595/397] w-[280px] perspective-1000 sm:w-[360px] md:w-[480px] lg:w-[595px]"
            initial={{ y: '-120vh', opacity: 0, rotateX: 6, rotateZ: -5 }}
            animate={envelopeControls}
            style={{ transformOrigin: '50% 50%' }}
          >
            <motion.div
              animate={openControls}
              className="relative h-full w-full preserve-3d"
            >
              <motion.div className="absolute inset-0" animate={shellDropControls}>
                <div className="absolute inset-0 rounded-[10px] bg-[#e8e0d5] shadow-[0_26px_60px_rgba(82,63,54,0.18)]">
                  <div className="absolute inset-0 rounded-[10px] bg-white/10" />
                </div>

                <div
                  className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[#f0eadd]"
                  style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                />
                <div
                  className="absolute inset-y-0 left-0 z-20 w-1/2 bg-[#f5efe4]"
                  style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}
                />
                <div
                  className="absolute inset-y-0 right-0 z-20 w-1/2 bg-[#efe8dc]"
                  style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
                />

                <motion.div
                  animate={flapControls}
                  className="absolute inset-x-0 top-0 z-30 h-1/2 origin-top bg-[#e8e0d5] shadow-md"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="backface-hidden absolute inset-0 rotate-x-180 bg-[#ded6ca]" />
                </motion.div>

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

                <WaxSealShards isShattered={isShattered} sizeClass={waxSealSizeClass} />
              </motion.div>

              <motion.div
                animate={letterControls}
                className="paper-panel absolute inset-4 z-10 flex origin-center flex-col items-center justify-center overflow-hidden p-6 text-center md:p-8"
              >
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

        <motion.p
          className="absolute bottom-[3%] left-[70%] z-10 -translate-x-1/2 text-center font-serif text-[11px] tracking-[0.22em] text-muted-foreground/70 md:text-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={isIdle ? { opacity: [0.35, 0.65, 0.35], y: 0 } : { opacity: 0, y: 6 }}
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
