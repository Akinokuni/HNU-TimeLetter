'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * 红色引导线 (Red Guide Line)
 *
 * 横跨"关于企划"→"关于我们"→"鸣谢"三个页面的 #c23643 折线。
 * - 宽度 100px，圆角端点
 * - 图层位于文字下方、背景上方（z-index: 1）
 * - 6个点构成一条完整连续折线（点4→点5跨越"关于我们"页面）
 * - 使用 stroke-dasharray / stroke-dashoffset 实现描边曝光动画
 * - 非可逆单向线性插值：向下滚动时正向曝光，向上回滚时冻结在历史最远端
 *
 * 路径坐标（占比，相对各页面左上角 0%,0%）：
 *   关于企划页：P0(17.396%,-20%) → P1(17.396%,0%) → P2(17.396%,5%) → P3(19.15%,7.50%) → P4(107.5%,40.43%)
 *   鸣谢页：    P5(-2.19%,65.40%) → P6(32%,150%)
 *
 * P0 在首页上方，与丝带（ribbon）自然衔接，被首屏 page-paper 遮盖，滚动时逐步曝光。
 * P6 延伸进页脚红色区域，确保引导线尾部与页脚衔接。
 * 注意：P4→P5 是跨越"关于我们"整个页面的连续折线段。
 */

interface GuideLineProps {
  /** 三个 section 容器的 ref：[关于企划, 关于我们, 鸣谢] */
  sectionRefs: React.RefObject<HTMLDivElement | null>[];
}

export function GuideLine({ sectionRefs }: GuideLineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathD, setPathD] = useState('');
  const [svgDimensions, setSvgDimensions] = useState({ top: 0, height: 0 });
  const totalLengthRef = useRef(0);
  const cachedMaxProgress = useRef(0);

  /**
   * 根据三个 section 的实际 DOM 位置计算 SVG 路径坐标
   */
  const recalculate = useCallback(() => {
    const aboutProject = sectionRefs[0]?.current;
    const aboutUs = sectionRefs[1]?.current;
    const credits = sectionRefs[2]?.current;
    if (!aboutProject || !aboutUs || !credits) return;

    const vw = window.innerWidth;

    // 获取各 section 相对于 ScrollSections 容器的位置
    const container = aboutProject.parentElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top + window.scrollY;

    const apRect = aboutProject.getBoundingClientRect();
    const apTop = apRect.top + window.scrollY - containerTop;
    const apH = apRect.height;

    const crRect = credits.getBoundingClientRect();
    const crTop = crRect.top + window.scrollY - containerTop;
    const crH = crRect.height;

    // 计算7个点的像素坐标（相对于容器）
    // P0: 在"关于企划"上方 20%，衔接首页丝带（被首屏遮盖，滚动时渐露）
    const p0 = { x: vw * 0.17396, y: apTop - apH * 0.20 };
    const p1 = { x: vw * 0.17396, y: apTop };
    // P2: 竖直段下延至 5%（原 0.5% 太短，无法形成与丝带的自然衔接）
    const p2 = { x: vw * 0.17396, y: apTop + apH * 0.05 };
    const p3 = { x: vw * 0.1915, y: apTop + apH * 0.075 };
    const p4 = { x: vw * 1.075, y: apTop + apH * 0.4043 };
    // P5 在鸣谢页（跨越了关于我们页面）
    const p5 = { x: vw * -0.0219, y: crTop + crH * 0.654 };
    // P6: 延伸至鸣谢页 150%，确保尾部伸入页脚红色区域
    const p6 = { x: vw * 0.32, y: crTop + crH * 1.50 };

    // SVG 覆盖范围：从 P0 到 P6
    const svgTop = Math.min(p0.y, p1.y) - 60; // 上方留出 stroke 宽度余量
    const svgBottom = p6.y + 60;
    const svgHeight = svgBottom - svgTop;

    // 所有 Y 坐标相对于 SVG 顶部
    const toLocal = (p: { x: number; y: number }) => ({
      x: p.x,
      y: p.y - svgTop,
    });

    const lp0 = toLocal(p0);
    const lp1 = toLocal(p1);
    const lp2 = toLocal(p2);
    const lp3 = toLocal(p3);
    const lp4 = toLocal(p4);
    const lp5 = toLocal(p5);
    const lp6 = toLocal(p6);

    // 一条完整连续折线：P0→P1→P2→P3→P4→P5→P6
    const d = [
      `M ${lp0.x} ${lp0.y}`,
      `L ${lp1.x} ${lp1.y}`,
      `L ${lp2.x} ${lp2.y}`,
      `L ${lp3.x} ${lp3.y}`,
      `L ${lp4.x} ${lp4.y}`,
      `L ${lp5.x} ${lp5.y}`,
      `L ${lp6.x} ${lp6.y}`,
    ].join(' ');

    setPathD(d);
    setSvgDimensions({ top: svgTop, height: svgHeight });
  }, [sectionRefs]);

  // 初始化 + resize 时重新计算路径
  useEffect(() => {
    const timer = setTimeout(recalculate, 200);
    window.addEventListener('resize', recalculate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recalculate);
    };
  }, [recalculate]);

  // pathD 更新后重新获取 totalLength
  useEffect(() => {
    if (pathRef.current && pathD) {
      totalLengthRef.current = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${totalLengthRef.current}`;
      pathRef.current.style.strokeDashoffset = `${totalLengthRef.current}`;
    }
  }, [pathD]);

  // 滚动驱动描边曝光动画（非可逆）
  useEffect(() => {
    if (!pathD) return;

    const aboutProject = sectionRefs[0]?.current;
    const credits = sectionRefs[2]?.current;
    if (!aboutProject || !credits) return;

    let rafId: number;

    const animate = () => {
      const path = pathRef.current;
      if (!path || totalLengthRef.current === 0) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      const scrollY = window.scrollY;
      const vp = window.innerHeight;

      const apRect = aboutProject.getBoundingClientRect();
      const crRect = credits.getBoundingClientRect();
      const startY = apRect.top + scrollY - vp;
      const endY = crRect.top + scrollY + crRect.height;

      // 计算线性进度 0→1
      const rawProgress = Math.max(0, Math.min(1, (scrollY - startY) / (endY - startY)));

      // 非可逆：只取历史最大值（Math.max(cachedMaxScroll, currentScroll) 算法）
      cachedMaxProgress.current = Math.max(cachedMaxProgress.current, rawProgress);

      const offset = totalLengthRef.current * (1 - cachedMaxProgress.current);
      path.style.strokeDashoffset = `${offset}`;

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [pathD, sectionRefs]);

  if (!pathD) return null;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: svgDimensions.top,
        left: 0,
        width: '100%',
        height: svgDimensions.height,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="#c23643"
        strokeWidth={100}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
