# Freelance Hub Frontend (`fp-react`)

React + Vite frontend for the Freelance Hub platform.  
This app handles role-based UI for:
- Public users
- Clients
- Freelancers
- Admins

## Tech Stack
- React 19
- React Router DOM 7
- Axios
- Vite 7
- ESLint
- Docker + Nginx (production image)

## Main Features
- Login and registration (client/freelancer)
- Role-based routing and protected pages
- Client workspace:
  - Dashboard
  - My Jobs
  - Proposals
  - Contracts
  - Job Complete
  - Payments
  - Reviews
- Freelancer workspace:
  - Dashboard
  - Browse Jobs
  - My Proposals
  - Contracts
  - Job Complete
  - Payments
  - Reviews
- Admin workspace:
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
  app/           # App routes and app entry
  components/    # Shared UI components (shell, navbar, sidebar, guards)
  contexts/      # Auth context
  constants/     # Shared constants
  services/      # API services (axios client + endpoint modules)
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
- In local dev (`127.0.0.1`/`localhost`), frontend uses `/api` proxy by default.
- For deployed HTTPS frontend, use HTTPS API URLs to avoid mixed-content blocking.

## Run Locally
```bash
cd fp-react
pnpm install
pnpm dev
```

App URL:
- `http://127.0.0.1:5173`

## Available Scripts
```bash
pnpm dev       # start dev server
pnpm build     # production build
pnpm preview   # preview production build
pnpm lint      # lint code
```

## Docker
Build image:
```bash
docker build -t frontend:1.0 .
```

Run container:
```bash
docker run -d --name frontend-server -p 8080:80 frontend:1.0
```

## Troubleshooting
- `Port 5173 is already in use`
  - Stop the process using that port, or run Vite on another port.
- `Network Error` on login/register
  - Check backend is running.
  - Check API URL/proxy configuration.
  - Check browser console for CORS or mixed-content errors.
- Mixed content error (`https` page calling `http` API)
  - Set API URL to HTTPS and rebuild frontend.

## Team Members
- Aung Myat Oo Gyaw (6726066)  
  GitHub: [Kizut0](https://github.com/Kizut0)
- Mi Hsu Myat Win Myint (6726115)  
  GitHub: [hsumyatwin-myint](https://github.com/hsumyatwin-myint)
- Su Eain Dray Myint (6726094)  
  GitHub: [u6726094-dot](https://github.com/u6726094-dot)
