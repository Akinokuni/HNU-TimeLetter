'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/lib/hooks';
import { EnvelopeIntro } from '@/components/shared/EnvelopeIntro';
import { InteractiveMap } from '@/components/desktop/InteractiveMap';
import { MobileExperience } from '@/components/mobile/MobileExperience';

export default function Home() {
  const { isEnvelopeOpened } = useAppStore();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // 避免 SSR Hydration 问题
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[#fdfbf7]" />
    );
  }

  return (
    <main
      className={`relative w-full bg-[#fdfbf7] ${
        isEnvelopeOpened ? 'min-h-screen' : 'h-screen overflow-hidden'
      }`}
    >
      {/* 全局背景噪音与光效 (Persistent Background) */}
      <div className="fixed inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-multiply z-0" />
      
      <AnimatePresence mode="wait">
        {!isEnvelopeOpened ? (
          <EnvelopeIntro key="envelope" />
        ) : (
          <motion.div
            key="content"
            className="relative z-10 w-full min-h-screen"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {isMobile ? <MobileExperience /> : <InteractiveMap />}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
