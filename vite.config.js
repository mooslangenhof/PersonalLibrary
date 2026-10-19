import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built site works both locally and on GitHub Pages
  // (where it lives under /PersonalLibrary/ instead of the domain root).
  base: './',
  server: { open: true },
  build: { chunkSizeWarningLimit: 2000 },
})
