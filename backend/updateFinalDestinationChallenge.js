const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/database');
const Challenge = require('./models/Challenge');

dotenv.config();

async function run() {
  try {
    await connectDB();

    const result = await Challenge.updateOne(
      { title: 'Final Destination' },
      {
        $set: {
          description:
            'Misc Challenge: Final warmup.\n\nA phrase is hidden in the clue below. The blank spaces (_) are not decorative - fill each one with an underscore before you start reading.\n\nThen read the first letter of every word from left to right. What you collect is the flag content - submit it inside CUHP{...}.\n\nHackers always create knowledge, even risks _ in silence\n_ around limits, working against years since _ attacks\n_ have always carried knowledge, escaping reality!',
          flag: 'CUHP{HACKER_IS_ALWAYS_A_HACKER!}'
        }
      }
    );

    console.log('Matched:', result.matchedCount || 0);
    console.log('Modified:', result.modifiedCount || 0);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
}

run();