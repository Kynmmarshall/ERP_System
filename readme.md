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
that calls the gateway and every backend service's health endpoint. The full
navigation shell, authentication and feature modules land in later phases —
see `../ERP_System_backend/docs/` (added progressively) for the full plan.