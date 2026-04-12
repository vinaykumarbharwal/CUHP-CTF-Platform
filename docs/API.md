# CUHP CTF API Documentation

## Base URL
- Development: http://localhost:5000/api
- Production: https://cuhp-ctf-backend.onrender.com/api

## Authentication
All protected endpoints require:
Authorization: Bearer <your_jwt_token>

## Endpoints

### Authentication
POST /auth/register
POST /auth/login

### Teams
POST /teams/create
POST /teams/join
GET /teams/my/team

### Challenges
GET /challenges
GET /challenges/:id

### Submissions
POST /submit

### Leaderboard
GET /leaderboard

### Graph
GET /graph/my-team

## Error Codes
200, 201, 400, 401, 403, 404, 429, 500
