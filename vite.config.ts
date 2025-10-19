import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@excalidraw/excalidraw/dist/excalidraw-assets/mermaid')) {
            return 'excalidraw-mermaid';
          }
          if (id.includes('@excalidraw/excalidraw/dist/excalidraw-assets')) {
            return 'excalidraw-assets';
          }
          if (id.includes('@tiptap/')) {
            return 'tiptap-core';
          }
          return undefined;
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw']
  }
})
