import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/client';

const BACKEND_URL = '/auth';

export default function SignInPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setError('')
      navigate('/people', { replace: true })
    }
  }, [navigate])

  const handleSuccess = async (credentialResponse) => {
    const token = credentialResponse?.credential
    if (!token) {
      setError('Google sign-in did not return a credential.')
      return
    }

    try {
      const response = await api.post(BACKEND_URL, { token })
      const data = response.data
      const backendToken = data?.token

      if (!backendToken) {
        throw new Error('Backend did not return an authentication token.')
      }

      localStorage.setItem('auth_token', backendToken)
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