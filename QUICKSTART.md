# Quick Start Guide

Get the Marriage Committee System running in 5 minutes!

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed

## Step 1: Backend Setup (2 minutes)

Open a terminal and run:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start backend server
python app.py
```

✅ Backend running at http://localhost:5000

## Step 2: Frontend Setup (2 minutes)

Open a **NEW terminal** (keep backend running) and run:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm start
```

✅ Frontend running at http://localhost:3000

## Step 3: Login (1 minute)

Browser should open automatically to http://localhost:3000

**Login with:**
- Username: `admin`
- Password: `admin123`

🎉 **You're ready to go!**

---

## Default Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin (Central Committee) | `admin` | `admin123` |
| Committee Member | `committee` | `committee123` |
| Overseer | `overseer` | `overseer123` |

⚠️ **Change these passwords after first login!**

---

## Create Your First Application

1. Logout from admin account
2. Click "Register here"
3. Create a new single user account
4. Login with new credentials
5. Go to Applications → New Application
6. Fill out and submit form

---

## Need Help?

See the full [SETUP_GUIDE.md](./SETUP_GUIDE.md) for:
- Detailed instructions
- Troubleshooting
- Production deployment
- Feature overview

---

## Stopping the Servers

Press `Ctrl + C` in both terminal windows.

---

## Next Time You Run

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

That's it! 🚀

