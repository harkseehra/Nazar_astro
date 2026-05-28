import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        gentium: ['var(--font-gentium)', 'Georgia', 'serif'],
        vazir:   ['var(--font-vazir)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
