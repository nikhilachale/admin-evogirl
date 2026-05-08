import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'dark' | 'light' | 'hero' | 'mark';
  className?: string;
}

/**
 * The evogirl wordmark, ported from the original prototype.
 * - dark   → for dark sidebars (gold on near-black)
 * - light  → for light surfaces (deep purple)
 * - hero   → large variant for landing/hero
 * - mark   → just the crown glyph, used when sidebar is collapsed
 */
export function Logo({ variant = 'dark', className }: LogoProps) {
  if (variant === 'mark') {
    return (
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold',
          className,
        )}
      >
        <span className="text-[18px] leading-none">♛</span>
      </div>
    );
  }

  const sizes = {
    dark: { crown: 'text-[14px]', text: 'text-[20px]', tag: 'text-[7px]' },
    light: { crown: 'text-[14px]', text: 'text-[18px]', tag: 'text-[7px]' },
    hero: { crown: 'text-[22px]', text: 'text-[36px]', tag: 'text-[9px]' },
  } as const;

  const colors = {
    dark: { crown: 'text-brand-gold', text: 'text-brand-gold', tag: 'text-brand-gold/50' },
    light: { crown: 'text-brand-purple-mid', text: 'text-brand-purple', tag: 'text-brand-gray' },
    hero: { crown: 'text-brand-gold', text: 'text-white', tag: 'text-white/50' },
  } as const;

  const s = sizes[variant];
  const c = colors[variant];

  return (
    <div className={cn('flex flex-col items-center leading-none', className)}>
      <span className={cn('mb-px leading-none', s.crown, c.crown)}>♛</span>
      <span
        className={cn(
          'font-display font-bold leading-none tracking-[0.25em]',
          s.text,
          c.text,
          variant === 'hero' && 'tracking-[0.4em]',
        )}
      >
        EVOGIRL
      </span>
      <span
        className={cn(
          'mt-0.5 font-bold uppercase leading-none tracking-[0.18em]',
          s.tag,
          c.tag,
          variant === 'hero' && 'mt-1 tracking-[0.3em]',
        )}
      >
        Premium Hair
      </span>
    </div>
  );
}
