import type { Metadata } from 'next';
import { CardIdGenerator } from '@/components/card-id/CardIdGenerator';

export const metadata: Metadata = {
  title: 'CardID 生成器 | HNU-TimeLetter',
  description: '自动排除飞书表中已分配 CardID 的随机编号生成页。',
};

export default function CardIdPage() {
  return (
    <main className="grid-paper-board relative min-h-screen overflow-hidden bg-[#f6edd2] text-stone-800">
      <div className="grain-paper pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.62),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(193,158,92,0.16),_transparent_28%)]" />
      <CardIdGenerator />
    </main>
  );
}
