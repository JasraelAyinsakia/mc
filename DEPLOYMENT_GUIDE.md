# Deployment Guide - FREE Hosting

Deploy your DLBC Marriage Committee System for free using Render and Vercel.

---

## 🎯 Overview

We'll deploy:
- **Backend + Database** → Railway.app (Free) *(Render instructions kept as fallback)*
- **Frontend** → Railway.app (Free) *(new, reliable static hosting flow)*

**Total Cost: $0/month** ✨

---

---

## Part 1 (Option A): Deploy Backend to **Railway** (10 minutes)

> ✅ Recommended going forward (Render free tier is unstable for long-running Flask apps)

### Step 1: Create a Railway Account

1. Go to https://railway.app
2. Click **"Login"** → Continue with GitHub/Google
3. Authorize the Railway GitHub app

### Step 2: Import the GitHub Repo

1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select `JasraelAyinsakia/mc`
3. When prompted for services, pick the **backend** directory only

### Step 3: Configure the Web Service

| Setting              | Value                                |
|----------------------|--------------------------------------|
| **Service name**     | `mc-backend` (or anything you like)  |
| **Root Directory**   | `backend`                            |
| **Builder**          | Auto (Nixpacks)                      |
| **Build Command**    | `pip install -r requirements.txt`    |
| **Start Command**    | `gunicorn app:app --bind 0.0.0.0:$PORT` |
| **Health Check**     | `/api/health`                        |

### Step 4: Add a Postgres Database

1. Inside the same project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait for Railway to provision the database
3. Open the database → **"Connect"** → copy the **Internal Database URL**
4. Go back to your web service → **Variables** → add:
   - `DATABASE_URL` = `<internal-postgres-url>`
   - `FLASK_ENV` = `production`
   - `SECRET_KEY` = generate something like `dlbc-railway-secret-2025`

### Step 5: Initialize the Database

Railway lets you run ad-hoc commands against a service:

```bash
railway run --service mc-backend "cd backend && python init_db.py"
```

If you prefer the dashboard:
1. Go to your backend service → **"Settings"**
2. Click **"Run Command"**
3. Run `python init_db.py`

### Step 6: Note the Backend URL

Once deployed, Railway will give you a domain like:
```
https://mc-backend-production.up.railway.app
```

You’ll use this URL in the frontend (`VITE_API_URL`).

> ⚠️ Make sure this domain is added to `CORS` in `backend/app.py`.

---

## Part 1 (Option B): Deploy Backend to **Render** (legacy instructions)

### Step 1: Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email
4. Verify your email

### Step 2: Push Code to GitHub

If you haven't already, create a GitHub repository:

```bash
cd /Users/ayinsakiajacob/Documents/projects/mc

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - DLBC Marriage System"

# Create repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/dlbc-marriage-system.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. **Login to Render Dashboard**
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository**
4. Configure:
   - **Name**: `dlbc-marriage-api`
   - **Region**: `Oregon (US West)` (or closest to Ghana)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python init_db.py`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: **Free**

5. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable":
   - `FLASK_ENV` = `production`
   - `SECRET_KEY` = (generate random string like `dlbc-secret-2024-xyz123`)
   - `DATABASE_URL` = (will be auto-filled when you add PostgreSQL)

6. Click **"Create Web Service"**

### Step 4: Add PostgreSQL Database

1. From your Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `dlbc-marriage-db`
   - **Database**: `dlbc_marriage`
   - **User**: `dlbc_user`
   - **Region**: Same as your web service
   - **Plan**: **Free**

3. Click **"Create Database"**
4. Copy the **Internal Database URL**
5. Go back to your Web Service → **Environment** tab
6. Update `DATABASE_URL` with the internal database URL

7. **Manually deploy** to initialize database

### Step 5: Update CORS Settings

After deployment, get your backend URL (something like `https://dlbc-marriage-api.onrender.com`)

Update `backend/app.py`:
```python
CORS(app, supports_credentials=True, origins=[
    'http://localhost:3001',
    'https://YOUR-FRONTEND-URL.vercel.app'  # Add after frontend deployment
])
```

---

## Part 2: Deploy Frontend to Railway (from scratch)

### Step 0: Install a Static Server (one-time repo change)

Railway needs a process that keeps listening on `$PORT`. Add `serve` locally and push:

```bash
cd frontend
npm install --save-dev serve
git add package.json package-lock.json
git commit -m "Add serve for Railway static hosting"
git push origin main
```

*(If you prefer a PR instead of pushing to main, create a branch and open a PR.)*

### Step 1: Create a Railway Frontend Service

