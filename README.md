# CUHP CTF Platform

CUHP CTF Platform is a full-stack Capture The Flag web application for team-based cybersecurity competitions.

## Project Name
CUHP-CTF-Platform

## Features
- JWT-based authentication (register/login)
- Email verification on registration (EmailJS verification link required before login)
- Team system (create team, join via invite code, max 2 members)
- Challenge browsing by category and difficulty
- Flag submission with rate limiting
- Live leaderboard with tie-breaking
- Leaderboard visibility lock (admin-only before challenge release)
- Team score progression graph over time
- Click to expand team rows and view member names on the leaderboard
- Team progress insights with score breakdown and recent solves

## Tech Stack
- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React 18, Tailwind CSS, Recharts
- Tooling: npm workspaces, concurrently, nodemon, react-scripts

## Prerequisites
- Node.js LTS
- npm
- MongoDB (local service or Atlas)

## Environment Variables

### Backend ([backend/.env](backend/.env))
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/cuhp_ctf?retryWrites=true&w=majority
MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/cuhp_ctf
ALLOW_LOCAL_MONGO_FALLBACK=true
JWT_SECRET=your_super_secret_jwt_key_change_this
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_admin_password
FRONTEND_URL=http://localhost:3000
EMAIL_VERIFICATION_URL=http://localhost:3000/verify-email
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=public_xxxxxxxxxxxxx
EMAILJS_PRIVATE_KEY=private_xxxxxxxxxxxxx
# Optional alias if your setup uses this variable name:
EMAILJS_ACCESS_TOKEN=private_xxxxxxxxxxxxx
PORT=5000
```

Email verification template params expected by backend:
- `verification_link` (or `verification_url`) for the clickable verification URL
- `to_email`, `to_name`, `username`, `email` for recipient personalization

MongoDB Atlas quick setup:
1. Create a cluster in MongoDB Atlas.
2. Create a database user.
3. Add your IP address (or 0.0.0.0/0 for testing) in Network Access.
4. Copy the SRV connection string and replace `MONGODB_URI`.
5. If you are developing locally without Atlas, leave `MONGODB_URI` empty and use the local fallback values above.

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

Real-time reload is enabled by default in development:
- Frontend uses React Fast Refresh.
- Backend uses nodemon with legacy watch mode, so API changes auto-restart the server.

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
- `GET /api/auth/verify-email?token=...`
- `POST /api/teams/create`
- `POST /api/teams/join`
- `GET /api/teams/my/team`
- `GET /api/challenges`
- `POST /api/challenges` (admin only)
- `PUT /api/challenges/:id` (admin only)
- `DELETE /api/challenges/:id` (admin only)
- `POST /api/submit`
- `GET /api/leaderboard`
- `GET /api/graph/my-team`
- `GET /api/graph/team/:teamId`
- `GET /api/graph/all-teams`

For complete API details, see [docs/API.md](docs/API.md).

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
- MongoDB Atlas connection failed:
	- Verify username/password in `MONGODB_URI`.
	- Ensure the cluster allows your IP in Atlas Network Access.
	- Confirm the database user has readWrite permissions.
	- If `querySrv ECONNREFUSED` appears, try a non-SRV `mongodb://...` URI with explicit shard hosts.
	- The backend falls back to `MONGODB_LOCAL_URI` when Atlas is unreachable and `ALLOW_LOCAL_MONGO_FALLBACK=true`.
	- Start local MongoDB if using fallback (`mongod --dbpath <path>` or `brew services start mongodb-community`).
- Frontend cannot reach backend:
	- Ensure backend is running and `REACT_APP_API_URL` is correct.
- Registration failed:
	- Use a unique username and email.
	- Password must be at least 6 characters.
	- Check toast message for exact backend error.
- Login shows "Invalid credentials":
	- Ensure you are using the account email (not username) and correct password.
	- If using older data, log in once after backend restart so legacy plaintext passwords are auto-upgraded.
- Login says to verify email first:
	- Open the verification link sent during registration, then log in again.
	- If link expired, a new verification link is required (add a resend flow or have an admin reset the account).
- Invalid/expired token:
	- Clear localStorage in browser and login again.
- Create Team runtime error (`Cannot read properties of undefined (reading '0')`):
	- Pull latest frontend changes and hard refresh browser (`Ctrl+F5`).

## Git Ignore
The repository already ignores the main generated and local-only files, including:
- `node_modules/`
- `.env` files in root, backend, and frontend
- build output folders such as `build/`, `dist/`, and `out/`
- logs, caches, editor settings, and upload artifacts

No `.gitignore` changes were needed for this update.

## License
MIT
