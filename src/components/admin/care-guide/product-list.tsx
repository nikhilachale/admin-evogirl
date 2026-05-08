import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CareGuideProduct } from '@/data/care-guide.mock';

interface ProductListProps {
  products: CareGuideProduct[];
  activeProductId: string | null;
  onSelect: (productId: string) => void;
  onAddProduct: () => void;
}

/**
 * Translates the prototype's `.product-list` panel (promise-admin.html lines
 * 1840-1869). The original showed a hero thumbnail for the first product and
 * fell back to an emoji glyph for the rest; we preserve that branching.
 */
export function ProductList({
  products,
  activeProductId,
  onSelect,
  onAddProduct,
}: ProductListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          Products ({products.length})
        </span>
        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center gap-1 rounded-md bg-brand-gold/15 px-2.5 py-1 text-[11px] font-bold text-brand-gold transition-colors hover:bg-brand-gold/25"
        >
          <Plus size={12} />
          Add Product
        </button>
      </div>

      <ul className="divide-y divide-border/40">
        {products.map((product) => {
          const active = product.id === activeProductId;
          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onSelect(product.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]',
                  active && 'bg-brand-gold/[0.08]',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg',
                    active
                      ? 'bg-brand-gold/15 text-brand-gold'
                      : 'bg-foreground/[0.05] text-foreground',
                  )}
                >
                  {product.heroImage ? (
                    <img
                      src={product.heroImage}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden>{product.icon}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      'truncate text-sm font-semibold',
                      active ? 'text-brand-gold' : 'text-foreground',
                    )}
                  >
                    {product.name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {product.category} · {product.sku}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
