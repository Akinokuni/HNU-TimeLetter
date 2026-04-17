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

export default function Home() {
  const { isEnvelopeOpened, isTransitioning, setTransitioning } = useAppStore();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useVirtualScroll(mounted && !isEnvelopeOpened && !isMobile);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isEnvelopeOpened && isTransitioning) {
      transitionTimerRef.current = setTimeout(() => {
        setTransitioning(false);
      }, 1400);
    }

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [isEnvelopeOpened, isTransitioning, setTransitioning]);

  if (!mounted) {
    return <div className="page-paper fixed inset-0" />;
  }

  return (
    <main className="relative w-full min-h-screen">
      <Footer />

      <AnimatePresence mode="wait">
        {!isEnvelopeOpened ? (
          <motion.div
            key="intro-flow"
            className="relative w-full"
            style={{ zIndex: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <EnvelopeIntro />
            <ScrollSections />
            <FooterSpacer />
          </motion.div>
        ) : (
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

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="transition-overlay"
            className="page-paper fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <motion.p
              className="font-serif text-lg tracking-[0.22em] text-muted-foreground"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              加载中…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function FooterSpacer() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const measure = () => setHeight(footer.offsetHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return <div style={{ height }} aria-hidden="true" />;
}
