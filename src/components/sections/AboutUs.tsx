'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * 关于我们 (About Us)
 *
 * 全屏页面，左侧文案 + 右侧人物头像展示。
 * 约 7 个成员，每人展示圆形头像 + 昵称 + 职责。
 *
 * 布局策略（fix3 修复）：
 *  - 引导线从右上方 P4(107.5%, 40.43%) 穿越至左下方 P5(-2.19%, 65.40%)，
 *    对角线在页面中段 y≈50% 处经过 x≈65% 位置
 *  - 文字块：靠左极端对齐（px 5%），停留在页面上半部（engage 引导线未到达的区域）
 *  - 成员网格：靠右极端对齐（pr 5%），采用紧凑的 2 列 × 4 行布局，
 *    整体向下偏移到 y≈65% 以下，避开引导线对角穿越区
 *  - 头像尺寸由 w-20 缩小为 w-14，进一步减少占位面积
 */

interface TeamMember {
  name: string;
  role: string;
  avatar?: string; // 未来填充
}

// 占位成员数据（待填充）
const TEAM_MEMBERS: TeamMember[] = [
  { name: '成员一', role: '策划 / 统筹' },
  { name: '成员二', role: '美术 / 后期' },
  { name: '成员三', role: '摄影' },
  { name: '成员四', role: '文案 / 脚本' },
  { name: '成员五', role: '前端开发' },
  { name: '成员六', role: '运营 / 宣发' },
  { name: '成员七', role: '技术支持' },
];

export function AboutUs() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: '-20%' });

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      <motion.div
        ref={contentRef}
        className="relative z-10 w-full h-full min-h-screen"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 左上：文案 — 左对齐，停留在页面上半部，避开对角引导线 */}
        <div className="absolute left-[5%] top-[12%] max-w-[30%] text-left">
          <h2 className="font-serif text-ink-strong text-3xl md:text-[40px] leading-tight tracking-[0.02em] mb-8">
            关于我们
          </h2>
          <p className="font-sans text-ink text-base md:text-lg leading-[1.8]">
            「海带视研」为本企划的策展与运营团队。主要负责收集与梳理各项提案，协调摄影及后期制作，将抽象的文字构想转化为具体的视觉展品。
          </p>
        </div>

        {/* 右下：成员头像网格 — 右对齐，下移到对角线下方 */}
        <div className="absolute right-[5%] bottom-[8%] max-w-[32%]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 justify-items-end">
            {TEAM_MEMBERS.map((member, i) => (
              <motion.div
                key={member.name}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.08 * i,
                }}
              >
                {/* 占位头像 — 缩小为 w-12 降低空间占用 */}
                <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-full bg-paper-strong border-2 border-border flex items-center justify-center">
                  <span className="text-ink-muted text-xs font-serif">
                    {member.name.slice(0, 1)}
                  </span>
                </div>
                {/* 昵称与职责 — 右侧横排展示，减少纵向占位 */}
                <div className="flex flex-col items-start">
                  <span className="text-ink-strong text-sm font-serif tracking-wide">
                    {member.name}
                  </span>
                  <span className="text-ink-muted text-[11px] font-sans">
                    {member.role}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
