import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Problem from './models/problems';
import User from './models/User';
import Contest from './models/Contest';
import ContestParticipant from './models/ContestParticipant';
import { hardcodedProblems } from './data/problems';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "";

let dbConnected = false;

// Database Connection
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => { dbConnected = true; console.log("✅ MongoDB Connected!"); })
    .catch((err) => { dbConnected = false; console.log("❌ Connection Error (using fallback data):", err.message); });
} else {
  console.log("⚠️ No MONGO_URI set. Running with hardcoded problem data only.");
}

// Generate stable fake IDs for hardcoded problems
const hardcodedWithIds = hardcodedProblems.map((p, i) => ({
  ...p,
  _id: `hardcoded-${String(i + 1).padStart(3, '0')}`,
}));

// Route: Get All Problems
app.get('/api/problems', async (req: Request, res: Response) => {
  // If DB is not connected, serve hardcoded data instantly (no timeout wait)
  if (!dbConnected) {
    const listing = hardcodedWithIds.map(({ testbench, ...rest }) => rest);
    return res.json(listing);
  }
  try {
    const problems = await Problem.find().select('-testCases');
    if (problems.length > 0) {
      res.json(problems);
    } else {
      const listing = hardcodedWithIds.map(({ testbench, ...rest }) => rest);
      res.json(listing);
    }
  } catch (error) {
    const listing = hardcodedWithIds.map(({ testbench, ...rest }) => rest);
    res.json(listing);
  }
});

