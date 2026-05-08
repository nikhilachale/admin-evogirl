import type { ProductReturnReasons } from '@/types/analytics';

interface Props {
  rows: ProductReturnReasons[];
}

export function ReturnReasons({ rows }: Props) {
  return (
    <div className="mt-3 flex flex-col gap-3.5">
      {rows.map((row) => (
        <div key={row.name}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-base">{row.emoji}</span>
            <span className="text-[12.5px] font-bold text-foreground">{row.name}</span>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {row.claims} claims
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-md bg-foreground/[0.05]">
            {row.segments.map((seg, i) => (
              <div
                key={`${row.name}-${seg.label}-${i}`}
                title={seg.label}
                style={{ width: `${seg.pct}%`, background: seg.color }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2.5 text-[10.5px] text-muted-foreground">
            {row.segments
              .filter((seg) => seg.label.toLowerCase() !== 'other')
              .map((seg) => (
                <span key={seg.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ background: seg.color }}
                  />
                  {seg.label} {seg.pct}%
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
