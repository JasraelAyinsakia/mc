# ⚡ Quick Deployment Guide (15 Minutes)

The **FASTEST** way to deploy your system for FREE!

---

## 🎯 What You'll Get

- ✅ **Live website** accessible from anywhere
- ✅ **Free hosting** ($0/month)
- ✅ **Automatic SSL** (HTTPS)
- ✅ **Professional URL**

---

## 📋 Prerequisites

1. **GitHub Account** - [Sign up free](https://github.com/join)
2. **Render Account** - [Sign up free](https://render.com/register)
3. **Vercel Account** - [Sign up free](https://vercel.com/signup)

---

## 🚀 Step-by-Step Deployment

### Step 1: Push to GitHub (3 min)

```bash
cd /Users/ayinsakiajacob/Documents/projects/mc

# Initialize git
git init
git add .
git commit -m "Initial commit - DLBC Marriage System"

# Create a new repository on GitHub.com called "dlbc-marriage-system"
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/dlbc-marriage-system.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend on Render (7 min)

1. **Go to** https://render.com and login
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub** and select your repository
4. **Fill in:**
   - Name: `dlbc-marriage-api`
   - Root Directory: `backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt && python init_db.py`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Instance Type: **Free**

5. **Click "Advanced"** and add:
   - `FLASK_ENV` = `production`
   - `SECRET_KEY` = `dlbc-secret-key-2024-change-me`

6. **Click "Create Web Service"**
7. **Wait 5 minutes** for deployment
8. **Copy your URL** (e.g., `https://dlbc-marriage-api.onrender.com`)

---

### Step 3: Add Database on Render (2 min)

1. **Click "New +"** → **"PostgreSQL"**
2. **Fill in:**
   - Name: `dlbc-marriage-db`
   - Plan: **Free**
3. **Click "Create Database"**
4. **Copy "Internal Database URL"**
5. **Go back to your Web Service** → Environment tab
6. **Add environment variable:**
   - `DATABASE_URL` = (paste the internal database URL)
7. **Click "Manual Deploy"** → **"Deploy latest commit"**

---

### Step 4: Deploy Frontend on Vercel (3 min)

1. **Go to** https://vercel.com and login
2. **Click "Add New..."** → **"Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: `https://dlbc-marriage-api.onrender.com/api`
   (Use YOUR backend URL from Step 2)

6. **Click "Deploy"**
7. **Wait 2 minutes**
8. **Copy your URL** (e.g., `https://dlbc-marriage-system.vercel.app`)

---

### Step 5: Update CORS (1 min)

Update `backend/app.py` line 14:

```python
CORS(app, supports_credentials=True, origins=[
    'http://localhost:3001',
    'https://YOUR-VERCEL-URL.vercel.app'  # Add your Vercel URL here
])
```

**Commit and push:**
```bash
git add .
git commit -m "Update CORS for production"
git push
```

Render will auto-deploy the update!

---

## 🎉 YOU'RE LIVE!

**Your System URLs:**
- 🌐 **Website**: `https://YOUR-APP.vercel.app`
- 🔌 **API**: `https://YOUR-API.onrender.com`

### First Steps:

1. **Visit your Vercel URL**
2. **Login:** username: `admin`, password: `admin123`
3. **⚠️ CHANGE PASSWORD IMMEDIATELY** (Profile → Change Password)
4. **Create committee members** via Admin Panel
5. **Share URL with church!**

---

## 📱 Share With Church Members

**Registration Link:**
```
https://YOUR-APP.vercel.app/register
```

**Login Link:**
```
https://YOUR-APP.vercel.app/login
```

Singles can self-register and submit applications!

---

## ⚠️ Important: Free Tier Notes

### Render Free Tier:
- **Sleeps after 15 min of inactivity**
- First request takes 30-50 seconds to wake up
- **Database expires in 90 days** (upgrade to paid or migrate data)

### Solution for Sleeping:
Use **UptimeRobot** (free) to ping your backend every 5 minutes:
1. Go to https://uptimerobot.com
2. Add New Monitor
3. URL: `https://YOUR-API.onrender.com/api/health`
4. Interval: 5 minutes

This keeps your backend awake!

---

## 🆘 Troubleshooting

### "Login failed" on production:
- Wait 1 minute after first deploy
- Check Render logs for errors
- Verify DATABASE_URL is set

### Frontend can't reach backend:
- Check CORS settings include your Vercel URL
- Verify VITE_API_URL is correct
- Test API: Visit `https://YOUR-API.onrender.com/api/health`

### Database errors:
- Check DATABASE_URL format
- Verify init_db.py ran during build
- Check Render logs

---

## 💡 Pro Tips

1. **Custom Domain** (Optional):
   - Buy domain from Namecheap (~$10/year)
   - Add to Vercel (Frontend)
   - Add to Render (Backend)

2. **Keep it running**:
   - Use UptimeRobot to prevent sleeping
   - Or upgrade to paid tier ($7/month)

3. **Backup database**:
   - Export data monthly (free tier expires in 90 days)
   - Or upgrade for persistent database

---

## 🎊 Success!

Your church's marriage system is now **LIVE and FREE**! 

Share it with your members and enjoy the digital transformation! 🙌

**Need help?** Check the full DEPLOYMENT_GUIDE.md

