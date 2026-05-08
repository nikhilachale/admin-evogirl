import { cn } from '@/lib/utils';

/**
 * Mirrors the prototype's `.s3-badge` (promise-admin.html line 484) — a small
 * pill that signals the configured object-storage backend is reachable.
 */
export function S3Badge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-success/20 bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {label}
    </span>
  );
}
