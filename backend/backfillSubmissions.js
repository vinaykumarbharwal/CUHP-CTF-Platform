const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/database');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const Submission = require('./models/Submission');

dotenv.config();

async function backfillSubmissions() {
  let created = 0;
  let skippedExisting = 0;
  let missingChallengeRef = 0;

  const teams = await Team.find({}, '_id members solvedChallenges').lean();

  for (const team of teams) {
    for (const solved of team.solvedChallenges || []) {
      const challengeId = solved?.challengeId;
      if (!challengeId) {
        continue;
      }

      const alreadyExists = await Submission.exists({
        teamId: team._id,
        challengeId,
        isCorrect: true
      });

      if (alreadyExists) {
        skippedExisting += 1;
        continue;
      }

      const challenge = await Challenge.findById(challengeId, 'points').lean();
      if (!challenge) {
        missingChallengeRef += 1;
        continue;
      }

      await Submission.create({
        teamId: team._id,
        submittedBy: team.members?.[0] || null,
        challengeId,
        points: challenge.points || 0,
        isCorrect: true,
        submittedAt: solved.solvedAt || new Date()
      });

      created += 1;
    }
  }

  const totals = await Submission.aggregate([
    { $match: { isCorrect: true } },
    {
      $group: {
        _id: '$teamId',
        totalScore: { $sum: '$points' }
      }
    }
  ]);

  const totalScoreByTeam = totals.reduce((acc, row) => {
    acc[String(row._id)] = row.totalScore || 0;
    return acc;
  }, {});

  for (const team of teams) {
    await Team.updateOne(
      { _id: team._id },
      { $set: { totalScore: totalScoreByTeam[String(team._id)] || 0 } }
    );
  }

  const finalSubmissionsCount = await Submission.countDocuments();

  return {
    teams: teams.length,
    created,
    skippedExisting,
    missingChallengeRef,
    finalSubmissionsCount
  };
}

async function run() {
  try {
    await connectDB();
    const result = await backfillSubmissions();
    console.log('Backfill complete');
    console.log(`Teams scanned: ${result.teams}`);
    console.log(`Created submissions: ${result.created}`);
    console.log(`Skipped existing: ${result.skippedExisting}`);
    console.log(`Missing challenge refs: ${result.missingChallengeRef}`);
    console.log(`Final submissions count: ${result.finalSubmissionsCount}`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
}

run();
