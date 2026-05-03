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
        <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-background">
          {/* 头像 */}
          <motion.div
            key={`avatar-${story.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative size-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white shrink-0"
          >
            <Image src={getStoryAvatarUrl(story)} alt={story.characterName} fill className="object-cover" sizes="40px" />
          </motion.div>

          {/* 角色名 + 地点，同一行，垂直居中 */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-[15px] font-serif text-stone-800 tracking-[0.12em] shrink-0">{story.characterName}</span>
            <span className="inline-flex items-center gap-1 shrink-0 bg-paper-strong text-ink text-[10px] font-sans tracking-wide px-2 py-[3px] rounded">
              <MapPin className="size-[10px] shrink-0" />
              {story.locationName}
            </span>
          </div>

          {/* 关闭按钮：48×48 触摸热区 */}
          <button
            aria-label="关闭"
            onClick={onClose}
            className="shrink-0 -mr-1 size-12 flex items-center justify-center text-stone-500 active:text-stone-800"
          >
            <X className="size-[18px]" strokeWidth={3} />
          </button>
        </header>

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
              className="text-reading text-stone-700"
            >
              {story.content.split(/\n\n+/).map((para, i) => (
                <p key={i} className="mb-[1em] last:mb-0 whitespace-pre-wrap">{para.trim()}</p>
              ))}
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
