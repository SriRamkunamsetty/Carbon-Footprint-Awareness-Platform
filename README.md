# 🌍 CarbonMind AI

> **Track. Reduce. Sustain.** — An AI-powered carbon footprint awareness platform that empowers individuals to understand, monitor, and reduce their environmental impact through intelligent activity tracking, personalized insights, and community-driven sustainability challenges.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/SriRamkunamsetty/Carbon-Footprint-Awareness-Platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## Problem Statement Alignment
Climate change is one of the most pressing challenges of our time. While large-scale policy changes are essential, individual action remains a critical component of reducing global carbon emissions. However, most people lack awareness of their personal carbon footprint and have no actionable way to track and reduce it.

**CarbonMind AI** aligns directly with **Challenge 3: Carbon Footprint Awareness Platform**. It bridges the gap between awareness and action by providing an intuitive, gamified, and AI-enhanced platform that makes carbon footprint tracking accessible, engaging, and actionable for everyone.

## Core Constraints Met
- **Repository Size**: Strictly under 10 MB.
- **Repository Visibility**: Public.
- **Branching**: Only one branch (`main`).
- **Functionality**: Complete end-to-end functionality integrating Firebase Authentication, Google Gemini AI generation, and Firebase Cloud Firestore data management. Code is fully clean, formatted, and strictly typed.

## Innovative Awareness Generation
The platform educates users and gamifies sustainability through several innovative mechanisms:
- **AI Carbon Twin**: Users can simulate how lifestyle changes (e.g., swapping a car commute for public transit, eating vegetarian, using renewable energy) will impact their long-term carbon footprint and generate tangible utility/monetary savings.
- **AI Daily Log Parser**: Users simply type their day in natural language (e.g., "I drove 15km and ate a beef steak for lunch"), and the AI extracts, categorizes, and calculates the precise carbon emissions on the fly.
- **Gamified Achievements**: Users earn XP, unlock eco-badges (e.g., "First Log", "3-Day Streak"), and climb the community leaderboard.
- **Actionable AI Eco-Tips**: Context-aware recommendations that highlight exactly how many kg of CO₂ could be saved by making specific lifestyle adjustments based on the user's highest personal emission category.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts
- **Backend & Database**: Firebase Auth, Cloud Firestore (NoSQL), Firebase Cloud Functions
- **AI Integration**: Google Gemini AI (for Natural Language Log Parsing and AI Coaching)
- **Deployment & Tooling**: Vercel (Frontend Hosting), GitHub Actions (CI/CD), ESLint, Prettier

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20.x
- npm ≥ 10.x
- Git

### Installation
```bash
git clone https://github.com/SriRamkunamsetty/Carbon-Footprint-Awareness-Platform.git
cd Carbon-Footprint-Awareness-Platform
npm install
```

### Environment Setup
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Running the Application
```bash
npm run dev
```

---

<p align="center">
  Made with 💚 for a greener planet<br/>
  <strong>CarbonMind AI</strong> — Every action counts.
</p>