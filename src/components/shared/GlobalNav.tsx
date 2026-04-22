'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from 'framer-motion';
import { useAppStore } from '@/lib/store';


/**
 * 全局导航栏 (Global Navigation Bar)
 *
 * 以轻量悬浮姿态常驻于视口右上角，跨越所有页面保持位置不变，
 * 服务于「主页 / 地图 / 公示板」三个顶层视觉阶段之间的切换。
 *
 * 堆叠关系（由下至上）：
 *   页面内容 → CustomScrollbar (z-1000) → 红色背景块 → 胶囊
 * 外层容器 z-[1100]，高于滑块轨道；红色背景块 z-0，胶囊 z-10，
 * 确保视觉上红色背景包裹胶囊、胶囊悬浮其上，而非二者并排。
 *
 * 视觉规格参见 `docs/design/交互设计.md#1.4 全局导航栏`。
 */

type NavKey = 'home' | 'map' | 'board';

const ITEMS: { key: NavKey; label: string }[] = [
  { key: 'home', label: '主页' },
  { key: 'map', label: '地图' },
  { key: 'board', label: '公示板' },
];

export function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setEnvelopeOpened, setIntroReady } = useAppStore();
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 1);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 不在后台管理路由下渲染
  if (pathname?.startsWith('/admin')) return null;

  // 感知当前处于哪个视觉阶段：纯路由判定，避免状态耦合
  // - `/creation` → 公示板
  // - `/map`      → 地图
  // - 其余（含 `/`） → 主页
  const active: NavKey =
    pathname === '/creation'
      ? 'board'
      : pathname === '/map'
        ? 'map'
        : 'home';

  const isHome = pathname === '/';
  // 开屏态：首页且页面未滚动时，显示紧贴视口右上角的红色背景块
  const showHomeBlock = mounted && isHome && !scrolled;

  const handleClick = (key: NavKey) => {
    if (key === 'board') {
      if (pathname !== '/creation') router.push('/creation');
      return;
    }
    if (key === 'home') {
      // 回到 `/` 重置开屏态：同时重置 isIntroReady，
      // 否则 `src/app/page.tsx` 的 `locked = !isEnvelopeOpened && !isIntroReady`
      // 因 `isIntroReady` 可能被 `/map` 或上一次 EnvelopeIntro 置为 true，
      // 会让信封入场动画重放期间滚动不再锁定，违反 globals.css 的「开屏入场动画期间禁止下滑」约束。
      setEnvelopeOpened(false);
      setIntroReady(false);
      if (pathname !== '/') router.push('/');
      return;
    }
    // key === 'map'
    if (pathname !== '/map') router.push('/map');
  };

  // prefers-reduced-motion：弱化/关闭动效，保留最终态
  const pillTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 420, damping: 38 };
  const blockTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: 'easeInOut' };

  return (
    <div
      // 钉视口右上角；z 高于 CustomScrollbar(z-[1000])，使红背景能覆盖滑块轨道区
      className="fixed top-0 right-0 z-[1100] pointer-events-none select-none"
      aria-label="全局导航"
    >
      {/* 红色背景块：首页开屏态专属；z-0，位于胶囊下层，包裹胶囊外轮廓。
          `initial={false}` —— 首次进入开屏不播淡入，仅在滚动/回滚时做淡出淡入。
          圆角与胶囊 rounded-full 等比放大（radius ≈ width/2），高度收敛以减少视觉占用。*/}
      <AnimatePresence initial={false}>
        {showHomeBlock && (
          <motion.div
            key="home-block"
            aria-hidden
            className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: '7vw',
              minWidth: 80,
              maxWidth: 128,
              height: '28vh',
              minHeight: 200,
              maxHeight: 320,
              background: '#c23643',
              borderBottomLeftRadius: '3.5vw',
              zIndex: 0,
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={blockTransition}
          />
        )}
      </AnimatePresence>

      {/* 胶囊：较窄(~4vw)，top 留 2.5vh 以显红色包裹感，right 贴视口更紧 */}
      <div
        className="pointer-events-auto absolute"
        style={{
          top: '2.5vh',
          right: '0.8vw',
          zIndex: 10,
        }}
      >
        <LayoutGroup id="global-nav">
          <ul
            className="relative flex flex-col items-stretch rounded-full border backdrop-blur-md shadow-sm"
            style={{
              borderColor: '#c23643',
              background: 'rgba(246, 241, 235, 0.55)',
              width: '4vw',
              minWidth: 44,
              maxWidth: 64,
              padding: '5px',
            }}
          >
            {ITEMS.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key} className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="global-nav-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: '#c23643' }}
                      transition={pillTransition}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleClick(item.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className="relative w-full flex items-center justify-center font-serif tracking-[0.18em] transition-colors duration-200"
                    style={{
                      writingMode: 'vertical-rl',
                      color: isActive ? '#ffffff' : '#5a4748',
                      paddingTop: '18px',
                      paddingBottom: '18px',
                      fontSize: 'clamp(11px, 0.85vw, 13px)',
                      lineHeight: 1.1,
                    }}
                  >
                    <span className="relative">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </div>
    </div>
  );
}

export default GlobalNav;
