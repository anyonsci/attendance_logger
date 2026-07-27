import { useEffect, useState } from 'react'

let toastListener = null

export function showToast(message, type = 'error') {
  if (toastListener) {
    toastListener({ id: Date.now(), message, type })
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, 4000)
    }
    return () => {
      toastListener = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '360px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'rgba(220, 38, 38, 0.95)' : 'rgba(30, 41, 59, 0.95)',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.3)'}`,
            fontSize: '0.9rem',
            fontWeight: '500',
            lineHeight: '1.4',
            animation: 'modalPopIn 0.2s ease-out',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
