import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://attendance-logger-backend-git-main-anyonscis-projects.vercel.app/api/auth/'

export default function SignInPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential
    if (!token) {
      setError('Google sign-in did not return a credential.')
      return
    }

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(errorBody || `Authentication failed with status ${response.status}`)
      }

      const data = await response.json()
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(data.user || {}))
      setError('')
      navigate('/people', { replace: true })
    } catch (err) {
      console.error('Backend auth failed', err)
      setError(err instanceof Error ? err.message : 'Unable to verify token with backend.')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          setError('Google login failed')
          console.log('Login Failed')
        }}
      />
      {error ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p> : null}
    </div>
  )
}