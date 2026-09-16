import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/features/auth/AuthContext'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerAccount(values.email, values.password, values.fullName)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Registration failed')
    }
  })

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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Create a student account</h1>
        <p className="mt-2 text-sm text-muted">
          Registering here always creates a <span className="text-text">Student</span> account. Staff
          and administrator access is granted by an administrator after your account exists - it can
          never be chosen during sign-up.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              hasError={Boolean(errors.fullName)}
              {...register('fullName')}
            />
          </FormField>

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
              autoComplete="new-password"
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
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
