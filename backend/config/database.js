const mongoose = require('mongoose');
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required and must point to MongoDB Atlas');
  }

  const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return { conn, mode: 'atlas' };
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
