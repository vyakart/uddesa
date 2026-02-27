const SERVICE_WORKER_URL = '/sw.js'

export function registerPwaServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  if (window.electronAPI) {
    return
  }

  const register = () => {
    void navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error) => {
      console.warn('PWA service worker registration failed:', error)
    })
  }

  if (document.readyState === 'complete') {
    register()
    return
  }

  window.addEventListener('load', register, { once: true })
}
