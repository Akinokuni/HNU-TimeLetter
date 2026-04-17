import type { Metadata } from 'next';
import Link from 'next/link';
import { MapExperience } from '@/components/shared/MapExperience';

export const metadata: Metadata = {
  title: '地图界面 | HNU-TimeLetter',
  description: '直达校园地图交互界面。',
};

export default function MapPage() {
  return (
    <main className="relative min-h-screen bg-[#fdfbf7]">
      <div className="grain-paper fixed inset-0 pointer-events-none z-0 opacity-20 brightness-100 contrast-150 mix-blend-multiply" />
      <div className="fixed left-4 top-4 z-30 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full border border-stone-300/80 bg-white/78 px-4 py-2 text-sm text-stone-700 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur transition hover:bg-white"
        >
          返回首页
        </Link>
      </div>
      <MapExperience />
    </main>
  );
}
