'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * 红色引导线 (Red Guide Line)
 *
 * 横跨"关于企划"→"关于我们"→"鸣谢"三个页面的 #c23643 折线。
 * - 宽度 100px，圆角端点
 * - 图层位于文字下方、背景上方（z-index: 1）
 * - 完整连续折线（P4→P5 跨越"关于我们"页面）
 * - 使用 stroke-dasharray / stroke-dashoffset 实现描边曝光动画
 * - 非可逆单向线性插值：向下滚动时正向曝光，向上回滚时冻结在历史最远端
 *
 * 路径坐标（相对占比）：
 *   关于企划页：P1(ribbonX,0%) → P2(ribbonX,10%) → P3(19.15%,12.5%) → P4(107.5%,40.43%)
 *   鸣谢页：    P5(-2.19%,65.40%) → P6(32%,97%)
 *
 * 衔接细节：
 *  - 路径从 P1 开始 —— P1 精确位于首屏底边（= 丝带视觉终点），
 *    因此用户刚开始下滑即可看到引导线从丝带下方伸出，无"空走"。
 *  - ribbonX 使用 20%vw - 50px 动态计算（对应丝带 100px 宽容器 + col-start-1 justify-end），
 *    保证在所有屏幕尺寸下都与丝带中心精确对齐。
 *  - P4→P5 是跨越"关于我们"整个页面的连续折线段。
 *
 * 渲染区域裁剪（关键）：
 *  - SVG 的可视区域严格受限于三页范围：顶边 = apTop - 60（保留 P1 圆角端点从丝带
 *    下方"长出"的视觉余量），底边 = crTop + crH（鸣谢页底边，即页脚红条顶部）。
 *  - 配合 `overflow: hidden`，任何超出底边的描边（包括 P6 圆角端点的外沿）都会被
 *    SVG 视口硬裁剪，彻底杜绝红线渲染到 footer 之上，保证页脚文字始终清晰。
 *  - 这是针对"P6 调整数值仍偶有覆盖页脚文字"的根治方案：不再依赖数值微调，
 *    而是用蒙版（SVG 视口 + overflow:hidden）从渲染层面禁止三页之外的输出。
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

    // 丝带水平中心：丝带位于 col-start-1（0~20%vw）的 flex justify-end 内，宽 100px。
    // 所以丝带中心 x = 20%vw - 50px（响应式，任意屏宽均与丝带精确对齐）。
    const ribbonX = vw * 0.2 - 50;

    // 计算路径各点的像素坐标（相对于 ScrollSections 容器）
    // P1: 丝带正下方、首屏底边 —— 路径起点。这样微量下滑即可立即看到引导线从丝带底部伸出。
    const p1 = { x: ribbonX, y: apTop };
    // P2: 竖直段下延至 10% apH —— 留出明显的一段"先竖直再转弯"
    const p2 = { x: ribbonX, y: apTop + apH * 0.10 };
    const p3 = { x: vw * 0.1915, y: apTop + apH * 0.125 };
    const p4 = { x: vw * 1.075, y: apTop + apH * 0.4043 };
    // P5 在鸣谢页（跨越了关于我们页面）
    const p5 = { x: vw * -0.0219, y: crTop + crH * 0.654 };
    // P6: 位于鸣谢页底部之上 3%（~30px），加上圆角端点（stroke 100px → 端点半径 50px，
    //     在此向下方向实际延伸 ~28px）后刚好触达页脚红色区域顶边，保证页脚文字
    //     （QQ 交流群 / HIMEMATSU / 版权条）有安全留白。
    //     之前用 1.03 时端点落在 footer 内 27px，cap 又 +28px 压住了 "QQ 交流群" 行。
    const p6 = { x: vw * 0.32, y: crTop + crH * 0.97 };

    // SVG 覆盖范围：三页裁剪盒。
    //   顶边：P1 上方 60px（容纳 stroke 圆角端点，使引导线从丝带下方长出）
    //   底边：严格等于鸣谢页底边 crTop + crH —— 与 overflow:hidden 合用作为蒙版，
    //        禁止任何引导线像素渲染到页脚（footer）之上。
    const svgTop = p1.y - 60;
    const svgBottom = crTop + crH;
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

    // 一条完整连续折线：P1→P2→P3→P4→P5→P6
    const d = [
      `M ${lp1.x} ${lp1.y}`,
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
        // 蒙版：硬裁剪所有超出 SVG 视口的描边（含圆角端点外沿），
        // 保证引导线绝不渲染到鸣谢页底边之下（= footer 之上）。
        overflow: 'hidden',
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
