# CarbonMind AI - Carbon Footprint Awareness Platform

CarbonMind AI helps users understand, track, and reduce their personal carbon footprint through natural-language activity logging, a carbon dashboard, an AI sustainability coach, and a carbon-twin simulator.

## Challenge Alignment

The project addresses the Carbon Footprint Awareness Platform challenge by turning everyday actions into measurable emissions and practical reduction guidance. See [docs/CHALLENGE_ALIGNMENT.md](docs/CHALLENGE_ALIGNMENT.md) for the full requirement-to-feature mapping.

It focuses on:

- **Understand** — dashboard analytics, carbon score, category breakdown, Carbon Twin simulator.
- **Track** — plain-language daily log, activity tracker, streaks, achievements, leaderboard.
- **Reduce** — AI sustainability coach, monthly goals, personalized tips from logged activities.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Firebase Auth, Firestore, Storage, Analytics, Messaging, Remote Config, and App Check
- Gemini / Vertex AI API fallback for AI coaching and parsing
- Vitest, Testing Library, jest-axe, and Playwright
- Docker / Google Cloud Run deployment support

## Quality Signals

- `npm run lint` passes with 0 errors and 0 warnings.
- `npm test` passes with 340+ Vitest tests (statements: ~95%, branches: ~85%) and LCOV coverage exported to `./coverage`.
- `npm run build` passes on Next.js 16.2.9.
- GitHub Actions CI runs lint, typecheck, and coverage on every push.
- SonarCloud quality gate passes; configure analysis with `sonar-project.properties` and upload `coverage/lcov.info`.
- Server proxy auth guard at `src/proxy.ts` protects `/dashboard/*` routes.
- Full test pyramid: unit tests for all carbon calculation functions, integration tests for the AI API route, hook tests with renderHook, accessibility tests with jest-axe, and Playwright E2E tests.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Firebase project credentials
- Optional: Gemini API key or Google Cloud project for Vertex AI

### Installation

```bash
npm install
```

### Environment

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
NEXT_PUBLIC_APP_CHECK_SITE_KEY=your_recaptcha_site_key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_fcm_vapid_key
GEMINI_API_KEY=your_gemini_api_key
GCP_PROJECT_ID=your_google_cloud_project_id
```

### Local Development

```bash
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification

```bash
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

### End-to-End Tests

```bash
npm.cmd run test:e2e
```

## Architecture

The app uses route-level pages under `src/app`, reusable UI under `src/components`, domain calculations under `src/lib/carbon`, Firebase services under `src/services`, and data hooks under `src/hooks`.

The API route at `src/app/api/ai/route.ts` uses a three-step fallback:

1. Vertex AI when running on Google Cloud with metadata credentials.
2. Gemini Developer API when `GEMINI_API_KEY` is configured.
3. Local heuristic parsing and coaching when external AI is unavailable.

## Testing Strategy

The test suite follows the Google Engineering testing pyramid:

- **Unit tests** (`src/tests/unit/carbon/`) — full coverage of all carbon calculation functions (transport, food, electricity, water, shopping, waste, score rating)
- **Service tests** (`src/tests/services/`) — typed CRUD operations via `FirestoreService`, `AnalyticsService`, and `activityService`
- **Hook tests** (`src/tests/hooks/`) — all custom React hooks tested with `renderHook` + vitest mocks
- **Integration tests** (`src/tests/integration/`) — full POST request/response cycle for the AI API route with Vertex AI, Gemini, and heuristic fallback paths
- **Accessibility tests** (`src/tests/a11y/`) — `jest-axe` WCAG 2.2 AA compliance checks
- **E2E tests** (`e2e/`) — Playwright tests for auth and dashboard journeys

All tests run in CI via GitHub Actions on every push to `main`.
