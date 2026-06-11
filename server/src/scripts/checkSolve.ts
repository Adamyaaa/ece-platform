import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Problem from '../models/problems';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function testSolve() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email: 'jainadamya13@gmail.com' });
  const problem = await Problem.findOne({});

  if (!user || !problem) {
    console.log("User or Problem not found!");
    process.exit(1);
  }

  const problemIdStr = problem._id.toString();
  console.log("Testing includes check with string:", problemIdStr);
  console.log("solvedProblems array contents:", user.solvedProblems);
  
  // Test Mongoose includes
  try {
    const included = user.solvedProblems.includes(problemIdStr as any);
    console.log("Does user.solvedProblems.includes(problemIdStr) return true?", included);

    if (!included) {
      user.solvedProblems.push(problemIdStr as any);
      console.log("Pushed to array. Array is now:", user.solvedProblems);
      await user.save();
      console.log("Saved successfully!");
    } else {
      console.log("Already solved, not pushing.");
    }
  } catch (error) {
    console.error("Error encountered:", error);
  }

  await mongoose.disconnect();
}

testSolve().catch(console.error);
