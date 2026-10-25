import { Link, useNavigate } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { AuthForm } from './AuthForm'

/** New accounts are always regular users; admins are created with the backend CLI. */
export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Create account"
      subtitle="Register to browse and purchase vehicles."
      submitLabel="Create account"
      enforcePasswordPolicy
      onSubmit={async (email, password) => {
        await signUp(email, password)
        navigate('/', { replace: true })
      }}
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-mist underline underline-offset-4 hover:text-white">
            Sign in
          </Link>
        </>
      }
    />
  )
}
