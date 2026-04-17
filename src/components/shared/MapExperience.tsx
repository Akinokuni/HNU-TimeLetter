'use client';

import { useEffect, useState } from 'react';
import { useIsMobile } from '@/lib/hooks';
import { InteractiveMap } from '@/components/desktop/InteractiveMap';
import { MobileExperience } from '@/components/mobile/MobileExperience';

export function MapExperience() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative z-10 w-full min-h-screen">
      {mounted ? (isMobile ? <MobileExperience /> : <InteractiveMap />) : <div className="min-h-screen" />}
    </div>
  );
}
