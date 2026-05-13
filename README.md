# BloodCare Nexus

BloodCare Nexus is a full-stack blood bank management system built to support donor registration, hospital blood requests, inventory monitoring, and admin approval workflows in one connected platform.

The project uses:

- `React.js` for the frontend user interface
- `Node.js` and `Express.js` for backend APIs
- `MongoDB` with `Mongoose` for persistent data storage

## What The Project Does

BloodCare Nexus supports two main portals:

- `User / Donor Portal`
- `Admin Portal`

The user side allows people to:

- Log in securely
- Register as donors
- Submit blood requests for patients or hospitals
- View available blood units
- Review supply guidance and regional coverage information

The admin side allows blood bank staff to:

- Review incoming blood requests
- Approve, reject, or complete requests
- Monitor donor submissions
- Update blood stock levels
- Track reserved and available units
- View request and donor activity in an operational dashboard

## Development Process Completed In This Project

The application was built and expanded in stages:

1. Converted the earlier grievance-style project into a Blood Bank Management System.
2. Designed a new blood-bank dashboard experience in React.
3. Added donor registration and blood request forms.
4. Added success feedback after records are submitted.
5. Built a separate admin workflow for request review and stock control.
6. Added role-based login for donor, hospital, and admin users.
7. Connected the frontend to a Node.js / Express backend.
8. Replaced temporary data handling with MongoDB persistence.
9. Created MongoDB seed data for users, donors, blood stock, locations, and requests.
10. Added request lifecycle handling:
    - `Pending`
    - `Approved`
    - `Rejected`
    - `Completed`
11. Linked approval and completion actions to inventory reservations and issued units.
12. Added regional donor and recipient coverage based on stored data.
13. Removed visualization-heavy extras when requested and kept the interface more official and operational.
14. Prepared the project for deployment using GitHub Pages, Render, and MongoDB Atlas.

## Project Structure

```text
grievance-platform
|- backend
|  |- config
|  |- controllers
|  |- data
|  |- models
|  |- routes
|  |- scripts
|  |- server.js
|- frontend
|  |- public
|  |- src
|  |- .env.production.example
|- .github
|  |- workflows
|- render.yaml
|- package.json
|- README.md
```

## How Frontend And Backend Are Connected

The connection follows this flow:

```text
React Frontend
   -> sends HTTP requests with fetch()
Node.js / Express Backend
   -> validates and processes requests
MongoDB Database
   -> stores and returns persistent data
Backend API Response
   -> frontend updates dashboards and forms
```

### Example Flow: User Submits A Blood Request

1. A logged-in user fills the blood request form in React.
2. The frontend sends a `POST` request to:

```text
/api/blood/requests
```

3. The Express backend validates the request and stores it in MongoDB.
4. The admin page fetches requests from:

```text
/api/blood/requests
```

5. The request appears in the admin queue.
6. When admin approves, rejects, or completes it, the frontend sends a `PATCH` request.
7. The backend updates request status and inventory counts in MongoDB.
8. Updated values return to the frontend and refresh the dashboard.

## Frontend Responsibilities

The React frontend handles:

- Login page and role routing
- User portal dashboard
- Admin portal dashboard
- Donor registration form
- Blood request form
- Request review actions
- Inventory editing controls
- Fetching and rendering backend data
- Showing success and error states

The frontend connects to the backend through:

```js
REACT_APP_API_BASE_URL
```

In local development it falls back to:

```text
http://localhost:5000
```

## Backend Responsibilities

The Express backend handles:

- Database connection
- Authentication routes
- Donor create and list operations
- Blood request create and list operations
- Request approval, rejection, and completion
- Inventory reads and stock updates
- Location catalog data
- Summary statistics for dashboard cards

Mounted routes:

```text
/api/auth
/api/blood
```

## Main API Endpoints

### Authentication

```text
POST /api/auth/login
POST /api/auth/signup
```

### Blood Bank Operations

```text
GET    /api/blood/summary
GET    /api/blood/inventory
PATCH  /api/blood/inventory/:type
GET    /api/blood/locations
GET    /api/blood/donors
POST   /api/blood/donors
GET    /api/blood/requests
POST   /api/blood/requests
PATCH  /api/blood/requests/:id/status
PATCH  /api/blood/requests/:id/fulfill
```

## MongoDB Database Usage

Database name:

```text
blood_bank_management
```

Main collections:

- `users`
- `donors`
- `bloodrequests`
- `bloodinventories`
- `locationcatalogs`

### What Each Collection Stores

- `users`: login credentials, role, and organization details
- `donors`: donor identity, health details, blood group, location, and donation history
- `bloodrequests`: patient or hospital requests, urgency, units, requester info, and status
- `bloodinventories`: available units, reserved units, and stock condition by blood group
- `locationcatalogs`: supported countries and states/provinces for form selections

## Request Status And Inventory Logic

The request workflow is connected directly to stock handling:

- `Pending`: request is waiting for admin review
- `Approved`: matching units are reserved from inventory
- `Rejected`: request is closed without issuing stock
- `Completed`: reserved units are issued and inventory is reduced

This makes the admin page operational rather than decorative. It reflects the actual database state.

## Seed Data

The project includes starter data for:

- Users
- Hospitals
- Admin
- Donors
- Blood requests
- Blood stock
- Countries and states

Seed script:

```powershell
cd "C:\Users\mohit\Downloads\FINAL DRAFT\FP\grievance-platform\backend"
npm run seed
```

Seed file sources:

- `backend/data/store.js`
- `backend/data/bootstrap.js`
- `backend/scripts/seedDatabase.js`

## Demo Login Credentials

### User / Donor

```text
Email: donor@bloodcare.local
Password: user123
```

### Hospital

```text
Email: hospital@bloodcare.local
Password: hospital123
```

### Admin

```text
Email: mohitchandra2405@gmail.com
Password: Mohit2405
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
- Login route currently used during development: `http://localhost:3001/#/login`
- Backend: `http://localhost:5000`
- API check: `http://localhost:5000/api/blood/summary`

## Running Frontend And Backend Separately

### Backend

```powershell
cd "C:\Users\mohit\Downloads\FINAL DRAFT\FP\grievance-platform\backend"
npm run dev
```

### Frontend On Port 3001

```powershell
cd "C:\Users\mohit\Downloads\FINAL DRAFT\FP\grievance-platform\frontend"
$env:PORT="3001"
npm start
```

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

## Deployment Preparation

The project has already been prepared for permanent hosting:

- GitHub Pages workflow for frontend deployment
- `render.yaml` for backend hosting on Render
- Production environment variable support
- Configurable CORS origins

### Recommended Hosting Stack

- Frontend: GitHub Pages, Netlify, or Vercel
- Backend: Render or Railway
- Database: MongoDB Atlas

## GitHub + Render + MongoDB Atlas Flow

1. Push the project to GitHub.
2. Deploy the backend service from the repository.
3. Add the MongoDB Atlas connection string as `MONGO_URI`.
4. Add allowed frontend origin through `CORS_ORIGINS`.
5. Add the backend URL to frontend build config through `REACT_APP_API_BASE_URL`.
6. Build and publish the frontend.

## Why This Project Is Useful

BloodCare Nexus helps:

- Save time during blood request handling
- Improve accuracy of donor and stock records
- Reduce confusion in request approvals
- Keep a clear view of available and reserved units
- Support safer and more organized blood bank workflows
