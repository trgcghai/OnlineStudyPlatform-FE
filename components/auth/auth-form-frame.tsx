import type { ReactNode } from "react";
import { BookOpen, Sparkles } from "lucide-react";

export function AuthFormFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl shadow-indigo-950/10 lg:min-h-[680px] lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative isolate flex min-h-56 flex-col justify-between overflow-hidden bg-[#171641] px-6 py-6 text-white sm:px-9 sm:py-8 lg:min-h-[680px] lg:px-12 lg:py-11">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 -z-10 size-80 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-8 -z-10 size-52 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
        />

        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl border border-white/15 bg-white/10 text-indigo-100">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            E-Learning AI
          </span>
        </div>

        <div className="relative z-10 mt-8 max-w-md lg:mt-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Không gian học tập
          </p>
          <h1 className="mt-4 text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Mở ra một điều mới.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-indigo-100/75 sm:text-base sm:leading-7">
            Bắt đầu từ điều bạn tò mò. Tiến xa hơn với từng bài học nhỏ.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative mx-auto mt-10 hidden h-56 w-full max-w-sm items-center justify-center lg:flex"
        >
          <div className="absolute h-48 w-48 rounded-full border border-white/10" />
          <div className="absolute h-36 w-36 rounded-full border border-white/15" />
          <div className="relative flex h-36 w-56 -rotate-3 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-indigo-950/30 backdrop-blur-sm transition-transform duration-500 motion-reduce:transition-none">
            <div className="flex-1 border-r border-white/15 p-5">
              <span className="block h-1.5 w-12 rounded-full bg-cyan-200/80" />
              <span className="mt-5 block h-1 w-full rounded-full bg-white/25" />
              <span className="mt-2 block h-1 w-4/5 rounded-full bg-white/15" />
              <span className="mt-2 block h-1 w-3/5 rounded-full bg-white/15" />
            </div>
            <div className="flex flex-1 flex-col justify-end p-5">
              <span className="mb-3 grid size-9 place-items-center rounded-xl bg-indigo-200/15 text-indigo-100">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              <span className="block h-1.5 w-4/5 rounded-full bg-white/30" />
              <span className="mt-2 block h-1 w-3/5 rounded-full bg-white/15" />
            </div>
          </div>
          <span className="absolute right-5 top-3 size-2 rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(165,243,252,0.8)]" />
        </div>

        <p className="mt-7 hidden text-xs text-indigo-100/50 sm:block lg:mt-0">
          Học theo nhịp riêng của bạn
        </p>
      </aside>

      <div className="flex items-center justify-center bg-card px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
