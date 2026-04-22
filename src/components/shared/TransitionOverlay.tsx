'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * 路由级过渡遮罩：放在 `app/layout.tsx` 里以便在 `/ → /map` 跨路由切换期间保持挂载。
 *
 * 触发方式：调用方（当前为 `EnvelopeIntro.handleOpen`）在开信动画末尾置 `isTransitioning=true`，
 * 随即 `router.push('/map')`。遮罩覆盖信纸放大到 `/map` 首帧渲染之间的空窗。
 *
 * 自动消退：挂起后 2500ms（对齐「信纸放大 0.9s + 目标页入场 ~1.5s」）清除 `isTransitioning`，
 * `AnimatePresence` 的 exit 再叠加 1s 淡出，总计约 3.5s。
 */
export function TransitionOverlay() {
  const { isTransitioning, setTransitioning } = useAppStore();

  useEffect(() => {
    if (!isTransitioning) return;
    const t = setTimeout(() => setTransitioning(false), 2500);
    return () => clearTimeout(t);
  }, [isTransitioning, setTransitioning]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="transition-overlay"
          aria-hidden
          className="fixed inset-0 z-[100] page-paper flex flex-col items-center justify-center gap-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          {/* 加载动画：三点脉冲 */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block w-2.5 h-2.5 rounded-full bg-[#c23643]"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
          <motion.p
            className="font-serif text-muted-foreground text-lg tracking-[0.22em]"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            加载中…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
