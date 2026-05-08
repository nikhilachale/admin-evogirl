import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InspirationImage } from '@/data/care-guide.mock';

interface ImageGridProps {
  images: InspirationImage[];
  onRemove: (imageId: string) => void;
  onAdd: () => void;
}

/**
 * Replaces the prototype's `.image-preview-grid` (promise-admin.html lines
 * 1886-1893). Each tile shows the inspiration emoji over a tinted gradient and
 * exposes a remove control on hover; the trailing tile is the "add another"
 * affordance.
 */
export function ImageGrid({ images, onRemove, onAdd }: ImageGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            'relative flex aspect-square items-center justify-center overflow-hidden rounded-lg text-2xl shadow-sm',
            image.gradient,
          )}
        >
          <span aria-hidden>{image.emoji}</span>
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            aria-label="Remove image"
            className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/80 text-white shadow transition-colors hover:bg-rose-500"
          >
            <X size={11} strokeWidth={3} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        aria-label="Add inspiration image"
        className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border bg-foreground/[0.02] text-muted-foreground transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
