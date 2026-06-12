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

- `npm.cmd run lint` passes.
- `npm.cmd test` passes with 280+ Vitest tests and LCOV coverage exported to `./coverage`.
- `npm.cmd run build` passes on Next.js 16.2.9.
- GitHub Actions CI runs lint, typecheck, and coverage on every push.
- SonarCloud quality gate passes; configure analysis with `sonar-project.properties` and upload `coverage/lcov.info`.
- Server proxy auth guard at `src/proxy.ts` protects `/dashboard/*` routes.
- Current coverage is useful but uneven: overall lines are above 80%, with continued focus on dashboard page branches.

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

## Known Quality Improvement Areas

- Split large client pages such as onboarding, tracker, landing, and dashboard into smaller components.
- Raise coverage for `AuthContext`, dashboard topbar/sidebar branches, and API fallback/error branches.
- Reduce repeated Firebase query and form logic across pages by moving it into hooks or services.
- Add Playwright coverage for the full daily-log flow, including parse, commit, and activity display.
- Keep README/docs synchronized with the actual dependency versions and current Sonar metrics.
