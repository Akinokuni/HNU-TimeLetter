'use client';

import { useIsMobile } from '@/lib/hooks';
import { InteractiveMap } from '@/components/desktop/InteractiveMap';
import { MobileExperience } from '@/components/mobile/MobileExperience';

/**
 * `/map` 路由：地图主体验（桌面端 InteractiveMap / 移动端 MobileExperience）。
 * 由全局导航栏的「地图」按钮或 EnvelopeIntro 开信动画结束后的 `router.push('/map')` 进入。
 *
 * 本页不再写入任何全局 zustand 状态：地图的可见性完全由路由决定，
 * 避免浏览器前进/后退时遗留的 `isEnvelopeOpened=true` 让 `/` 错误渲染地图。
 */
export default function MapPage() {
  const isMobile = useIsMobile();

  return (
    <main className="relative w-full min-h-screen">
      {isMobile ? <MobileExperience /> : <InteractiveMap />}
    </main>
  );
}
