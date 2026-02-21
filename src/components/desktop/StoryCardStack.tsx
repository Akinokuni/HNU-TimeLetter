'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Story } from '@/lib/types';
import { X } from 'lucide-react';

interface StoryCardStackProps {
  stories: Story[];
  activeIndices: number[]; // 当前卡片堆叠顺序 (索引数组)
  onSwipe: () => void;     // 触发“滑动”事件 (切换下一张)
  onSelect: () => void;    // 触发“点击”事件 (查看/隐藏详情)
  onBack: () => void;      // 返回地图视图
}

/**
 * StoryCardStack (故事卡片堆组件)
 * 对应文档: docs/roles/PC端开发-DevB.md -> 1.2 StoryCardStack
 * 
 * 功能职责:
 * 1. 层叠展示故事卡片，使用 Framer Motion 实现物理动效。
 * 2. 支持自适应宽高比 (Adaptive Ratio)，不强制裁剪图片。
 * 3. 交互逻辑: 拖拽/滑动 (Swipe) 切换，点击 (Click) 查看详情。
 */
export function StoryCardStack({ stories, activeIndices, onSwipe, onSelect, onBack }: StoryCardStackProps) {
  // 获取最顶层的卡片索引 (activeIndices 的第一个元素)
  const topIndex = activeIndices[0];

  return (
    <div className="relative w-full h-[60vh] flex items-center justify-center">
        {/* 返回按钮 (Back to Map) */}
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-50 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors cursor-pointer pointer-events-auto"
        >
            <X size={24} />
        </button>

      {/* 
        卡片堆叠容器
        - 布局: Flex 居中，无固定宽高，允许内部子元素撑开。
        - 渲染逻辑: 逆序渲染 activeIndices (确保 topIndex 最后渲染，即 z-index 最高)。
      */}
      <div className="relative w-full h-full flex items-center justify-center">
        {activeIndices.slice().reverse().map((index, i) => {
            const isTop = index === topIndex;
            const story = stories[index];
            const offset = activeIndices.length - 1 - i; // 计算当前卡片距离顶层的偏移量 (0=顶层)

            // 视觉堆叠效果计算:
            // 越往底层 (offset 越大): 尺寸越小 (scale 减小), 位置越靠下 (y 增加), 透明度越低 (opacity 降低)
            const scale = 1 - offset * 0.05;
            const y = offset * 15;
            // 增加旋转角度，使下层卡片露出边缘，形成滑动引导 (Swipe Guide)
            const rotate = offset * 3; 
            const opacity = 1 - offset * 0.2;
            
            // 性能优化: 仅渲染视觉可见的前3张卡片
            if (offset > 2) return null;

            return (
                <Card 
                    key={story.id}
                    story={story}
                    index={index}
                    isTop={isTop}
                    style={{ 
                        scale, 
                        y,
                        rotate, // 传入旋转角度
                        zIndex: activeIndices.length - offset, // 动态计算层级
                        opacity 
                    }}
                    onSwipe={() => isTop && onSwipe()} // 仅允许顶层卡片触发滑动
                    onSelect={onSelect}
                />
            );
        })}
      </div>
      
      {/* 交互提示 (Hint) */}
      <div className="absolute bottom-4 text-gray-400 text-sm animate-pulse">
        {stories.length > 1 ? "Swipe to browse, Click to read" : "Click to read"}
      </div>
    </div>
  );
}

interface CardProps {
    story: Story;
    index: number;
    isTop: boolean;
    style: any;
    onSwipe: () => void;
    onSelect: () => void;
}

/**
 * 单个卡片组件 (Card)
 * 核心特性: 自适应宽高比 (Adaptive Aspect Ratio)
 */
function Card({ story, isTop, style, onSwipe, onSelect }: CardProps) {
    // Motion Values 用于处理拖拽跟随动画
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]); // 随拖拽距离旋转
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]); // 随拖拽距离渐变透明

    // 拖拽结束处理: 如果移动距离超过阈值 (100px)，视为 Swipe 操作
    const handleDragEnd = (event: any, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 100) {
            onSwipe();
        }
    };

    return (
        <motion.div
            // 样式定义 (Style):
            // - h-[60vh] & max-h-[600px]: 限制高度，适应视口。
            // - w-auto: 宽度自动，由内部 img 标签的自然宽高比决定 (实现 Adaptive Ratio)。
            // - absolute: 绝对定位，确保所有卡片重叠在同一中心点。
            className="absolute h-[60vh] max-h-[600px] w-auto bg-white rounded-xl shadow-2xl cursor-pointer border-[8px] border-white flex-shrink-0"
            style={{ 
                ...style,
                x: isTop ? x : 0, 
                rotate: isTop ? rotate : style.rotate, // 非顶层卡片使用传入的 rotate 值 (Swipe Guide)
                opacity: isTop ? opacity : style.opacity
            }}
            // 交互定义:
            drag={isTop ? "x" : false} // 仅允许水平拖拽
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // 限制回弹
            dragElastic={0.1} // 增加阻尼感
            onDragEnd={handleDragEnd}
            onClick={() => {
                // 点击判定: 排除拖拽产生的误触 (位移小于 10px 视为点击)
                if (Math.abs(x.get()) < 10) onSelect();
            }}
            whileHover={isTop ? { scale: 1.02 } : {}} // 鼠标悬停微调
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="relative h-full w-auto">
                {/* 
                  核心图片组件
                  - 使用原生 <img> 标签而非 NextImage，以便利用其自然宽高比撑开父容器。
                  - object-cover: 确保填满高度。
                  - pointer-events-none: 防止图片拖拽干扰卡片拖拽。
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={story.mainImageUrl} 
                    alt={story.characterName}
                    className="h-full w-auto object-cover rounded-sm pointer-events-none select-none block"
                    draggable={false}
                />
                
                {/* 底部黑色渐变遮罩: 增强文字可读性与质感 */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent rounded-b-sm" />
                
                {/* 角色名标签: 位于卡片左下角 */}
                <div className="absolute bottom-4 left-4 text-white font-bold text-xl tracking-wider shadow-black/50 drop-shadow-md">
                    {story.characterName}
                </div>
            </div>
        </motion.div>
    );
}
