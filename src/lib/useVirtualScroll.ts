'use client';

import { useEffect, useState } from 'react';
import Lenis from 'lenis';

/**
 * 平滑滚动 (Smooth Scroll via Lenis)
 *
 * 使用 Lenis.js 替代自定义 wheel 拦截实现，提供丝滑惯性滚动体验。
 *
 * 配置参数与 todo/滚动.md 推荐值对齐：
 *  - duration: 1.2
 *  - easing: 经典指数缓动 Math.min(1, 1.001 - Math.pow(2, -10 * t))
 *  - wheelMultiplier: 1, touchMultiplier: 2, smoothWheel: true
 *
 * Lenis 自动管理：
 *  - 滚轮事件拦截与平滑插值
 *  - html.lenis / html.lenis-scrolling 等 CSS 类名切换
 *  - 键盘导航兼容
 *
 * 原生滚动条由 globals.css 中的 CSS 规则隐藏。
 *
 * 返回值：当前 Lenis 实例（可为 null）。外部组件（如 CustomScrollbar）
 * 可通过实例上的 on('scroll', ...) 订阅实现与 Lenis 精确同步的自定义滑块。
 */
export function useVirtualScroll(enabled = true): Lenis | null {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLenis(null);
      return;
    }

    const instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    setLenis(instance);

    let rafId = 0;
    function raf(time: number) {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      setLenis(null);
    };
  }, [enabled]);

  return lenis;
}
