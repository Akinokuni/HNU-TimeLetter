'use client';

import Image from 'next/image';
import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

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

export function EnvelopeIntro() {
  const { setEnvelopeOpened } = useAppStore();
  const [isOpening, setIsOpening] = useState(false);
  const [entryStarted, setEntryStarted] = useState(false);
  const [ribbonRevealed, setRibbonRevealed] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const openControls = useAnimationControls();
  const isOpeningRef = useRef(false);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isOpeningRef.current = isOpening;
  }, [isOpening]);

  useEffect(() => {
    let active = true;
    const envelopeNode = envelopeRef.current;
    const ribbonNode = ribbonRef.current;
    const timeoutIds: number[] = [];
    let frameId = 0;
    let nestedFrameId = 0;

    if (envelopeNode) {
      envelopeNode.style.willChange = 'transform, opacity';
    }
    if (ribbonNode) {
      ribbonNode.style.willChange = 'clip-path';
    }

    frameId = window.requestAnimationFrame(() => {
      if (!active) {
        return;
      }

      nestedFrameId = window.requestAnimationFrame(() => {
        if (!active) {
          return;
        }

        setEntryStarted(true);
        setRibbonRevealed(true);
        timeoutIds.push(
          window.setTimeout(() => {
            if (!active || isOpeningRef.current) {
              return;
            }

            setTitleVisible(true);
          }, 1400)
        );
        timeoutIds.push(
          window.setTimeout(() => {
            if (!active || isOpeningRef.current) {
              return;
            }

            setHintVisible(true);
          }, 2000)
        );
        timeoutIds.push(
          window.setTimeout(() => {
            if (envelopeNode) {
              envelopeNode.style.willChange = '';
            }
            if (ribbonNode) {
              ribbonNode.style.willChange = '';
            }
          }, 2200)
        );
      });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(nestedFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      if (envelopeNode) {
        envelopeNode.style.willChange = '';
      }
      if (ribbonNode) {
        ribbonNode.style.willChange = '';
      }
    };
  }, []);

  const handleOpen = async () => {
    if (isOpening) return;
    isOpeningRef.current = true;
    setIsOpening(true);
    setTitleVisible(false);
    setHintVisible(false);
    if (envelopeRef.current) {
      envelopeRef.current.style.willChange = 'transform, opacity';
    }

    void openControls.start('open');
    await new Promise((resolve) => setTimeout(resolve, 1900));

    void openControls.start('drop_envelope');
    await new Promise((resolve) => setTimeout(resolve, 600));

    void openControls.start('expand_letter');
    await new Promise((resolve) => setTimeout(resolve, 800));

    setEnvelopeOpened(true);
  };

  return (
    <motion.div
      className="page-paper fixed inset-0 z-50 overflow-hidden"
      exit={{ opacity: 0 }}
      initial={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      <section className="relative h-screen w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.45),rgba(255,255,255,0)_28%),radial-gradient(circle_at_82%_50%,rgba(255,255,255,0.22),rgba(255,255,255,0)_26%),linear-gradient(135deg,rgba(255,255,255,0.18),rgba(194,54,67,0.04))]" />

        <div className="relative z-10 grid h-full w-full grid-cols-5 items-center">
          <div
            ref={ribbonRef}
            className={cn(
              'hero-ribbon-clip col-start-1 flex h-full items-center justify-end overflow-visible',
              ribbonRevealed && 'hero-ribbon-revealed'
            )}
          >
            <TwistedRibbon />
          </div>

          <div
            className={cn(
              'col-start-2 flex items-center justify-center self-center transition-opacity duration-[800ms] [transition-timing-function:cubic-bezier(0.83,0,0.17,1)]',
              titleVisible ? 'opacity-100' : 'opacity-0'
            )}
          >
            <h1
              className="font-serif text-[clamp(26px,3vw,58px)] leading-[1.02] tracking-[0.08em] text-foreground"
              style={{
                textOrientation: 'upright',
                writingMode: 'vertical-rl',
              }}
            >
              与她的海大时光笺
            </h1>
          </div>

          <motion.div
            className={cn(
              'hero-envelope-gpu relative col-start-3 col-span-3 mx-auto aspect-[595/397] w-[280px] perspective-1000 sm:w-[360px] md:w-[480px] lg:w-[595px]',
              entryStarted && !isOpening && 'hero-envelope-entry'
            )}
            ref={envelopeRef}
            style={{ transformOrigin: '50% 50%' }}
          >
            <motion.div
              animate={openControls}
              className="relative h-full w-full preserve-3d"
              variants={{
                drop_envelope: {
                  transition: { staggerChildren: 0.02 },
                },
                open: {
                  scale: 1.08,
                  y: 84,
                  transition: { duration: 0.8, ease: 'backOut' },
                },
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-[10px] bg-[#e8e0d5] shadow-[0_26px_60px_rgba(82,63,54,0.18)]"
                variants={{
                  drop_envelope: {
                    opacity: 0,
                    transition: { duration: 0.6, ease: 'easeIn' },
                    y: 1000,
                  },
                  expand_letter: { opacity: 0, transition: { duration: 0 }, y: 1000 },
                }}
              >
                <div className="absolute inset-0 rounded-[10px] bg-white/10" />
              </motion.div>

              <motion.div
                className="paper-panel absolute inset-4 z-10 flex origin-bottom flex-col items-center justify-center p-6 text-center md:p-8"
                variants={{
                  drop_envelope: {
                    transition: { duration: 0.6 },
                    y: -150,
                  },
                  expand_letter: {
                    opacity: 0,
                    scale: 5,
                    transition: { duration: 0.8, ease: 'easeInOut' },
                    y: 0,
                  },
                  open: {
                    transition: { bounce: 0.3, delay: 0.7, duration: 1, type: 'spring' },
                    y: -150,
                  },
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-border/80 p-4 md:p-[18px]">
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
                </div>
              </motion.div>

              <motion.div
                className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-[#f0eadd]"
                style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
                variants={{
                  drop_envelope: {
                    opacity: 0,
                    transition: { duration: 0.6, ease: 'easeIn' },
                    y: 1000,
                  },
                  expand_letter: { opacity: 0, transition: { duration: 0 }, y: 1000 },
                }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 z-20 w-1/2 bg-[#f5efe4]"
                style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}
                variants={{
                  drop_envelope: {
                    opacity: 0,
                    transition: { duration: 0.6, ease: 'easeIn' },
                    y: 1000,
                  },
                  expand_letter: { opacity: 0, transition: { duration: 0 }, y: 1000 },
                }}
              />
              <motion.div
                className="absolute inset-y-0 right-0 z-20 w-1/2 bg-[#efe8dc]"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 50%)' }}
                variants={{
                  drop_envelope: {
                    opacity: 0,
                    transition: { duration: 0.6, ease: 'easeIn' },
                    y: 1000,
                  },
                  expand_letter: { opacity: 0, transition: { duration: 0 }, y: 1000 },
                }}
              />

              <motion.div
                className="absolute inset-x-0 top-0 z-30 h-1/2 origin-top bg-[#e8e0d5] shadow-md"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  transformStyle: 'preserve-3d',
                }}
                variants={{
                  drop_envelope: {
                    opacity: 0,
                    transition: { duration: 0.6, ease: 'easeIn' },
                    y: 1000,
                  },
                  expand_letter: { opacity: 0, transition: { duration: 0 }, y: 1000 },
                  open: {
                    rotateX: 180,
                    transition: {
                      rotateX: { duration: 0.6, ease: 'easeInOut' },
                      zIndex: { delay: 0.3 },
                    },
                    zIndex: 0,
                  },
                }}
              >
                <div className="backface-hidden absolute inset-0 rotate-x-180 bg-[#ded6ca]" />
              </motion.div>

              <motion.button
                className={cn(
                  'absolute left-1/2 top-1/2 z-40 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer sm:h-[82px] sm:w-[82px] md:h-[92px] md:w-[92px]',
                  isOpening && 'pointer-events-none'
                )}
                onClick={handleOpen}
                variants={{
                  drop_envelope: {
                    opacity: 0,
                    transition: { duration: 0.6, ease: 'easeIn' },
                    y: 1000,
                  },
                  expand_letter: { opacity: 0, transition: { duration: 0 }, y: 1000 },
                  open: {
                    filter: 'blur(4px)',
                    opacity: 0,
                    scale: 1.5,
                    transition: { duration: 0.3 },
                  },
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

              <motion.p
                className={cn(
                  'absolute inset-x-0 -bottom-10 translate-y-2 text-center font-serif text-[11px] tracking-[0.22em] text-muted-foreground/70 transition-[opacity,transform] duration-500 ease-in-out md:text-sm',
                  hintVisible ? 'translate-y-0 opacity-55' : 'opacity-0'
                )}
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
