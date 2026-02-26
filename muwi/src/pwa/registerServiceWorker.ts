const SERVICE_WORKER_URL = '/sw.js'

export function registerPwaServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  if (window.electronAPI) {
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => {
      console.warn('PWA service worker registration failed:', error)
    })
  })
}

