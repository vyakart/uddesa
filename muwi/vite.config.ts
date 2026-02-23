import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const isElectron =
  process.env.ELECTRON === 'true' || process.env.npm_lifecycle_event?.startsWith('electron:') === true

const manualChunks = (id: string): string | undefined => {
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
