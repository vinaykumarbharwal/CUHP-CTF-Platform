# CUHP CTF API Documentation

## Base URL
- Development: http://localhost:5000/api
- Production: https://cuhp-ctf-backend.onrender.com/api

## Auth Header
Protected endpoints require a bearer token:

```http
Authorization: Bearer <jwt_token>
```

## Global Rate Limits
- All `/api/*` routes: 100 requests / 15 minutes / IP
- `POST /api/submit`: 10 requests / minute / IP

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

Request:
```json
{
	"username": "player1",
	"email": "player1@example.com",
	"password": "password123"
}
```

Success response (`201`):
```json
{
	"token": "<jwt>",
	"user": {
		"id": "<user_id>",
		"username": "player1",
		"email": "player1@example.com"
	}
}
```

Validation error (`400`):
```json
{
	"errors": [
		{
			"msg": "Invalid value",
			"path": "email",
			"location": "body"
		}
	]
}
```

Duplicate user (`400`):
```json
{
	"error": "User already exists"
}
```

#### POST /auth/login
Login with email and password.

Request:
```json
{
	"email": "player1@example.com",
	"password": "password123"
}
```

Success response (`200`):
```json
{
	"token": "<jwt>",
	"user": {
		"id": "<user_id>",
		"username": "player1",
		"email": "player1@example.com",
		"teamId": null
	}
}
```

Invalid credentials (`401`):
```json
{
	"error": "Invalid credentials"
}
```

### Teams

#### POST /teams/create
Create a team for the current user.

Auth required: yes

Request:
```json
{
	"name": "Team Alpha"
}
```

Success response (`201`):
```json
{
	"team": {
		"_id": "<team_id>",
		"name": "Team Alpha",
		"inviteCode": "a1b2c3d4e5f6g7h8",
		"members": ["<user_id>"],
		"totalScore": 0,
		"solvedChallenges": []
	},
	"inviteCode": "a1b2c3d4e5f6g7h8"
}
```

Common errors:
- `400`: `{"error":"You are already in a team"}`
- `400`: `{"error":"Team name already exists"}`

#### POST /teams/join
Join a team using invite code.

Auth required: yes

Request:
```json
{
	"inviteCode": "a1b2c3d4e5f6g7h8"
}
```

Success response (`200`):
```json
{
	"team": {
		"_id": "<team_id>",
		"name": "Team Alpha"
	},
	"message": "Successfully joined team"
}
```

Common errors:
- `404`: `{"error":"Invalid invite code"}`
- `400`: `{"error":"Team is already full"}`
- `400`: `{"error":"You are already in a team"}`

#### GET /teams/:id
Get team details by team ID.

Auth required: yes

Success response (`200`): team object with populated members and solved challenges.

Not found (`404`):
```json
{
	"error": "Team not found"
}
```

#### GET /teams/my/team
Get the authenticated user's team.

Auth required: yes

Success response (`200`): team object with populated members and solved challenges.

Not in a team (`404`):
```json
{
	"error": "You are not in a team"
}
```

### Challenges

#### GET /challenges
Get all challenges. Flag values are excluded.

Auth required: yes

Success response (`200`):
```json
[
	{
		"_id": "<challenge_id>",
		"title": "SQL Injection 101",
		"description": "Try to bypass...",
		"category": "Web",
		"difficulty": "Easy",
		"points": 100,
		"hint": null
	}
]
```

#### GET /challenges/:id
Get one challenge by ID. Flag is excluded.

Auth required: yes

Not found (`404`):
```json
{
	"error": "Challenge not found"
}
```

### Submissions

#### POST /submit
Submit a flag for a challenge.

Auth required: yes

Request:
```json
{
	"challengeId": "<challenge_id>",
	"flag": "CUHP{example_flag}"
}
```

Success response (`200`):
```json
{
	"success": true,
	"message": "Correct flag!",
	"points": 100,
	"totalScore": 300
}
```

Common errors:
- `400`: `{"error":"You must be in a team to submit flags"}`
- `404`: `{"error":"Challenge not found"}`
- `400`: `{"error":"Challenge already solved by your team"}`
- `400`: `{"error":"Incorrect flag"}`
- `429`: too many submission attempts

### Leaderboard

#### GET /leaderboard
Get ranked teams.

Auth required: yes

Ranking logic:
- Primary: `totalScore` descending
- Secondary tie-break: earliest solve time ascending

Success response (`200`):
```json
[
	{
		"rank": 1,
		"id": "<team_id>",
		"name": "Team Alpha",
		"totalScore": 500,
		"members": [
			{ "username": "player1" },
			{ "username": "player2" }
		],
		"solvedCount": 3
	}
]
```

### Graph

#### GET /graph/my-team
Get cumulative score progression for the authenticated user's team.

Auth required: yes

Success response (`200`):
```json
[
	{
		"timestamp": "2026-04-12T12:00:00.000Z",
		"score": 0,
		"points": 0
	},
	{
		"timestamp": "2026-04-12T12:30:00.000Z",
		"score": 100,
		"points": 100
	}
]
```

#### GET /graph/team/:teamId
Get cumulative score progression for a specific team.

Auth required: yes

Success response (`200`): same shape as `/graph/my-team`.

## Error Summary
- `200`: Success
- `201`: Created
- `400`: Bad request / business rule violation
- `401`: Missing or invalid auth token
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Server error
