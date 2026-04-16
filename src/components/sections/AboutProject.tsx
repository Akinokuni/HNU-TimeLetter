'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * 关于企划 (About Project)
 *
 * 全屏页面，展示企划简介文案。
 * 排版：大留白风格，标题使用标题字体 (font-serif)，正文使用正文字体 (font-sans)。
 */
export function AboutProject() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: '-20%' });

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div
        ref={contentRef}
        className="relative z-10 max-w-2xl mx-auto px-8 md:px-16 py-20"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 标题 */}
        <h2 className="font-serif text-ink-strong text-3xl md:text-[40px] leading-tight tracking-[0.02em] mb-10">
          关于企划
        </h2>

        {/* 正文 */}
        <div className="font-sans text-ink text-base md:text-lg leading-[1.8] space-y-6">
          <p>
            这是一个聚焦于海大校园、由群友灵感驱动的 AIGC 视觉共创展。
          </p>
          <p>
            企划发起自海大 Gal同好群⌈海带姬松书院⌋。我们试图打破次元的边界，将那些原本只存在于游戏屏幕中的少女，带入触手可及的真实校园。
          </p>
          <p>
            这里的每一处选址、每一位登场人物，乃至于画面背后承载的那段微小故事，均脱胎于群友的提案与共创。由大家提供喜爱的人物与故事线索，再由制作组借由实景拍摄与 AIGC 技术将其化为现实。
          </p>
          <p>
            这不仅一次单向的画集展示，更是一场属于我们的集体记忆创作。我们以这方校园为画框，邀你一同拆开这封跨越虚实的"海大时光笺"。
          </p>
        </div>
      </motion.div>
    </section>
  );
}
