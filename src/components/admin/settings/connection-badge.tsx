import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/types/settings';

const PALETTE: Record<
  ConnectionStatus,
  { label: string; tone: string; dot: string }
> = {
  connected: {
    label: 'Connected',
    tone: 'bg-emerald-500/12 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  running: {
    label: 'Running',
    tone: 'bg-emerald-500/12 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  disconnected: {
    label: 'Disconnected',
    tone: 'bg-brand-pink/12 text-brand-pink',
    dot: 'bg-brand-pink',
  },
};

interface Props {
  status: ConnectionStatus;
  /** Override the rendered label (e.g. "Reconnect"). */
  label?: string;
}

export function ConnectionBadge({ status, label }: Props) {
  const { label: defaultLabel, tone, dot } = PALETTE[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold',
        tone,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label ?? defaultLabel}
    </span>
  );
}
