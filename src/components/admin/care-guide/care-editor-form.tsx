import { useMemo } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatRelative } from '@/lib/utils';
import { useCareGuideStore } from '@/store/care-guide';
import { toast } from '@/store/toast';
import { ImageGrid } from './image-grid';
import { LabeledTextarea } from './labeled-textarea';
import { UploadZone } from './upload-zone';

const PALETTES = [
  'bg-gradient-to-br from-brand-purple-pale to-brand-purple-light',
  'bg-gradient-to-br from-pink-50 to-pink-200',
  'bg-gradient-to-br from-green-50 to-green-200',
  'bg-gradient-to-br from-amber-50 to-amber-200',
  'bg-gradient-to-br from-sky-50 to-sky-200',
];
const EMOJIS = ['🏫', '💼', '🌸', '🎀', '🦋', '✨', '🌿'];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

/**
 * Translates the prototype's `.care-form` panel (promise-admin.html lines
 * 1872-1922) into a controlled React form. Save / publish actions toast and
 * mutate `useCareGuideStore`; lines (do/don't) are stored as one-per-line
 * textarea content to match the original UX.
 */
export function CareEditorForm() {
  const products = useCareGuideStore((s) => s.products);
  const guides = useCareGuideStore((s) => s.guides);
  const contents = useCareGuideStore((s) => s.contents);
  const activeProductId = useCareGuideStore((s) => s.activeProductId);
  const dirty = useCareGuideStore((s) => s.dirty);
  const updateContent = useCareGuideStore((s) => s.updateContent);
  const removeInspirationImage = useCareGuideStore(
    (s) => s.removeInspirationImage,
  );
  const addInspirationImage = useCareGuideStore((s) => s.addInspirationImage);
  const saveDraft = useCareGuideStore((s) => s.saveDraft);
  const saveAndPublish = useCareGuideStore((s) => s.saveAndPublish);

  const product = useMemo(
    () => products.find((p) => p.id === activeProductId) ?? null,
    [products, activeProductId],
  );
  const guide = activeProductId ? guides[activeProductId] : null;
  const content = activeProductId ? contents[activeProductId] : null;

  if (!product || !guide || !content) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Pick a product on the left to author its care guide.
      </div>
    );
  }

  const dosText = content.dos.join('\n');
  const dontsText = content.donts.join('\n');

  const handleAddInspiration = () => {
    addInspirationImage({
      id: `ins-${Date.now().toString(36)}`,
      emoji: pickRandom(EMOJIS),
      gradient: pickRandom(PALETTES),
    });
  };

  const handlePreview = () => {
    toast({
      icon: '👁',
      title: 'Preview ready',
      description: `${product.name} — preview opens at /help/care/${product.sku}.`,
      tone: 'default',
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold text-foreground">
            {guide.title}
          </h2>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {guide.publishedAt
              ? `Published · last edited ${formatRelative(guide.updatedAt)}`
              : `Draft · last edited ${formatRelative(guide.updatedAt)}`}
            {dirty && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Unsaved
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={saveDraft}
          className={cn(
            'bg-brand-pink text-white hover:bg-brand-pink/90',
            !dirty && 'opacity-80',
          )}
        >
          Save Changes
        </Button>
      </header>

      <div className="space-y-5">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Product Hero Image
          </span>
          <UploadZone
            onBrowse={() =>
              toast({
                icon: '🖼️',
                title: 'Hero upload',
                description:
                  'File picker is wired in; CephRGW upload lands once backend mediates the PUT.',
                tone: 'default',
              })
            }
          />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Occasion / Inspiration Images
          </span>
          <ImageGrid
            images={content.inspirationImages}
            onRemove={removeInspirationImage}
            onAdd={handleAddInspiration}
          />
        </div>

        <LabeledTextarea
          label="Daily Care Tips"
          rows={5}
          placeholder="Enter daily care tips..."
          value={content.dailyCareTips}
          onChange={(e) => updateContent('dailyCareTips', e.target.value)}
        />

        <LabeledTextarea
          label="Cleaning Guide"
          rows={4}
          placeholder="Cleaning instructions..."
          value={content.cleaningGuide}
          onChange={(e) => updateContent('cleaningGuide', e.target.value)}
        />

        <LabeledTextarea
          label="Storage Tips"
          rows={2}
          placeholder="Storage recommendations..."
          value={content.storageTips}
          onChange={(e) => updateContent('storageTips', e.target.value)}
        />

        <LabeledTextarea
          label="Do's (one per line)"
          rows={4}
          value={dosText}
          onChange={(e) =>
            updateContent(
              'dos',
              e.target.value.split('\n').map((line) => line),
            )
          }
        />

        <LabeledTextarea
          label="Don'ts (one per line)"
          rows={4}
          value={dontsText}
          onChange={(e) =>
            updateContent(
              'donts',
              e.target.value.split('\n').map((line) => line),
            )
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveAndPublish}
            className="flex-1 rounded-lg bg-gradient-to-br from-brand-pink to-[#C4006A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
          >
            Save &amp; Publish
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
          >
            <Eye size={14} />
            Preview
          </button>
        </div>
      </div>
    </section>
  );
}
