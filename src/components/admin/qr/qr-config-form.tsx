import { useMemo } from 'react';
import { Printer, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  QR_CATEGORY_LABELS,
  QR_PRODUCT_PRESETS,
} from '@/data/qr-cards.mock';
import type { QrCardConfig, QrProductCategory } from '@/types/qr';

interface Props {
  value: QrCardConfig;
  onChange: (next: QrCardConfig) => void;
  onGenerate: () => void;
  onPrint: () => void;
  generating?: boolean;
  generated?: boolean;
}

const FIELD_BASE =
  'h-9 w-full rounded-[8px] border border-white/10 bg-white/[0.03] px-3 text-[12.5px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40';

export function QrConfigForm({
  value,
  onChange,
  onGenerate,
  onPrint,
  generating,
  generated,
}: Props) {
  const productsForCategory = useMemo(
    () => QR_PRODUCT_PRESETS.filter((p) => p.category === value.category),
    [value.category],
  );

  const handleCategoryChange = (next: QrProductCategory) => {
    const firstProduct = QR_PRODUCT_PRESETS.find((p) => p.category === next);
    if (!firstProduct) return;
    onChange({
      ...value,
      category: next,
      productSku: firstProduct.sku,
      productName: firstProduct.name,
    });
  };

  const handleSkuChange = (sku: string) => {
    const preset = QR_PRODUCT_PRESETS.find((p) => p.sku === sku);
    if (!preset) return;
    onChange({ ...value, productSku: preset.sku, productName: preset.name });
  };

  return (
    <aside className="rounded-2xl border border-border bg-card/40 p-5">
      <h2 className="mb-4 text-sm font-extrabold text-foreground">
        Card Configuration
      </h2>

      <div className="space-y-3">
        <Field label="Product Category">
          <select
            value={value.category}
            onChange={(e) =>
              handleCategoryChange(e.target.value as QrProductCategory)
            }
            className={cn(FIELD_BASE, 'appearance-none')}
          >
            {(Object.keys(QR_CATEGORY_LABELS) as QrProductCategory[]).map(
              (key) => (
                <option key={key} value={key}>
                  {QR_CATEGORY_LABELS[key]}
                </option>
              ),
            )}
          </select>
        </Field>

        <Field label="Product SKU / Name">
          <select
            value={value.productSku}
            onChange={(e) => handleSkuChange(e.target.value)}
            className={cn(FIELD_BASE, 'appearance-none')}
          >
            {productsForCategory.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Product ID (auto-filled)">
          <Input
            readOnly
            value={value.productSku}
            className="h-9 cursor-not-allowed border-white/10 bg-white/[0.03] font-mono text-[12px] opacity-60"
          />
        </Field>

        <Field label="Batch / Print Run">
          <Input
            value={value.batch}
            onChange={(e) => onChange({ ...value, batch: e.target.value })}
            placeholder="e.g. BATCH-2025-04"
            className="h-9 border-white/10 bg-white/[0.03] font-mono text-[12px]"
          />
        </Field>

        <Field label="Quantity to Print">
          <Input
            type="number"
            min={1}
            value={value.quantity}
            onChange={(e) =>
              onChange({
                ...value,
                quantity: Math.max(0, Number(e.target.value) || 0),
              })
            }
            placeholder="Number of cards"
            className="h-9 border-white/10 bg-white/[0.03] text-[12.5px]"
          />
        </Field>
      </div>

      <div className="mt-5 space-y-2">
        <Button
          onClick={onGenerate}
          disabled={generating}
          className="w-full bg-brand-purple-mid text-white hover:bg-brand-purple-mid/90"
        >
          <Zap size={14} className="mr-1.5" />
          {generating
            ? 'Generating...'
            : generated
              ? 'Regenerate QR Codes'
              : 'Generate QR Codes'}
        </Button>
        <Button
          onClick={onPrint}
          variant="secondary"
          className="w-full bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25"
        >
          <Printer size={14} className="mr-1.5" />
          Print Cards
        </Button>
      </div>

      <PrintSpecs />
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function PrintSpecs() {
  return (
    <div className="mt-4 rounded-[10px] border border-emerald-400/15 bg-emerald-400/[0.07] p-3">
      <div className="mb-1 text-[10px] font-bold tracking-wider text-emerald-400">
        PRINT SPECS
      </div>
      <div className="text-[11px] leading-[1.7] text-muted-foreground">
        Size: 85mm × 54mm (Credit card)
        <br />
        Print: CMYK, 300 DPI
        <br />
        Finish: Matte lamination + Spot UV on ₹100 badge
        <br />
        QR: Error correction Level H (30%)
        <br />
        Tested scan distance: up to 15cm
      </div>
    </div>
  );
}
