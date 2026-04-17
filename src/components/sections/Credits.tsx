'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * 鸣谢 (Credits)
 *
 * 全屏页面，整体偏右对齐。
 * - 上部：鸣谢文案
 * - 下部：参与贡献名单 — 三排横向无限滚动昵称展示区
 */

// 占位昵称列表（待填充真实数据）
const CONTRIBUTOR_ROWS: string[][] = [
  ['幽兰', '星河', '白鹿', '月影', '清风', '朝露', '映雪', '听雨', '落霞', '浮生', '若梦', '长安'],
  ['拾光', '念初', '执念', '画眉', '流年', '素心', '晚晴', '云烟', '梨落', '墨染', '知秋', '踏歌'],
  ['余温', '故里', '北辰', '西窗', '南歌', '东篱', '初雪', '暮色', '半夏', '微凉', '轻吟', '浅笑'],
];

function MarqueeRow({
  names,
  speed = 30,
  reverse = false,
}: {
  names: string[];
  speed?: number;
  reverse?: boolean;
}) {
  // 复制一份实现无缝循环
  const doubled = [...names, ...names];
  const duration = names.length * speed / 10;

  return (
    <div className="relative overflow-hidden whitespace-nowrap py-3">
      <motion.div
        className="inline-flex gap-8"
        animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{
          x: {
            duration,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="text-ink-muted text-sm md:text-base font-sans tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          >
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function Credits() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: '-20%' });

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden">
      <motion.div
        ref={contentRef}
        className="relative z-10 w-full max-w-6xl ml-auto px-8 md:px-16 lg:pr-24 py-20"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 鸣谢文案 */}
        <div className="text-right md:text-right mb-16">
          <h2 className="font-serif text-ink-strong text-3xl md:text-[40px] leading-tight tracking-[0.02em] mb-8">
            鸣谢
          </h2>
          <p className="font-sans text-ink text-base md:text-lg leading-[1.8] max-w-lg ml-auto">
            感谢每一位参与共创的群友，是你们的灵感与热情让这个企划从一个简单的想法，生长为一场真实的视觉展览。每一个角色、每一处场景的背后，都有你们的身影。
          </p>
        </div>

        {/* 参与贡献名单 */}
        <div className="mt-8">
          <h3 className="font-serif text-ink-strong text-xl md:text-2xl tracking-wide mb-6 text-right">
            参与贡献名单
          </h3>
          <div className="space-y-2">
            {CONTRIBUTOR_ROWS.map((row, i) => (
              <MarqueeRow
                key={i}
                names={row}
                speed={25 + i * 8}
                reverse={i % 2 === 1}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
