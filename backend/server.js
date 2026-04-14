const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const Challenge = require('./models/Challenge');
// const challengeSeedData = require('./data/challenges');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const writeApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many write requests from this IP. Please try again later.' },
  keyGenerator: (req) => `${req.ip}:${req.baseUrl}${req.path}`,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', writeApiLimiter);

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const graphRoutes = require('./routes/graph');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/submit', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/stats', statsRoutes);

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    const { mode } = await connectDB();
    console.log(`Database mode: ${mode}`);

    const challengeCount = await Challenge.countDocuments();
    if (challengeCount === 0) {
      await Challenge.insertMany(challengeSeedData);
      console.log('Default challenges inserted');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
