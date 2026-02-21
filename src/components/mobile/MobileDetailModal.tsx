'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

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

interface MobileDetailModalProps {
  story: Story | null;
  onClose: () => void;
  onNextLocal?: () => void;
  onPrevLocal?: () => void;
  hasMoreLocal?: boolean;
  hasPrevLocal?: boolean;
  onNextLocation?: () => void;
  onPrevLocation?: () => void;
  hasMoreLocation?: boolean;
  hasPrevLocation?: boolean;
}

/**
 * MobileDetailModal: 移动端详情弹窗
 * 负责人: Developer C
 * 
 * 优化: 箭头透明化，且在 1s 不活动后自动淡出
 */
export function MobileDetailModal({ 
  story, 
  onClose, 
  onNextLocal, 
  onPrevLocal,
  hasMoreLocal,
  hasPrevLocal,
  onNextLocation,
  onPrevLocation,
  hasMoreLocation,
  hasPrevLocation
}: MobileDetailModalProps) {
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0]);
  const contentScale = useTransform(dragY, [0, 300], [1, 0.95]);
  
  // 控制箭头显示状态
  const [controlsVisible, setControlsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1s 自动淡出逻辑
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleInteraction = () => {
      setControlsVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setControlsVisible(false);
      }, 1000);
    };

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleInteraction);
    }
    // 同时也监听整个模态框的点击/触摸
    window.addEventListener('touchstart', handleInteraction);

    // 初始状态：1s 后自动隐藏
    timeoutId = setTimeout(() => setControlsVisible(false), 1000);

    return () => {
      if (scrollEl) scrollEl.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!story) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden"
      style={{ opacity: backdropOpacity }}
    >
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full h-[96dvh] bg-[#fdfbf7] rounded-t-[40px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] overflow-hidden"
        layoutId={`story-card-${story.id}`}
        style={{ y: dragY, scale: contentScale }}
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 60 || info.velocity.y > 300) {
            onClose();
          } else {
            dragY.set(0);
          }
        }}
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-stone-300/60 rounded-full z-30" />

        {/* --- 浮动导航箭头：移除背景，增加淡出动画 --- */}
        <motion.div 
          className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-40"
          animate={{ opacity: controlsVisible ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          {hasPrevLocal ? (
            <button
              className="w-14 h-14 flex items-center justify-center text-stone-400/80 pointer-events-auto active:scale-90"
              onClick={(e) => { e.stopPropagation(); onPrevLocal?.(); }}
            >
              <ChevronLeft className="w-10 h-10 drop-shadow-md" />
            </button>
          ) : <div />}

          {hasMoreLocal ? (
            <button
              className="w-14 h-14 flex items-center justify-center text-stone-400/80 pointer-events-auto active:scale-90"
              onClick={(e) => { e.stopPropagation(); onNextLocal?.(); }}
            >
              <ChevronRight className="w-10 h-10 drop-shadow-md" />
            </button>
          ) : <div />}
        </motion.div>

        {/* 可滚动的主体区域 */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col"
        >
          {/* 图片区域 */}
          <div className="relative w-full aspect-[4/5] flex-shrink-0 bg-stone-200">
            <AnimatePresence mode="wait">
              <motion.div
                key={story.id}
                layoutId={`story-img-${story.id}`} // 关键修复：添加 layoutId
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Image src={story.mainImageUrl} alt={story.characterName} fill className="object-cover" priority unoptimized />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

            <button className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center text-white bg-black/30 backdrop-blur-md rounded-full z-20" onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 文本区域 */}
          <div 
            className="px-8 pt-8 pb-32 flex flex-col"
            onTouchStart={(e) => {
              (window as any).startX = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const deltaX = e.changedTouches[0].clientX - (window as any).startX;
              if (deltaX > 80 && hasPrevLocation && onPrevLocation) onPrevLocation();
              else if (deltaX < -80 && hasMoreLocation && onNextLocation) onNextLocation();
            }}
          >
            <div className="flex items-center gap-5 mb-8">
              <motion.div key={`avatar-${story.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-16 h-16 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
                <Image src={story.avatarUrl} alt={story.characterName} fill className="object-cover" unoptimized />
              </motion.div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-serif text-stone-800 tracking-tight mb-2">{story.characterName}</h2>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-white bg-stone-900 px-2 py-0.5 rounded font-sans uppercase tracking-widest">
                    <MapPin className="w-2 h-2" />
                    {story.locationName}
                  </span>
                  <span className="text-[10px] text-stone-400 font-serif">{story.date}</span>
                </div>
              </div>
            </div>

            <motion.div key={`content-${story.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-stone-700 text-[17px] leading-[1.8] space-y-6 whitespace-pre-wrap">
              {story.content}
            </motion.div>
            
            <div className="mt-12 pt-6 border-t border-stone-100 flex flex-col gap-6">
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-serif uppercase tracking-[0.2em]">
                <span>By {story.author}</span>
              </div>
              
              <div className="flex flex-col gap-2 p-4 bg-stone-50 rounded-2xl border border-stone-100/50">
                <div className="flex items-center gap-2 opacity-50">
                  <ChevronLeft className="w-3 h-3" /><ChevronRight className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-widest font-medium">屏幕两侧箭头: 翻阅当前地点</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 text-stone-600">
                  <span className="text-[9px] uppercase tracking-widest font-bold">左右滑动手势: 切换下一个地点</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
