import { ImagePlus } from 'lucide-react';

interface UploadZoneProps {
  onBrowse?: () => void;
}

/**
 * Stand-in for the prototype's `.upload-zone` (promise-admin.html lines
 * 1879-1883). The real upload flow will POST to the CephRGW S3 backend; for
 * now we render the hint copy and a clickable "browse files" affordance.
 */
export function UploadZone({ onBrowse }: UploadZoneProps) {
  return (
    <button
      type="button"
      onClick={onBrowse}
      className="group flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-foreground/[0.02] px-6 py-6 text-center transition-colors hover:border-brand-gold/40 hover:bg-brand-gold/[0.04]"
    >
      <ImagePlus
        size={28}
        className="text-muted-foreground transition-colors group-hover:text-brand-gold"
      />
      <div className="text-sm font-semibold text-foreground">
        Drag &amp; drop or{' '}
        <span className="text-brand-gold underline-offset-2 group-hover:underline">
          browse files
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        JPG, PNG, WEBP up to 5MB · Stored to CephRGW S3
      </div>
    </button>
  );
}
