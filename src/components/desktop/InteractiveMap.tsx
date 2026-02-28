'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import data from '@/data/content.json';
import { StoryView } from './StoryView';
import { LocationPoint } from '@/lib/types';

/**
 * InteractiveMap (交互式地图组件)
 * 对应文档: docs/roles/PC端开发-DevB.md -> 1.1 InteractiveMap
 * 
 * 功能职责:
 * 1. 全屏展示海大地图，保持 object-fit: contain 不缩放。
 * 2. 渲染地图上的 Pin 点 (Avatar)，支持 Hover 动效。
 * 3. 点击 Pin 点触发视口切换 (进入 StoryView)。
 */
export function InteractiveMap() {
  // 当前激活的地点 (用于渲染故事区内容)
  const [activeLocation, setActiveLocation] = useState<LocationPoint | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const storySectionRef = useRef<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [mapAspect, setMapAspect] = useState<number | null>(null);

  const getScrollBehavior = (): ScrollBehavior => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'auto';
    }
    return 'smooth';
  };

  useLayoutEffect(() => {
    if (!mapAspect) return;
    const container = mapContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;

      const containerAspect = width / height;
      if (containerAspect > mapAspect) {
        const h = height;
        const w = h * mapAspect;
        setMapSize({ width: w, height: h });
      } else {
        const w = width;
        const h = w / mapAspect;
        setMapSize({ width: w, height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [mapAspect]);

  const scrollToStorySection = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        storySectionRef.current?.scrollIntoView({
          behavior: getScrollBehavior(),
          block: 'start'
        });
      });
    });
  };

  const handleLocationSelect = (location: LocationPoint) => {
    setActiveLocation(location);
    scrollToStorySection();
  };

  return (
    <div className="relative w-full bg-[#fdfbf7]">
      <section ref={storySectionRef} className="w-full">
        {activeLocation && (
          <StoryView
            key={activeLocation.id}
            stories={activeLocation.stories}
          />
        )}
      </section>

      <section className="relative w-full h-screen overflow-hidden">
        <div className="relative w-full h-full" ref={mapContainerRef}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: mapSize.width, height: mapSize.height }}>
              <Image 
                src="/images/map.svg"
                alt="HNU Map"
                fill 
                className="object-contain"
                priority
                sizes="100vw"
                onLoadingComplete={(img) => {
                  if (img.naturalWidth && img.naturalHeight) {
                    setMapAspect(img.naturalWidth / img.naturalHeight);
                  }
                }}
              />

              {data.locations.map((loc) => {
                const latestStory = loc.stories[0];
                if (!latestStory) return null;

                return (
                  <div
                    key={loc.id}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${loc.x}%`,
                      top: `${loc.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => handleLocationSelect(loc)}
                  >
                    <div className="w-12 h-12 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-white opacity-90 hover:opacity-100 hover:scale-110 hover:-translate-y-2 transition-all duration-300 relative z-10">
                      <Image 
                        src={latestStory.avatarUrl} 
                        alt={latestStory.characterName} 
                        width={48} 
                        height={48} 
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>

                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20">
                      {loc.name}
                      {loc.stories.length > 1 && (
                        <span className="ml-1 text-xs text-gray-300">({loc.stories.length})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
