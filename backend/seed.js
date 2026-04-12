const dotenv = require('dotenv');
const Challenge = require('./models/Challenge');
const { connectDB, disconnectDB } = require('./config/database');
const challenges = require('./data/challenges');

dotenv.config();

async function seed() {
  try {
    await connectDB();
    await Challenge.deleteMany({});
    await Challenge.insertMany(challenges);
    console.log('Database seeded successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    await disconnectDB();
    process.exit(1);
  }
}

seed();
