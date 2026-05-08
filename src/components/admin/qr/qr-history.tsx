import { CheckCircle2, Clock } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import type { GeneratedQrCard } from '@/types/qr';

interface Props {
  history: GeneratedQrCard[];
}

/**
 * Recent generation runs. Not shown in the prototype (which doesn't
 * persist anything) — added so the panel still feels populated when
 * an agent first opens it. Displays SKU, batch, when it was generated,
 * and whether it has been printed yet.
 */
export function QrHistory({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Recent Generation Runs
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-3 border-b border-border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Product · SKU</span>
          <span>Batch</span>
          <span>Generated</span>
          <span>Status</span>
        </div>
        {history.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center gap-3 border-b border-border/50 px-4 py-3 text-sm last:border-b-0"
          >
            <div>
              <div className="font-semibold text-foreground">{c.productName}</div>
              <div className="font-mono text-[10.5px] text-muted-foreground">
                {c.productSku}
              </div>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {c.batch}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatRelative(c.generatedAt)}
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              {c.printedAt ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Printed</span>
                </>
              ) : (
                <>
                  <Clock size={12} className="text-brand-gold" />
                  <span className="text-brand-gold">Queued</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
