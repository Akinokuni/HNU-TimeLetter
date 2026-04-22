'use client';

import { useEffect } from 'react';
import { useIsMobile } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { InteractiveMap } from '@/components/desktop/InteractiveMap';
import { MobileExperience } from '@/components/mobile/MobileExperience';

/**
 * /map 路由：地图主体验（桌面端 InteractiveMap / 移动端 MobileExperience）。
 * 由全局导航栏的「地图」按钮路由至此。进入后自动将 isEnvelopeOpened 置为 true，
 * 以便其他依赖该状态的组件（例如 Lenis 滚动开关）保持一致行为。
 */
export default function MapPage() {
  const isMobile = useIsMobile();
  const { setEnvelopeOpened, setIntroReady } = useAppStore();

  useEffect(() => {
    setEnvelopeOpened(true);
    setIntroReady(true);
  }, [setEnvelopeOpened, setIntroReady]);

  return (
    <main className="relative w-full min-h-screen">
      {isMobile ? <MobileExperience /> : <InteractiveMap />}
    </main>
  );
}
