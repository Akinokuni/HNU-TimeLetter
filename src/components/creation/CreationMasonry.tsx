'use client';

import type { CreationCard } from '@/lib/types';
import CreationNoteCard from './CreationNoteCard';

interface CreationMasonryProps {
  cards: CreationCard[];
}

export default function CreationMasonry({ cards }: CreationMasonryProps) {
  // 空态
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <p className="text-ink-muted text-center text-sm font-serif leading-relaxed max-w-md">
          当前还没有公开灵感，
          <br />
          欢迎先在群内发起第一条共创提案
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full px-4 sm:px-6 lg:px-10
                 columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5
                 gap-5"
    >
      {cards.map((card) => (
        <CreationNoteCard key={card.id} card={card} />
      ))}
    </div>
  );
}
