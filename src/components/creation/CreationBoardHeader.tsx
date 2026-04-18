export default function CreationBoardHeader() {
  return (
    <header className="w-full pt-12 pb-8 sm:pt-16 sm:pb-10 px-4 sm:px-6 lg:px-10 text-center">
      <h1 className="font-serif tracking-wider mb-3">
        创作公示板
      </h1>
      <p className="text-ink-muted max-w-lg mx-auto">
        这里收集群友灵感，欢迎在已有灵感上继续扩写与衍生
      </p>
      {/* 分隔 — 克制的细线 */}
      <div className="mt-6 mx-auto w-16 h-px bg-ink-muted/30" />
    </header>
  );
}
