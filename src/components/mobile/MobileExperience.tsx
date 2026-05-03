'use client';

/**
 * MobileExperience: 移动端核心体验容器
 * 负责人: Developer C
 *
 * 整合 StoryFeed, MobileDetailModal 和 StaticMapModal。
 * 持有 Lenis 平滑滚动实例，详情页打开时暂停，关闭后恢复。
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import Lenis from 'lenis';
import { StoryFeed } from './StoryFeed';
import { MobileDetailModal } from './MobileDetailModal';
import { StaticMapModal } from './StaticMapModal';
import data from '@/data/content.json';
import type { Story } from '@/lib/types';
import { flattenStoriesWithLocationName } from '@/lib/content';

export function MobileExperience() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // 初始化 Lenis 绑定到瀑布流容器
  useEffect(() => {
    const wrapper = scrollWrapperRef.current;
    const content = scrollContentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // 详情页或地图打开时暂停 Lenis，关闭后恢复
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (selectedId || isMapOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [selectedId, isMapOpen]);

  // 地图弹窗时锁定 body 滚动
  useEffect(() => {
    document.body.style.overflow = isMapOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMapOpen]);

  const allStories = useRef(flattenStoriesWithLocationName(data.locations) as Story[]);
  const currentStory = allStories.current.find(s => s.id === selectedId) ?? null;

  return (
    <div className="relative w-full h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* 1. Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="mb-0 text-xl font-serif text-stone-800 tracking-wider">与她的海大时光笺</h1>
          <p className="text-[10px] text-stone-400 font-sans uppercase tracking-[0.2em] mt-0.5">Hainan University</p>
        </div>
      </header>

      {/* 2. Story Feed List */}
      <div className="flex-1 overflow-hidden">
        <StoryFeed
          onStoryClick={(story) => setSelectedId(story.id)}
          wrapperRef={scrollWrapperRef}
          contentRef={scrollContentRef}
        />
      </div>

      {/* 3. Detail Modal（右侧滑入） */}
      <AnimatePresence mode="wait">
        {currentStory && (
          <MobileDetailModal
            key="detail-modal"
            story={currentStory}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      {/* 4. Floating Action Button (FAB) */}
      <motion.button
        className="fixed bottom-8 right-8 w-14 h-14 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center z-30 cursor-pointer"
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMapOpen(true)}
      >
        <MapIcon className="w-6 h-6" />
      </motion.button>

      {/* 5. Static Map Modal */}
      <StaticMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
    </div>
  );
}
