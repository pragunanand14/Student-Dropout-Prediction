# AI Student Dropout Prediction Dashboard

## Overview
Full-stack web app with React+Tailwind frontend and Flask backend. Fake login, interactive dashboard with stats, student table (search/filter/sort), charts, details modal.

## Quick Start
1. **Backend (first terminal):**
   ```
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
   Backend: http://localhost:5000
   Backend runs on http://localhost:5000

2. **Frontend (new terminal):**
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Frontend: http://localhost:3000
   Frontend runs on http://localhost:3000 (proxies to backend)

3. Login with any email/password → Dashboard.

## Integrated Run
To serve the React frontend directly from Flask:
```
cd frontend
npm run build
cd ..\backend
python app.py
```
Open http://localhost:5000 and Flask will serve both the frontend and the API.

## Run Both Together
To start the backend and frontend together in development from the project root:
```powershell
.\run-dev.ps1
```
Or:
```bat
run-dev.bat
```
This opens two PowerShell windows:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

## Features
- Fake login → Dashboard
- Stats cards: Total/High/Med/Low risk
- Student table: search, filters (class/section/risk), sort
- View details modal
- Charts: risk pie, class bar, trends line
- Responsive sidebar nav
- Logout

## Tech
- Frontend: React 18, Tailwind CSS, Vite, Recharts
- Backend: Flask, CORS, JSON data
- Dummy data: 50 students

## Troubleshooting
- Python 3.8+, Node 18+
- Backend first, then frontend
- Check console for API errors

