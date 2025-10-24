# Deployment Guide - FREE Hosting

Deploy your DLBC Marriage Committee System for free using Render and Vercel.

---

## 🎯 Overview

We'll deploy:
- **Backend + Database** → Render.com (Free)
- **Frontend** → Vercel (Free)

**Total Cost: $0/month** ✨

---

## Part 1: Deploy Backend to Render (10 minutes)

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

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 3: Update Frontend Configuration

Update `frontend/src/utils/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 
                'https://dlbc-marriage-api.onrender.com/api';
```

Commit and push:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

### Step 4: Deploy on Vercel

**Option A: Using Vercel Dashboard**
1. Login to Vercel
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variable**:
   - `VITE_API_URL` = `https://dlbc-marriage-api.onrender.com/api`
6. Click **"Deploy"**

**Option B: Using Vercel CLI**
```bash
cd frontend
vercel

# Follow the prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? dlbc-marriage-frontend
# Directory? ./
# Override settings? No
```

### Step 5: Update Backend CORS

Once deployed, you'll get a URL like `https://dlbc-marriage-frontend.vercel.app`

Update `backend/app.py`:
```python
CORS(app, supports_credentials=True, origins=[
    'http://localhost:3001',
    'https://dlbc-marriage-frontend.vercel.app'
])
```

Commit and push to trigger Render redeploy.

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

