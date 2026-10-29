/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5180, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        // Large, rarely-changing libraries get their own cacheable chunks.
        manualChunks: {
          codemirror: ['@uiw/react-codemirror', '@codemirror/lang-css', '@codemirror/autocomplete', '@codemirror/lint'],
          csstree: ['css-tree'],
          react: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
