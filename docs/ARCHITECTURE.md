# 🏗️ CarbonMind AI — Architecture Documentation

> Comprehensive system architecture guide for the CarbonMind AI platform.

---

## Table of Contents

- [System Architecture Overview](#system-architecture-overview)
- [High-Level Architecture Diagram](#high-level-architecture-diagram)
- [Feature-First Folder Structure](#feature-first-folder-structure)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Service Layer Architecture](#service-layer-architecture)
- [State Management Approach](#state-management-approach)
- [Authentication Architecture](#authentication-architecture)
- [Cloud Functions Pipeline](#cloud-functions-pipeline)
- [Rendering Strategy](#rendering-strategy)

---

## System Architecture Overview

CarbonMind AI follows a **modern JAMstack architecture** built on Next.js 15 with the App Router, Firebase as the Backend-as-a-Service (BaaS), and Google Gemini AI for intelligent carbon insights.

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js 15 App Router** | Server components, streaming SSR, built-in API routes, and optimized bundling |
| **Firebase BaaS** | Zero-ops backend with real-time database, authentication, and serverless functions |
| **Cloud Functions v2** | Event-driven architecture for data consistency and automated reporting |
| **Feature-first structure** | Colocation of related logic, improved maintainability and developer experience |
| **TypeScript strict mode** | Compile-time type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling with design system consistency and minimal CSS bundle |

---

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["🌐 Browser"]
        PWA["📱 PWA/Mobile"]
    end

    subgraph NextJS["Next.js 15 Application"]
        AppRouter["App Router"]
        ServerComponents["Server Components"]
        ClientComponents["Client Components"]
        APIRoutes["API Routes"]
        Middleware["Auth Middleware"]
    end

    subgraph Firebase["Firebase Services"]
        Auth["🔐 Firebase Auth"]
        Firestore["🗄️ Cloud Firestore"]
        Functions["⚡ Cloud Functions v2"]
        Hosting["🌍 Firebase Hosting"]
        Scheduler["⏰ Cloud Scheduler"]
    end

    subgraph AI["AI Services"]
        Gemini["🤖 Google Gemini AI"]
    end

    subgraph Deployment["Deployment"]
        Vercel["▲ Vercel Edge Network"]
        CDN["📦 CDN / Static Assets"]
    end

    Browser --> Vercel
    PWA --> Vercel
    Vercel --> AppRouter
    AppRouter --> ServerComponents
    AppRouter --> ClientComponents
    AppRouter --> Middleware
    ServerComponents --> APIRoutes
    ClientComponents --> Auth
    ClientComponents --> Firestore
    APIRoutes --> Gemini
    Auth --> Firestore
    Firestore --> Functions
    Scheduler --> Functions
    Functions --> Firestore
    Vercel --> CDN
    Hosting --> CDN

    style Client fill:#e3f2fd,stroke:#1565c0
    style NextJS fill:#fff3e0,stroke:#e65100
    style Firebase fill:#fce4ec,stroke:#c62828
    style AI fill:#e8f5e9,stroke:#2e7d32
    style Deployment fill:#f3e5f5,stroke:#6a1b9a
```

---

## Feature-First Folder Structure

CarbonMind AI uses a **feature-first** directory organization where related files (routes, components, hooks, types) are colocated by domain concern.

```mermaid
graph LR
    subgraph Root["Project Root"]
        App["app/"]
        Components["components/"]
        Lib["lib/"]
        Hooks["hooks/"]
        Context["context/"]
        Types["types/"]
        Functions["functions/"]
        Docs["docs/"]
    end

    subgraph AppRoutes["app/ — Route Segments"]
        AuthGroup["(auth)/ — Login, Signup"]
        DashGroup["(dashboard)/ — Protected Routes"]
        Layout["layout.tsx — Root Layout"]
        Page["page.tsx — Landing Page"]
    end

    subgraph DashRoutes["(dashboard)/ — Feature Routes"]
        Dashboard["dashboard/ — Main Dashboard"]
        Log["log/ — Activity Logger"]
        Leaderboard["leaderboard/ — Rankings"]
        Achievements["achievements/ — Badges"]
        Challenges["challenges/ — Community"]
        Insights["insights/ — AI Insights"]
        Tips["tips/ — Eco Tips"]
    end

    App --> AppRoutes
    DashGroup --> DashRoutes

    style Root fill:#f5f5f5,stroke:#616161
    style AppRoutes fill:#e3f2fd,stroke:#1565c0
    style DashRoutes fill:#e8f5e9,stroke:#2e7d32
```

### Directory Responsibilities

| Directory | Responsibility | Key Files |
|-----------|---------------|-----------|
| `app/` | Next.js route definitions and page components | `layout.tsx`, `page.tsx`, route groups |
| `components/` | Reusable React components organized by domain | `ui/`, `charts/`, `layout/`, `forms/` |
| `lib/` | Service layer, utilities, and third-party integrations | `firebase/`, `gemini.ts`, `utils.ts` |
| `hooks/` | Custom React hooks for data fetching and state | `useAuth.ts`, `useCarbonData.ts` |
| `context/` | React Context providers for global state | `AuthContext.tsx` |
| `types/` | TypeScript interfaces and type definitions | `index.ts` |
| `functions/` | Firebase Cloud Functions (TypeScript, separate build) | `src/index.ts` |
| `docs/` | Project documentation and guides | `ARCHITECTURE.md`, `SECURITY.md` |

---

## Data Flow Diagrams

### Activity Logging Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Activity Form
    participant Hook as useFirestore Hook
    participant FS as Cloud Firestore
    participant CF as Cloud Functions
    participant LB as Leaderboard

    User->>UI: Submits activity (transport, 15kg CO₂)
    UI->>Hook: addActivity(activityData)
    Hook->>FS: activities.add(activityData)
    FS-->>CF: onActivityWritten trigger
    CF->>FS: Query monthly activities
    CF->>CF: Calculate carbon score
    CF->>FS: Update users/{userId}
    CF->>LB: Update leaderboard/{userId}
    FS-->>Hook: Real-time snapshot update
    Hook-->>UI: Re-render with new score
    UI-->>User: Updated dashboard
```

### User Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant Auth as Firebase Auth
    participant FS as Cloud Firestore
    participant CF as Cloud Functions

    User->>Auth: Sign up (Google OAuth / Email)
    Auth-->>FS: Auth trigger creates user
    User->>FS: Write user profile document
    FS-->>CF: onUserCreated trigger
    CF->>FS: Create leaderboard entry
    CF->>FS: Award "Green Pioneer" badge
    FS-->>User: Welcome state ready
```

### Weekly Report Generation

```mermaid
sequenceDiagram
    participant Scheduler as Cloud Scheduler
    participant CF as weeklyReport Function
    participant FS as Cloud Firestore

    Scheduler->>CF: Trigger (Sunday 00:00 UTC)
    CF->>FS: Query all users
    loop For each user
        CF->>FS: Query week's activities
        CF->>CF: Aggregate carbon by category
        CF->>FS: Write weekly_reports document
    end
    CF-->>Scheduler: Execution complete
```

---

## Service Layer Architecture

The service layer in `lib/` provides a clean abstraction over Firebase services, preventing direct SDK calls from UI components.

```mermaid
graph TB
    subgraph UI["UI Layer (Components)"]
        Pages["Page Components"]
        Forms["Form Components"]
        Charts["Chart Components"]
    end

    subgraph Hooks["Hook Layer"]
        UseAuth["useAuth()"]
        UseCarbonData["useCarbonData()"]
        UseFirestore["useFirestore()"]
    end

    subgraph Services["Service Layer (lib/)"]
        AuthService["lib/firebase/auth.ts"]
        FirestoreService["lib/firebase/firestore.ts"]
        GeminiService["lib/gemini.ts"]
        UtilsService["lib/utils.ts"]
    end

    subgraph External["External Services"]
        FirebaseAuth["Firebase Auth SDK"]
        FirebaseFS["Firestore SDK"]
        GeminiAPI["Gemini AI API"]
    end

    Pages --> UseAuth
    Pages --> UseCarbonData
    Forms --> UseFirestore
    Charts --> UseCarbonData

    UseAuth --> AuthService
    UseCarbonData --> FirestoreService
    UseFirestore --> FirestoreService

    AuthService --> FirebaseAuth
    FirestoreService --> FirebaseFS
    GeminiService --> GeminiAPI

    style UI fill:#e3f2fd,stroke:#1565c0
    style Hooks fill:#fff3e0,stroke:#e65100
    style Services fill:#e8f5e9,stroke:#2e7d32
    style External fill:#fce4ec,stroke:#c62828
```

### Service Module Details

#### `lib/firebase/config.ts`
Initializes the Firebase app singleton. Ensures only one Firebase instance exists across the application lifecycle.

#### `lib/firebase/auth.ts`
Provides authentication utilities:
- `signInWithGoogle()` — OAuth popup flow
- `signInWithEmail(email, password)` — Email/password login
- `signUp(email, password, name)` — New user registration
- `signOut()` — Session termination
- `onAuthStateChanged(callback)` — Auth state observer

#### `lib/firebase/firestore.ts`
Encapsulates all Firestore CRUD operations:
- `addActivity(userId, activityData)` — Log a carbon activity
- `getUserActivities(userId, dateRange)` — Query user activities
- `getLeaderboard(limit)` — Fetch ranked leaderboard
- `getUserAchievements(userId)` — Get unlocked badges
- `updateUserProfile(userId, data)` — Update user metadata

#### `lib/gemini.ts`
Integrates Google Gemini AI for personalized insights:
- `generateCarbonInsights(userData)` — AI analysis of carbon patterns
- `getEcoRecommendations(activities)` — Personalized reduction tips
- `analyzeCarbonTrend(history)` — Trend analysis and projections

---

## State Management Approach

CarbonMind uses a **layered state management** strategy optimized for the Next.js App Router:

```mermaid
graph TB
    subgraph ServerState["Server State"]
        SSR["Server Components (RSC)"]
        ServerActions["Server Actions"]
    end

    subgraph SharedState["Shared Client State"]
        AuthCtx["AuthContext"]
        ThemeCtx["ThemeContext"]
    end

    subgraph LocalState["Local Component State"]
        useState["useState / useReducer"]
        FormState["Form State"]
    end

    subgraph CacheState["Data Cache"]
        FirestoreRT["Firestore Real-time Listeners"]
        SWR["Stale-While-Revalidate"]
    end

    SSR --> SharedState
    ServerActions --> CacheState
    SharedState --> LocalState
    CacheState --> LocalState

    style ServerState fill:#e8f5e9,stroke:#2e7d32
    style SharedState fill:#e3f2fd,stroke:#1565c0
    style LocalState fill:#fff3e0,stroke:#e65100
    style CacheState fill:#fce4ec,stroke:#c62828
```

### State Categories

| Category | Tool | Use Case |
|----------|------|----------|
| **Server State** | React Server Components | Initial page data, SEO content, static queries |
| **Auth State** | `AuthContext` + `useAuth` | User session, auth status, user profile |
| **Theme State** | `ThemeContext` | Light/dark mode preference |
| **Form State** | `useState` / controlled components | Activity form inputs, search filters |
| **Real-time Data** | Firestore `onSnapshot` | Leaderboard updates, live carbon score |
| **Cached Data** | React cache / custom hooks | Activity history, achievement list |

### Why Not Redux/Zustand?

CarbonMind deliberately avoids a global state management library because:

1. **Firebase provides real-time state** — Firestore listeners serve as the single source of truth for most application data
2. **React Context is sufficient** — Only auth and theme state need to be globally shared
3. **Server Components reduce client state** — Next.js 15 RSC handles data fetching on the server, eliminating the need for client-side caching of static data
4. **Simplicity** — Fewer dependencies, smaller bundle, and easier onboarding for new contributors

---

## Authentication Architecture

```mermaid
graph LR
    subgraph Client["Client"]
        LoginPage["Login Page"]
        AuthProvider["AuthContext Provider"]
        ProtectedRoute["Protected Route"]
    end

    subgraph Firebase["Firebase"]
        FirebaseAuth["Firebase Auth"]
        CustomClaims["Custom Claims"]
    end

    subgraph Middleware["Next.js"]
        AuthMiddleware["middleware.ts"]
    end

    LoginPage -->|"signInWithPopup()"| FirebaseAuth
    FirebaseAuth -->|"ID Token"| AuthProvider
    AuthProvider -->|"user object"| ProtectedRoute
    AuthMiddleware -->|"verify token"| ProtectedRoute

    style Client fill:#e3f2fd,stroke:#1565c0
    style Firebase fill:#fce4ec,stroke:#c62828
    style Middleware fill:#fff3e0,stroke:#e65100
```

---

## Cloud Functions Pipeline

```mermaid
graph LR
    subgraph Triggers["Event Triggers"]
        UserCreate["users/{userId} CREATE"]
        ActivityWrite["activities/{activityId} WRITE"]
        Schedule["Sunday 00:00 UTC"]
        HTTPSCall["HTTPS Callable"]
    end

    subgraph Functions["Cloud Functions v2"]
        OnUserCreated["onUserCreated"]
        OnActivityWritten["onActivityWritten"]
        WeeklyReport["weeklyReport"]
        AwardPoints["awardPoints"]
        CheckAchievements["checkAchievements"]
    end

    subgraph Effects["Side Effects"]
        LeaderboardUpdate["Update Leaderboard"]
        AchievementUnlock["Unlock Achievement"]
        ScoreCalc["Calculate Carbon Score"]
        ReportGen["Generate Report"]
        AuditLog["Write Audit Log"]
    end

    UserCreate --> OnUserCreated
    ActivityWrite --> OnActivityWritten
    Schedule --> WeeklyReport
    HTTPSCall --> AwardPoints
    HTTPSCall --> CheckAchievements

    OnUserCreated --> LeaderboardUpdate
    OnUserCreated --> AchievementUnlock
    OnActivityWritten --> ScoreCalc
    OnActivityWritten --> LeaderboardUpdate
    WeeklyReport --> ReportGen
    AwardPoints --> AuditLog
    CheckAchievements --> AchievementUnlock

    style Triggers fill:#e8f5e9,stroke:#2e7d32
    style Functions fill:#e3f2fd,stroke:#1565c0
    style Effects fill:#fff3e0,stroke:#e65100
```

---

## Rendering Strategy

| Route | Strategy | Rationale |
|-------|----------|-----------|
| `/` (Landing) | **SSG** | Static marketing page, maximum performance |
| `/login`, `/signup` | **CSR** | Firebase Auth SDK requires client-side rendering |
| `/dashboard` | **SSR + CSR Hybrid** | Initial data server-rendered, real-time updates client-side |
| `/leaderboard` | **SSR + Real-time** | Server-rendered initial load, Firestore listener for live updates |
| `/log` | **CSR** | Interactive form with client-side validation |
| `/achievements` | **SSR** | Achievement data fetched on server, rarely changes |
| `/insights` | **CSR** | Gemini AI API calls happen client-side with streaming |
| `/tips` | **SSG + ISR** | Static content with incremental regeneration |

---

<p align="center">
  <em>Last updated: June 2025</em>
</p>
