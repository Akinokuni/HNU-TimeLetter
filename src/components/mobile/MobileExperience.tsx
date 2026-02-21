'use client';

/**
 * MobileExperience: 移动端核心体验容器
 * 负责人: Developer C
 * 
 * 整合 StoryFeed, MobileDetailModal 和 StaticMapModal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import { StoryFeed } from './StoryFeed';
import { MobileDetailModal } from './MobileDetailModal';
import { StaticMapModal } from './StaticMapModal';
import data from '@/data/content.json';

interface Story {
  id: string;
  characterId: string;
  characterName: string;
  avatarUrl: string;
  mainImageUrl: string;
  content: string;
  author: string;
  date: string;
  locationId: string;
  locationName?: string;
}

export function MobileExperience() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 获取所有有故事的地点
  const locationsWithStories = useMemo(() => {
    return data.locations.filter(loc => loc.stories.length > 0);
  }, []);

  // 扁平化全局故事列表
  const allStories = useMemo(() => {
    return data.locations.flatMap(loc => 
      loc.stories.map(story => ({
        ...story,
        locationName: loc.name
      }))
    ) as Story[];
  }, []);

  const currentStory = useMemo(() => 
    allStories.find(s => s.id === selectedId) || null
  , [selectedId, allStories]);

  // 导航逻辑：同地点切换 (Local)
  const locationStories = useMemo(() => {
    if (!currentStory) return [];
    return allStories.filter(s => s.locationId === currentStory.locationId);
  }, [currentStory, allStories]);

  const handleNextLocal = () => {
    const currentIndex = locationStories.findIndex(s => s.id === selectedId);
    if (currentIndex < locationStories.length - 1) setSelectedId(locationStories[currentIndex + 1].id);
  };

  const handlePrevLocal = () => {
    const currentIndex = locationStories.findIndex(s => s.id === selectedId);
    if (currentIndex > 0) setSelectedId(locationStories[currentIndex - 1].id);
  };

  // 导航逻辑：跨地点切换 (Global/Location Jump)
  const handleNextLocation = () => {
    if (!currentStory) return;
    const locIdx = locationsWithStories.findIndex(l => l.id === currentStory.locationId);
    if (locIdx < locationsWithStories.length - 1) setSelectedId(locationsWithStories[locIdx + 1].stories[0].id);
  };

  const handlePrevLocation = () => {
    if (!currentStory) return;
    const locIdx = locationsWithStories.findIndex(l => l.id === currentStory.locationId);
    if (locIdx > 0) setSelectedId(locationsWithStories[locIdx - 1].stories[0].id);
  };

  // 滚动穿透锁定 (符合文档 4.2 要求)
  useEffect(() => {
    if (selectedId || isMapOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedId, isMapOpen]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfbf7] flex flex-col overflow-hidden">
      {/* 1. Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-serif text-stone-800 tracking-wider">与她的海大时光笺</h1>
          <p className="text-[10px] text-stone-400 font-sans uppercase tracking-[0.2em] mt-0.5">Hainan University</p>
        </div>
      </header>

      {/* 2. Story Feed List */}
      <div className="flex-1 overflow-hidden">
        <StoryFeed onStoryClick={(story) => setSelectedId(story.id)} />
      </div>

      {/* 3. Detail Modal (Shared Layout Animation) */}
      <AnimatePresence mode="wait">
        {currentStory && (
          <MobileDetailModal 
            key="detail-modal" 
            story={currentStory} 
            onClose={() => setSelectedId(null)} 
            onNextLocal={handleNextLocal}
            onPrevLocal={handlePrevLocal}
            hasMoreLocal={locationStories.findIndex(s => s.id === selectedId) < locationStories.length - 1}
            hasPrevLocal={locationStories.findIndex(s => s.id === selectedId) > 0}
            onNextLocation={handleNextLocation}
            onPrevLocation={handlePrevLocation}
            hasMoreLocation={locationsWithStories.findIndex(l => l.id === currentStory.locationId) < locationsWithStories.length - 1}
            hasPrevLocation={locationsWithStories.findIndex(l => l.id === currentStory.locationId) > 0}
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
