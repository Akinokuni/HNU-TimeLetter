'use client';

import { useState } from 'react';
import Image from 'next/image';
// 1. 引入数据包袱（假设你已经改名叫 mock-content.json）
import data from '@/data/content.json';
import PostcardModal from './PostcardModal';

export function InteractiveMap() {
  const [activeLocation, setActiveLocation] = useState<any>(null);

  return (
    <div className="relative w-full h-screen bg-[#fdfbf7] overflow-hidden">
      
      {/* 适配容器：使用 contain 保证地图完整显示 */}
      <div className="relative w-full h-full">
        <Image 
          src="/images/map.svg" // 记得确认你的底图名字对不对
          alt="HNU Map"
          fill 
          className="object-contain"
          priority
        />

        {/* 2. 核心修改：使用 data.locations.map 遍历地点数组 */}
        {data.locations.map((loc) => {
          // 获取该地点的最新一个故事（用来显示头像）
          const latestStory = loc.stories[0];

          // 如果没有故事，暂不显示该地点
          if (!latestStory) return null;

          return (
            <div
              key={loc.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${loc.x}%`,
                top: `${loc.y}%`,
                // 把原点设在中心，这样坐标更精准
                transform: 'translate(-50%, -50%)' 
              }}
              onClick={() => setActiveLocation(loc)}
            >
              {/* MapPin 交互效果 (文档 2.2 要求) */}
              <div className="w-12 h-12 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-white opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-300 relative z-10">
                <Image 
                  src={latestStory.avatarUrl} // 这里的字段名要跟你 JSON 里的对应
                  alt={latestStory.characterName} 
                  width={48} 
                  height={48} 
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Tooltip 悬浮提示 (Hover 状态显示) */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20">
                {loc.name}
                {/* 如果这个地点有多个故事，可以顺便提示一下 */}
                {loc.stories.length > 1 && (
                  <span className="ml-1 text-xs text-gray-300">({loc.stories.length})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 明信片阅读器 */}
      {activeLocation && (
        <PostcardModal 
          location={activeLocation} 
          onClose={() => setActiveLocation(null)} 
        />
      )}
    </div>
  );
}