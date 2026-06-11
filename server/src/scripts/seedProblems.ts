import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from '../models/problems';
import { hardcodedProblems, STABLE_IDS } from '../data/problems';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in .env');
  process.exit(1);
}

async function seed() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected. Seeding coding problems...');

    // Clear existing problems
    await Problem.deleteMany({});
    console.log('🧹 Cleared existing problems.');

    // Map stable ObjectIds to problems
    const problemsWithIds = hardcodedProblems.map((prob, index) => ({
      ...prob,
      _id: new mongoose.Types.ObjectId(STABLE_IDS[index])
    }));

    // Insert seeded problems
    const result = await Problem.insertMany(problemsWithIds);
    console.log(`🎉 Successfully seeded ${result.length} problems!`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
