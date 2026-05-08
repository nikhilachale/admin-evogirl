import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { toast } from '@/store/toast';
import { useQrStore } from '@/store/qr';
import { MOCK_QR_CARDS, QR_PRODUCT_PRESETS } from '@/data/qr-cards.mock';
import type { GeneratedQrCard, QrCardConfig, QrCardUrls } from '@/types/qr';
import { PageHeader } from '@/components/admin/page-header';
import { QrConfigForm } from '@/components/admin/qr/qr-config-form';
import {
  QrCardSideA,
  QrCardSideB,
} from '@/components/admin/qr/qr-card-preview';
import { QrDataPanel } from '@/components/admin/qr/qr-data-panel';
import { QrHistory } from '@/components/admin/qr/qr-history';

const DEFAULT_PRODUCT = QR_PRODUCT_PRESETS[0];

const DEFAULT_CONFIG: QrCardConfig = {
  category: DEFAULT_PRODUCT.category,
  productSku: DEFAULT_PRODUCT.sku,
  productName: DEFAULT_PRODUCT.name,
  batch: 'BATCH-2025-04',
  quantity: 500,
};

/** Build the two URLs the generator embeds in each card. */
function buildUrls(config: QrCardConfig): QrCardUrls {
  const params = `pid=${encodeURIComponent(config.productSku)}&b=${encodeURIComponent(config.batch)}`;
  return {
    sideA: `https://promise.evogirl.com/reward?${params}`,
    sideB: `https://promise.evogirl.com/help?${params}`,
  };
}

/** Render a QR data URL with the prototype's visual settings. */
async function renderQr(text: string): Promise<string> {
  // Both prototype sides used the same dark/light pair (line 3382).
  // We keep that contrast for max scannability — bezel coloring lives
  // on the card frame, not on the QR itself.
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 220,
    // qrcode is canvas-based and needs literal hex (CSS vars not supported).
    // Pinned to the brand palette's darkest purple + lightest pale.
    color: { dark: '#1F1B2E', light: '#EDE8F5' },
  });
}

export function QrGeneratorPage() {
  const [config, setConfig] = useState<QrCardConfig>(DEFAULT_CONFIG);
  const [generating, setGenerating] = useState(false);
  const [qrSideA, setQrSideA] = useState<string | null>(null);
  const [qrSideB, setQrSideB] = useState<string | null>(null);

  const history = useQrStore((s) => s.history);
  const hydrate = useQrStore((s) => s.hydrate);
  const recordRun = useQrStore((s) => s.recordRun);
  const markPrinted = useQrStore((s) => s.markPrinted);

  // Hydrate the history with a few mock runs on first mount.
  useEffect(() => {
    if (history.length === 0) hydrate(MOCK_QR_CARDS);
  }, [history.length, hydrate]);

  const urls = useMemo(() => buildUrls(config), [config]);

  // Auto-render the QR previews when the config changes — matches the
  // prototype's `updateQRPreview()` reactivity (line 3392).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, b] = await Promise.all([
        renderQr(urls.sideA),
        renderQr(urls.sideB),
      ]);
      if (cancelled) return;
      setQrSideA(a);
      setQrSideB(b);
    })();
    return () => {
      cancelled = true;
    };
  }, [urls.sideA, urls.sideB]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const [a, b] = await Promise.all([
        renderQr(urls.sideA),
        renderQr(urls.sideB),
      ]);
      setQrSideA(a);
      setQrSideB(b);

      const id = `qr-${config.productSku}-${config.batch}`;
      const card: GeneratedQrCard = {
        id,
        productSku: config.productSku,
        productName: config.productName,
        serial: config.batch,
        batch: config.batch,
        category: config.category,
        url: urls.sideA,
        urls,
        qrImages: { sideA: a, sideB: b },
        generatedAt: Date.now(),
      };
      recordRun(card);

      toast({
        icon: '⚡',
        title: 'QR codes generated',
        description: `${config.quantity} cards ready for ${config.productSku} · ${config.batch}.`,
        tone: 'success',
      });
    } catch (err) {
      toast({
        icon: '⚠',
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Unknown error.',
        tone: 'error',
      });
    } finally {
      setGenerating(false);
    }
  }, [config, urls, recordRun]);

  const handlePrint = useCallback(() => {
    const id = `qr-${config.productSku}-${config.batch}`;
    markPrinted(id);
    // Defer to the browser print dialog like the prototype's `printCard()`
    // (line 3398). The `print-area` styling lives in the prototype's
    // print stylesheet only — in this SPA we just trigger the browser
    // print dialog and let the existing card-preview DOM render.
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, [config.batch, config.productSku, markPrinted]);

  return (
    <div className="p-8">
      <PageHeader
        title="QR Card Generator"
        subtitle="Generate print-ready cards for product packaging · Both sides auto-generated"
      />

      <div className="grid gap-7 lg:grid-cols-[340px_1fr] lg:items-start">
        <QrConfigForm
          value={config}
          onChange={setConfig}
          onGenerate={handleGenerate}
          onPrint={handlePrint}
          generating={generating}
          generated={Boolean(qrSideA && qrSideB)}
        />

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Side A — Reward & Warranty
            </div>
            <QrCardSideA qrDataUrl={qrSideA} />
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Side B — Help & Support
            </div>
            <QrCardSideB qrDataUrl={qrSideB} />
          </div>

          <QrDataPanel urls={urls} />
        </div>
      </div>

      <div className="mt-8">
        <QrHistory history={history} />
      </div>
    </div>
  );
}
