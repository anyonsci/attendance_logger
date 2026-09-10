import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../api/supabase'

const defaultRedirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
const authRedirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL || defaultRedirectUrl

export default function SignInPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const redirectIfAuthenticated = (currentSession) => {
      if (mounted && currentSession) {
        navigate('/', { replace: true })
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      redirectIfAuthenticated(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      redirectIfAuthenticated(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleSignIn = async () => {
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authRedirectUrl,
          scopes: 'openid email profile',
        },
      })

      if (signInError) throw signInError
    } catch (err) {
      console.error('Supabase auth failed', err)
      setError(err instanceof Error ? err.message : 'Unable to sign in with Google.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
      <button type="button" onClick={handleSignIn}>Continue with Google</button>
      {error ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p> : null}
    </div>
  )
}