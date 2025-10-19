import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const shouldAnalyze = process.env.ANALYZE === 'true' || process.env.ANALYZE === '1'
const plugins: PluginOption[] = [react()]

if (shouldAnalyze) {
  plugins.push(
    visualizer({
      filename: 'dist/stats/bundle.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true
    })
  )
  plugins.push(
    visualizer({
      filename: 'dist/stats/bundle.raw-data.json',
      template: 'raw-data'
    })
  )
}

// https://vite.dev/config/
export default defineConfig({
  plugins,
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
