import type { QrCardUrls } from '@/types/qr';

/**
 * The "Embedded QR Data" block under the card previews.
 * Mirrors promise-admin.html lines 1785-1791.
 */
export function QrDataPanel({ urls }: { urls: QrCardUrls }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Embedded QR Data
      </div>
      <div className="space-y-1.5 font-mono text-[11.5px] leading-[1.7] text-foreground/55">
        <div>
          <span className="text-brand-gold/80">Side A:</span> {urls.sideA}
        </div>
        <div>
          <span className="text-brand-pink/80">Side B:</span> {urls.sideB}
        </div>
      </div>
    </div>
  );
}
