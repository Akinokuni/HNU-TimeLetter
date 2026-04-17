import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ExhibitionCard, ExhibitionEntry, ExhibitionSubmission } from '@/lib/exhibition';

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="paper-panel border-border/80 px-4 py-2 font-serif text-sm tracking-[0.08em] text-foreground transition duration-150 hover:-translate-y-0.5 hover:shadow-paper-hover"
    >
      {children}
    </Link>
  );
}

function EntryPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-border/80 bg-paper px-3 py-1 font-serif text-[11px] tracking-[0.16em] text-foreground">
      {children}
    </span>
  );
}

function EmptyBoardState({ cardId }: { cardId?: string }) {
  return (
    <div className="border border-border/70 bg-card/84 px-6 py-8 shadow-paper">
      <div className="space-y-4 font-sans text-[15px] leading-8 text-ink">
        <p className="font-serif text-xl tracking-[0.04em] text-foreground">
          当前还没有可归档的 CardID 投稿。
        </p>
        <p>
          现在的展览页已经只按 <span className="font-serif text-foreground">CardID</span> 整合卡片，不再假设人物名和时间。
          如果问卷表里还没有提交记录，页面会保持空展板状态。
        </p>
        <p>可展示的内容会严格收口到表里已有的提交项，例如昵称、灵感、故事和参考图片。</p>
        {cardId ? (
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-muted-foreground">
            当前筛选 CardID = {cardId}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SubmissionEntry({
  entry,
  fallbackAlt,
}: {
  entry: ExhibitionEntry;
  fallbackAlt: string;
}) {
  return (
    <div className="space-y-3">
      <EntryPill>{entry.kind}</EntryPill>
      {entry.text ? (
        <div className="border border-border/70 bg-paper-strong/35 px-4 py-4">
          <ScrollArea className="h-[148px] pr-3">
            <p className="whitespace-pre-wrap pr-4 font-sans text-base leading-8 text-ink md:text-[17px]">
              {entry.text}
            </p>
          </ScrollArea>
        </div>
      ) : null}
      {entry.imageUrl ? (
        <figure className="inline-flex w-full max-w-[236px] flex-col gap-3 border border-border/70 bg-paper/92 p-2">
          <div className="relative h-[140px] w-full overflow-hidden bg-paper-strong">
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt ?? fallbackAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 236px, 236px"
              unoptimized={entry.imageUrl.startsWith('/api/feishu/attachment/')}
            />
          </div>
          <figcaption className="font-serif text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            参考图片
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}

function SubmissionBlock({
  submission,
  cardId,
}: {
  submission: ExhibitionSubmission;
  cardId: string;
}) {
  return (
    <section className="border-t border-border/70 pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-serif text-[18px] leading-tight tracking-[0.02em] text-foreground md:text-[20px]">
          {submission.nickname}
        </h3>
      </div>

      <div className="mt-4 space-y-5">
        {submission.entries.map((entry) => (
          <SubmissionEntry
            key={entry.id}
            entry={entry}
            fallbackAlt={`${cardId} 的提交参考图`}
          />
        ))}
      </div>
    </section>
  );
}

function CardEntry({ card }: { card: ExhibitionCard }) {
  return (
    <article className="mb-8 inline-block w-full break-inside-avoid border border-border/70 bg-card/88 px-5 py-6 align-top shadow-paper md:mb-10 md:px-6 md:py-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="font-serif text-xs uppercase tracking-[0.24em] text-muted-foreground">
          CardID
        </span>
        <h2 className="font-serif text-[22px] leading-tight tracking-[0.02em] text-foreground md:text-[26px]">
          {card.cardId}
        </h2>
      </div>

      <div className="mt-6 space-y-5">
        {card.submissions.map((submission) => (
          <SubmissionBlock key={submission.id} submission={submission} cardId={card.cardId} />
        ))}
      </div>
    </article>
  );
}

export function ExhibitionBoard({
  cards,
  cardId,
}: {
  cards: ExhibitionCard[];
  cardId?: string;
}) {
  return (
    <section className="relative z-10 px-5 pb-16 pt-10 sm:px-8 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="font-serif text-xs uppercase tracking-[0.42em] text-muted-foreground">
              Exhibition Board
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[0.03em] text-foreground sm:text-5xl">
              校园故事展览表
            </h1>
            <p className="mt-4 max-w-2xl font-sans text-sm leading-7 text-ink sm:text-base sm:leading-8">
              现在每张卡片都只按同一个 CardID 归档。昵称、灵感、故事和图片都作为投稿内容逐条展开，
              不再额外假设人物名、角色名或时间字段。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionLink href="/map">返回地图界面</ActionLink>
            <ActionLink href="/card-id">打开 CardID 生成器</ActionLink>
          </div>
        </div>

        <article className="paper-panel grain-paper border-border/80 px-6 py-8 md:px-10 md:py-10">
          <div className="mb-8 flex flex-wrap gap-x-8 gap-y-2 border-b border-border/70 pb-4 font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>当前按 CardID 归档 {cards.length} 张卡</span>
            {cardId ? <span>当前筛选 CardID = {cardId}</span> : null}
          </div>

          {cards.length === 0 ? (
            <EmptyBoardState cardId={cardId} />
          ) : (
            <div className="columns-1 gap-8 md:columns-2 md:gap-10">
              {cards.map((card) => (
                <CardEntry key={card.id} card={card} />
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
