const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const Challenge = require('./models/Challenge');
const User = require('./models/User');
const Team = require('./models/Team');
const challengeSeedData = require('./data/challenges');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const graphRoutes = require('./routes/graph');

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/submit', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/graph', graphRoutes);

const PORT = process.env.PORT || 5000;

async function seedDemoUserAndTeamIfNeeded() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return;
  }

  const demoUser = new User({
    username: 'demo',
    email: 'demo@cuhp.local',
    password: 'Password123!'
  });

  await demoUser.save();

  const demoTeam = new Team({
    name: 'Demo Team',
    inviteCode: 'CUHPDEMO',
    members: [demoUser._id]
  });

  await demoTeam.save();

  demoUser.teamId = demoTeam._id;
  await demoUser.save();

  console.log('Default demo user/team inserted');
  console.log('Demo login: demo@cuhp.local / Password123!');
  console.log('Demo team invite code: CUHPDEMO');
}

async function startServer() {
  try {
    const { mode } = await connectDB();
    console.log(`Database mode: ${mode}`);

    await seedDemoUserAndTeamIfNeeded();

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
