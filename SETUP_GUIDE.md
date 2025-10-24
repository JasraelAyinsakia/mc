# Deeper Life Bible Church - Marriage Committee System
## Complete Setup Guide

This guide will walk you through setting up the Marriage Committee Management System from scratch.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for version control)

---

## Part 1: Backend Setup (Flask API)

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Create Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your settings (optional - defaults work for development):

```env
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///marriage_system.db
FLASK_ENV=development
FLASK_DEBUG=True
```

### Step 5: Initialize the Database

```bash
python init_db.py
```

This will create the database and set up default users:

**Default Accounts:**
- **Admin**: username: `admin`, password: `admin123`
- **Committee Member**: username: `committee`, password: `committee123`
- **Overseer**: username: `overseer`, password: `overseer123`

⚠️ **Important**: Change these passwords after first login!

### Step 6: Start the Backend Server

```bash
python app.py
```

The backend API will be running at: `http://localhost:5000`

You should see:
```
* Running on http://0.0.0.0:5000
```

**Keep this terminal window open!**

---

## Part 2: Frontend Setup (React Application)

### Step 1: Open a New Terminal

Open a **new terminal window/tab** (keep the backend running in the first terminal).

### Step 2: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 3: Install Node Dependencies

```bash
npm install
```

Or if you prefer yarn:
```bash
yarn install
```

This might take a few minutes to download all dependencies.

### Step 4: Start the Development Server

```bash
npm start
```

Or with yarn:
```bash
yarn start
```

The frontend will be running at: `http://localhost:3000`

Your browser should automatically open to the login page!

---

## Part 3: First Login and Testing

### Step 1: Access the Application

Open your browser and go to: `http://localhost:3000`

### Step 2: Login with Admin Account

Use the default admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

### Step 3: Explore the System

After logging in, you'll see the dashboard. Explore:
- Dashboard - Overview of applications
- Applications - List of all applications
- Committee Portal - Admin features (for committee members)
- Profile - Update your information
- Notifications - System notifications

### Step 4: Create a Test User

1. Logout from admin account
2. Click "Register here" on login page
3. Fill in registration form as a single brother/sister
4. Login with new credentials
5. Submit a test marriage application

---

## Common Issues and Solutions

### Issue 1: Backend Port Already in Use

**Error**: `Address already in use`

**Solution**: Kill the process using port 5000:

**macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### Issue 2: Frontend Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: The terminal will ask if you want to use a different port. Type `Y` and press Enter.

Or kill the process:

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Issue 3: Database Errors

**Error**: `Database locked` or `OperationalError`

**Solution**: Delete the database file and reinitialize:

```bash
cd backend
rm marriage_system.db
python init_db.py
```

### Issue 4: Python Module Not Found

**Error**: `ModuleNotFoundError`

**Solution**: Make sure virtual environment is activated and reinstall:

```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Issue 5: Node Module Errors

**Error**: Module resolution errors

**Solution**: Delete node_modules and reinstall:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Running Both Servers

You'll need **two terminal windows**:

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

### Stopping the Servers

Press `Ctrl + C` in each terminal window.

---

## User Roles Explained

### 1. Single (Brother/Sister)
- Register and create marriage applications
- Track application progress
- Complete courtship topics
- View notifications

### 2. Committee Member
- Review applications in their region
- Conduct interviews
- Manage medical tests
- Track courtship progress
- Schedule check-ins

### 3. Central Committee
- Oversee all applications nationwide
- Final approvals
- Generate reports
- System administration

### 4. Regional/Divisional Overseer
- Monitor applications in their region
- Provide guidance
- Review reports

---

## Testing the System

### Test Scenario 1: Single User Journey

1. Register as a new single user (brother or sister)
2. Login with your credentials
3. Go to "Applications" → "New Application"
4. Fill out the marriage application form
5. Submit the application
6. View your application status on the dashboard

### Test Scenario 2: Committee Member Workflow

1. Login as committee member (username: `committee`, password: `committee123`)
2. Go to "Committee Portal"
3. View pending applications
4. Click on an application to review it
5. Update the application stage

### Test Scenario 3: Admin Functions

1. Login as admin (username: `admin`, password: `admin123`)
2. Access all features across the system
3. View statistics and reports
4. Manage all applications

---

## Production Deployment

### For Production Use:

1. **Change Default Passwords**
   - Login and change all default passwords immediately

2. **Update Environment Variables**
   ```env
   SECRET_KEY=<generate-strong-random-key>
   FLASK_ENV=production
   FLASK_DEBUG=False
   DATABASE_URL=postgresql://user:password@localhost/dbname  # Use PostgreSQL
   ```

3. **Use PostgreSQL Instead of SQLite**
   - SQLite is for development only
   - For production, use PostgreSQL or MySQL

4. **Set Up HTTPS**
   - Use SSL certificates
   - Never run production without HTTPS

5. **Configure Email Notifications**
   - Add SMTP settings to .env
   - Enable email notifications

6. **Deploy to Server**
   - Use platforms like Heroku, DigitalOcean, AWS, etc.
   - Or deploy on your church's server

---

## Getting Help

### Check the Logs

**Backend Logs:**
- Look at terminal where `python app.py` is running
- Check for error messages

**Frontend Logs:**
- Open browser Developer Tools (F12)
- Check Console tab for errors

### Database Issues

View database contents:
```bash
cd backend
sqlite3 marriage_system.db
.tables
SELECT * FROM users;
.quit
```

---

## Next Steps

1. ✅ Complete the setup
2. ✅ Test with sample data
3. ✅ Customize for your church's needs
4. ✅ Change default passwords
5. ✅ Train committee members
6. ✅ Deploy to production

---

## Support

For technical issues or questions:
1. Check the error message in terminal
2. Review this guide's troubleshooting section
3. Check browser console for frontend errors
4. Review the README.md file

---

## Features Overview

✅ **User Management**
- Role-based access control
- Secure authentication
- Profile management

✅ **Application Processing**
- Digital application forms
- Multi-stage workflow
- Progress tracking

✅ **Medical Test Management**
- Test result tracking
- Compatibility checking
- Hospital coordination

✅ **Courtship Manual**
- 24 weekly topics
- Progress tracking
- Counselor feedback

✅ **Committee Tools**
- Application review
- Interview recording
- Stage management

✅ **Notifications**
- Real-time updates
- Email alerts (configurable)
- Status changes

✅ **Reports & Analytics**
- Dashboard statistics
- Application tracking
- Progress reports

---

## System Architecture

```
┌─────────────────────┐
│   React Frontend    │  (Port 3000)
│   (User Interface)  │
└──────────┬──────────┘
           │
           │ HTTP/REST API
           │
┌──────────▼──────────┐
│   Flask Backend     │  (Port 5000)
│   (API Server)      │
└──────────┬──────────┘
           │
           │
┌──────────▼──────────┐
│  SQLite Database    │
│  (Data Storage)     │
└─────────────────────┘
```

---

## Congratulations!

Your Marriage Committee Management System is now set up and running! 🎉

The system will help streamline your church's marriage preparation process and provide better service to your members.

God bless your ministry!

