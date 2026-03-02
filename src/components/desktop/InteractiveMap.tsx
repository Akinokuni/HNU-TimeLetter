'use client';

import { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import data from '@/data/content.json';
import { StoryView } from './StoryView';
import { LocationPoint } from '@/lib/types';

/**
 * InteractiveMap (交互式地图组件) — 重构版
 *
 * 交互流程:
 *  idle ──(点击 Pin)──► rolling ──(地图动画完成)──► rolled
 *  rolled ──(点击卷轴)──► unrolling ──(故事退出完成 → 地图展开 → 动画完成)──► idle
 *
 * 布局策略:
 *  - 地图容器: absolute right-0, 动画 width 100% ↔ STRIP_WIDTH px (右锚定)
 *  - 故事面板: absolute left-0 right-[STRIP_WIDTH], z-10 (在地图下方)
 *  - 地图覆盖故事面板(z-20); 卷起后 56px 条带可见，故事面板从左侧露出
 *  - 卷轴条按钮: z-30 (位于地图堆叠上下文内，仍高于故事面板)
 *
 * 性能要点:
 *  - mapContainerRef 指向内层 100vw div，ResizeObserver 不受外层动画影响
 *  - phaseRef 同步最新 phase，避免 animation callback 闭包陷阱
 *  - isMapRolled 与 phase 解耦，确保"故事退出 → 地图展开"的顺序动画
 */

type Phase = 'idle' | 'rolling' | 'rolled' | 'unrolling';

/** 卷轴条宽度 (px) */
const STRIP_WIDTH = 56;

/** 地图卷起动画参数 */
const MAP_ROLL_TRANSITION = {
  roll:   { duration: 0.48, ease: [0.55, 0, 0.9, 0.45] as const },
  unroll: { duration: 0.52, ease: [0.1, 0.55, 0.45, 1] as const },
};

export function InteractiveMap() {
  // ─── 相位状态机 ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('idle');
  /**
   * phaseRef 始终同步最新 phase，供 animation callback 读取，
   * 避免 useCallback 依赖导致的闭包过期问题。
   */
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  // ─── 地图折叠状态 (与 phase 解耦，用于驱动 width 动画) ─────────────────────
  /**
   * isMapRolled 单独控制 Framer Motion width animate 值，
   * 这样可在 AnimatePresence.onExitComplete 回调中精确触发地图展开，
   * 而不是在 phase 变更时立即触发。
   */
  const [isMapRolled, setIsMapRolled] = useState(false);

  // ─── 当前激活地点 ──────────────────────────────────────────────────────────
  const [activeLocation, setActiveLocation] = useState<LocationPoint | null>(null);

  // ─── 地图尺寸计算 ──────────────────────────────────────────────────────────
  /**
   * mapContainerRef 指向内层 style={{ width: '100vw' }} div，
   * 外层动画容器压缩时，此 div 始终报告完整视口宽度，
   * 确保 Pin 的百分比坐标定位始终准确。
   */
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [mapAspect, setMapAspect] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!mapAspect) return;
    const container = mapContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const containerAspect = width / height;
      if (containerAspect > mapAspect) {
        setMapSize({ width: height * mapAspect, height });
      } else {
        setMapSize({ width, height: width / mapAspect });
      }
    };

    updateSize();
    const obs = new ResizeObserver(updateSize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [mapAspect]);

  // ─── 事件处理器 ────────────────────────────────────────────────────────────

  /** 点击地图 Pin：仅在 idle 状态下响应，防止动画中途重入 */
  const handleLocationSelect = useCallback((location: LocationPoint) => {
    if (phaseRef.current !== 'idle') return;
    setActiveLocation(location);
    setIsMapRolled(true);   // 触发地图 width 动画: 100% → STRIP_WIDTH
    setPhase('rolling');
  }, []);

  /** 点击卷轴条：仅在 rolled 状态下响应 */
  const handleRollBack = useCallback(() => {
    if (phaseRef.current !== 'rolled') return;
    setPhase('unrolling'); // 触发故事面板的 AnimatePresence exit 动画
  }, []);

  /**
   * 故事面板退出动画完成时触发 (AnimatePresence.onExitComplete)
   * 此时才启动地图展开动画，实现"先退出故事 → 再展开地图"的顺序感。
   */
  const handleStoryExitComplete = useCallback(() => {
    setIsMapRolled(false); // 触发地图 width 动画: STRIP_WIDTH → 100%
  }, []);

  /**
   * 地图 width 动画完成时触发。
   * 使用 phaseRef 读取最新 phase，避免闭包陷阱。
   */
  const handleMapAnimationComplete = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'rolling') {
      setPhase('rolled');
    } else if (p === 'unrolling') {
      setPhase('idle');
      setActiveLocation(null); // 清理，避免下次卷起时短暂闪现旧内容
    }
  }, []);

  // showStory 控制 AnimatePresence 的挂载/卸载
  // 仅在 'rolled' 状态（地图已完全卷起）时显示，确保顺序感
  const showStory = phase === 'rolled';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fdfbf7]">

      {/* ── 故事面板 ─────────────────────────────────────────────────────────
          z-30，位于地图上方。地图卷起后从左侧"露出"。
          key 绑定 activeLocation.id：切换地点时触发重新挂载与进场动画。
          onExitComplete：故事退场完成后，通知地图开始展开。
      ──────────────────────────────────────────────────────────────────── */}
      <AnimatePresence onExitComplete={handleStoryExitComplete}>
        {showStory && activeLocation && (
          <motion.div
            key={activeLocation.id}
            className="absolute top-0 left-0 bottom-0 z-30"
            style={{ right: STRIP_WIDTH }}
            initial={{ opacity: 0, y: 48 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { type: 'spring', stiffness: 58, damping: 18 },
            }}
            exit={{
              opacity: 0,
              y: '-100%',
              transition: { duration: 0.36, ease: 'easeIn' },
            }}
          >
            <StoryView stories={activeLocation.stories} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 地图容器 ──────────────────────────────────────────────────────────
          z-10，右锚定。width 从 100% 动画至 STRIP_WIDTH px，实现"卷起"效果。
          overflow-hidden 裁剪内层 100vw div，让地图从右侧边缘开始"收纳"。
      ──────────────────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 z-10 overflow-hidden"
        animate={{ width: isMapRolled ? STRIP_WIDTH : '100%' }}
        transition={isMapRolled ? MAP_ROLL_TRANSITION.roll : MAP_ROLL_TRANSITION.unroll}
        onAnimationComplete={handleMapAnimationComplete}
      >
        {/* 内层 div：始终为 100vw，右锚定。
            mapContainerRef 指向此 div，ResizeObserver 不受外层动画影响。 */}
        <div
          ref={mapContainerRef}
          className="absolute top-0 right-0 bottom-0"
          style={{ width: '100vw' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: mapSize.width, height: mapSize.height }}>

              {/* 地图底图 */}
              <Image
                src="/images/map.svg"
                alt="HNU Map"
                fill
                className="object-contain"
                priority
                sizes="100vw"
                onLoadingComplete={(img) => {
                  if (img.naturalWidth && img.naturalHeight) {
                    setMapAspect(img.naturalWidth / img.naturalHeight);
                  }
                }}
              />

              {/* 地图 Pin 点 */}
              {data.locations.map((loc) => {
                const latestStory = loc.stories[0];
                if (!latestStory) return null;

                return (
                  <div
                    key={loc.id}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${loc.x}%`,
                      top: `${loc.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => handleLocationSelect(loc)}
                  >
                    {/* Avatar 气泡 */}
                    <div className="w-12 h-12 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-white opacity-90 hover:opacity-100 hover:scale-110 hover:-translate-y-2 transition-all duration-300 relative z-10">
                      <Image
                        src={latestStory.avatarUrl}
                        alt={latestStory.characterName}
                        width={48}
                        height={48}
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>

                    {/* Hover Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-20">
                      {loc.name}
                      {loc.stories.length > 1 && (
                        <span className="ml-1 text-xs text-gray-300">({loc.stories.length})</span>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* ── 卷轴条 (Scroll Strip) ────────────────────────────────────────
            z-30（地图堆叠上下文内），地图卷起时淡入。
            点击此条触发 handleRollBack，启动还原流程。
            视觉设计：仿古信纸纹理 + 竖排"展开地图"文字 + 地图 Pin 图标。
        ──────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isMapRolled && (
            <motion.button
              key="scroll-strip"
              className="absolute left-0 top-0 bottom-0 z-30 flex flex-col items-center justify-center gap-4 select-none"
              style={{
                width: STRIP_WIDTH,
                background: 'linear-gradient(to right, #ede6d9 50%, rgba(237,230,217,0.6))',
                boxShadow: '5px 0 25px rgba(139,90,43,0.22), inset -2px 0 0 rgba(139,90,43,0.15)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.22, delay: 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              onClick={handleRollBack}
              aria-label="展开地图"
              title="点击展开地图"
            >
              {/* 装饰性横纹（模拟卷纸边缘） */}
              <div
                className="absolute inset-y-10 left-3 right-3 flex flex-col justify-between pointer-events-none"
                aria-hidden="true"
              >
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="h-px rounded-full" style={{ background: 'rgba(120,70,20,0.15)' }} />
                ))}
              </div>

              {/* 地图 Pin 图标 */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="relative z-10 flex-shrink-0"
                style={{ color: 'rgba(139,90,43,0.7)' }}
                aria-hidden="true"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>

              {/* 竖排文字 */}
              <p
                className="relative z-10 text-[10px] tracking-[0.28em] font-medium"
                style={{ writingMode: 'vertical-rl', color: 'rgba(120,70,20,0.65)' }}
              >
                展开地图
              </p>

              {/* 向左箭头（暗示可展开） */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10 flex-shrink-0"
                style={{ color: 'rgba(139,90,43,0.6)' }}
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
