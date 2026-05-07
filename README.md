# BloodCare Nexus

BloodCare Nexus is a full-stack blood bank management system with:

- `frontend`: React user and admin portals
- `backend`: Node.js + Express API
- `database`: MongoDB

## Project Structure

```text
grievance-platform
|- backend
|  |- config
|  |- data
|  |- models
|  |- routes
|  |- scripts
|  |- server.js
|- frontend
|  |- public
|  |- src
|  |- .env.production.example
|- package.json
|- README.md
```

## Local Run

From the project root:

```powershell
cd "C:\Users\mohit\Downloads\FINAL DRAFT\FP\grievance-platform"
npm install
cd backend
npm install
cd ..\frontend
npm install
cd ..
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000` or `http://localhost:3001`
- Backend: `http://localhost:5000`
- API health: `http://localhost:5000/api/blood/summary`

## Environment Variables

### Backend

Create `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/blood_bank_management
PORT=5000
CORS_ORIGINS=http://localhost:3001
```

### Frontend Production

Create `frontend/.env.production`:

```env
REACT_APP_API_BASE_URL=https://your-backend-service.onrender.com
```

## Permanent Hosting With GitHub

This app cannot be hosted fully on GitHub alone because:

- GitHub Pages can host the React frontend
- Node.js + MongoDB backend needs a server host such as Render or Railway

Recommended permanent setup:

1. Push the project code to a GitHub repository
2. Deploy the backend to Render
3. Use MongoDB Atlas for the database
4. Deploy the frontend from GitHub to GitHub Pages, Netlify, or Vercel

## GitHub + Render + MongoDB Atlas Flow

### 1. Create a GitHub repository

Inside the project root:

```powershell
cd "C:\Users\mohit\Downloads\FINAL DRAFT\FP\grievance-platform"
git init
git add .
git commit -m "Initial BloodCare Nexus deployment setup"
```

Then create a new empty repository on GitHub and connect it:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Deploy backend

Use Render:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Set backend environment variables:

- `MONGO_URI=your-mongodb-atlas-uri`
- `PORT=5000`
- `CORS_ORIGINS=https://YOUR_USERNAME.github.io`

### 3. Deploy frontend

For GitHub Pages, build the frontend with:

```powershell
cd "C:\Users\mohit\Downloads\FINAL DRAFT\FP\grievance-platform\frontend"
npm install
npm run build
```

Before deploying, create `frontend/.env.production` and set:

```env
REACT_APP_API_BASE_URL=https://your-backend-service.onrender.com
```

## Notes

- The frontend now reads the backend URL from `REACT_APP_API_BASE_URL`
- The backend now reads allowed frontend origins from `CORS_ORIGINS`
- This makes the project ready for non-local deployment
