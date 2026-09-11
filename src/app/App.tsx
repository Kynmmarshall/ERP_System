import { SystemStatusPage } from '@/pages/SystemStatusPage'

export function App() {
  // Router/AppShell/auth land in Phase 2. Phase 1 proves the frontend can
  // make a real, working request through the gateway to every service.
  return <SystemStatusPage />
}
