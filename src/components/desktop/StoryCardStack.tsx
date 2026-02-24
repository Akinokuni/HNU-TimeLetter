'use client';

import { motion, useMotionValue, useTransform, PanInfo, animate, MotionValue, useMotionValueEvent } from 'framer-motion';
import { Story } from '@/lib/types';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface StoryCardStackProps {
  stories: Story[];
  activeIndices: number[]; // 当前卡片堆叠顺序 (索引数组)
  onSwipe: () => void;     // 触发“滑动”事件 (切换下一张)
  onSelect: () => void;    // 触发“点击”事件 (查看/隐藏详情)
  onBack: () => void;      // 返回地图视图
}

export function StoryCardStack({ stories, activeIndices, onSwipe, onSelect, onBack }: StoryCardStackProps) {
  const topIndex = activeIndices[0];
  
  // 共享的拖拽值，仅用于驱动"下一张"卡片的联动动画 (Scale/Opacity)
  // 实际的卡片位移由各卡片内部的 MotionValue (x) 独立管理
  const sharedDragX = useMotionValue(0);

  // 处理滑动完成的逻辑
  const handleSwipeComplete = () => {
      onSwipe();
      // 重置联动值，以便下一张卡片（新的 Top）处于初始状态
      sharedDragX.set(0); 
  };

  return (
    <div className="relative w-full h-[60vh] flex items-center justify-center">
        {/* 返回按钮 */}
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-50 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors cursor-pointer pointer-events-auto"
        >
            <X size={24} />
        </button>

      <div className="relative w-full h-full flex items-center justify-center">
        {activeIndices.slice().reverse().map((index, i) => {
            const isTop = index === topIndex;
            const story = stories[index];
            const offset = activeIndices.length - 1 - i; // 0 = 顶层, 1 = 第二层...

            return (
                <Card 
                    key={story.id}
                    story={story}
                    isTop={isTop}
                    offset={offset}
                    storyCount={stories.length}
                    sharedDragX={sharedDragX}
                    zIndex={activeIndices.length - offset}
                    onSwipe={handleSwipeComplete}
                    onSelect={onSelect}
                />
            );
        })}
      </div>
      
      <div className="absolute bottom-4 text-gray-400 text-sm animate-pulse">
        {stories.length > 1 ? "Swipe to browse, Click to read" : "Click to read"}
      </div>
    </div>
  );
}

interface CardProps {
    story: Story;
    isTop: boolean;
    offset: number;
    storyCount: number;
    sharedDragX: MotionValue<number>;
    zIndex: number;
    onSwipe: () => void;
    onSelect: () => void;
}

function Card({ story, isTop, offset, storyCount, sharedDragX, zIndex, onSwipe, onSelect }: CardProps) {
    // 每个卡片拥有独立的 x 位移状态
    const x = useMotionValue(0);

    // 只有顶层卡片负责更新共享的 dragX，从而驱动底层卡片的联动
    useMotionValueEvent(x, "change", (latest) => {
        if (isTop) {
            sharedDragX.set(latest);
        }
    });

    // 监听 isTop 变化，实现“回归动画”
    // 当卡片从 Top 变为非 Top (被划走) 时，它此刻的位置在屏幕外 (fly out distance)
    // 我们需要将它从屏幕外平滑移动回 x=0，实现“从同方向插入底部”的效果
    useEffect(() => {
        if (!isTop && x.get() !== 0) {
            animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
        }
    }, [isTop, x]);

    // 基础样式计算
    const isTwoCards = storyCount === 2;
    const scaleFactor = isTwoCards ? 0.02 : 0.05;
    
    const baseScale = 1 - offset * scaleFactor;
    const baseY = offset * 15;
    const baseRotate = offset * 3;

    // 目标状态 (下一层级，即 offset - 1)
    const targetOffset = Math.max(0, offset - 1);
    const targetScale = 1 - targetOffset * scaleFactor;
    const targetY = targetOffset * 15;
    const targetRotate = targetOffset * 3;

    // --- 联动动画逻辑 ---
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const inputRange = [-screenWidth, 0, screenWidth];

    const animatedScale = useTransform(sharedDragX, inputRange, [targetScale, baseScale, targetScale]);
    const animatedY = useTransform(sharedDragX, inputRange, [targetY, baseY, targetY]);
    const animatedRotate = useTransform(sharedDragX, inputRange, [targetRotate, baseRotate, targetRotate]);

    // 只有顶层卡片跟随旋转，底层卡片保持静态或微动
    const topRotate = useTransform(x, [-200, 200], [-10, 10]);

    // 最终样式组装
    let style: any = {
        x: x, // 始终绑定内部 x
        zIndex
    };

    if (isTop) {
        // 顶层卡片: 全尺寸，不透明，旋转跟随拖拽
        style = { ...style, scale: 1, opacity: 1, y: 0, rotate: topRotate };
    } else {
        // 所有底层卡片: 响应 sharedDragX 实现联动放大/上浮/透明度变化
        style = { 
            ...style, 
            scale: animatedScale, 
            opacity: 1, 
            y: animatedY,
            rotate: animatedRotate 
        };
    }

    // 拖拽结束处理
    const handleDragEnd = async (event: any, info: PanInfo) => {
        const offsetVal = info.offset.x;
        const velocity = info.velocity.x;
        
        if ((Math.abs(offsetVal) > 100 || Math.abs(velocity) > 500) && storyCount > 1) {
            const direction = offsetVal > 0 ? 1 : -1;
            // 播放飞出动画
            await new Promise<void>(resolve => {
                animate(x, direction * screenWidth, { 
                    duration: 0.3, 
                    ease: "easeIn",
                    onComplete: () => resolve()
                });
            });
            onSwipe();
        } else {
            // 回弹
            animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
        }
    };

    return (
        <motion.div
            className="absolute h-[60vh] max-h-[600px] w-auto bg-white rounded-xl shadow-2xl cursor-pointer border-[8px] border-white flex-shrink-0"
            style={style}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
                e.stopPropagation();
                if (isTop && Math.abs(x.get()) < 10) onSelect();
            }}
            whileHover={isTop ? { scale: 1.02 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="relative h-full w-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={story.mainImageUrl} 
                    alt={story.characterName}
                    className="h-full w-auto object-cover rounded-sm pointer-events-none select-none block"
                    draggable={false}
                />
                
            </div>
        </motion.div>
    );
}
