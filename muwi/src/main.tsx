import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/themes/light.css'
import './styles/themes/dark.css'
import './styles/utilities.css'
import './styles/shell.css'
import './styles/reset.css'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)
const isWebFallbackHarnessRoute =
  import.meta.env.DEV && window.location.pathname === '/__e2e__/web-fallbacks'

if (isWebFallbackHarnessRoute) {
  void import('./e2e/WebFallbackHarness.tsx').then(({ WebFallbackHarness }) => {
    root.render(
      <StrictMode>
        <WebFallbackHarness />
      </StrictMode>,
    )
  })
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

if (import.meta.env.PROD && !window.electronAPI) {
  void import('./pwa/registerServiceWorker.ts').then(({ registerPwaServiceWorker }) => {
    registerPwaServiceWorker()
  })
}
