import express, { Request, Response } from 'express'; 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Problem from './models/problems'; 
import User from './models/User';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "";

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ Connection Error:", err));

// Route: Get All Problems
app.get('/api/problems', async (req: Request, res: Response) => {
  try {
    const problems = await Problem.find().select('-testCases');
    res.json(problems); // <--- Fixed: res.json is a function
  } catch (error) {
    res.status(500).json({ message: "Error fetching problems" });
  }
});

// Route: Get Single Problem
app.get('/api/problems/:id', async (req: Request, res: Response) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
        res.status(404).json({ message: "Problem not found" });
        return; 
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: "Error fetching problem details" });
  }
});

const PORT = process.env.PORT || 5000;
// Import the judge function
import { runVerilog } from './judge/verilogRunner'; 

// ... (your existing database/middleware code) ...

// 🚀 The Run Code Endpoint
app.post('/api/run', async (req, res) => {
  const { code, problemId } = req.body;

  if (!code || !problemId) {
    return res.status(400).json({ output: "❌ Error: Missing code or problem ID." });
  }

  try {
    // 1. Find the problem in the DB
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      return res.status(404).json({ output: "❌ Error: Problem not found." });
    }

    // 2. Get the SPECIFIC testbench for this problem
    const testbench = problem.testbench;

    // 3. Run the code
    const output = await runVerilog(code, testbench);
    res.json({ output });

  } catch (error) {
    console.error(error);
    res.status(500).json({ output: "Server Error: Could not run code." });
  }
});
app.post('/api/solve', async (req, res) => {
  const { userId, problemId } = req.body;

  if (!userId || !problemId) {
    return res.status(400).json({ error: "Missing UserID or ProblemID" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if problem is already solved to avoid duplicates
    if (!user.solvedProblems.includes(problemId)) {
      user.solvedProblems.push(problemId);
      await user.save();
    }

    res.json({ success: true, solvedCount: user.solvedProblems.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});
// GET USER PROFILE ROUTE
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find the user by ID
    // .select('-passwordHash') tells Mongo: "Give me everything EXCEPT the password"
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Return the user data
    res.json(user);

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server Error" });
  }
});
// GOOGLE LOGIN / SIGNUP ROUTE
app.post('/api/google-login', async (req, res) => {
  const { email, username } = req.body;

  try {
    // 1. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 2. If NOT, create a new user automatically
      console.log("🆕 Creating new Google user:", email);
      user = new User({
        username: username,
        email: email,
        passwordHash: "GOOGLE_AUTH_USER", // Placeholder since they don't have a password
        solvedProblems: []
      });
      await user.save();
    } else {
      console.log("👋 Google user found:", user.username);
    }

    // 3. Return the User ID (This is what the frontend needs!)
    res.json({
      success: true,
      token: "dummy-token-123", // You can implement real JWT later
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        solvedProblems: user.solvedProblems
      }
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});
// ... app.listen ...
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));