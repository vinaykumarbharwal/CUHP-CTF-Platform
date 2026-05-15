const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const Team = require('./models/Team');
const Submission = require('./models/Submission');

dotenv.config();

async function normalizeCorrectSubmissionPoints() {
  const correctSolves = await Submission.aggregate([
    {
      $match: {
        isCorrect: true,
        teamId: { $ne: null },
        challengeId: { $ne: null }
      }
    },
    {
      $lookup: {
        from: 'challenges',
        localField: 'challengeId',
        foreignField: '_id',
        as: 'challenge'
      }
    },
    {
      $unwind: '$challenge'
    },
    {
      $project: {
        _id: 1,
        points: 1,
        challengePoints: '$challenge.points'
      }
    },
    {
      $match: {
        $expr: { $ne: ['$points', '$challengePoints'] }
      }
    }
  ]);

  if (correctSolves.length === 0) {
    return 0;
  }

  const result = await Submission.bulkWrite(
    correctSolves.map((solve) => ({
      updateOne: {
        filter: { _id: solve._id },
        update: { $set: { points: solve.challengePoints || 0 } }
      }
    }))
  );

  return result.modifiedCount || 0;
}

async function reconcileTeamStatsFromSubmissions() {
  const solvedByTeam = await Submission.aggregate([
    {
      $match: {
        isCorrect: true,
        teamId: { $ne: null },
        challengeId: { $ne: null }
      }
    },
    {
      $sort: { submittedAt: 1, _id: 1 }
    },
    {
      $group: {
        _id: {
          teamId: '$teamId',
          challengeId: '$challengeId'
        },
        solvedAt: { $first: '$submittedAt' }
      }
    },
    {
      $lookup: {
        from: 'challenges',
        localField: '_id.challengeId',
        foreignField: '_id',
        as: 'challenge'
      }
    },
    {
      $unwind: '$challenge'
    },
    {
      $group: {
        _id: '$_id.teamId',
        totalScore: { $sum: '$challenge.points' },
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

  if (solvedByTeam.length === 0) {
    return 0;
  }

  const result = await Team.bulkWrite(
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

  return result.modifiedCount || result.matchedCount || 0;
}

async function dedupeCorrectSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      family: 4,
      autoIndex: false
    });

    const duplicateGroups = await Submission.aggregate([
      {
        $match: {
          isCorrect: true,
          teamId: { $ne: null },
          challengeId: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            teamId: '$teamId',
            challengeId: '$challengeId'
          },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    let totalDeleted = 0;

    for (const group of duplicateGroups) {
      const submissions = await Submission.find({
        teamId: group._id.teamId,
        challengeId: group._id.challengeId,
        isCorrect: true
      })
        .sort({ submittedAt: 1, _id: 1 })
        .select('_id submittedAt points')
        .lean();

      if (submissions.length <= 1) {
        continue;
      }

      const duplicateIds = submissions.slice(1).map((submission) => submission._id);
      const deleteResult = await Submission.deleteMany({ _id: { $in: duplicateIds } });
      totalDeleted += deleteResult.deletedCount || 0;
    }

    const normalizedSubmissions = await normalizeCorrectSubmissionPoints();
    const reconciledTeams = await reconcileTeamStatsFromSubmissions();

    const remainingDuplicates = await Submission.aggregate([
      {
        $match: {
          isCorrect: true,
          teamId: { $ne: null },
          challengeId: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            teamId: '$teamId',
            challengeId: '$challengeId'
          },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Duplicate groups found: ${duplicateGroups.length}`);
    console.log(`Duplicate submissions deleted: ${totalDeleted}`);
    console.log(`Correct submission points normalized: ${normalizedSubmissions}`);
    console.log(`Teams reconciled from cleaned submissions: ${reconciledTeams}`);
    console.log(`Remaining duplicate groups: ${remainingDuplicates.length}`);

    if (remainingDuplicates.length === 0) {
      await Submission.syncIndexes();
      await Challenge.syncIndexes();
      await Team.syncIndexes();
      console.log('Indexes synced successfully');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Dedupe failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect failures on error path
    }
    process.exit(1);
  }
}

dedupeCorrectSubmissions();
