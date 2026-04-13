const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Challenge = require('./models/Challenge');
const Submission = require('./models/Submission');

dotenv.config();

async function backfillSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      family: 4
    });

    const teams = await Team.find({}, '_id members solvedChallenges totalScore').lean();

    let created = 0;
    let skippedExisting = 0;
    let missingChallengeRefs = 0;

    for (const team of teams) {
      for (const solved of team.solvedChallenges || []) {
        const challengeId = solved.challengeId;
        if (!challengeId) {
          continue;
        }

        const exists = await Submission.exists({
          teamId: team._id,
          challengeId,
          isCorrect: true
        });

        if (exists) {
          skippedExisting += 1;
          continue;
        }

        const challenge = await Challenge.findById(challengeId, 'points').lean();
        if (!challenge) {
          missingChallengeRefs += 1;
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
          total: { $sum: '$points' }
        }
      }
    ]);

    const totalMap = totals.reduce((acc, item) => {
      acc[String(item._id)] = item.total || 0;
      return acc;
    }, {});

    for (const team of teams) {
      await Team.updateOne(
        { _id: team._id },
        { $set: { totalScore: totalMap[String(team._id)] || 0 } }
      );
    }

    const finalCount = await Submission.countDocuments();

    console.log(`Backfill created: ${created}`);
    console.log(`Skipped existing: ${skippedExisting}`);
    console.log(`Missing challenge refs: ${missingChallengeRefs}`);
    console.log(`Final submissions: ${finalCount}`);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

backfillSubmissions();
