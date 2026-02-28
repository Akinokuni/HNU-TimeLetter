'use client';

import { useCallback, useEffect, useState } from 'react';
import { Story } from '@/lib/types';
import { StoryCardStack } from './StoryCardStack';
import { StoryTextArea } from './StoryTextArea';

interface StoryViewProps {
  stories: Story[];
}

export function StoryView({ stories }: StoryViewProps) {
  const [activeIndices, setActiveIndices] = useState(stories.map((_, i) => i));
  const [isTextVisible, setIsTextVisible] = useState(false);

  useEffect(() => {
    setActiveIndices(stories.map((_, i) => i));
    setIsTextVisible(false);
  }, [stories]);

  const topIndex = activeIndices[0];
  const topStory = stories[topIndex];

  const handleSwipe = useCallback(() => {
    setActiveIndices((prev) => {
      const next = [...prev];
      const first = next.shift();
      if (first !== undefined) next.push(first);
      return next;
    });
  }, []);

  const handleSelect = useCallback(() => {
    setIsTextVisible((prev) => !prev);
  }, []);

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center pt-10 pb-20 select-none"
      onClick={() => setIsTextVisible(false)}
    >
      <div className="w-full flex-shrink-0">
        <StoryCardStack
          stories={stories}
          activeIndices={activeIndices}
          onSwipe={handleSwipe}
          onSelect={handleSelect}
        />
      </div>

      <div className="w-full flex-shrink-0 px-4 mt-[-50px] z-10">
        <StoryTextArea story={topStory} isVisible={isTextVisible} />
      </div>

      <div
        className={`w-full flex-shrink-0 transition-[height] duration-300 ${
          isTextVisible ? 'h-8' : 'h-28 md:h-40 lg:h-48'
        }`}
      />
    </div>
  );
}
