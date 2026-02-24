import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const isElectron =
  process.env.MUWI_ELECTRON_BUILD === 'true' ||
  process.env.ELECTRON === 'true' ||
  process.env.npm_lifecycle_event?.startsWith('electron:') === true

const manualChunks = (id: string): string | undefined => {
  if (id.includes('/src/components/diaries/blackboard/ExcalidrawWrapper.tsx')) {
    return 'blackboard-excalidraw-wrapper'
  }

  if (id.includes('/node_modules/katex/')) {
    return 'blackboard-katex-vendor'
  }

  if (id.includes('/node_modules/mermaid/')) {
    return 'blackboard-mermaid-vendor'
  }

  if (id.includes('/node_modules/@excalidraw/mermaid-to-excalidraw/')) {
    return 'blackboard-mermaid-bridge'
  }

  if (
    id.includes('/node_modules/@excalidraw/excalidraw/') ||
    id.includes('/node_modules/roughjs/') ||
    id.includes('/node_modules/perfect-freehand/')
  ) {
    return 'blackboard-excalidraw-core'
  }

  if (
    id.includes('/src/components/diaries/academic/BibliographyManager.tsx') ||
    id.includes('/src/components/diaries/academic/ReferenceLibraryPanel.tsx') ||
    id.includes('/src/components/diaries/academic/CitationPicker.tsx')
  ) {
    return 'academic-reference-tools'
  }

  if (id.includes('/src/components/diaries/academic/TemplateSelector.tsx')) {
    return 'academic-template-selector'
  }

  if (
    id.includes('/src/utils/citation.ts') ||
    id.includes('/src/utils/citeproc.ts') ||
    id.includes('/node_modules/citation-js/') ||
    id.includes('/node_modules/citeproc/')
  ) {
    return 'academic-citation'
  }

  if (id.includes('/src/components/diaries/blackboard/')) {
    return 'diary-blackboard'
  }

  if (id.includes('/src/components/diaries/academic/')) {
    return 'diary-academic'
  }

  if (id.includes('/src/components/diaries/long-drafts/')) {
    return 'diary-long-drafts'
  }

  if (id.includes('/src/components/diaries/drafts/')) {
    return 'diary-drafts'
  }

  if (id.includes('/src/components/diaries/scratchpad/')) {
    return 'diary-scratchpad'
  }

  if (id.includes('/src/components/diaries/PersonalDiary/')) {
    return 'diary-personal-diary'
  }

  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only include Electron plugins when building for Electron
    ...(isElectron
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  lib: {
                    entry: 'electron/preload.ts',
                    formats: ['cjs'],
                    fileName: () => '[name].cjs',
                  },
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
              onstart(options) {
                const hasElectronApp = Boolean(
                  (process as NodeJS.Process & { electronApp?: unknown }).electronApp
                )
                if (hasElectronApp) {
                  options.reload()
                  return
                }
                const env = { ...process.env }
                delete env.ELECTRON_RUN_AS_NODE
                options.startup(['.'], { env })
              },
            },
          ]),
          renderer(),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@db': path.resolve(__dirname, './src/db'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    modulePreload: {
      resolveDependencies: (_filename, deps, context) => {
        if (context.hostType !== 'html') {
          return deps
        }

        return deps.filter((dep) => !dep.includes('diary-'))
      },
    },
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
