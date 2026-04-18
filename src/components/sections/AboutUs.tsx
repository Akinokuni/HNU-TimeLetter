'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * 关于我们 (About Us)
 *
 * 左侧文案区 + 右侧成员展示区（金字塔右对齐，共 6 人）。
 *
 * 成员网格：
 *  - 采用 3 列网格系统对齐，三行 1-2-3 金字塔布局，整体右对齐：
 *      行 1：              A
 *      行 2：        B     C
 *      行 3：  D     E     F
 *  - 所有列共用同一网格轨道宽度，保证纵向列边精确对齐。
 *  - 每位成员单元自上而下：头像 → 名称 → 负责方面。
 *  - 头像尺寸放大到 w-24 → w-28 → w-32（跨断点），对应「关于我们」作为人员
 *    介绍主页所需的视觉权重。
 *
 * 引导线穿越关系：P4(107.5%, 40.43%) → P5(-2.19%, 65.40%) 的对角线由右上
 * 到左下贯穿本页，中段 y_mid 位于 x ≈ 54%·vw。
 *
 * 排版分区：
 *   - 左：文案块 `absolute left-0 top-1/2 w-[60%] px-[5%]`，垂直居中，占页左
 *     60% 宽度；文本左对齐。容器内首位 `float:right` 的 shape-outside 占位块
 *     按引导线斜率收束正文右端，保证文字不越过引导线。
 *   - 右：成员金字塔 `ml-auto pr-[5%] max-w-[38%]`，占页右 ~40%；3 列等宽
 *     轨道，最靠左列中心位于 ~65%·vw，整体位于引导线右下方。
 */

interface TeamMember {
  name: string;
  role: string;
  avatar?: string; // 预留真实头像
}

// 成员占位数据（6 人，金字塔 1-2-3）
const TEAM_MEMBERS: TeamMember[] = [
  { name: '成员一', role: '策划 / 统筹' },
  { name: '成员二', role: '美术 / 后期' },
  { name: '成员三', role: '摄影' },
  { name: '成员四', role: '文案 / 脚本' },
  { name: '成员五', role: '前端开发' },
  { name: '成员六', role: '运营 / 宣发' },
];

// 金字塔 1-2-3 的 (col, row) 落点，col/row 均以 1 起算
const PYRAMID_CELLS: Array<{ col: 1 | 2 | 3; row: 1 | 2 | 3 }> = [
  { col: 3, row: 1 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 1, row: 3 },
  { col: 2, row: 3 },
  { col: 3, row: 3 },
];

export function AboutUs() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: '-20%' });

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      <motion.div
        ref={contentRef}
        className="relative z-10 w-full min-h-screen flex items-center"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 左：文案 —— 左侧垂直居中对齐，宽度占页左 60% */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[60%] px-[5%] text-left">
          {/*
           * shape-outside 右侧避让：
           *   - 引导线 P4→P5 从本页顶部 x~78%·vw 斜向下至底部 x~30%·vw；
           *   - 容器中段（垂直居中）对应引导线 x ≈ 54%·vw，即容器右侧
           *     ~90% 本地宽度处；
           *   - float:right 占位块宽 15%、高 22vh，polygon(100% 0, 100% 100%,
           *     0 100%) 的斜边与引导线方向一致，将正文行的右端沿对角收束，
           *     保证文字全程位于引导线左上方。
           * 仅在中等及以上断点启用；移动端回退到常规左对齐流。
           */}
          <div
            aria-hidden
            className="hidden md:block float-right"
            style={{
              width: '15%',
              height: '22vh',
              shapeOutside: 'polygon(100% 0, 100% 100%, 0 100%)',
            }}
          />
          <h2 className="font-serif text-ink-strong tracking-[0.02em] mb-8">
            关于我们
          </h2>
          <p className="text-intro font-sans text-ink mb-0 max-w-none">
            「海带视研」为本企划的策展与运营团队。主要负责收集与梳理各项提案，协调摄影及后期制作，将抽象的文字构想转化为具体的视觉展品。
          </p>
        </div>

        {/* 右：成员金字塔 —— 3 列网格对齐，右锚定，占页右 ~40% */}
        <div className="ml-auto pr-[5%] w-full max-w-[40%] md:max-w-[38%] lg:max-w-[35%]">
          <div className="grid grid-cols-3 gap-x-8 gap-y-10 md:gap-x-10 md:gap-y-12 items-start">
            {TEAM_MEMBERS.map((member, i) => {
              const cell = PYRAMID_CELLS[i];
              return (
                <motion.div
                  key={member.name}
                  className="flex flex-col items-center text-center"
                  style={{ gridColumnStart: cell.col, gridRowStart: cell.row }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                  }
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.08 * i,
                  }}
                >
                  {/* 头像占位 —— 尺寸放大至 w-24/28/32 */}
                  <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-paper-strong border-2 border-border flex items-center justify-center">
                    <span className="font-serif text-ink-muted text-lg md:text-xl">
                      {member.name.slice(0, 1)}
                    </span>
                  </div>
                  {/* 名称 */}
                  <span className="mt-3 md:mt-4 font-serif text-ink-strong text-base md:text-lg tracking-wide">
                    {member.name}
                  </span>
                  {/* 负责方面 */}
                  <span className="mt-1 font-sans text-ink-muted text-xs md:text-sm">
                    {member.role}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
