'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks';
import { useVirtualScroll } from '@/lib/useVirtualScroll';
import { EnvelopeIntro } from '@/components/shared/EnvelopeIntro';
import { InteractiveMap } from '@/components/desktop/InteractiveMap';
import { MobileExperience } from '@/components/mobile/MobileExperience';
import { ScrollSections } from '@/components/sections/ScrollSections';
import { Footer } from '@/components/sections/Footer';
import { CustomScrollbar } from '@/components/shared/CustomScrollbar';

export default function Home() {
  const { isEnvelopeOpened, isTransitioning, setTransitioning, isIntroReady } =
    useAppStore();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 开屏入场动画期间禁止下滑：仅在入场动画播完后启用 Lenis 与自定义滑块
  const lenis = useVirtualScroll(
    mounted && !isEnvelopeOpened && !isMobile && isIntroReady,
  );
  const scrollbarEnabled =
    mounted && !isEnvelopeOpened && !isMobile && isIntroReady;

  // 避免 SSR Hydration 问题
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.add('home-scrollbar-hidden');
    document.body.classList.add('home-scrollbar-hidden');

    return () => {
      document.documentElement.classList.remove('home-scrollbar-hidden');
      document.body.classList.remove('home-scrollbar-hidden');
    };
  }, []);

  // 开屏动画未播完 + 信封未打开时锁定纵向滚动
  useEffect(() => {
    const locked = mounted && !isEnvelopeOpened && !isIntroReady;
    if (locked) {
      document.documentElement.classList.add('intro-scroll-locked');
      document.body.classList.add('intro-scroll-locked');
      return () => {
        document.documentElement.classList.remove('intro-scroll-locked');
        document.body.classList.remove('intro-scroll-locked');
      };
    }
  }, [mounted, isEnvelopeOpened, isIntroReady]);

  // 过渡遮罩自动消退：当地图内容渲染完成后延时淡出
  useEffect(() => {
    if (isEnvelopeOpened && isTransitioning) {
      transitionTimerRef.current = setTimeout(() => {
        setTransitioning(false);
      }, 2500); // 等待 AnimatePresence exit(1s) + 地图入场(1.5s) 后消退
    }
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [isEnvelopeOpened, isTransitioning, setTransitioning]);

  if (!mounted) {
    return (
      <div className="page-paper fixed inset-0" />
    );
  }

  return (
    <main className="relative w-full min-h-screen">
      {/* ── 页脚：固定在视口底部 z-0，被上方内容遮盖 ── */}
      <Footer />

      <AnimatePresence mode="wait">
        {!isEnvelopeOpened ? (
          /* ── 信封开屏 + 向下滚动延伸页面 ── */
          <motion.div
            key="intro-flow"
            className="relative w-full"
            style={{ zIndex: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            {/* 首屏：信封 — EnvelopeIntro 自带 page-paper 背景 */}
            <EnvelopeIntro />

            {/* 下滚页面群 — ScrollSections 自带 page-paper 背景 */}
            <ScrollSections />

            {/* 页脚占位空间 — 无背景，让固定页脚从下方"揭露" */}
            <FooterSpacer />
          </motion.div>
        ) : (
          /* ── 主体验：地图 / 集邮册 ── */
          <motion.div
            key="content"
            className="relative z-10 w-full min-h-screen"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            {isMobile ? <MobileExperience /> : <InteractiveMap />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 过渡遮罩：信纸放大→地图加载期间覆盖页脚 ── */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="transition-overlay"
            className="fixed inset-0 z-[100] page-paper flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            {/* 加载动画：三点脉冲 */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block w-2.5 h-2.5 rounded-full bg-[#c23643]"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <motion.p
              className="font-serif text-muted-foreground text-lg tracking-[0.22em]"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              加载中…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 自定义滑块：与 Lenis 同步的 DOM 滚动条 ── */}
      <CustomScrollbar enabled={scrollbarEnabled} lenis={lenis} />
    </main>
  );
}

/**
 * 页脚占位组件：测量固定页脚高度，在文档流中腾出相同空间。
 * 滚动到此区域时，固定页脚从底部被"揭露"。
 * 注意：不设置背景色，保持透明，让下方固定页脚可见。
 */
function FooterSpacer() {
  const [h, setH] = useState(0);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const measure = () => setH(footer.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  return <div style={{ height: h }} aria-hidden="true" />;
}
