'use client';

import { useEffect, useRef } from 'react';

/**
 * 虚拟滚动动量 (Virtual Scroll Momentum)
 *
 * 基础位移遵循线性插值，即滚动多少、移动多少。
 * 外层套用物理阻尼 (Friction) 与惯性 (Inertia)，使视觉丝滑。
 *
 * 实现原理：
 *  - 拦截原生 wheel 事件，累积目标滚动位置
 *  - 使用 rAF + lerp 将 window.scrollTo 平滑过渡到目标位置
 *  - 保持原生滚动条、键盘导航和触摸滑动的兼容性
 *  - 移动端不拦截 touch（系统已自带动量滚动）
 */
export function useVirtualScroll(enabled = true) {
  const targetY = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // 隐藏原生滚动条（避免双滚动条），但保留滚动能力
    document.documentElement.style.scrollbarWidth = 'none';
    const styleEl = document.createElement('style');
    styleEl.textContent = '::-webkit-scrollbar { display: none !important; }';
    document.head.appendChild(styleEl);

    const LERP = 0.1; // 阻尼系数：越小越丝滑，越大越跟手
    let lastScrollToY = -1;

    // 同步初始位置
    targetY.current = window.scrollY;
    currentY.current = window.scrollY;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const clamp = (v: number) => Math.max(0, Math.min(v, maxScroll()));

    /* ── Wheel（桌面端） ── */
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetY.current = clamp(targetY.current + e.deltaY);
    };

    /* ── 外部滚动（滚动条拖拽 / 浏览器导航 / 锚点跳转） ── */
    const handleScroll = () => {
      // 若原生 scrollY 与我们上次 scrollTo 的值有较大偏差，说明是外部触发
      if (Math.abs(window.scrollY - lastScrollToY) > 2) {
        targetY.current = window.scrollY;
        currentY.current = window.scrollY;
      }
    };

    /* ── rAF 循环 ── */
    const tick = () => {
      currentY.current += (targetY.current - currentY.current) * LERP;

      // 距离足够小时直接 snap，避免无限逼近
      if (Math.abs(targetY.current - currentY.current) < 0.5) {
        currentY.current = targetY.current;
      }

      lastScrollToY = Math.round(currentY.current);
      window.scrollTo(0, lastScrollToY);

      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId.current);
      // 恢复原生滚动条
      document.documentElement.style.scrollbarWidth = '';
      styleEl.remove();
    };
  }, [enabled]);

  return { currentY, targetY };
}
