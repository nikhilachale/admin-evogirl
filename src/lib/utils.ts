import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes — later classes win on conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as INR currency. */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Strip a phone number down to its significant trailing digits so masked /
 * differently-formatted numbers for the same person still compare equal
 * (e.g. "+91 98XXX-XX138" → "9198138"). Returns '' if too short to trust.
 */
export function normalizePhoneDigits(phone: string | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(-10) : '';
}

/** Format a unix timestamp as "2 mins ago" / "3 hours ago" / etc. */
export function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(timestamp).toLocaleDateString('en-IN');
}
