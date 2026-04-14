const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const Team = require('./models/Team');
const User = require('./models/User');
require('dotenv').config();

async function cleanup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Delete all submissions
    const submissionResult = await Submission.deleteMany({});
    console.log(`✓ Deleted ${submissionResult.deletedCount} submissions`);

    // Reset all teams - clear solved challenges and scores
    const teamUpdateResult = await Team.updateMany(
      {},
      {
        $set: {
          solvedChallenges: [],
          teamSubmissionStats: {
            successfulSubmissions: 0,
            failedSubmissions: 0,
          },
          totalScore: 0,
        },
      }
    );
    console.log(`✓ Reset ${teamUpdateResult.modifiedCount} teams`);

    // Reset all users - clear solved challenges and points
    const userUpdateResult = await User.updateMany(
      {},
      {
        $set: {
          points: 0,
          solvedChallenges: [],
        },
      }
    );
    console.log(`✓ Reset ${userUpdateResult.modifiedCount} users`);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('Ready to run: npm run seed\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
