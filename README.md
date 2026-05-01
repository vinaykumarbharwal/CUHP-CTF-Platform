
# CUHP CTF Platform

## Overview
CUHP CTF Platform is a full-stack web application for hosting and managing Capture The Flag (CTF) competitions. It supports team-based play, real-time scoring, challenge management, and a modern user experience for both participants and administrators.

## Features
- Secure authentication and email verification
- Team creation and joining (invite code, max 2 members)
- Challenge browsing by category and difficulty
- Flag submission with rate limiting and cooldowns
- Live leaderboard with tie-breaking and team details
- Team score progression graph
- Admin controls for challenge and leaderboard visibility

## Technology Stack
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React 18, Tailwind CSS, Recharts
- **Tooling:** npm workspaces, concurrently, nodemon, react-scripts

## Prerequisites
- Node.js (LTS recommended)
- npm
- MongoDB (local or Atlas)

## Environment Variables

### Backend (`backend/.env`)
```
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/cuhp_ctf
ALLOW_LOCAL_MONGO_FALLBACK=true
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
FRONTEND_URL=http://localhost:3000
EMAIL_VERIFICATION_URL=http://localhost:3000/verify-email
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
PORT=5000
```

**Email verification template params:**
- `verification_link` or `verification_url` (URL for verification)
- `to_email`, `to_name`, `username`, `email` (recipient info)

**MongoDB Atlas setup:**

1. Create a cluster in MongoDB Atlas
2. Create a database user
3. Add your IP address in Network Access
4. Copy the SRV connection string and set `MONGODB_URI`
5. For local development, use `MONGODB_LOCAL_URI`


### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:5000/api
```


## Installation

From the project root:
```
npm install
```
Or use the workspace install script:
```
npm run install:all
```

## Running the App (Development)

**Option 1: Run both frontend and backend together**
```
npm run dev
```

**Option 2: Run separately**
```
cd backend && npm run dev
cd frontend && npm start
```

## Seeding Initial Challenges
```
npm run seed
```

## App URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api



## Project Structure
```
CUHP-CTF-Platform/
├── backend/
├── frontend/
├── database/
├── docs/
├── docker/
└── README.md
```

## Project Structure
```text
CUHP-CTF-Platform/
├── backend/
├── frontend/
├── database/
├── docs/
├── docker/
└── README.md
```


## Troubleshooting
- **MongoDB connection issues:**
  - Check your URI, credentials, and IP whitelist in Atlas
  - For local fallback, ensure MongoDB is running and `ALLOW_LOCAL_MONGO_FALLBACK=true`
- **Frontend cannot reach backend:**
  - Confirm backend is running and `REACT_APP_API_URL` is correct
- **Registration or login issues:**
  - Use a unique email and username
  - Password must be at least 6 characters
  - Check for email verification if required
- **Other errors:**
  - See browser console or backend logs for details

## License
MIT
