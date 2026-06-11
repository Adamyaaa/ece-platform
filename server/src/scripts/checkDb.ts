import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Problem from '../models/problems';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function check() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({});
  console.log("USERS:", JSON.stringify(users, null, 2));

  const problems = await Problem.find({});
  console.log("PROBLEMS COUNT:", problems.length);
  if (problems.length > 0) {
    console.log("FIRST PROBLEM ID:", problems[0]._id, typeof problems[0]._id);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
