import type { PlatformShare } from '@/types/analytics';

export function PlatformBreakdown({ platforms }: { platforms: PlatformShare[] }) {
  return (
    <div className="flex flex-col gap-2.5 pt-1">
      {platforms.map((p) => (
        <div key={p.name} className="flex items-center gap-3">
          <span className="text-base leading-none">{p.emoji}</span>
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-[11px]">
              <span className="text-muted-foreground">{p.name}</span>
              <span className="font-bold text-foreground">{p.pct}%</span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: `${p.pct}%`, background: p.color, opacity: 0.7 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
