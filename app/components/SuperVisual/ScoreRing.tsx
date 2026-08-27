"use client";

import { useId } from "react";
import { metaDeScore } from "@/lib/model";

export function ScoreRing({ score, size = 110 }: { score: number; size?: number }) {
  const id = useId();
  const gradId = `gradScore-${id.replace(/:/g, "")}`;
  const meta = metaDeScore(score);
  const circ = 2 * Math.PI * 46;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Score ${score} de 100, tier ${meta.label}`}
      role="img"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 motion-safe:transition-all motion-safe:duration-700">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="drop-shadow-sm motion-safe:transition-all motion-safe:duration-700"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={meta.stop0} />
            <stop offset="100%" stopColor={meta.stop1} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black tabular-nums sm:text-[28px] ${meta.colorCls}`}>{score}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">score</span>
      </div>
    </div>
  );
}
