import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [['src/renderer/**', 'jsdom']],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    setupFiles: ['./src/renderer/src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
