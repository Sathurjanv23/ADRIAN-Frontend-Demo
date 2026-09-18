# ADRIAN — Frontend-Only Demo Build

This is a **frontend-only demo** of Project ADRIAN / NOVA (AI Emergency Response & Relief Network). It is a fork of the full-stack project with the Java Spring Boot backend, MongoDB, Redis, and AWS Bedrock/Ollama AI service **completely removed**. Every screen is fully interactive and works from realistic mock data that lives entirely in the browser — there is nothing to install, configure, or run besides this Next.js app.

## What changed vs. the full-stack version

- All API calls now resolve against an in-memory mock data layer (`lib/mock/`, `lib/api/client.ts`, `lib/store/nova-store.ts`) instead of a Spring Boot backend.
- Sign in / sign up / OTP verification / "Sign in with Google" are all simulated locally in `lib/auth.ts` — no server, no real Google OAuth.
- The **ADRIAN Copilot** AI assistant answers using a deterministic local reasoning engine (`lib/copilot/ollama-client.ts`) grounded in the same mock operational data, instead of calling a local Ollama LLM.
- Data you create or change during a session (accepting a mission, admitting a patient, dispatching relief, approving a user, etc.) persists in memory for the length of that browser tab/session, then resets on a full reload — there is no real database.
- The `backend/` and `infrastructure/` folders from the original repo are not included in this build.

## Demo accounts

Sign in with any of these emails and password `Demo1234` (any password meeting the usual rules — 8+ characters, one uppercase, one number — will also work for these seed accounts):

| Role | Email |
|---|---|
| Citizen | `amal@nova.lk` |
| Emergency Officer | `dilrukshi@dmmc.gov.lk` |
| Rescue Team | `kapila@rescue.lk` |
| Hospital | `priya@nhsl.gov.lk` |
| Admin | `admin@nova.lk` |

You can also sign up as a new account from the Register page — a demo OTP code is shown directly on screen (no real email/SMS is sent), and "Sign in with Google" logs you in instantly as a demo citizen account.

The **Command Center** (`/command`) can also be opened directly without signing in, using the "guest commander" bypass built into the app.

## Getting started

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

To build for production:

```bash
npm run build
npm run start
```

> Note: the production build fetches the `Inter` and `JetBrains Mono` fonts from Google Fonts at build time (standard `next/font/google` behavior) — make sure the machine running `npm run build` has normal internet access.

## Project structure

- `app/` — Next.js App Router pages (citizen, command center, rescue, hospital, relief, admin, auth)
- `components/` — shared UI, emergency-specific components, map, charts
- `lib/mock/` — all mock data: incidents, teams, hospitals, resources, risk predictions, relief logistics, registered demo accounts
- `lib/api/client.ts` — mock "API" layer (in-memory, replaces the old Spring Boot REST client)
- `lib/store/nova-store.ts` — Zustand store, the single source of truth for live app state
- `lib/auth.ts` — mock authentication
- `lib/copilot/` — local deterministic "AI" reasoning for the Copilot assistant

## Resetting the demo

Mock state lives in memory plus a few localStorage keys (`nova_token`, `nova_user`, `adrian_registered_users`, `adrian_lang`). To fully reset the demo to its original seed state, clear your browser's local storage for this site and reload.
