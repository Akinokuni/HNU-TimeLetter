'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * 关于企划 (About Project)
 *
 * 左对齐全屏页面，正文沿对角引导线下方自然折行。
 *
 * 引导线几何（与 GuideLine.tsx 保持一致）：
 *   - 直接落在本页的线段为 P3(19.15%·vw, 12.5%·apH) → P4(107.5%·vw, 40.43%·apH)
 *   - 斜率 dy/dx ≈ 27.93%·pageH / 88.35%·vw ≈ 0.316
 *
 * 排版与避让：
 *   - `<section>`: `items-start pt-[20vh] pb-[12vh] px-[8%]` 将正文顶部对齐到引
 *     导线向右倾斜开始之后的区域；左右各留 8%·vw 的视觉边距。
 *   - 正文容器内首个兄弟元素为 `float: right` 的空白占位块，`shape-outside` 为
 *     对角三角形。该形状从正文顶部延伸至引导线退出视口右边缘时对应的 y 位置
 *     （~22vh），标题与段落行因此沿对角自然向右展开，全程不越过引导线。
 *   - 段落使用 `.text-intro`（视觉规范 §2.2.4），显式 `max-w-none mb-0` 以让出
 *     默认 800px 限宽，让 shape-outside 完整作用于整段文本；段间间距由父级
 *     `space-y-6` 统一控制。
 */
export function AboutProject() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: '-20%' });

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      <motion.div
        ref={contentRef}
        className="relative z-10 w-full min-h-screen flex items-start pt-[20vh] pb-[12vh] px-[8%]"
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full text-left max-w-[72ch] lg:max-w-none">
          {/*
           * shape-outside 对角避让块：
           *   - width 58% 对应内容容器右侧的退让宽度；
           *   - height 22vh 覆盖引导线进入正文顶部到从右边缘退出视口的纵向距离；
           *   - polygon(0 0, 100% 0, 100% 100%) 的斜边与引导线 P3→P4 等方向，
           *     保证正文行的右端沿对角收束。
           * 仅在中等及以上断点启用；移动端回退到常规左对齐流。
           */}
          <div
            aria-hidden
            className="hidden md:block float-right"
            style={{
              width: '58%',
              height: '22vh',
              shapeOutside: 'polygon(0 0, 100% 0, 100% 100%)',
            }}
          />

          {/* 标题 —— 使用全局 h2 基准字号（视觉规范 §2.2.1） */}
          <h2 className="mb-10 font-serif text-ink-strong tracking-[0.02em]">
            关于企划
          </h2>

          {/* 正文 —— 开屏页下滚页面群使用大正文（视觉规范 §2.2.4） */}
          <div className="font-sans text-ink space-y-6">
            <p className="text-intro mb-0 max-w-none">
              这是一个聚焦于海大校园、由群友灵感驱动的 AIGC 视觉共创展。
            </p>
            <p className="text-intro mb-0 max-w-none">
              企划发起自海大 Gal 同好群&ldquo;海带姬松书院&rdquo;。我们试图打破次元的边界，将那些原本只存在于游戏屏幕中的少女，
              带入触手可及的真实校园。
            </p>
            <p className="text-intro mb-0 max-w-none">
              这里的每一处选址、每一位登场人物，乃至于画面背后承载的那段微小故事，均脱胎于群友的提案与共创。
              由大家提供喜爱的人物与故事线索，再由制作组借由实景拍摄与 AIGC 技术将其化为现实。
            </p>
            <p className="text-intro mb-0 max-w-none">
              这不仅是一次单向的画集展示，更是一场属于我们的集体记忆创作。我们以这方校园为画框，
              邀你一同拆开这封跨越虚实的&ldquo;海大时光笺&rdquo;。
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