// Route: Get Single Problem
app.get('/api/problems/:id', async (req: Request, res: Response) => {
  // If DB is not connected, serve from hardcoded data instantly
  if (!dbConnected) {
    const fallback = hardcodedWithIds.find(p => p._id === req.params.id);
    if (fallback) return res.json(fallback);
    return res.status(404).json({ message: "Problem not found" });
  }
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      const fallback = hardcodedWithIds.find(p => p._id === req.params.id);
      if (fallback) { res.json(fallback); return; }
      res.status(404).json({ message: "Problem not found" });
      return;
    }
    res.json(problem);
  } catch (error) {
    const fallback = hardcodedWithIds.find(p => p._id === req.params.id);
    if (fallback) { res.json(fallback); return; }
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
    // 1. Try to find problem in DB (only if connected), fall back to hardcoded
    let problem = null;
    if (dbConnected) {
      try {
        problem = await Problem.findById(problemId);
      } catch (e) {
        // DB error — ignore, try fallback
      }
    }

    if (!problem) {
      const fallback = hardcodedWithIds.find(p => p._id === problemId);
      if (fallback) {
        problem = fallback as any;
      } else {
        return res.status(404).json({ output: "❌ Error: Problem not found." });
      }
    }

    // 2. Get the SPECIFIC testbench for this problem
    const testbench = problem.testbench;

    // 3. Run the code
    const result = await runVerilog(code, testbench);
    res.json({ output: result.output, waveformData: result.waveformData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ output: "Server Error: Could not run code.", waveformData: [] });
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
        profilePicture: user.profilePicture || '',
        solvedProblems: user.solvedProblems
      }
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// UPDATE profile picture
app.put('/api/users/:userId/profile-picture', async (req, res) => {
  const { profilePicture } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { profilePicture },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ADMIN ROUTE: Add a new Problem
app.post('/api/problems', async (req, res) => {
  const { secret, title, description, difficulty, category, templateCode, driverCode, testbench } = req.body;

  // 1. Simple Security Check
  if (secret !== "admin-123") { // 👈 You can change this password later
    return res.status(403).json({ error: "Unauthorized: Wrong Admin Key" });
  }

  try {
    // 2. Create and Save
    const newProblem = new Problem({
      title,
      description,
      difficulty,
      category,
      templateCode,
      driverCode, // The hidden Verilog that runs the test
      testbench   // The Verilog test cases
    });

    await newProblem.save();
    console.log(`✅ Admin added problem: ${title}`);
    res.json({ success: true, problem: newProblem });

  } catch (err) {
    res.status(500).json({ error: "Failed to save problem." });
  }
});

// DELETE a problem (Admin only)
app.delete('/api/problems/:id', async (req, res) => {
  const { secret } = req.body;

  if (secret !== "admin-123") {
    return res.status(403).json({ error: "Unauthorized: Wrong Admin Key" });
  }

  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    // Also delete all comments for this problem
    await Comment.deleteMany({ problemId: req.params.id });

    res.json({ success: true, message: `Deleted: ${problem.title}` });
  } catch (error) {
    console.error("Error deleting problem:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// ========== DISCUSSION / COMMENTS ROUTES ==========
import Comment from './models/Comment';

// GET all comments for a problem
app.get('/api/comments/:problemId', async (req, res) => {
  try {
    const comments = await Comment.find({ problemId: req.params.problemId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// POST a new comment (or reply)
app.post('/api/comments', async (req, res) => {
  const { problemId, userId, username, text, parentId } = req.body;

  if (!problemId || !userId || !username || !text) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newComment = new Comment({
      problemId,
      userId,
      username,
      text,
      likes: [],
      parentId: parentId || null,
    });
    await newComment.save();
    res.json(newComment);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// POST toggle like on a comment
app.post('/api/comments/:id/like', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const index = comment.likes.indexOf(userId);
    if (index === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(index, 1);
    }
    await comment.save();
    res.json(comment);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// DELETE a comment (by author or admin)
app.delete('/api/comments/:id', async (req, res) => {
  const { userId, secret } = req.body;

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Allow if the user is the author OR has admin key
    const isAuthor = userId && comment.userId === userId;
    const isAdmin = secret === "admin-123";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({ parentId: comment._id });
    await Comment.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// =========================================
// CONTEST ROUTES
// =========================================

// 1. Create Contest (Admin)
app.post('/api/contests', async (req, res) => {
  const { title, description, startTime, durationMinutes, problems, difficulty, secret } = req.body;

  if (secret !== "admin-123") return res.status(403).json({ error: "Unauthorized" });

  try {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const contest = new Contest({
      title,
      description,
      startTime: start,
      endTime: end,
      durationMinutes,
      problems,
      difficulty
    });

    await contest.save();
    res.json(contest);
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// 2. List Contests
app.get('/api/contests', async (req, res) => {
  try {
    const now = new Date();
    const contests = await Contest.find().sort({ startTime: 1 });

    // Transform for frontend
    const result = contests.map(c => {
      let status = "Upcoming";
      if (now >= c.startTime && now <= c.endTime) status = "Live";
      else if (now > c.endTime) status = "Past";

      return {
        ...c.toObject(),
        status
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 3. Get Contest Details
app.get('/api/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('problems');
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const now = new Date();

    // If upcoming, hide problems!
    if (now < contest.startTime) {
      contest.problems = [];
    }

    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 4. Join Contest (Register)
app.post('/api/contests/:id/register', async (req, res) => {
  const { userId, username } = req.body;

  try {
    // Check if already registered
    const existing = await ContestParticipant.findOne({ contestId: req.params.id, userId });
    if (existing) return res.json({ success: true, message: "Already registered" });

    const participant = new ContestParticipant({
      contestId: req.params.id,
      userId,
      username
    });

    await participant.save();

    // Add to contest participant list
    await Contest.findByIdAndUpdate(req.params.id, { $push: { participants: userId } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// 5. Submit Contest Problem
app.post('/api/contests/:id/submit', async (req, res) => {
  const { userId, problemId, passed } = req.body;
  const contestId = req.params.id;

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const now = new Date();
    if (now < contest.startTime || now > contest.endTime) {
      return res.status(400).json({ error: "Contest is not active" });
    }

    let participant = await ContestParticipant.findOne({ contestId, userId });
    if (!participant) return res.status(403).json({ error: "Not registered" });

    // Initialize problem status if not present
    if (!participant.problemStatus) participant.problemStatus = new Map();

    // Get status
    let status = participant.problemStatus.get(problemId);
    if (!status) {
      status = { solved: false, attempts: 0 };
    }

    // Update attempts
    status.attempts += 1;

    if (passed && !status.solved) {
      status.solved = true;
      status.solvedAt = now;
      participant.score += 100; // Simple scoring: 100 pts per problem
      participant.finishTime = now; // Update finish time to latest solve
    }

    // Set back to map
    participant.problemStatus.set(problemId, status);

    // Mark modified for Map
    participant.markModified('problemStatus');

    await participant.save();

    res.json({ success: true, score: participant.score });

  } catch (error) {
    console.error("Contest submit error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// ... app.listen ...
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));