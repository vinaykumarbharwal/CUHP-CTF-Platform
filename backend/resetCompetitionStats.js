const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Submission = require('./models/Submission');
const User = require('./models/User');

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
    const beforeUsersWithTeam = await User.countDocuments({ teamId: { $ne: null } });

    const beforeTeamsWithMembers = await Team.countDocuments({ 'members.0': { $exists: true } });

    await Submission.deleteMany({});
    await Team.updateMany({}, { $set: { totalScore: 0, solvedChallenges: [], members: [] } });
    await User.updateMany({}, { $set: { teamId: null } });

    const afterSubmissions = await Submission.countDocuments();
    const afterNonZeroScoreTeams = await Team.countDocuments({ totalScore: { $gt: 0 } });
    const afterSolvedTeams = await Team.countDocuments({ 'solvedChallenges.0': { $exists: true } });
    const afterUsersWithTeam = await User.countDocuments({ teamId: { $ne: null } });
    const afterTeamsWithMembers = await Team.countDocuments({ 'members.0': { $exists: true } });

    console.log('Before submissions:', beforeSubmissions);
    console.log('Before active teams:', beforeActiveTeams);
    console.log('Before users with teamId:', beforeUsersWithTeam);
    console.log('Before teams with members:', beforeTeamsWithMembers);
    console.log('After submissions:', afterSubmissions);
    console.log('Teams with non-zero score after reset:', afterNonZeroScoreTeams);
    console.log('Teams with solved challenges after reset:', afterSolvedTeams);
    console.log('Users with teamId after reset:', afterUsersWithTeam);
    console.log('Teams with members after reset:', afterTeamsWithMembers);

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
