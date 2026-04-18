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
 *  - SVG 的可视区域通过蒙版硬裁剪：顶边 = apTop - 60（保留 P1 圆角端点从丝带
 *    下方长出的视觉余量），底边 = `crTop + crH + FOOTER_TEXT_TOP_OFFSET - 10`。
 *  - `FOOTER_TEXT_TOP_OFFSET = 34px` 由 Footer.tsx 布局直接推导：外层 nav 是 `py-5` (20px)，
 *    外层 `<a>` 自带 `py-3.5` (14px)，第一个 link 文本 `<span>` 顶边约在 footer 顶边下
 *    20 + 14 = 34px。再减 10px 安全间隙即为引导线视觉尾端允许伸到的最低点。
 *  - 为什么不测量 footer DOM：Footer 是 `position: fixed`，`getBoundingClientRect()` 返回
 *    视区相对坐标。用 `rect.top + scrollY - containerTop` 转换在 `scrollY=0` 时会得到
 *    负值，令 `svgHeight` 负号、浏览器忽略 height，引导线将完全不可见。
 *  - 效果：引导线视觉尾端伸入 footer 的 #C23643 红色区域（与页脚背景同色蟍融，
 *    呈现"线条归到红带"的视觉效果），同时严格停在首条链接文本上方 10px，
 *    避免覆盖 QQ 交流群 / HIMEMATSU / 版权条。
 *  - 配合 `overflow: hidden`，任何超出底边的描边（包括 P6 圆角端点的外沿）都会被
 *    SVG 视口硬裁剪。
 *  - 因此 P6 故意放在 `crBottom + 80`（超出蒙版底边 56px），让 stroke 主体而非
 *    仅仅圆角帽填满蒙版底边——这样不管 P5→P6 的角度，尾部视觉均硬齐
 *    到 `crBottom + 24`（红带内 24px），不再出现"有地方没碰到"。
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

    // Footer 第一个链接文本顶边相对 footer 顶边的偏移：
    //   nav.py-5 (20px) + a.py-3.5 (14px) = 34px。由 Footer.tsx 布局静态推导，
    //   不测量 DOM（Footer 是 position:fixed，getBoundingClientRect 给出视区相对坐标，
    //   无法直接转换到容器文档流坐标系）。
    const FOOTER_TEXT_TOP_OFFSET = 34;

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
    // P6: 故意推到 `crBottom + 80`，远在蒙版底边 (`crBottom + 24`) 之下。
    //     既然 SVG 的 `overflow: hidden` 硬裁剪，超过蒙版的部分一律不渲染；
    //     把线条终点放到蒙版外，能保证 stroke 主体（100px 宽）填满整个蒙版
    //     底边，不管 P5→P6 的角度，尾部视觉上都确实抵达页脚红带。
    //     之前 0.97*crH 是在 credits 内部结束，导致线未期同蒙版底边齐平、视觉上
    //     "没碰到页脚"。
    const p6 = { x: vw * 0.32, y: crTop + crH + 80 };

    // SVG 覆盖范围：蒙版裁剪盒。
    //   顶边：P1 上方 60px（容纳 stroke 圆角端点，使引导线从丝带下方长出）
    //   底边：footer 首条链接文本顶边 - 10px安全间隙。采用静态偏移而非 DOM 测量，
    //        避免对 position:fixed footer 用错误的坐标转换公式。
    const svgTop = p1.y - 60;
    const svgBottom = crTop + crH + FOOTER_TEXT_TOP_OFFSET - 10;
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
      // 滚动驱动的起止位置（分子 / 分母必须匹配可达的滚动区间）：
      //   startY：aboutProject 顶边刚进入视口时 (scrollY + vp == apTop)
      //   endY  ：credits 底边刚到视口底时 (scrollY + vp == crBottom)
      // 之前 endY = crRect.top + scrollY + crH（= credits 文档底边），要求滚动越过
      // credits 底边才能画完；但由于 FooterSpacer 与固定 footer 的布局特性，实际
      // 的 maxScrollY = scrollHeight - vp 常达不到这个值（用户实测 36px deadzone），
      // 导致 rawProgress 在触底时只有 ~0.856，引导线尾部 ~560px 压根没画出。
      const startY = apRect.top + scrollY - vp;
      const endY = crRect.top + scrollY + crRect.height - vp;

      // 计算线性进度；再在 ≥95% 时 snap 到 1.0，吸收任何残余的布局 deadzone
      // （固定 footer / spacer 的像素误差、平滑滚动库的余量等）。
      const linear = (scrollY - startY) / (endY - startY);
      const rawProgress = linear >= 0.95 ? 1 : Math.max(0, linear);

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
