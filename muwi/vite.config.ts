import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const isElectron =
  process.env.MUWI_ELECTRON_BUILD === 'true' ||
  process.env.ELECTRON === 'true' ||
  process.env.npm_lifecycle_event?.startsWith('electron:') === true

const modulePreloadDenyPrefixes = [
  'diary-',
  'academic-citation-',
  'academic-reference-tools-',
  'academic-template-selector-',
  'blackboard-',
]

const shouldPreloadDependency = (dep: string): boolean =>
  !modulePreloadDenyPrefixes.some((prefix) => dep.includes(prefix))

const manualChunks = (id: string): string | undefined => {
  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react'
  }

  if (id.includes('/node_modules/lucide-react/')) {
    return 'vendor-icons'
  }

  if (
    id.includes('/src/components/common/CommandPalette/') ||
    id.includes('/src/utils/commands.ts')
  ) {
    return 'app-shell-command-palette'
  }

  if (id.includes('/src/components/common/ContextMenu/')) {
    return 'app-shell-ui'
  }

  if (
    id.includes('/src/hooks/useGlobalShortcuts.ts') ||
    id.includes('/src/hooks/useKeyboardShortcuts.ts') ||
    id.includes('/src/hooks/usePasteHandler.ts') ||
    id.includes('/src/hooks/usePrefersReducedMotion.ts') ||
    id.includes('/src/utils/keyboard.ts')
  ) {
    return 'app-shell-hooks'
  }

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

  if (
    id.includes('/src/components/common/ExportPanel/') ||
    id.includes('/src/components/common/BackupPanel/')
  ) {
    return 'app-shell-panels'
  }

  if (
    id.includes('/src/components/common/Button/') ||
    id.includes('/src/components/common/DiaryLayout/') ||
    id.includes('/src/components/common/ErrorBoundary/') ||
    id.includes('/src/components/common/FormControls/') ||
    id.includes('/src/components/common/Modal/') ||
    id.includes('/src/components/common/NavigationHeader/') ||
    id.includes('/src/components/common/PageStack/') ||
    id.includes('/src/components/common/PasskeyPrompt/') ||
    id.includes('/src/components/common/Sidebar/') ||
    id.includes('/src/components/common/StatusBar/') ||
    id.includes('/src/components/common/Toolbar/') ||
    id.includes('/src/components/common/TitleBar/')
  ) {
    return 'diary-shared-ui'
  }

  if (id.includes('/src/hooks/useContentLocking.ts')) {
    return 'diary-shared-ui'
  }

  if (id.includes('/src/stores/scratchpadStore.ts')) {
    return 'diary-scratchpad'
  }

  if (id.includes('/src/stores/appStore.ts') || id.includes('/src/stores/settingsStore.ts')) {
    return 'app-shell-state'
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
    ...(!isElectron
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            includeAssets: [
              'robots.txt',
              'apple-touch-icon.png',
              'pwa-192x192.png',
              'pwa-512x512.png',
              'maskable-icon-512x512.png',
            ],
            manifest: {
              id: '/?source=pwa',
              name: 'MUWI',
              short_name: 'MUWI',
              description: 'Multi-Utility Writing Interface for scratchpads, drafts, and academic writing.',
              start_url: '/',
              scope: '/',
              display: 'standalone',
              background_color: '#f5f1e8',
              theme_color: '#2f5f4f',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
                {
                  src: '/maskable-icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
              globIgnores: [
                '**/assets/diary-*.js',
                '**/assets/blackboard-*.js',
                '**/assets/academic-citation-*.js',
              ],
              navigateFallback: '/offline.html',
              navigateFallbackDenylist: [/^\/assets\//, /^\/__e2e__\//, /^\/api\//],
              cleanupOutdatedCaches: true,
              runtimeCaching: [
                {
                  urlPattern: ({ request }) => request.mode === 'navigate',
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'pages',
                    networkTimeoutSeconds: 3,
                    expiration: {
                      maxEntries: 20,
                      maxAgeSeconds: 7 * 24 * 60 * 60,
                    },
                  },
                },
                {
                  urlPattern: ({ request }) =>
                    ['style', 'script', 'worker', 'font'].includes(request.destination),
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'assets-static',
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 30 * 24 * 60 * 60,
                    },
                  },
                },
                {
                  urlPattern: ({ request }) => request.destination === 'image',
                  handler: 'StaleWhileRevalidate',
                  options: {
                    cacheName: 'assets-images',
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 30 * 24 * 60 * 60,
                    },
                  },
                },
              ],
            },
            devOptions: {
              enabled: false,
            },
          }),
        ]
      : []),
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

        return deps.filter(shouldPreloadDependency)
      },
    },
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
