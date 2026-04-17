'use client';

import type { CreationCard } from '@/lib/types';
import { getCardColor, getCardRotation } from './utils';
import CreationNoteEntry from './CreationNoteEntry';

interface CreationNoteCardProps {
  card: CreationCard;
}

export default function CreationNoteCard({ card }: CreationNoteCardProps) {
  const bgColor = getCardColor(card.cardId);
  const rotation = getCardRotation(card.cardId);

  return (
    <div
      className="relative break-inside-avoid mb-5
                 transition-all duration-200 ease-out"
      style={{
        backgroundColor: bgColor,
        transform: `rotate(${rotation}deg) translateY(0px)`,
        boxShadow: '2px 3px 12px rgba(69,39,40,0.08)',
        borderRadius: 0,
        // Hover 时角度归正、轻微抬升、阴影增强（通过 CSS 变量）
        ['--hover-transform' as string]: 'rotate(0deg) translateY(-4px)',
        ['--hover-shadow' as string]: '0 8px 24px rgba(69,39,40,0.14)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(69,39,40,0.14)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotation}deg) translateY(0px)`;
        e.currentTarget.style.boxShadow = '2px 3px 12px rgba(69,39,40,0.08)';
      }}
    >
      {/* 顶部按钮区：独立占位，避免压住第一条 entry 的 tag */}
      <div className="flex justify-end px-4 pt-3 pb-1">
        <a
          href={card.addIdeaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 whitespace-nowrap
                     border border-black/[0.08] bg-white/92 px-3 py-1.5
                     text-[11px] leading-none text-ink
                     shadow-[0_2px_6px_rgba(69,39,40,0.08)]
                     transition-colors duration-150 hover:bg-white"
          style={{ borderRadius: 0 }}
        >
          <span className="text-[12px] leading-none">+</span>
          <span>新增创意</span>
        </a>
      </div>

      {/* 卡片内部堆叠项 */}
      <div className="pt-1">
        {card.entries.map((entry, idx) => (
          <CreationNoteEntry
            key={entry.id}
            entry={entry}
            isLast={idx === card.entries.length - 1}
          />
        ))}
      </div>

      {/* 底部装饰线 — 模拟便签撕裂边缘 */}
      <div
        className="h-[3px] w-full opacity-20"
        style={{
          background: `repeating-linear-gradient(90deg, ${bgColor} 0px, ${bgColor} 4px, transparent 4px, transparent 8px)`,
        }}
      />
    </div>
  );
}