1. In the **same Railway project** (so it shares the database), click **"+ New" → "Deploy from GitHub"**.
2. Choose the **same repo**: `JasraelAyinsakia/mc`.
3. When asked for a directory, set **Root Directory = `frontend`**.
4. Railway will create a new service called something like `mc-frontend`.

### Step 2: Configure Build & Start Commands

| Setting        | Value                                      |
| -------------- | ------------------------------------------ |
| **Build**      | `npm install && npm run build`             |
| **Start**      | `npx serve -s dist -l $PORT`               |
| **Health path**| leave empty (static apps respond on `/`)   |

This builds the Vite app and serves the `dist` folder forever using `serve`.

### Step 3: Environment Variables

Add the API endpoint so the frontend knows where to call:

| Key           | Value (example)                                      |
|---------------|-------------------------------------------------------|
| `VITE_API_URL`| `https://mc-production-491c.up.railway.app/api`      |

*(Replace with your actual backend domain.)*

### Step 4: Generate a Public Domain

1. `mc-frontend` service → **Settings → Networking**.
2. Choose **Custom Port** = `8080` (any number works as long as it matches `$PORT`).
3. Click **Generate Domain** → copy the resulting URL, e.g.  
   `https://mc-frontend-production.up.railway.app`

### Step 5: Update Backend CORS

Add the new frontend domain to the backend CORS list (`backend/app.py`):

```python
CORS(app, supports_credentials=True, origins=[
    'http://localhost:3001',
    'https://mc-frontend-production.up.railway.app',
])
```

Commit & push those backend changes so Railway redeploys the API.

### Step 6: Redeploy Frontend

After moving to `serve`, click **"Redeploy"** on the `mc-frontend` service.  
Wait until it shows **Running** (green check), then visit the domain.  
The SPA will now stay online and talk to your backend without 502 errors.

---

## Part 3: Final Configuration

### Update Production Settings

1. **Backend** (`backend/config.py`):
```python
class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'None'
```

2. **Frontend** - Create `.env.production`:
```
VITE_API_URL=https://dlbc-marriage-api.onrender.com/api
```

---

## 🎉 Your System is Now LIVE!

**Frontend URL**: `https://dlbc-marriage-frontend.vercel.app`
**Backend API**: `https://dlbc-marriage-api.onrender.com/api`

### Initial Setup:

1. Visit your frontend URL
2. Login with admin credentials (admin/admin123)
3. **CHANGE THE PASSWORD IMMEDIATELY**
4. Create committee members through Admin Panel
5. Share the URL with your church members!

---

## ⚠️ Important Notes

### Free Tier Limitations:

**Render Free Tier:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-50 seconds to wake up
- 750 hours/month free (enough for 24/7 if you have only this service)
- PostgreSQL database: 90 days expiry (data deleted), 1GB storage

**Vercel Free Tier:**
- Unlimited bandwidth
- Automatic SSL
- 100GB bandwidth/month
- No sleeping

### Avoiding Sleep Issues:

Add a cron job or use a service like:
- **UptimeRobot** (free) - Ping your backend every 5 minutes
- **Cron-job.org** (free) - Schedule wake-up pings

---

## 🔄 Updating Your Deployment

**When you make changes:**

```bash
# Commit changes
git add .
git commit -m "Description of changes"
git push

# Render and Vercel will auto-deploy!
```

---

## 💰 Upgrade Options (If Needed Later)

If your church grows and needs better performance:

**Render Paid Plans** ($7/month):
- No sleeping
- Better performance
- Persistent database

**Alternative: DigitalOcean** ($4-12/month):
- Full VPS control
- Better for long-term

---

## 🆘 Troubleshooting

### Backend not responding:
- Check Render logs: Dashboard → Your Service → Logs
- Verify DATABASE_URL is set correctly
- Check if service is sleeping (free tier)

### Frontend can't connect to backend:
- Verify CORS settings include your frontend URL
- Check API_URL in frontend configuration
- Verify backend is running (visit `/api/health` endpoint)

### Database errors:
- Free PostgreSQL expires after 90 days - upgrade or migrate
- Check connection string is correct
- Verify database was initialized

---

## 📱 Share With Your Church

Once deployed, create accounts for:
1. **Committee Members** - Use Admin Panel
2. **Singles** - They self-register
3. **Overseers** - Use Admin Panel

**Share this URL with church members:**
```
https://dlbc-marriage-frontend.vercel.app
```

---

## 🎊 Congratulations!

Your Marriage Committee System is now accessible worldwide for FREE!

No more manual processes - everything is digital and automated! 🙌

