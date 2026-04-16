'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * 关于我们 (About Us)
 *
 * 全屏页面，左侧文案 + 右侧人物头像展示。
 * 约 7 个成员，每人展示圆形头像 + 昵称 + 职责。
 * 当前版本内容留空（占位设计）。
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
    <section className="relative w-full min-h-screen flex items-center overflow-hidden">
      <motion.div
        ref={contentRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-8 md:px-16 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 左侧：文案 */}
        <div>
          <h2 className="font-serif text-ink-strong text-3xl md:text-[40px] leading-tight tracking-[0.02em] mb-10">
            关于我们
          </h2>
          <p className="font-sans text-ink text-base md:text-lg leading-[1.8]">
            「海带视研」为本企划的策展与运营团队。主要负责收集与梳理各项提案，协调摄影及后期制作，将抽象的文字构想转化为具体的视觉展品。
          </p>
        </div>

        {/* 右侧：成员头像网格 */}
        <div className="grid grid-cols-3 gap-8 justify-items-center">
          {TEAM_MEMBERS.map((member, i) => (
            <motion.div
              key={member.name}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 * i,
              }}
            >
              {/* 占位头像 */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-paper-strong border-2 border-border flex items-center justify-center">
                <span className="text-ink-muted text-xs font-serif">
                  {member.name.slice(0, 1)}
                </span>
              </div>
              {/* 昵称 */}
              <span className="text-ink-strong text-sm font-serif tracking-wide">
                {member.name}
              </span>
              {/* 职责 */}
              <span className="text-ink-muted text-xs font-sans">
                {member.role}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
