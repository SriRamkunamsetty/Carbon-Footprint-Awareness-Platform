# Challenge Alignment — Carbon Footprint Awareness Platform

## Problem Statement

> Design a solution that helps individuals **understand**, **track**, and **reduce** their carbon footprint through simple actions and personalized insights.

## Feature Mapping

| Requirement | CarbonMind AI Feature | Location |
|-------------|----------------------|----------|
| **Understand** | Carbon score, category breakdown, trend charts, yearly projection | `src/app/dashboard/page.tsx`, `src/hooks/useCarbonScore.ts` |
| **Understand** | Carbon Twin simulator for scenario comparison | `src/app/dashboard/twin/page.tsx` |
| **Track** | Natural-language daily activity log with AI parsing | `src/app/dashboard/log/page.tsx`, `src/app/api/ai/route.ts` |
| **Track** | Activity history with search, edit, pagination | `src/app/dashboard/tracker/page.tsx`, `src/hooks/useActivities.ts` |
| **Track** | Streaks, points, achievements, leaderboard | `src/constants/achievements.ts`, `src/app/dashboard/leaderboard/page.tsx` |
| **Reduce** | Personalized AI sustainability coach | `src/app/dashboard/coach/page.tsx` |
| **Reduce** | Monthly carbon goals and progress tracking | `src/hooks/useGoals.ts`, onboarding baseline setup |
| **Reduce** | Actionable tips from parsed activities and coach responses | `src/lib/mock-ai.ts`, AI API route |

## Simple Actions

- Log a day in plain English instead of filling multi-field forms.
- Set a monthly carbon goal during onboarding.
- Run what-if scenarios in the Carbon Twin (transport, diet, energy).
- Chat with the AI coach for localized reduction advice.

## Personalized Insights

- Score relative to a configurable global baseline (`CARBON_SCORE_BASELINE`).
- Category-weighted breakdown (transport, food, electricity, etc.).
- 30-day trend visualization.
- Achievement badges unlocked from real activity patterns.

## Data & Trust

- Firebase Auth with server proxy guard (`src/proxy.ts`).
- User-scoped Firestore rules and Zod-validated API inputs.
- JSON export from Settings for data portability.
