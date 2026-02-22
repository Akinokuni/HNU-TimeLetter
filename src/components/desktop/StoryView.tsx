'use client';

import { useState } from 'react';
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

    // 获取当前顶层故事
    const topIndex = activeIndices[0];
    const topStory = stories[topIndex];

    // 处理卡片滑动 (Swipe) 事件
    const handleSwipe = () => {
        // 逻辑: 将顶层卡片索引移至队尾 (实现循环播放)
        setActiveIndices((prev) => {
            const newIndices = [...prev];
            const first = newIndices.shift();
            if (first !== undefined) newIndices.push(first);
            return newIndices;
        });
        // 切换卡片后，默认隐藏文本详情，恢复纯享模式
        setIsTextVisible(false);
    };

    // 处理卡片点击 (Select) 事件
    const handleSelect = () => {
        // 逻辑: 切换文本显示状态 (Toggle)
        setIsTextVisible(!isTextVisible);
    };

    // 滚轮/触摸板滑动处理: 在顶部向下滑动 (Scroll Up) 时返回地图
    const handleWheel = (e: React.WheelEvent) => {
        const container = e.currentTarget;
        // 如果在顶部 (scrollTop === 0) 且 向上滚动 (deltaY < 0)
        // 使用 -30 作为阈值防止误触
        if (container.scrollTop === 0 && e.deltaY < -30) {
            onBack();
        }
    };

    return (
        <div 
            className="w-full h-full flex flex-col items-center pt-10 overflow-y-auto pb-20 no-scrollbar"
            onWheel={handleWheel}
        >
            {/* 上部: 故事卡片堆叠区 */}
            <div className="w-full flex-shrink-0">
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
            <div className="w-full flex-shrink-0 px-4 mt-[-50px] z-10">
                 <StoryTextArea story={topStory} isVisible={isTextVisible} />
            </div>
        </div>
    );
}
