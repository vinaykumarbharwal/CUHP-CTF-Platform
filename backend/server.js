const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const Submission = require('./models/Submission');
// const challengeSeedData = require('./data/challenges');

dotenv.config();

const app = express();

// Hosted platforms sit behind reverse proxies; trust the first proxy for correct client IP handling.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

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

async function reconcileTeamStatsFromSubmissions() {
  // Always normalize persisted team score fields from source-of-truth submissions.
  const solvedByTeam = await Submission.aggregate([
    {
      $match: {
        isCorrect: true,
        teamId: { $ne: null },
        challengeId: { $ne: null }
      }
    },
    {
      $sort: { submittedAt: 1 }
    },
    {
      $group: {
        _id: {
          teamId: '$teamId',
          challengeId: '$challengeId'
        },
        solvedAt: { $first: '$submittedAt' },
        points: { $first: '$points' }
      }
    },
    {
      $group: {
        _id: '$_id.teamId',
        totalScore: { $sum: '$points' },
        solvedChallenges: {
          $push: {
            challengeId: '$_id.challengeId',
            solvedAt: '$solvedAt'
          }
        }
      }
    }
  ]);

  await Team.updateMany({}, { $set: { totalScore: 0, solvedChallenges: [] } });

  if (solvedByTeam.length > 0) {
    await Team.bulkWrite(
      solvedByTeam.map((row) => ({
        updateOne: {
          filter: { _id: row._id },
          update: {
            $set: {
              totalScore: row.totalScore || 0,
              solvedChallenges: row.solvedChallenges || []
            }
          }
        }
      }))
    );
  }
}

async function startServer() {
  try {
    const { mode } = await connectDB();
    console.log(`Database mode: ${mode}`);

    await reconcileTeamStatsFromSubmissions();
    console.log('Team scores reconciled from submissions');

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
