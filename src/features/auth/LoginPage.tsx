import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, verifyMfa } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()
  const [formError, setFormError] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const result = await login(values.email, values.password)
      if (result.status === 'mfa_required') {
        setChallengeId(result.challengeId)
        return
      }
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed')
    }
  })

  const onVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    if (challengeId === null) return
    setFormError(null)
    setVerifying(true)
    try {
      await verifyMfa(challengeId, code)
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid or expired code')
    } finally {
      setVerifying(false)
    }
  }

  if (challengeId !== null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">ICT University ERP</p>
          <img src="/logo.png" alt="" className="mt-4 size-12" />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Enter your code</h1>
          <p className="mt-2 text-sm text-muted">
            Administrator accounts need a second step. We emailed you a 6-digit code - it expires
            shortly and can only be used once.
          </p>

          <form onSubmit={onVerify} noValidate className="mt-8 flex flex-col gap-5">
            <FormField label="6-digit code" htmlFor="code">
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                required
              />
            </FormField>

            {formError ? (
              <p role="alert" className="text-sm text-error">
                {formError}
              </p>
            ) : null}

            <Button type="submit" isLoading={verifying} className="w-full">
              Verify and sign in
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            Didn't get it?{' '}
            <button
              type="button"
              onClick={() => {
                setChallengeId(null)
                setCode('')
                setFormError(null)
              }}
              className="font-medium text-primary hover:underline"
            >
              Start over
            </button>
          </p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">ICT University ERP</p>
        <img src="/logo.png" alt="" className="mt-4 size-12" />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Sign in</h1>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              hasError={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>

          {formError ? (
            <p role="alert" className="text-sm text-error">
              {formError}
            </p>
          ) : null}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
