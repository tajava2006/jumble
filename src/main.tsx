import './index.css'
import './polyfill'

import { restoreElectronLocalStorage } from './lib/electron-local-storage'

const setVh = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`)
}
window.addEventListener('resize', setVh)
window.addEventListener('orientationchange', setVh)
setVh()

const bootstrap = async () => {
  // Electron restores its main-process snapshot before modules that read
  // localStorage are evaluated. Web mode returns immediately.
  await restoreElectronLocalStorage()

  // This is the only deferred module boundary: application modules must not
  // read localStorage until Electron has restored its durable snapshot.
  const { startApplication } = await import('./app-bootstrap')
  await startApplication()
}

bootstrap().catch((error) => {
  console.error('[main] failed to bootstrap application:', error)
})
