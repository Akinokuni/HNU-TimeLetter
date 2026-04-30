'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import data from '@/data/content.json';
import type { Story } from '@/lib/types';
import { flattenStoriesWithLocationName, getStoryAvatarUrl, getStoryMainImageUrl } from '@/lib/content';

interface StoryFeedProps {
  onStoryClick: (story: Story) => void;
}

/**
 * StoryCard: 单个故事卡片组件
 * 包含缩略图、角色名和地点信息
 */
function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId={`story-card-${story.id}`}
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
      }}
      className="flex flex-col bg-white rounded-md shadow-sm border border-stone-100 overflow-hidden cursor-pointer mb-4 break-inside-avoid"
      onClick={onClick}
      whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
    >
      <div className="relative w-full bg-stone-100">
        <motion.div
          layoutId={`story-img-${story.id}`}
          className="w-full"
        >
          {/* 使用原生 img 标签配合 h-auto 破除固有宽高比约束，实现真实瀑布流错落高度 */}
          <img
            src={getStoryMainImageUrl(story)}
            alt={story.characterName}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </div>

      <div className="p-3 bg-white">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-stone-100 flex-shrink-0">
            <Image
              src={getStoryAvatarUrl(story)}
              alt={story.characterName}
              fill
              className="object-cover"
              sizes="20px"
            />
          </div>
          <span className="text-[10px] text-stone-400 font-serif truncate">
            {story.locationName}
          </span>
        </div>
        <h3 className="mb-0 text-[13px] font-serif text-stone-800 line-clamp-1 leading-tight">
          {story.characterName}
        </h3>
      </div>
    </motion.div>
  );
}

/**
 * StoryFeed: 移动端瀑布流列表
 * 负责人: Developer C
 */
export function StoryFeed({ onStoryClick }: StoryFeedProps) {
  const allStories = useMemo(() => {
    return flattenStoriesWithLocationName(data.locations) as Story[];
  }, []);

  return (
    <div className="w-full px-4 py-6 overflow-y-auto h-full scrollbar-hide">
      <motion.div 
        className="columns-2 gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.06 }
          }
        }}
      >
        {allStories.map((story) => (
          <StoryCard 
            key={story.id} 
            story={story} 
            onClick={() => onStoryClick(story)} 
          />
        ))}
      </motion.div>
    </div>
  );
}
