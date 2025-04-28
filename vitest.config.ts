import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'istanbul',
      reportsDirectory: './coverage',
      exclude: ['**/node_modules/**', '**/tests/**', 'src/components/ui/**', 'src/main.tsx'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
    }
  },
});
