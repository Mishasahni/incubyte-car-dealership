import { Link, useNavigate } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { AuthForm } from './AuthForm'

export function LoginPage() {
  const { signIn, notice } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Sign in"
      subtitle="Access the vehicle inventory."
      submitLabel="Sign in"
      enforcePasswordPolicy={false}
      notice={notice}
      onSubmit={async (email, password) => {
        await signIn(email, password)
        navigate('/', { replace: true })
      }}
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            Create one
          </Link>
        </>
      }
    />
  )
}
