# MyGenie POS Website - PRD

## Original Problem Statement
Pull code from https://github.com/Abhi-mygenie/website.git (branch: 30-june), wipe local /app, preserve workspace files (.git, .emergent, frontend/.env, backend/.env), set up the project, install dependencies, and make the website run. No code edits. Environment variables to be added manually by user post-deployment.

## Architecture
- **Frontend**: React (CRA + Craco) with Tailwind CSS, Radix UI, Framer Motion, Recharts
- **Backend**: Python FastAPI with Motor (async MongoDB driver)
- **Database**: MongoDB (external — user will configure MONGO_URL in backend/.env)
- **Integrations**: Freshsales CRM, Calendly, Razorpay, Google Ads OAuth, Meta Ads, OTP, S3 storage

## What's Been Implemented (2026-06-30)
- [x] Pulled repo from GitHub (branch: 30-june) into /app
- [x] Preserved workspace files (.git, .emergent, frontend/.env, backend/.env)
- [x] Installed backend Python dependencies (requirements.txt via pip --no-deps to resolve litellm conflict)
- [x] Installed frontend Node.js dependencies (yarn install)
- [x] Backend running on port 8001 (FastAPI + Uvicorn via Supervisor)
- [x] Frontend running on port 3000 (Craco/CRA dev server via Supervisor)
- [x] Website rendering correctly with all pages accessible

## Environment Variables (User Responsibility)
User will configure these in backend/.env after deployment:
- MONGO_URL (external MongoDB connection string)
- DB_NAME
- Freshsales API keys
- Razorpay keys
- Meta/Google Ads tokens
- OTP service credentials
- S3 storage config
- Other service-specific env vars

## Backlog
- P0: User adds environment variables for external services
- P1: Production build optimization (yarn build)
- P2: SSL/domain configuration for production
