const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Submission = require('./models/Submission');

dotenv.config();

async function dedupeCorrectSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      family: 4
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
        .select('_id')
        .lean();

      if (submissions.length <= 1) {
        continue;
      }

      const duplicateIds = submissions.slice(1).map((submission) => submission._id);
      const deleteResult = await Submission.deleteMany({ _id: { $in: duplicateIds } });
      totalDeleted += deleteResult.deletedCount || 0;
    }

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
    console.log(`Remaining duplicate groups: ${remainingDuplicates.length}`);

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
