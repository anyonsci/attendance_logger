import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/attendance_logger/sw.js', {
      scope: '/attendance_logger/',
    })

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing

      if (!installingWorker) {
        return
      }

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.info('A new version of the app is available. Reloading…')
          window.location.reload()
        }
      })
    })

    await navigator.serviceWorker.ready
    await registration.update()
  } catch (error) {
    console.error('Service worker registration failed:', error)
  }
}

window.addEventListener('load', () => {
  registerServiceWorker()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
