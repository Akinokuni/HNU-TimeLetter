'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * 红色引导线 (Red Guide Line)
 *
 * 横跨"关于企划"→"关于我们"→"鸣谢"三个页面的 #c23643 折线。
 * - 宽度 100px，圆角端点，图层位于最底层（z-index: 1）
 * - 使用 stroke-dasharray / stroke-dashoffset 实现描边曝光动画
 * - 非可逆单向线性插值：向下滚动时正向曝光，向上回滚时冻结在历史最远端
 *
 * 路径坐标（占比，相对各页面左上角 0%,0%）：
 *   关于企划页：P1(17.396%,0%) → P2(17.396%,0.5%) → P3(19.15%,7.50%) → P4(107.5%,40.43%)
 *   鸣谢页：    P5(-2.19%,65.40%) → P6(32%,126.27%)
 */

interface GuideLineProps {
  /** 三个 section 容器的 ref：[关于企划, 关于我们, 鸣谢] */
  sectionRefs: React.RefObject<HTMLDivElement | null>[];
}

export function GuideLine({ sectionRefs }: GuideLineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathD, setPathD] = useState('');
  const [svgStyle, setSvgStyle] = useState<React.CSSProperties>({});
  const totalLengthRef = useRef(0);
  const cachedMaxProgress = useRef(0);

  /**
   * 根据三个 section 的实际 DOM 位置计算 SVG 路径坐标
   */
  const recalculate = useCallback(() => {
    const aboutProject = sectionRefs[0]?.current;
    const credits = sectionRefs[2]?.current;
    if (!aboutProject || !credits) return;

    const vw = window.innerWidth;

    // 获取 section 在文档中的绝对 Y 偏移
    const apRect = aboutProject.getBoundingClientRect();
    const apTop = apRect.top + window.scrollY;
    const apH = apRect.height;

    const crRect = credits.getBoundingClientRect();
    const crTop = crRect.top + window.scrollY;
    const crH = crRect.height;

    // 计算绝对像素坐标
    const p1 = { x: vw * 0.17396, y: apTop };
    const p2 = { x: vw * 0.17396, y: apTop + apH * 0.005 };
    const p3 = { x: vw * 0.1915, y: apTop + apH * 0.075 };
    const p4 = { x: vw * 1.075, y: apTop + apH * 0.4043 };

    const p5 = { x: vw * -0.0219, y: crTop + crH * 0.654 };
    const p6 = { x: vw * 0.32, y: crTop + crH * 1.2627 };

    // SVG 定位：从 aboutProject 顶部到 P6 底部
    const svgTop = apTop;
    const svgBottom = p6.y + 100; // 额外边距
    const svgHeight = svgBottom - svgTop;

    // 所有 Y 坐标相对于 SVG 顶部
    const toLocal = (p: { x: number; y: number }) => ({
      x: p.x,
      y: p.y - svgTop,
    });

    const lp1 = toLocal(p1);
    const lp2 = toLocal(p2);
    const lp3 = toLocal(p3);
    const lp4 = toLocal(p4);
    const lp5 = toLocal(p5);
    const lp6 = toLocal(p6);

    const d = [
      `M ${lp1.x} ${lp1.y}`,
      `L ${lp2.x} ${lp2.y}`,
      `L ${lp3.x} ${lp3.y}`,
      `L ${lp4.x} ${lp4.y}`,
      `M ${lp5.x} ${lp5.y}`,
      `L ${lp6.x} ${lp6.y}`,
    ].join(' ');

    setPathD(d);
    setSvgStyle({
      position: 'absolute',
      top: apTop,
      left: 0,
      width: '100%',
      height: svgHeight,
      pointerEvents: 'none',
      zIndex: 1,
      overflow: 'visible',
    });
  }, [sectionRefs]);

  // 初始化 + resize 时重新计算路径
  useEffect(() => {
    // 延迟首次计算，等待布局稳定
    const timer = setTimeout(recalculate, 100);
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
      // 初始隐藏：dashoffset = totalLength
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

      // 引导线可视区域：从关于企划页顶部进入视口开始，到鸣谢页底部离开
      const apRect = aboutProject.getBoundingClientRect();
      const crRect = credits.getBoundingClientRect();
      const startY = apRect.top + scrollY - vp;
      const endY = crRect.top + scrollY + crRect.height;

      // 计算线性进度 0→1
      const rawProgress = Math.max(0, Math.min(1, (scrollY - startY) / (endY - startY)));

      // 非可逆：只取历史最大值
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
      style={svgStyle}
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
