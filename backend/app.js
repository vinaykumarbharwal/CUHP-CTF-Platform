const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const graphRoutes = require('./routes/graph');
const statsRoutes = require('./routes/stats');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/submit', submissionRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/graph', graphRoutes);
  app.use('/api/stats', statsRoutes);

  return app;
}

module.exports = createApp;
