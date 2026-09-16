import {
  BarChart3,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/academic', label: 'Academic', icon: GraduationCap },
  { to: '/finance', label: 'Finance & Marketing', icon: BarChart3 },
  { to: '/people', label: 'People & Operations', icon: Users },
  { to: '/status', label: 'System Status', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-surface-elevated text-text' : 'text-muted hover:bg-surface-elevated/60 hover:text-text'
            }`
          }
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const { principal, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
          <img src="/logo.png" alt="" className="size-6" />
          ICT University ERP
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-md p-2 text-muted hover:bg-surface-elevated hover:text-text"
          aria-label="Open navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
          <div className="relative flex w-72 flex-col gap-6 bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">Menu</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-2 text-muted hover:bg-surface-elevated hover:text-text"
                aria-label="Close navigation"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border p-4 lg:flex">
          <div>
            <div className="flex items-center gap-2 px-3">
              <img src="/logo.png" alt="" className="size-6" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">ICT University</p>
            </div>
            <div className="mt-6">
              <NavLinks />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{principal?.fullName}</p>
              <p className="truncate text-xs text-muted">{principal?.role}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md p-2 text-muted hover:bg-surface-elevated hover:text-text"
              aria-label="Log out"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
