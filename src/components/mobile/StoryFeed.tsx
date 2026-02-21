'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
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

interface StoryFeedProps {
  onStoryClick: (story: Story) => void;
}

/**
 * StoryCard: 单个故事卡片组件
 * 包含缩略图、角色名和地点信息
 */
function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  return (
    <motion.div
      layoutId={`story-card-${story.id}`}
      className="flex flex-col bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden cursor-pointer"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
    >
      <div className="relative w-full aspect-[4/5] bg-stone-100">
        <motion.div
          layoutId={`story-img-${story.id}`}
          className="w-full h-full"
        >
          <Image
            src={story.mainImageUrl}
            alt={story.characterName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized
          />
        </motion.div>
      </div>

      <div className="p-3 bg-white">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-stone-100 flex-shrink-0">
            <Image
              src={story.avatarUrl}
              alt={story.characterName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <span className="text-[10px] text-stone-400 font-serif truncate">
            {story.locationName}
          </span>
        </div>
        <h3 className="text-[13px] font-serif text-stone-800 line-clamp-1 leading-tight">
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
  const allStories = data.locations.flatMap(loc => 
    loc.stories.map(story => ({
      ...story,
      locationName: loc.name
    }))
  ) as Story[];

  return (
    <div className="w-full px-4 py-6 overflow-y-auto h-full scrollbar-hide">
      <div className="grid grid-cols-2 gap-4">
        {allStories.map((story) => (
          <StoryCard 
            key={story.id} 
            story={story} 
            onClick={() => onStoryClick(story)} 
          />
        ))}
      </div>
    </div>
  );
}
