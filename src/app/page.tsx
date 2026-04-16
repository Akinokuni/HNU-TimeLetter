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
    <main className="page-paper relative w-full min-h-screen">
      {/* 全局背景噪音与光效 (Persistent Background) */}
      <div className="fixed inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-multiply z-0" />

      <AnimatePresence mode="wait">
        {!isEnvelopeOpened ? (
          /* ── 信封开屏 + 向下滚动延伸页面 ── */
          <motion.div
            key="intro-flow"
            className="relative w-full"
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            {/* 首屏：信封 */}
            <EnvelopeIntro />

            {/* 下滚页面群：关于企划 → 关于我们 → 鸣谢 → 页脚 */}
            <ScrollSections />
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
