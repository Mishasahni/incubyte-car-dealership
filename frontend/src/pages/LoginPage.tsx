import { Link, useNavigate } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { AuthForm } from './AuthForm'

export function LoginPage() {
  const { signIn, notice } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to continue to your account."
      submitLabel="Sign in"
      pendingLabel="Signing in…"
      enforcePasswordPolicy={false}
      notice={notice}
      onSubmit={async (email, password) => {
        await signIn(email, password)
        navigate('/', { replace: true })
      }}
      footer={
        <>
          New to Masar Auto?{' '}
          <Link to="/register" className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            Create an account
          </Link>
        </>
      }
    />
  )
}
