import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'

const AUTH_BACKEND_URL =
  import.meta.env.VITE_AUTH_BACKEND_URL || 'https://idp-server.vercel.app'

export default function SignInPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setError('Google Sign-In did not return an identity token.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const endpoint = `${AUTH_BACKEND_URL.replace(/\/+$/, '')}/api/auth/google`
      const response = await axios.post(
        endpoint,
        { idToken },
        { headers: { 'Content-Type': 'application/json' } }
      )

      const token = response.data?.token
      const user = response.data?.user

      if (!token) {
        throw new Error('Authentication backend did not return a session token.')
      }

      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user || {}))
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Authentication backend request failed:', err)
      const message =
        err.response?.data?.error ||
        (err instanceof Error ? err.message : 'Unable to authenticate with server.')
      setError(message)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3rem', gap: '1rem' }}>
      <h2>Sign In to Attendance Logger</h2>
      <p style={{ color: '#64748b', margin: 0 }}>Authenticate using your Google Account</p>
      <div style={{ marginTop: '1rem' }}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            setError('Google Sign-In was cancelled or failed.')
          }}
          useOneTap={false}
        />
      </div>
      {isLoading ? <p style={{ color: '#3b82f6' }}>Authenticating…</p> : null}
      {error ? <p style={{ color: '#ef4444', maxWidth: '350px', textAlign: 'center' }}>{error}</p> : null}
    </div>
  )
}
