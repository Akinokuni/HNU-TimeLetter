'use client';

import { useRef } from 'react';
import { AboutProject } from './AboutProject';
import { AboutUs } from './AboutUs';
import { Credits } from './Credits';
import { Footer } from './Footer';
import { GuideLine } from '@/components/shared/GuideLine';

/**
 * ScrollSections — 下滚页面群包装组件
 *
 * 包含"关于企划"、"关于我们"、"鸣谢"三个全屏页面，
 * 以及横跨其间的红色引导线和底部页脚。
 *
 * 页脚使用揭露式视差动画：固定在视口底部，
 * 由上方内容滚走后逐渐"揭开"。
 */
export function ScrollSections() {
  const aboutProjectRef = useRef<HTMLDivElement>(null);
  const aboutUsRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      {/* 红色引导线 — 最底层 z-1 */}
      <GuideLine sectionRefs={[aboutProjectRef, aboutUsRef, creditsRef]} />

      {/* 三个全屏页面 — z-2，page-paper 不透明背景遮住引导线与底部页脚 */}
      <div ref={aboutProjectRef} className="relative z-[2] page-paper">
        <AboutProject />
      </div>
      <div ref={aboutUsRef} className="relative z-[2] page-paper">
        <AboutUs />
      </div>
      <div ref={creditsRef} className="relative z-[2] page-paper">
        <Credits />
      </div>

      {/* 页脚占位 + 揭露式页脚 */}
      <Footer />
    </div>
  );
}
