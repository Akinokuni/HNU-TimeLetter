'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import type { Story } from '@/lib/types';
import { getStoryAvatarUrl, getStoryMainImageUrl } from '@/lib/content';

interface MobileDetailModalProps {
  story: Story | null;
  onClose: () => void;
}

/**
 * MobileDetailModal: 移动端单故事沉浸阅读视图
 * 负责人: Developer C
 *
 * 点击卡片后从右侧整页滑入，关闭时向右退出。
 * 右上角 X 为唯一退出入口。
 */
export function MobileDetailModal({ story, onClose }: MobileDetailModalProps) {

  if (!story) return null;

  return (
    <motion.div className="fixed inset-0 z-[1200]">
      {/* 背景遮罩：独立 opacity 动画 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 主内容：从右侧整页滑入 */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-background flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定顶部 header：不随内容滚动 */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-stone-100 bg-background flex-shrink-0">
          <div className="flex items-center gap-4">
            <motion.div
              key={`avatar-${story.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex-shrink-0"
            >
              <Image src={getStoryAvatarUrl(story)} alt={story.characterName} fill className="object-cover" sizes="48px" />
            </motion.div>
            <div className="flex flex-col">
              <h2 className="text-lg font-serif text-stone-800 tracking-tight mb-1 leading-tight">{story.characterName}</h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] text-white bg-stone-900 px-2 py-0.5 rounded font-sans uppercase tracking-widest">
                  <MapPin className="w-2 h-2" />
                  {story.locationName}
                </span>
                <span className="text-[10px] text-stone-400 font-serif">{story.date}</span>
              </div>
            </div>
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center text-stone-500 active:text-stone-800 flex-shrink-0"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 可滚动主体区域：图片 + 正文 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {/* 图片区域 */}
          <div className="relative w-full">
            <Image
              src={getStoryMainImageUrl(story)}
              alt={story.characterName}
              width={1200}
              height={1200}
              className="w-full h-auto object-contain pointer-events-none"
              priority
              sizes="100vw"
            />
          </div>

          {/* 正文区域 */}
          <div className="px-8 pt-8 pb-16 flex flex-col">
            <motion.div
              key={`content-${story.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-reading text-stone-700 space-y-6 whitespace-pre-wrap"
            >
              {story.content}
            </motion.div>

            <div className="mt-12 pt-6 border-t border-stone-100">
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-serif uppercase tracking-[0.2em]">
                <span>By {story.author}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
