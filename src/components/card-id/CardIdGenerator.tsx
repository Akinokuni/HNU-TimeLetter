'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type CardIdResponse = {
  cardId: string;
  usedCount: number;
  remainingCount: number;
  selfPath: string;
  exhibitionPath: string;
};

function buildAbsoluteUrl(path: string) {
  if (typeof window === 'undefined') {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export function CardIdGenerator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCardId = searchParams.get('CardID')?.trim() ?? '';
  const [cardId, setCardId] = useState(queryCardId);
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('点击下面按钮，生成一个未被占用的 CardID。');
  const [exhibitionPath, setExhibitionPath] = useState(
    queryCardId ? `/exhibition?CardID=${encodeURIComponent(queryCardId)}` : '/exhibition'
  );

  useEffect(() => {
    setCardId(queryCardId);
    setExhibitionPath(
      queryCardId ? `/exhibition?CardID=${encodeURIComponent(queryCardId)}` : '/exhibition'
    );
  }, [queryCardId]);

  const sharePath = useMemo(() => {
    return cardId ? `/card-id?CardID=${encodeURIComponent(cardId)}` : '/card-id';
  }, [cardId]);

  async function generateCardId() {
    setIsGenerating(true);
    setMessage('正在从飞书表里排除已占用的 CardID...');

    try {
      const response = await fetch('/api/card-id', { cache: 'no-store' });
      const payload = (await response.json()) as CardIdResponse | { message: string };

      if (!response.ok || !('cardId' in payload)) {
        throw new Error('message' in payload ? payload.message : '生成 CardID 失败。');
      }

      setCardId(payload.cardId);
      setUsedCount(payload.usedCount);
      setRemainingCount(payload.remainingCount);
      setExhibitionPath(payload.exhibitionPath);
      setMessage(`已为你生成新的 CardID，并自动避开 ${payload.usedCount} 个已分配编号。`);
      router.replace(payload.selfPath, { scroll: false });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '生成 CardID 失败。');
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyCurrentCardId() {
    if (!cardId) {
      setMessage('先生成一个 CardID，再复制会更顺手。');
      return;
    }

    await navigator.clipboard.writeText(cardId);
    setMessage('CardID 已复制。');
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(buildAbsoluteUrl(sharePath));
    setMessage('带 CardID 的分享链接已复制。');
  }

  return (
    <section className="relative z-10 px-5 pb-16 pt-10 sm:px-8 lg:px-14">
      <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-stone-900/8 bg-[#f9efc7] p-6 shadow-[0_24px_50px_rgba(91,69,43,0.14)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.45em] text-stone-500">Card ID Booth</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[0.08em] text-stone-800 sm:text-5xl">
            随机 CardID 生成器
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            每次生成前都会先读取飞书表里的既有 CardID，自动排除已经分配过的编号。
          </p>

          <div className="mt-8 rounded-[28px] border border-stone-900/8 bg-white/55 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <p className="text-xs uppercase tracking-[0.36em] text-stone-500">Current CardID</p>
            <div className="mt-3 flex min-h-24 items-center rounded-[22px] border border-dashed border-stone-400/80 bg-[#fffaf0] px-6 py-5">
              <span className="font-serif text-4xl tracking-[0.22em] text-stone-800 sm:text-5xl">
                {cardId || '------'}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateCardId}
                disabled={isGenerating}
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-[#fff8ee] transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-70"
              >
                {isGenerating ? '生成中...' : '生成新的 CardID'}
              </button>
              <button
                type="button"
                onClick={copyCurrentCardId}
                className="rounded-full border border-stone-400 bg-white/75 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
              >
                复制 CardID
              </button>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-full border border-stone-400 bg-white/75 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
              >
                复制分享链接
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-stone-900/8 bg-[#fff7df] px-5 py-4 text-sm leading-7 text-stone-700">
            {message}
          </div>
        </article>

        <div className="grid gap-7">
          <article className="rounded-[30px] border border-stone-900/8 bg-[#f4d2bd] p-6 shadow-[0_20px_40px_rgba(91,69,43,0.12)]">
            <p className="text-xs uppercase tracking-[0.38em] text-stone-500">Status</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white/55 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">已占用</p>
                <p className="mt-2 font-serif text-3xl text-stone-800">
                  {usedCount === null ? '--' : usedCount}
                </p>
              </div>
              <div className="rounded-[22px] bg-white/55 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">剩余可用</p>
                <p className="mt-2 font-serif text-3xl text-stone-800">
                  {remainingCount === null ? '--' : remainingCount}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-stone-900/8 bg-[#dce8c7] p-6 shadow-[0_20px_40px_rgba(91,69,43,0.12)]">
            <p className="text-xs uppercase tracking-[0.38em] text-stone-500">Jump</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-[0.06em] text-stone-800">
              带参跳到 Exhibition
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              推荐直接使用 <span className="font-medium">/exhibition?CardID=xxxxxx</span> 这条链路。
              这样生成器、展览页和后续表单都能围绕同一个 CardID 串起来。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={exhibitionPath}
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-[#fff8ee] transition hover:bg-stone-700"
              >
                前往 Exhibition
              </Link>
              <Link
                href="/map"
                className="rounded-full border border-stone-400 bg-white/75 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
              >
                进入地图界面
              </Link>
              <Link
                href={sharePath}
                className="rounded-full border border-stone-400 bg-white/75 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
              >
                当前生成器链接
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
