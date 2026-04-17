'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * 平滑滚动 (Smooth Scroll via Lenis)
 *
 * 使用 Lenis.js 替代自定义 wheel 拦截实现，提供丝滑惯性滚动体验。
 *
 * 配置参数来源：HIMEMATSU 参考站点（见 todo/滚动.md）
 *  - duration: 1.2（动画持续时间，越长越平滑）
 *  - easing: 指数缓动函数（开始迅速响应，结尾极其缓慢地停下）
 *  - wheelMultiplier: 1（鼠标滚轮灵敏度）
 *  - touchMultiplier: 2（触摸屏灵敏度）
 *
 * Lenis 自动管理：
 *  - 滚轮事件拦截与平滑插值
 *  - html.lenis / html.lenis-scrolling 等 CSS 类名切换
 *  - 键盘导航兼容
 *
 * 原生滚动条由 globals.css 中的 CSS 规则隐藏。
 */
export function useVirtualScroll(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return lenisRef;
}
