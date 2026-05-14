# Meadow Mentor

> AI-powered diet coaching app for chronic inflammatory conditions

**Live app:** [meadowmentor.com](https://meadowmentor.com)

Meadow Mentor helps people with IBD, IBS, Crohn's, Ulcerative Colitis, and related autoimmune/gut-inflammation conditions stick to therapeutic diets. The app combines AI ingredient analysis, a compliance-scoring food journal, AI recipe generation, and personalized meal planning across five different therapeutic diets.

---

## Why I built this

I wanted to ship a real product that solves a problem I understand. People newly diagnosed with inflammatory conditions are often handed a complex therapeutic diet (SCD, GAPS, Paleo AIP, Mediterranean, low-fiber) with little practical guidance. The cognitive load of "is this ingredient compliant?" multiple times per day is exhausting. Meadow Mentor offloads that decision to AI.

This is a **production application** with paying users — not a tutorial project.

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Material UI v7 + Tailwind CSS
- React Router 7
- Firebase Auth (client SDK)
- Stripe (via Firestore extension)

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- Firebase Admin SDK (auth verification)
- LangChain + LangGraph (agent workflows)
- Google Gemini (primary LLM)
- Sanity CMS (blog content)
- Socket.IO (streaming chat)

**Infrastructure**
- Docker (multi-stage build)
- Google Cloud Run (autoscaling container hosting)
- Google Artifact Registry (image storage)
- Google Secret Manager (production secrets)
- Prerender.io (SEO for SPA)

**Companion services**
- Next.js 16 marketing site (separate Cloud Run service)
- Sanity Studio (headless CMS for blog)

---

## Architecture at a glance

```
┌─────────────────────┐       ┌─────────────────────┐
│   meadowmentor.com  │       │  app.meadowmentor   │
│   (Next.js 16)      │       │  (React SPA + API)  │
│   Cloud Run         │       │  Cloud Run          │
└─────────────────────┘       └──────────┬──────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                    ┌──────────┐   ┌──────────┐   ┌──────────┐
                    │ MongoDB  │   │ Firebase │   │  Gemini  │
                    │  Atlas   │   │ Auth +   │   │   LLM    │
                    │          │   │ Stripe   │   │          │
                    └──────────┘   └──────────┘   └──────────┘
```

- **Auth flow:** client signs in via Firebase Auth → Firebase ID token sent as `Bearer` header → Express middleware verifies token via Firebase Admin SDK → user profile loaded from MongoDB
- **AI flow:** user request → controller → LangGraph agent → tool calls (e.g. food DB lookup, recipe validation) → streamed response via Socket.IO
- **Subscription flow:** Stripe Firestore extension writes subscription state to Firestore → React `UserContext` subscribes to Firestore changes → backend verifies premium status from Firestore on protected routes

---

## Features

- **AI ingredient label analysis** — paste or photograph an ingredient list and get diet-compliance scoring
- **Food journal with compliance scoring** — log meals, get instant pass/fail per diet
- **AskKay** — streaming AI chat with diet-aware persona
- **AI recipe generation** — generate compliant recipes from available ingredients
- **Meal-to-compliant conversion** — turn a non-compliant meal into a compliant version
- **AI weekly meal plan** — generate a 7-day plan
- **Saved recipes** — persist and share AI-generated recipes
- **Premium tier** — meal-history analysis, higher API limits, priority access

Five therapeutic diets supported: Mediterranean, Specific Carbohydrate Diet (SCD), GAPS, Paleo Autoimmune Protocol (AIP), and Low-Fiber.

---

## Recommended showcase files

If you're reviewing this for a hiring decision, here are the files I'd point to as representative of my code style and engineering thinking:

### Backend — `backend/middleware/authMiddleware.js`
Clean, single-responsibility Express middleware that verifies Firebase ID tokens. JSDoc documented, handles the common auth failure modes explicitly (missing header, malformed bearer, expired token). Demonstrates how the backend trusts the frontend's Firebase Auth session without maintaining its own session store.

### Frontend — `client/src/context/UserContext.jsx`
React Context that bridges three separate data sources into a single `useUser()` hook: Firebase Auth (login state), Firestore real-time subscriptions (Stripe subscription status), and a MongoDB user profile (app-specific data like diet preferences and API usage limits). Includes a `getFreshIdToken` helper that proactively refreshes tokens to prevent `auth/id-token-expired` errors on protected API calls — a real production bug I diagnosed and fixed.

---

## Local setup

```bash
# Clone
git clone https://github.com/ReidKimball/meadow-mentor-public.git
cd meadow-mentor-public

# Install
cd backend && npm install
cd ../client && npm install
```

Create `backend/.env.config` with the keys defined in `backend/check_env_vars.js` (you'll need your own Firebase project, MongoDB Atlas cluster, Gemini API key, and Stripe account to run a full local copy — this app is not a one-click clone).

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

---

## Deployment

A single PowerShell script handles building and deploying both services to Cloud Run:

```powershell
.\deploy.ps1 app        # React + Express
.\deploy.ps1 marketing  # Next.js marketing site
.\deploy.ps1 all
```

Production secrets live in Google Secret Manager and are mounted as env vars on the Cloud Run service.

---

## Status

Live, in production, with paying users. Active development continues on:
- Improved meal-history analysis using LangGraph multi-agent workflows
- Bowel-movement logging + symptom correlation analytics
- Practitioner referral / B2B tier

---

## About

Built solo by [Reid Kimball](https://github.com/ReidKimball). Open to questions about any architectural or implementation choice — happy to walk through the codebase live.
