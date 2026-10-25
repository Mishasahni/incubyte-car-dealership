export interface CredentialErrors {
  email?: string
  password?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Client-side checks for fast feedback; the backend validates again. */
export function validateCredentials(
  email: string,
  password: string,
  { enforcePolicy }: { enforcePolicy: boolean },
): CredentialErrors {
  const errors: CredentialErrors = {}
  if (!email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address'

  if (!password) errors.password = 'Password is required'
  else if (enforcePolicy && (password.length < 8 || password.length > 128))
    errors.password = 'Password must be 8–128 characters'
  return errors
}
