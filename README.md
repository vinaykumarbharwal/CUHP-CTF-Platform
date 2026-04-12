# CUHP CTF Platform

CUHP CTF Platform is a full-stack Capture The Flag web application for team-based cybersecurity competitions.

## Project Name
CUHP-CTF-Platform

## Features
- JWT-based authentication (register/login)
- Team system (create team, join via invite code, max 2 members)
- Challenge browsing by category and difficulty
- Flag submission with rate limiting
- Live leaderboard with tie-breaking
- Team score progression graph over time

## Tech Stack
- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React 18, Tailwind CSS, Recharts
- Tooling: npm workspaces, nodemon

## Prerequisites
- Node.js LTS
- npm
- MongoDB (local service or Atlas)

## Environment Variables

### Backend ([backend/.env](backend/.env))
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/cuhp_ctf?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
```

MongoDB Atlas quick setup:
1. Create a cluster in MongoDB Atlas.
2. Create a database user.
3. Add your IP address (or 0.0.0.0/0 for testing) in Network Access.
4. Copy the SRV connection string and replace `MONGODB_URI`.

### Frontend ([frontend/.env](frontend/.env))
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Installation

From project root:
```bash
npm install
```

Or use workspace install script:
```bash
npm run install:all
```

## Run (Development)

### Option A: Run both from root
```bash
npm run dev
```

Windows fallback if `npm` is not recognized:
```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

### Option B: Run separately
```bash
cd backend
npm run dev
```

```bash
cd frontend
npm start
```

## Seed Initial Challenges
```bash
npm run seed
```

## App URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/teams/create`
- `POST /api/teams/join`
- `GET /api/teams/my/team`
- `GET /api/challenges`
- `POST /api/submit`
- `GET /api/leaderboard`
- `GET /api/graph/my-team`

For complete API details, see [docs/API.md](docs/API.md).

## Project Structure
```text
CUHP-CTF-Platform/
├── backend/
├── frontend/
├── database/
├── docs/
├── docker/
├── scripts/
└── .github/workflows/
```

## Troubleshooting
- MongoDB Atlas connection failed:
	- Verify username/password in `MONGODB_URI`.
	- Ensure the cluster allows your IP in Atlas Network Access.
	- Confirm the database user has readWrite permissions.
	- If `querySrv ECONNREFUSED` appears, try a non-SRV `mongodb://...` URI with explicit shard hosts.
- Frontend cannot reach backend:
	- Ensure backend is running and `REACT_APP_API_URL` is correct.
- Registration failed:
	- Use a unique username and email.
	- Password must be at least 6 characters.
	- Check toast message for exact backend error.
- Invalid/expired token:
	- Clear localStorage in browser and login again.
- Create Team runtime error (`Cannot read properties of undefined (reading '0')`):
	- Pull latest frontend changes and hard refresh browser (`Ctrl+F5`).

## License
MIT
