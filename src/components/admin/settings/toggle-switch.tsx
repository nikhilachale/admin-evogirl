import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string; // for aria
  disabled?: boolean;
}

/**
 * Pill-style toggle that matches the prototype's `.toggle-switch` look.
 * Uses `role="switch"` so it stays accessible without re-creating a checkbox.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-emerald-500/30' : 'bg-foreground/10',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[18px] w-[18px] rounded-full transition-[left] duration-200',
          checked ? 'left-[23px] bg-emerald-400' : 'left-[3px] bg-foreground',
        )}
      />
    </button>
  );
}
