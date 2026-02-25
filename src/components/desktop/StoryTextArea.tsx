'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Story } from '@/lib/types';

interface StoryTextAreaProps {
  story: Story;     // 当前展示的故事数据
  isVisible: boolean; // 是否显示文本区 (由点击卡片触发)
}

/**
 * StoryTextArea (故事文本展示区)
 * 对应文档: docs/roles/PC端开发-DevB.md -> 1.2 StoryCardStack -> 故事文本区
 * 
 * 功能职责:
 * 1. 位于卡片堆下方，居中展示故事详情。
 * 2. 包含“静态邮票” (Static Stamp) 装饰元素。
 * 3. 随卡片切换实现淡入淡出 (Fade In/Out) 切换动画。
 */
export function StoryTextArea({ story, isVisible }: StoryTextAreaProps) {
  if (!story) return null;

  return (
    // 使用 AnimatePresence 管理组件进出场的动画
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={story.id} // 关键: key 变化时触发重新渲染动画
          // 进场动画: 从下方 20px 处淡入
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          // 退场动画: 向上方 20px 处淡出
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-2xl mx-auto mt-8 p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 select-none"
          onClick={(e) => e.stopPropagation()}
        >
            {/* 
              静态邮票 (Static Stamp)
              - 位置: 左上角 (-top-6 -left-6)
              - 样式: 旋转、齿孔边框、阴影
            */}
            <div className="absolute -top-6 -left-6 transform -rotate-6">
                <div className="w-20 h-24 bg-white p-1 shadow-md border-[2px] border-gray-200 border-dotted">
                    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                        <Image 
                            src={story.avatarUrl} 
                            alt={story.characterName}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    </div>
                </div>
            </div>

            {/* 故事正文内容区 */}
            <div className="pl-12">
                {/* 角色名 (大标题) */}
                <h3 className="text-2xl font-serif text-gray-800 mb-4 tracking-wider">
                    {story.characterName}
                </h3>
                
                {/* 故事文本: 保留换行符 (whitespace-pre-wrap) */}
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap font-sans text-lg">
                    {story.content}
                </div>
                
                {/* 底部信息: 作者与日期 */}
                <div className="mt-6 text-right text-sm text-gray-400 font-serif italic">
                    — {story.author} · {story.date}
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
