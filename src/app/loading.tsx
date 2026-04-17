import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="page-paper fixed inset-0 z-[100] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-primary" />
      </div>
      <p className="mt-4 font-serif text-sm tracking-widest text-muted-foreground animate-pulse">
        正在载入回忆...
      </p>
    </div>
  );
}
