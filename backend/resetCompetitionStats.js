const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Submission = require('./models/Submission');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      family: 4
    });

    const beforeSubmissions = await Submission.countDocuments();
    const beforeActiveTeams = await Team.countDocuments({
      $or: [
        { totalScore: { $gt: 0 } },
        { 'solvedChallenges.0': { $exists: true } }
      ]
    });

    await Submission.deleteMany({});
    await Team.updateMany({}, { $set: { totalScore: 0, solvedChallenges: [] } });

    const afterSubmissions = await Submission.countDocuments();
    const afterNonZeroScoreTeams = await Team.countDocuments({ totalScore: { $gt: 0 } });
    const afterSolvedTeams = await Team.countDocuments({ 'solvedChallenges.0': { $exists: true } });

    console.log('Before submissions:', beforeSubmissions);
    console.log('Before active teams:', beforeActiveTeams);
    console.log('After submissions:', afterSubmissions);
    console.log('Teams with non-zero score after reset:', afterNonZeroScoreTeams);
    console.log('Teams with solved challenges after reset:', afterSolvedTeams);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect failures on error path
    }
    process.exit(1);
  }
}

run();
