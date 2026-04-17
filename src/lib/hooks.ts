'use client';

import { useState, useEffect, useLayoutEffect, type RefObject } from 'react';

/**
 * 响应式媒体查询 Hook
 * 用于检测屏幕宽度，避免 SSR Hydration 问题
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // 初始化时设置状态
    setMatches(media.matches);

    // 监听变化
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * 检测是否为移动端
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function fitContainedSize(width: number, height: number, aspect: number) {
  const containerAspect = width / height;
  if (containerAspect > aspect) {
    return {
      width: height * aspect,
      height,
    };
  }

  return {
    width,
    height: width / aspect,
  };
}

interface UseContainedMapSizeOptions {
  onContainerResize?: (size: { width: number; height: number }) => void;
  shouldMeasure?: () => boolean;
}

export function useContainedMapSize(
  containerRef: RefObject<HTMLElement | null>,
  mapAspect: number | null,
  options: UseContainedMapSizeOptions = {}
) {
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const { onContainerResize, shouldMeasure } = options;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;

      onContainerResize?.({ width, height });

      if (!mapAspect) return;
      if (shouldMeasure && !shouldMeasure()) return;

      setMapSize(fitContainedSize(width, height, mapAspect));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef, mapAspect, onContainerResize, shouldMeasure]);

  return mapSize;
}
