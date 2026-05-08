import { cn } from '@/lib/utils';

/**
 * Side A — Reward & Warranty
 *
 * Translates the prototype's `.card-printable.card-side-a` into Tailwind.
 * Source: promise-admin.html lines 1741-1761.
 */
export function QrCardSideA({
  qrDataUrl,
  className,
}: {
  qrDataUrl: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // .card-printable
        'relative flex h-[192px] w-[336px] flex-col overflow-hidden rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        // .card-side-a — gradient pulled from prototype line 402.
        'bg-[linear-gradient(140deg,hsl(var(--brand-purple-darkest))_0%,hsl(var(--brand-purple-deep))_55%,hsl(var(--brand-purple))_100%)]',
        className,
      )}
    >
      <CardLogoRow tag="OWN YOUR STYLE" />

      <div className="flex min-h-0 flex-1 items-center gap-3 overflow-hidden px-[14px] pb-[18px] pt-2">
        <QrFrame
          tone="gold"
          qrDataUrl={qrDataUrl}
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
          <div className="mb-1 text-[7.5px] font-extrabold uppercase tracking-[0.18em] text-white/40">
            Valid 30 days · Next purchase
          </div>
          <div
            className={cn(
              'mb-1.5 block rounded-[9px] px-3 pb-1.5 pt-[7px] text-center',
              // .card-gold-inset gradient from prototype line 428.
              'bg-[linear-gradient(135deg,#A87800,#F0D060_40%,#E8C030_60%,#A87800)]',
              'shadow-[0_3px_12px_rgba(168,120,0,0.4)]',
            )}
          >
            <span className="block font-display text-[46px] leading-[0.82] tracking-tight text-[#1A0A00]">
              ₹100
            </span>
            <span className="block font-display text-[14px] leading-[1.1] tracking-[0.35em] text-[#3A1A00]">
              REWARD
            </span>
          </div>
          <div className="mb-1.5 mt-[5px] text-[7.5px] font-bold tracking-wide text-white/35">
            + 90-Day Warranty · Joined by 50,000+
          </div>
          <span className="inline-flex items-center gap-1 self-start rounded-[5px] bg-brand-pink px-[9px] py-1 text-[8px] font-extrabold tracking-wide text-white">
            <span aria-hidden>⚡</span>
            SCAN NOW — GET ₹100
          </span>
        </div>
      </div>

      <span className="absolute bottom-2 right-[14px] text-[7px] font-bold tracking-wide text-brand-gold/40">
        promise.evogirl.com/reward
      </span>
    </div>
  );
}

/**
 * Side B — Help & Support
 *
 * Translates the prototype's `.card-side-b` block (lines 1764-1782).
 */
export function QrCardSideB({
  qrDataUrl,
  className,
}: {
  qrDataUrl: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex h-[192px] w-[336px] flex-col overflow-hidden rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        // .card-side-b gradient (line 403).
        'bg-[linear-gradient(140deg,#0A0118_0%,#1E0535_60%,#2E1050_100%)]',
        className,
      )}
    >
      {/* .card-promise-bg — giant ghost word behind the content. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[96px] leading-none tracking-tight text-white/[0.045]"
      >
        PROMISE
      </span>

      <CardLogoRow tag="WE'VE GOT YOU" />

      <div className="flex min-h-0 flex-1 items-center gap-3 overflow-hidden px-[14px] pb-[18px] pt-2">
        <QrFrame tone="pink" qrDataUrl={qrDataUrl} />
        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
          <div className="mb-0.5 font-display text-[24px] leading-[0.92] tracking-wide text-white">
            NEED HELP?
          </div>
          <div className="mb-1.5 font-display text-[21px] leading-[0.92] tracking-[0.06em] text-brand-pink">
            WE'RE HERE 24/7
          </div>
          <div className="mb-1.5 text-[8px] leading-[1.55] text-white/45">
            Returns • Exchanges • Product Qs
            <br />
            Reply under 2 hours. No hassle.
          </div>
          <span className="inline-flex items-center gap-1 self-start rounded-[5px] border border-brand-pink/40 bg-brand-pink/[0.18] px-[9px] py-1 text-[8px] font-extrabold tracking-wide text-white/90">
            <span aria-hidden>💬</span>
            GET HELP NOW
          </span>
        </div>
      </div>

      <span className="absolute bottom-2 right-[14px] text-[7px] font-bold tracking-wide text-brand-pink/35">
        promise.evogirl.com/help
      </span>
    </div>
  );
}

function CardLogoRow({ tag }: { tag: string }) {
  return (
    <div className="flex h-[38px] flex-shrink-0 items-center justify-between overflow-hidden px-[14px] pt-2.5">
      <span className="font-display text-[13px] font-bold uppercase tracking-[0.32em] text-brand-gold">
        ♛ EVOGIRL
      </span>
      <span className="whitespace-nowrap text-[7px] font-extrabold uppercase tracking-[0.18em] text-white/30">
        {tag}
      </span>
    </div>
  );
}

function QrFrame({
  tone,
  qrDataUrl,
}: {
  tone: 'gold' | 'pink';
  qrDataUrl: string | null;
}) {
  // Bezel gradients pulled directly from prototype lines 418 / 420.
  const bezel =
    tone === 'gold'
      ? 'bg-[linear-gradient(145deg,#B8860B,#F0D060,#C9A020)] shadow-[0_0_20px_rgba(212,175,55,0.55)]'
      : 'bg-[linear-gradient(145deg,#CC0066,#FF6BA8,#E02070)] shadow-[0_0_20px_rgba(255,61,139,0.5)]';

  return (
    <div
      className={cn(
        'flex h-[96px] w-[96px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] p-[5px]',
        bezel,
      )}
    >
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`QR code (${tone === 'gold' ? 'reward' : 'help'} side)`}
          className="h-full w-full rounded-[6px]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-brand-white text-center text-[10px] font-bold text-brand-purple">
          QR CODE
        </div>
      )}
    </div>
  );
}
