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
import { REQUESTABLE_ROLES, ROLE_LABELS } from '@/features/auth/roles'
import type { Role } from '@/types/auth'

const DASHBOARD_BLURBS: Partial<Record<Role, string>> = {
  student: 'Enrol in courses, track results and pay tuition.',
  lecturer: 'Teach: grading, attendance, exams and the course catalogue.',
  finance_staff: 'Invoices, expenses, the ledger and monthly reports.',
  marketing: 'Admissions campaigns, leads and return on spend.',
  admin: 'Run academic, finance, marketing, people and system administration.',
}

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  requestedRole: z.enum(['student', 'lecturer', 'finance_staff', 'marketing', 'admin']),
  justification: z.string().max(500).optional(),
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { requestedRole: 'student' },
  })

  const requestedRole = watch('requestedRole')
  const needsApproval = requestedRole !== 'student'

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        requestedRole: values.requestedRole,
        justification: values.justification,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Registration failed')
    }
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">ICT University ERP</p>
        <img src="/logo.png" alt="" className="mt-4 size-12" />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Choose the dashboard you need. Every new account starts as a{' '}
          <span className="text-text">Student</span>; anything higher is an application an
          administrator has to approve before it takes effect.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <fieldset>
            <legend className="text-sm font-medium text-text">Which dashboard do you need?</legend>
            <div className="mt-3 flex flex-col gap-2">
              {REQUESTABLE_ROLES.map((role) => (
                <label
                  key={role}
                  htmlFor={`role-${role}`}
                  className="flex cursor-pointer gap-3 rounded-lg border border-border bg-surface-elevated p-3 has-[:checked]:border-primary/60"
                >
                  <input
                    id={`role-${role}`}
                    type="radio"
                    value={role}
                    className="mt-1 accent-primary"
                    {...register('requestedRole')}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-text">{ROLE_LABELS[role]}</span>
                    <span className="block text-sm text-muted">{DASHBOARD_BLURBS[role]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {needsApproval ? (
            <div
              role="status"
              className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
            >
              You will sign in as a Student straight away. An administrator reviews your request for{' '}
              {ROLE_LABELS[requestedRole]} access, and your dashboard changes only once they approve it.
            </div>
          ) : null}

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

          {needsApproval ? (
            <FormField
              label="Why do you need this access?"
              htmlFor="justification"
              error={errors.justification?.message}
            >
              <Input
                id="justification"
                placeholder="Lecturer in the CS department"
                hasError={Boolean(errors.justification)}
                {...register('justification')}
              />
            </FormField>
          ) : null}

          {formError ? (
            <p role="alert" className="text-sm text-error">
              {formError}
            </p>
          ) : null}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {needsApproval ? 'Create account and apply' : 'Create account'}
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
