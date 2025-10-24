# Deeper Life Bible Church - Marriage Committee Management System

## Overview
A comprehensive web application to digitize and streamline the marriage preparation process for Deeper Life Bible Church in Ghana.

## Features
- 📝 **Digital Application Process** - Brothers and sisters can submit marriage intentions online
- 🔄 **Multi-Stage Workflow** - Track progress through 15+ stages from application to wedding
- 👥 **Role-Based Access** - Different views for Singles, Committee Members, Central Committee, and Overseers
- 🏥 **Medical Test Tracking** - Manage HIV, Hepatitis, and Sickle Cell test results
- 📚 **Courtship Manual** - 24-week guided topics with progress tracking
- 📍 **Cross-Location Support** - Coordinate between different regions and divisions
- 📊 **Dashboards & Reports** - Real-time visibility into all ongoing processes
- 🔔 **Notifications** - Email alerts for stage updates and deadlines
- 📅 **Scheduling** - Monthly check-ins and meeting coordination

## Tech Stack
- **Backend**: Python Flask, SQLAlchemy
- **Frontend**: React, Tailwind CSS
- **Database**: SQLite (upgradable to PostgreSQL)
- **Authentication**: Flask-Login with role-based permissions

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Initialize the database:
```bash
cd backend
python init_db.py
```

5. Run the application:

**Backend:**
```bash
cd backend
python app.py
```

**Frontend:**
```bash
cd frontend
npm start
```

6. Access the application at `http://localhost:3000`

## Default Admin Credentials
- **Username**: admin
- **Password**: admin123
- **Role**: Central Committee Member

⚠️ **Important**: Change the default password after first login!

## User Roles

### 1. Single Brother/Sister
- Submit marriage application
- Track application progress
- Upload documents
- Access courtship manual
- Schedule monthly check-ins

### 2. Local Marriage Committee Member
- Review applications from their location
- Interview applicants
- Approve/reject stages
- Assign counselors
- Schedule meetings

### 3. Central Marriage Committee
- Oversee all applications across locations
- Final approval authority
- Generate reports
- Manage system settings

### 4. Regional/Divisional Overseer
- Monitor applications in their region
- Provide guidance to local committees
- Review reports

## Application Stages

1. ✅ Initial Application Submission
2. ✅ Form Review
3. ✅ Brother's Interview
4. ✅ Medical Tests Request (Brother)
5. ✅ Medical Results Review (Brother)
6. ✅ Sister Contact & Application
7. ✅ Sister's Interview
8. ✅ Medical Tests Request (Sister)
9. ✅ Medical Results Review (Sister)
10. ✅ Medical Compatibility Check
11. ✅ First Couple Meeting
12. ✅ Proposal Permission & Response
13. ✅ Family Introduction - Sister's Family
14. ✅ Family Introduction - Brother's Family
15. ✅ Courtship Period (6 months - 24 topics)
16. ✅ Monthly Check-ins
17. ✅ Central Committee Review
18. ✅ Wedding Date Scheduling
19. ✅ Completed

## Courtship Manual Topics
The system includes 24 weekly topics covering:
- Biblical foundations of marriage
- Communication and conflict resolution
- Financial management
- Intimacy and purity
- Family planning
- Spiritual leadership
- And more...

## Support & Maintenance
For technical support or feature requests, contact the system administrator.

## License
© 2025 Deeper Life Bible Church Ghana. All rights reserved.

