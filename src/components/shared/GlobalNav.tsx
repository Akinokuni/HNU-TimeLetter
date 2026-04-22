'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';

/**
 * 全局导航栏 (Global Navigation Bar)
 *
 * 以轻量悬浮姿态常驻于视口右上角，跨越所有页面保持位置不变，
 * 服务于「主页 / 地图 / 公示板」三个顶层视觉阶段之间的切换。
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
  const { isEnvelopeOpened, setEnvelopeOpened } = useAppStore();
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

  // 感知当前处于哪个视觉阶段：
  // - `/creation` → 公示板
  // - `/` + 信封已开启 → 地图
  // - `/` + 信封未开启 → 主页
  const active: NavKey =
    pathname === '/creation' ? 'board' : isEnvelopeOpened ? 'map' : 'home';

  const isHome = pathname === '/';
  // 开屏态：首页且页面未滚动时，胶囊容器下方附加红色长方形色块
  const showHomeBlock = mounted && isHome && !scrolled;

  const handleClick = (key: NavKey) => {
    if (key === 'board') {
      if (pathname !== '/creation') router.push('/creation');
      return;
    }
    if (key === 'home') {
      if (pathname !== '/') router.push('/');
      setEnvelopeOpened(false);
      return;
    }
    // key === 'map'
    if (pathname !== '/') router.push('/');
    setEnvelopeOpened(true);
  };

  return (
    <div
      className="fixed top-[2.5vh] right-[2.5vw] z-[90] pointer-events-none select-none"
      aria-label="全局导航"
    >
      <div className="pointer-events-auto relative">
        {/* 首页开屏红色色块：仅左下角圆角，其余三角直角；视觉上紧贴胶囊下沿 */}
        <AnimatePresence>
          {showHomeBlock && (
            <motion.div
              key="home-block"
              aria-hidden
              className="absolute left-0 w-full pointer-events-none"
              style={{
                top: 'calc(100% - 1px)',
                width: '7vw',
                minWidth: 56,
                maxWidth: 96,
                height: '30vh',
                background: '#c23643',
                borderBottomLeftRadius: '9999px',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* 胶囊容器：磨砂玻璃 + Primary 红描边 + 完整胶囊圆角 */}
        <LayoutGroup id="global-nav">
          <ul
            className="relative flex flex-col items-stretch rounded-full border backdrop-blur-md shadow-sm"
            style={{
              borderColor: '#c23643',
              background: 'rgba(246, 241, 235, 0.55)',
              width: '7vw',
              minWidth: 56,
              maxWidth: 96,
              padding: '6px',
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
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 38,
                      }}
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
                      paddingTop: '14px',
                      paddingBottom: '14px',
                      fontSize: 'clamp(12px, 0.95vw, 15px)',
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
