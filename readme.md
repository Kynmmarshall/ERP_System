# ICT University ERP — Frontend

React + TypeScript + Vite + Tailwind CSS frontend for the ICT University ERP.
Talks to the backend (`../ERP_System_backend`) only through its API gateway.

## Prerequisites

- Node.js 22+
- The backend gateway running locally (see
  `../ERP_System_backend/readme.md`) for real (non-mocked) API calls

## Develop

```powershell
npm install
npm run dev
```

`npm run dev` proxies `/api/*` to `http://localhost:8081` (the backend
gateway), so requests made from the app are real, same-origin requests
against the running services — see `vite.config.ts`.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

## Status

Phase 1 (foundation): toolchain, design tokens, and a real system-status page
that calls the gateway and every backend service's health endpoint.

Phase 2 (auth + app shell): self-hosted Space Grotesk/Manrope, an
`AuthContext` with in-memory access tokens and transparent refresh-cookie
rotation, a real login page, protected routing, and a responsive
sidebar/topbar shell (Overview, Academic, Finance & Marketing, People &
Operations, System Status, Settings). Log in at `/login` with a seeded dev
account from `../ERP_System_backend/readme.md`. Business-module pages are
intentionally still empty-state placeholders — they land in Phases 4-6. See
`../ERP_System_backend/docs/` (added progressively) for the full plan.