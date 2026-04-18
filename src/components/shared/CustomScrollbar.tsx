'use client';

import { useEffect, useRef, useState } from 'react';
import type Lenis from 'lenis';

/**
 * 自定义滑块 (Custom DOM Scrollbar)
 *
 * 复刻 todo/滚动.md 中所描述的简洁悬浮式滑块：
 *  - 轨道 (.scrollbar)：固定在视口右侧，宽 15px，透明背景，z-index 1000
 *  - 滑块 (.scrollbar-thumb)：宽 10px，高度随页面比例动态计算
 *    · 默认：透明填充 + 1px #c23643 细描边（像一条竖向描边矩形）
 *    · 鼠标悬停滑块时：填充为实心 #c23643，呈现"激活"态
 *  - 通过 Lenis 的 'scroll' 事件驱动滑块位移，保证平滑滚动与滑块同步
 *  - 原生滚动条已在 globals.css 中隐藏
 *
 * 使用：在页面需要滚动时挂载；不需要时（如地图页）可通过 enabled=false 卸载。
 *
 * 注：滑块自身保留 pointer-events: auto 以支持悬停/点击/拖拽，
 *     轨道则 pointer-events: none，避免干扰页面其他交互。
 */
interface CustomScrollbarProps {
  /** 是否启用滑块；false 时彻底不渲染 */
  enabled?: boolean;
  /** 可选的 Lenis 实例；若提供则通过 lenis.on('scroll') 驱动，否则使用 window 原生 scroll */
  lenis?: Lenis | null;
}

export function CustomScrollbar({ enabled = true, lenis = null }: CustomScrollbarProps) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const thumb = thumbRef.current;
    if (!thumb) return;

    // 滑块高度 = 视口高度 × (视口 / 总文档高度)
    const updateThumbHeight = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const heightRatio = Math.min(1, clientHeight / scrollHeight);
      const h = Math.max(40, clientHeight * heightRatio);
      thumb.style.height = `${h}px`;
    };

    // 滑块位移 = 进度 × (视口高度 - 滑块高度)
    const updateThumbPosition = (scroll: number, limit: number) => {
      const progress = limit > 0 ? scroll / limit : 0;
      const maxTranslate = window.innerHeight - thumb.offsetHeight;
      const translateY = Math.max(0, Math.min(maxTranslate, progress * maxTranslate));
      thumb.style.transform = `translate3d(0, ${translateY}px, 0)`;
    };

    updateThumbHeight();
    updateThumbPosition(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);

    // 轨道可见性：仅在页面可滚动时显示
    const updateTrackVisibility = () => {
      const track = trackRef.current;
      if (!track) return;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight > 1;
      track.style.opacity = scrollable ? '1' : '0';
    };
    updateTrackVisibility();

    // 监听尺寸 & 文档高度变化
    const ro = new ResizeObserver(() => {
      updateThumbHeight();
      updateTrackVisibility();
      updateThumbPosition(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);
    });
    ro.observe(document.documentElement);
    window.addEventListener('resize', updateThumbHeight);

    // 滚动事件绑定：优先 Lenis，回退到原生
    let unsubLenis: (() => void) | undefined;
    if (lenis) {
      const onLenisScroll = ({ scroll, limit }: { scroll: number; limit: number }) => {
        updateThumbPosition(scroll, limit);
      };
      lenis.on('scroll', onLenisScroll);
      unsubLenis = () => lenis.off('scroll', onLenisScroll);
    } else {
      const onNativeScroll = () => {
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        updateThumbPosition(window.scrollY, limit);
      };
      window.addEventListener('scroll', onNativeScroll, { passive: true });
      unsubLenis = () => window.removeEventListener('scroll', onNativeScroll);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateThumbHeight);
      if (unsubLenis) unsubLenis();
    };
  }, [enabled, lenis]);

  // 鼠标拖动滑块调节页面滚动位置
  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const thumb = thumbRef.current;
    if (!thumb) return;
    e.preventDefault();
    e.stopPropagation();

    const startPointerY = e.clientY;
    const scrollHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollLimit = Math.max(0, scrollHeight - viewportHeight);
    const trackRange = Math.max(1, viewportHeight - thumb.offsetHeight);
    const startScroll = lenis ? lenis.scroll : window.scrollY;

    setDragging(true);
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    const onMove = (ev: MouseEvent) => {
      const deltaY = ev.clientY - startPointerY;
      const scrollDelta = (deltaY / trackRange) * scrollLimit;
      const target = Math.max(0, Math.min(scrollLimit, startScroll + scrollDelta));
      if (lenis) {
        lenis.scrollTo(target, { immediate: true });
      } else {
        window.scrollTo(0, target);
      }
    };

    const onUp = () => {
      setDragging(false);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!enabled) return null;

  const active = hovered || dragging;

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      className="fixed top-0 right-0 z-[1000] h-screen pointer-events-none transition-opacity duration-300"
      style={{ width: '15px', backgroundColor: 'transparent' }}
    >
      <div
        ref={thumbRef}
        className="absolute top-0 pointer-events-auto"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={handleThumbMouseDown}
        style={{
          right: '2.5px',
          width: '10px',
          backgroundColor: active ? '#c23643' : 'transparent',
          border: '1px solid #c23643',
          borderRadius: '5px',
          boxSizing: 'border-box',
          cursor: dragging ? 'grabbing' : 'grab',
          transition: 'background-color 180ms ease',
          willChange: 'transform, height',
        }}
      />
    </div>
  );
}
