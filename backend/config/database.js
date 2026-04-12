const mongoose = require('mongoose');

const DEFAULT_LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/cuhp_ctf';

function getMongooseOptions() {
  return {
    serverSelectionTimeoutMS: 8000,
    family: 4
  };
}

function shouldFallbackToLocal() {
  if (process.env.ALLOW_LOCAL_MONGO_FALLBACK === 'true') {
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}

async function connectWithUri(uri, mode) {
  const conn = await mongoose.connect(uri, getMongooseOptions());
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return { conn, mode };
}

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const localMongoUri = process.env.MONGODB_LOCAL_URI || DEFAULT_LOCAL_MONGO_URI;

  if (!mongoUri) {
    if (!shouldFallbackToLocal()) {
      throw new Error('MONGODB_URI is required in production');
    }

    console.warn('MONGODB_URI not set. Falling back to local MongoDB URI.');
    try {
      return await connectWithUri(localMongoUri, 'local');
    } catch (localError) {
      throw new Error(`Local MongoDB fallback failed (${localMongoUri}). Start MongoDB locally or set MONGODB_URI. Original error: ${localError.message}`);
    }
  }

  try {
    return await connectWithUri(mongoUri, 'atlas');
  } catch (error) {
    if (!shouldFallbackToLocal()) {
      throw error;
    }

    console.warn('Atlas connection failed. Falling back to local MongoDB URI.');
    console.warn(`Atlas error: ${error.message}`);
    try {
      return await connectWithUri(localMongoUri, 'local');
    } catch (localError) {
      throw new Error(`Atlas and local MongoDB connections failed. Atlas error: ${error.message}. Local error: ${localError.message}`);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
