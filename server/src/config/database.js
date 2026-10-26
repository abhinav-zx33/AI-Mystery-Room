import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (cause) {
    throw new Error('Could not connect to MongoDB. Check that MongoDB is running and MONGODB_URI is correct.', { cause });
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
