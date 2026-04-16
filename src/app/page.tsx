'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks';
import { useVirtualScroll } from '@/lib/useVirtualScroll';
import { EnvelopeIntro } from '@/components/shared/EnvelopeIntro';
import { InteractiveMap } from '@/components/desktop/InteractiveMap';
import { MobileExperience } from '@/components/mobile/MobileExperience';
import { ScrollSections } from '@/components/sections/ScrollSections';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  const { isEnvelopeOpened } = useAppStore();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // 虚拟滚动动量：仅在桌面端 + 信封未打开（可滚动浏览关于页面）时启用
  useVirtualScroll(mounted && !isEnvelopeOpened && !isMobile);

  // 避免 SSR Hydration 问题
  useEffect(() => {
    setMounted(true);
  }, []);

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
