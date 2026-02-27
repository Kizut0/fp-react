# Freelance Link Frontend (`fp-react`)

Frontend implementation for the project:
**"Freelance Link: A Web-Based Freelancer Hiring Platform for Clients and Freelancers"**

This repository contains the React web client used by:
- Public users
- Clients
- Freelancers
- Admins

## Project Goal
Build a simple, structured, and user-friendly freelancer platform focused on core marketplace flows:
- Job posting and job management
- Proposal submission and hiring
- Contract tracking
- Payment tracking
- Review and rating
- Admin monitoring and moderation

## Tech Stack
- React 19
- React Router DOM 7
- Axios
- Vite 7
- ESLint
- Docker + Nginx

## Frontend Scope
- Authentication pages (Login / Register)
- Role-based protected routes
- Client pages:
  - Dashboard
  - My Jobs
  - Proposals
  - Contracts
  - Job Complete
  - Payments
  - Reviews
- Freelancer pages:
  - Dashboard
  - Browse Jobs
  - My Proposals
  - Contracts
  - Job Complete
  - Payments
  - Reviews
- Admin pages:
  - Dashboard
  - Users
  - Jobs
  - Proposals
  - Contracts
  - Reviews
  - Payments

## Project Structure
```txt
src/
  app/           # routes and app entry
  components/    # shared UI components
  contexts/      # auth context/provider
  constants/     # shared constants
  services/      # API services and axios client
  pages/
    auth/
    public/
    client/
    freelancer/
    admin/
```

## Environment Variables
Create `.env` in `fp-react`:

```env
VITE_API_URL=https://freelance.southeastasia.cloudapp.azure.com
```

Optional:
```env
VITE_FORCE_ABSOLUTE_API_URL=false
VITE_API_TIMEOUT_MS=15000
VITE_API_PROXY_TARGET=http://127.0.0.1:3000
```

Notes:
- Local development uses `/api` proxy (`vite.config.js`).
- In HTTPS deployment, use HTTPS API URL to avoid mixed-content errors.

## Local Development
```bash
cd fp-react
pnpm install
pnpm dev
```

Frontend URL:
- `http://127.0.0.1:5173`

## Scripts
```bash
pnpm dev       # run Vite dev server
pnpm build     # build production bundle
pnpm preview   # preview production bundle
pnpm lint      # run ESLint
```

## Docker
Build:
```bash
docker build -t frontend:1.0 .
```

Run:
```bash
docker run -d --name frontend-server -p 8080:80 frontend:1.0
```

## Team Members
- Aung Myat Oo Gyaw (6726066)  
  Github: [Kizut0](https://github.com/Kizut0)
- Mi Hsu Myat Win Myint (6726115)  
  Github: [hsumyatwin-myint](https://github.com/hsumyatwin-myint)
- Su Eain Dray Myint (6726094)  
  Github: [u6726094-dot](https://github.com/u6726094-dot)
