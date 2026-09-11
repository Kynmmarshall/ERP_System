import type { Config } from 'tailwindcss'

const withAlpha =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `hsl(var(${variable}))`
      : `hsl(var(${variable}) / ${opacityValue})`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: withAlpha('--color-background'),
        surface: withAlpha('--color-surface'),
        'surface-elevated': withAlpha('--color-surface-elevated'),
        primary: withAlpha('--color-primary'),
        secondary: withAlpha('--color-secondary'),
        accent: withAlpha('--color-accent'),
        text: withAlpha('--color-text'),
        muted: withAlpha('--color-muted'),
        border: withAlpha('--color-border'),
        glow: withAlpha('--color-glow'),
        success: withAlpha('--color-success'),
        warning: withAlpha('--color-warning'),
        error: withAlpha('--color-error'),
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config
