import { Link, useNavigate } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { AuthForm } from './AuthForm'

/** New accounts are always regular users; admins are created with the backend CLI. */
export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Create your account"
      subtitle="Register to browse the vehicle inventory and buy vehicles. New accounts are buyer accounts."
      submitLabel="Create account"
      pendingLabel="Creating account…"
      enforcePasswordPolicy
      onSubmit={async (email, password) => {
        await signUp(email, password)
        navigate('/', { replace: true })
      }}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            Sign in
          </Link>
        </>
      }
    />
  )
}
