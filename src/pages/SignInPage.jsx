import { Link } from 'react-router-dom'

function SignInPage() {
  return (
    <section className="page">
      <h2>Sign in</h2>
      <p>Use Google sign-in to access your attendance workspace.</p>
      <button>Continue with Google</button>
      <p>
        <Link to="/people">Open person list</Link>
      </p>
    </section>
  )
}

export default SignInPage
