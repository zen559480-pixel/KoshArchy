# KoshArchy — Production Cloud Deployment Guide

This guide covers deploying **KoshArchy** to production using the recommended free/cost-effective serverless cloud stack:
1. **Neon** — Serverless PostgreSQL 16
2. **Render** — Backend Express API (Web Service)
3. **Vercel** — Frontend Vite React App (Static Edge Deployment)
4. *Alternative:* **Docker / Self-Hosted VPS** (DigitalOcean, Hetzner, AWS EC2)

---

## 1. Neon Database Setup (PostgreSQL)

Neon provides free serverless PostgreSQL with instant autoscaling and connection pooling.

### Steps:
1. Go to [https://neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, name it `kosharchy-db`, and select your preferred region (e.g. `ap-southeast-1` or `eu-central-1`).
3. Under **Dashboard > Connection Details**, select **Prisma** or **Direct connection**.
4. Copy the connection string. It looks like:
   ```env
   DATABASE_URL="postgresql://kosharchy_owner:yourpassword@ep-cool-frost-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
5. Push your schema and seed the database from your local terminal:
   ```bash
   # From root:
   DATABASE_URL="your-neon-connection-string" npm run db:push
   ```
   *Note: On first startup, the API will automatically connect to Neon and seed the admin user and 16 default financial categories.*

---

## 2. Render Deployment (Backend API)

Render hosts the Node.js Express API service.

### Option A: Render Blueprint (1-Click Automated)
The repository includes a `render.yaml` blueprint:
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New > Blueprint**.
3. Connect your GitHub repository: `https://github.com/zen559480-pixel/KoshArchy`.
4. Render will detect `render.yaml` and set up `kosharchy-api`.
5. Enter your environment variables when prompted (`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL`).

### Option B: Manual Web Service Setup
1. In Render, click **New > Web Service**.
2. Connect your repository: `https://github.com/zen559480-pixel/KoshArchy`.
3. Configure service settings:
   - **Name:** `kosharchy-api`
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     npm install --include=dev && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Health Check Path:** `/health`
4. Add Environment Variables in Render:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production environment |
   | `PORT` | `10000` | Default Render port |
   | `DATABASE_URL` | `postgresql://...` | Neon connection string from Step 1 |
   | `JWT_SECRET` | *(generate 32+ random characters)* | Token signing secret |
   | `JWT_EXPIRES_IN` | `30d` | Session expiry |
   | `CLIENT_URL` | `https://kosharchy.vercel.app` | Your Vercel frontend URL (or `*`) |
   | `ADMIN_EMAIL` | `you@email.com` | First login email |
   | `ADMIN_PASSWORD` | `your-secure-password` | First login password |
   | `ADMIN_NAME` | `Zen` | Display name |

5. Click **Deploy Web Service**.
6. Note down your Render API URL (e.g., `https://kosharchy-api.onrender.com`).

---

## 3. Vercel Deployment (Frontend React)

Vercel deploys the frontend across global edge CDNs with zero cold starts.

### Steps:
1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **Add New > Project**.
3. Import your GitHub repository: `zen559480-pixel/KoshArchy`.
4. In the configuration screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `apps/web` *(or leave root; `vercel.json` handles both)*
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://kosharchy-api.onrender.com/api` |
   *(Point to your Render backend `/api` endpoint)*
6. Click **Deploy**.
7. In 1–2 minutes, your site will be live at `https://kosharchy.vercel.app`.
8. Copy your Vercel URL, go back to Render, and ensure `CLIENT_URL` includes this domain (e.g. `https://kosharchy.vercel.app`).

---

## 4. Alternative: 1-Click Docker Self-Hosting

You can also self-host KoshArchy on any Linux server, VPS (DigitalOcean, Linode, AWS), or local machine with Docker:

```bash
# Clone the repository
git clone https://github.com/zen559480-pixel/KoshArchy.git
cd KoshArchy

# Start production containers (Postgres, API, and Nginx Web)
docker compose -f docker-compose.prod.yml up -d --build
```

- Web UI will be running on: `http://localhost` (Port 80)
- Backend API running on: `http://localhost:3001`
- PostgreSQL running on: `localhost:5432`

---

## 5. Environment Variables Reference

### Backend (`apps/api/.env`)
```env
DATABASE_URL="postgresql://user:password@host:5432/kosharchy?sslmode=require"
JWT_SECRET="generate-32-char-random-string"
JWT_EXPIRES_IN="30d"
PORT=3001
CLIENT_URL="https://kosharchy.vercel.app"
ADMIN_EMAIL="admin@kosharchy.com"
ADMIN_PASSWORD="StrongPassword123!"
ADMIN_NAME="Zen"
```

### Frontend (`apps/web/.env`)
```env
# In development (proxies /api -> localhost:3001):
# VITE_API_URL is not needed

# In production (Vercel):
VITE_API_URL=https://kosharchy-api.onrender.com/api
```

---

## 6. Post-Deployment Verification Checklist

1. **Health Check:**
   Visit `https://kosharchy-api.onrender.com/health` → Should return `{"status":"healthy","database":"connected"}`.
2. **Login Flow:**
   Visit your Vercel URL → Enter `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in Render.
3. **Core Verification:**
   - Add Bank Account (e.g. HDFC ₹1,00,000)
   - Log an Income transaction (Salary ₹1,50,000)
   - Verify Fluid Money calculation updates on Dashboard
   - Check Forecast and Analytics pages render without console errors
   - Test CSV export from Settings
