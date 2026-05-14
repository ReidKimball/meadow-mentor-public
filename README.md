# Meadow Mentor

> AI-powered diet coaching app for chronic inflammatory conditions

**Live app:** [meadowmentor.com](https://meadowmentor.com)

Meadow Mentor helps people with IBD, IBS, Crohn's, Ulcerative Colitis, and related autoimmune/gut-inflammation conditions stick to therapeutic diets. The app combines AI recipe generation, AI coaching, and personalized meal planning across four different therapeutic diets.

---

## Why I built this

People newly diagnosed with inflammatory conditions are often handed a complex therapeutic diet (SCD, GAPS, Paleo AIP, Mediterranean) with little practical guidance. The cognitive load of "is this ingredient allowed?" multiple times per day is exhausting. Meadow Mentor is the personal coach that guides people, one meal at a time.

This is a **production application** with real users, not a tutorial project.

---

## How I built this: AI-augmented development

I built Meadow Mentor by directing AI coding agents (Windsurf/Cascade, Claude, GPT, Gemini) to write the implementation while I owned the product and engineering decisions. This is an honest description of how the app was made, and I think it reflects where software development is heading.

**What I owned:**
- **Product vision and problem definition.** I identified the user need, defined the feature set, and made every prioritization call.
- **Architecture and tech stack.** I chose React + Express + MongoDB + Firebase Auth + Gemini + LangChain/LangGraph + Stripe and defined how they connect. I can explain why each piece is there and what tradeoffs I considered.
- **Design system.** I collaborated with AI to create a complete brand and UI specification ([Brand_Report_Dec2025_v3.md](zInstructions_and_Context/Brand%20Guidelines/Brand_Report_Dec2025_v3.md)): color palette with WCAG AA compliance rules, typography hierarchy, component patterns, voice and tone guidelines. Every frontend page is built against this spec.
- **Code quality governance.** I created documentation standards and agent skills that constrain how AI writes code. Instead of accepting whatever the AI generated, I built systems to steer it toward consistent, documented, maintainable output.
- **Agent skills I built:** `api-design` (RESTful API design standards), `engineering-tutor` (forces hypothesis-first debugging), `enforce-strict-scope` (audits git diffs for scope creep). These are reusable tools that enforce engineering discipline on AI-generated code.
- **Deployment and infrastructure.** Docker multi-stage builds, Google Cloud Run, CI/CD scripting, secret management.
- **Debugging and production issues.** When things broke in production (token expiry bugs, MongoDB connection failures, OAuth leaks), I dug into cloud run logs, terminal errors, mongoDB data, and LangSmith traces in order to give AI the context it needed. Then I directed fixes after it presented potential solutions.

**What the AI wrote:**
- The implementation code: React components, Express routes, Mongoose models, LangGraph agents, service files.
- I reviewed, tested, and iterated on all of it. But I did not hand-write the logic line by line.

---

## What I'd showcase

If you're reviewing this repo, here are the artifacts that best represent how I work:

### 1. Design system: `Brand_Report_Dec2025_v3.md`
A 150-line brand specification I created that defines colors, typography, accessibility rules (WCAG AA), component patterns, voice/tone, and footer architecture. This document is what the AI references when building any frontend page. It demonstrates product thinking: I defined *what the app should look and feel like* for a vulnerable user population, then enforced that consistently across the codebase.

### 2. Documentation and code quality standards
I created guidelines that govern how the AI documents backend code (JSDoc, error handling patterns) and frontend code (component structure, prop documentation). Rather than cleaning up after the AI, I built rules that produce clean code from the start.

### 3. Agent skills: `api-design`, `engineering-tutor`, `enforce-strict-scope`
These are custom AI agent skills I designed and built:
- **[`api-design`](https://github.com/ReidKimball/.agents/tree/main/skills/api-design)** defines RESTful API conventions so every new endpoint follows the same patterns
- **[`engineering-tutor`](https://github.com/ReidKimball/.agents/tree/main/skills/engineering-tutor)** uses a Socratic method to force hypothesis-first debugging instead of trial-and-error
- **[`enforce-strict-scope`](https://github.com/ReidKimball/.agents/tree/main/skills/enforce-strict-scope)** audits `git diff` output to catch unrelated changes before they ship

These tools demonstrate that I think about process and quality, not just features.

### 4. Architecture decisions
The codebase reflects deliberate technical choices I can walk through:
- **Auth:** Firebase Auth on the client, Firebase Admin SDK verification on the server, MongoDB for app data. Three data sources unified in a single React Context (`UserContext.jsx`).
- **AI agents:** LangChain + LangGraph with tool-calling for diet-aware recipe generation and chat.
- **Payments:** Stripe via the Firestore extension, with real-time subscription state synced to the frontend.
- **Deployment:** Dockerized multi-stage build deployed to Cloud Run with a single PowerShell script.

---

## Tech Stack

**Frontend:** React 19, Vite, Material UI v7, Tailwind CSS, React Router 7, Firebase Auth, Stripe (Firestore extension)

**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, Firebase Admin SDK, LangChain + LangGraph, Google Gemini, Sanity CMS, Socket.IO

**Infrastructure:** Docker, Google Cloud Run, Google Artifact Registry, Google Secret Manager, Prerender.io

**Companion services:** Next.js 16 marketing site (separate Cloud Run service), Sanity Studio (headless CMS)

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

- **Auth flow:** Firebase Auth sign-in, ID token as Bearer header, Express middleware verifies via Admin SDK, user profile loaded from MongoDB
- **AI flow:** user request, controller, LangGraph agent, tool calls (food DB lookup, recipe validation), streamed response via Socket.IO
- **Subscription flow:** Stripe Firestore extension writes subscription state, React UserContext subscribes to Firestore changes, backend verifies premium status on protected routes

---

## Features

- **AskKay:** streaming AI chat with a diet-aware persona
- **AI recipe generation:** compliant recipes from available ingredients
- **AI weekly meal plan:** 7-day meal plan generation
- **Saved recipes:** persist and share AI-generated recipes

Four therapeutic diets supported: Mediterranean, Specific Carbohydrate Diet (SCD), GAPS, and Paleo Autoimmune Protocol (AIP).

---

## Local setup

```bash
git clone https://github.com/ReidKimball/meadow-mentor-public.git
cd meadow-mentor-public

cd backend && npm install
cd ../client && npm install
```

Create `backend/.env.config` with the keys defined in `backend/check_env_vars.js` (you'll need your own Firebase project, MongoDB Atlas cluster, Gemini API key, and Stripe account).

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd client && npm run dev
```

---

## Status

Live, in production, with real users.

---

## About

Built solo by [Reid Kimball](https://github.com/ReidKimball) using AI-augmented development. Open to questions about any product, architecture, or process decision. Happy to walk through how I work live.
