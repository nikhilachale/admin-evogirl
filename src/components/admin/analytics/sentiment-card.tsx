import { cn } from '@/lib/utils';
import type { ReviewSentiment } from '@/types/analytics';

interface Props {
  sentiment: ReviewSentiment;
}

export function SentimentCard({ sentiment }: Props) {
  // Build the donut from the buckets, in order, accumulating offsets.
  const segments: { color: string; offset: number; length: number }[] = [];
  let acc = 0;
  for (const b of sentiment.buckets) {
    segments.push({ color: b.color, offset: -acc, length: b.pct });
    acc += b.pct;
  }

  return (
    <div>
      <div className="mt-3 flex items-center gap-3.5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3.6"
            />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={seg.color}
                strokeWidth="3.6"
                strokeDasharray={`${seg.length} 100`}
                strokeDashoffset={seg.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-2xl leading-none text-foreground">
              {sentiment.averageRating.toFixed(1)}
            </div>
            <div className="text-[8.5px] font-bold tracking-widest text-muted-foreground">
              AVG
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {sentiment.buckets.map((b) => (
            <div key={b.label} className="flex justify-between text-[11.5px]">
              <span className="text-muted-foreground">
                <span className="mr-1.5" style={{ color: b.color }}>
                  ●
                </span>
                {b.label}
              </span>
              <span className="font-bold text-foreground">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3.5">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          🤖 Top Phrases (AI)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sentiment.phrases.map((p) => (
            <span
              key={p.text}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                p.tone === 'positive'
                  ? 'border-success/20 bg-success/10 text-success'
                  : 'border-brand-pink/20 bg-brand-pink/10 text-brand-pink',
              )}
            >
              {p.text} {p.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
