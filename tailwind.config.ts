import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Brand palette — wired to CSS variables in src/styles/globals.css.
        // Edit the `--brand-*` block in globals.css to retheme.
        // Tailwind opacity modifiers (bg-brand-gold/15) work because the
        // variables are stored as raw HSL triplets, not `hsl(...)` strings.
        brand: {
          'purple-darkest': 'hsl(var(--brand-purple-darkest))',
          'purple-deep': 'hsl(var(--brand-purple-deep))',
          'purple': 'hsl(var(--brand-purple))',
          'purple-mid': 'hsl(var(--brand-purple-mid))',
          'purple-light': 'hsl(var(--brand-purple-light))',
          'purple-pale': 'hsl(var(--brand-purple-pale))',
          'gold': 'hsl(var(--brand-gold))',
          'gold-light': 'hsl(var(--brand-gold-light))',
          'gold-dark': 'hsl(var(--brand-gold-dark))',
          'pink': 'hsl(var(--brand-pink))',
          'pink-light': 'hsl(var(--brand-pink-light))',
          'white': 'hsl(var(--brand-white))',
          'gray': 'hsl(var(--brand-gray))',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
