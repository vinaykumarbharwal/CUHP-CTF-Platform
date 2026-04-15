require('dotenv').config();
const { connectDB } = require('./config/database');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const Submission = require('./models/Submission');
const createApp = require('./app');
const { ensureAdminUser } = require('./utils/adminBootstrap');
// const challengeSeedData = require('./data/challenges');

const app = createApp();

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

    await ensureAdminUser();

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
