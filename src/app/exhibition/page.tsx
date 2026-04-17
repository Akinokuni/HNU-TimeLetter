import type { Metadata } from 'next';
import { ExhibitionBoard } from '@/components/exhibition/ExhibitionBoard';
import { getExhibitionCards } from '@/lib/exhibition';

export const metadata: Metadata = {
  title: '校园故事展览表 | HNU-TimeLetter',
  description: '以便签纸形式展示校园文本、故事与图片的展览页，并支持接入飞书展览表。',
};

type ExhibitionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExhibitionPage({ searchParams }: ExhibitionPageProps) {
  const cards = await getExhibitionCards();
  const params = (await searchParams) ?? {};
  const rawCardId = params.CardID;
  const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId)?.trim() || undefined;
  const visibleCards = cardId ? cards.filter((card) => card.cardId === cardId) : cards;

  return (
    <main className="page-paper grid-paper-board relative min-h-screen overflow-hidden text-foreground">
      <div className="grain-paper pointer-events-none absolute inset-0 opacity-15 mix-blend-multiply" />
      <ExhibitionBoard cards={visibleCards} cardId={cardId} />
    </main>
  );
}
