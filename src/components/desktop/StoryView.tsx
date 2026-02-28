'use client';

import { useCallback, useEffect, useState } from 'react';
import { Story } from '@/lib/types';
import { StoryCardStack } from './StoryCardStack';
import { StoryTextArea } from './StoryTextArea';

interface StoryViewProps {
  stories: Story[];   // 该地点的所有故事
  onBack: () => void; // 返回地图的回调函数
}

/**
 * StoryView (故事视图容器)
 * 对应文档: docs/roles/PC端开发-DevB.md -> 1.2 StoryCardStack & 1.3
 * 
 * 功能职责:
 * 1. 作为 "InteractiveMap" 下方故事区域的顶层容器。
 * 2. 协调 "StoryCardStack" 和 "StoryTextArea" 之间的状态联动。
 * 3. 管理当前卡片的堆叠顺序 (activeIndices) 和文本显示状态 (isTextVisible)。
 */
export function StoryView({ stories, onBack }: StoryViewProps) {
    // 状态管理: 存储当前卡片索引的顺序 (例如 [0, 1, 2] -> 0 在顶层)
    const [activeIndices, setActiveIndices] = useState(stories.map((_, i) => i));
    
    // 状态管理: 是否显示当前故事的文本详情
    const [isTextVisible, setIsTextVisible] = useState(false);

    // 切换地点时重置卡堆顺序与文本显示状态
    useEffect(() => {
        setActiveIndices(stories.map((_, i) => i));
        setIsTextVisible(false);
    }, [stories]);

    // 获取当前顶层故事
    const topIndex = activeIndices[0];
    const topStory = stories[topIndex];

    // 处理卡片滑动 (Swipe) 事件
    const handleSwipe = useCallback(() => {
        // 逻辑: 将顶层卡片索引移至队尾 (实现循环播放)
        setActiveIndices((prev) => {
            const newIndices = [...prev];
            const first = newIndices.shift();
            if (first !== undefined) newIndices.push(first);
            return newIndices;
        });
        // 保持文本显示状态，实现内容无缝切换
    }, []);

    // 处理卡片点击 (Select) 事件
    const handleSelect = useCallback(() => {
        // 逻辑: 切换文本显示状态 (Toggle)
        setIsTextVisible((prev) => !prev);
    }, []);

    return (
        <div 
            className="w-full min-h-screen flex flex-col items-center pt-10 pb-20 select-none"
            onClick={() => setIsTextVisible(false)} // 点击空白处关闭文本区
        >
            {/* 上部: 故事卡片堆叠区 */}
            <div 
                className="w-full flex-shrink-0"
            >
                <StoryCardStack 
                    stories={stories} 
                    activeIndices={activeIndices}
                    onSwipe={handleSwipe}
                    onSelect={handleSelect}
                    onBack={onBack}
                />
            </div>
            
            {/* 
              下部: 故事文本详情区 
              使用负 margin (mt-[-50px]) 使其在视觉上更靠近卡片，形成连接感
            */}
            <div 
                className="w-full flex-shrink-0 px-4 mt-[-50px] z-10"
            >
                 <StoryTextArea story={topStory} isVisible={isTextVisible} />
            </div>

            {/* 文本未展开时预留底部留白，避免地图紧贴进入故事区 */}
            <div
                className={`w-full flex-shrink-0 transition-[height] duration-300 ${
                    isTextVisible ? 'h-8' : 'h-28 md:h-40 lg:h-48'
                }`}
            />
        </div>
    );
}
