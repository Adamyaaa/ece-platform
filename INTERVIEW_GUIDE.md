# ECE Platform - Complete Interview Guide

## Project Overview

**ECE Platform** is a full-stack web application that enables users to learn, practice, and compete in digital electronics/Verilog programming. It's a combination of an online judge, discussion forum, and learning management system built with modern web technologies.

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Monaco Editor
- **Backend**: Express.js + TypeScript, Node.js
- **Database**: MongoDB (with fallback hardcoded data)
- **Authentication**: Firebase (Google & GitHub SSO)
- **Code Compilation**: JDoodle API (cloud-based Verilog compiler)
- **Deployment**: 
  - Backend: Render.com
  - Frontend: Vercel

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Firebase Auth    │  Monaco Editor  │  Waveform Viz │   │
│  │  (Google/GitHub)  │  (Code Input)   │  (Canvas)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↓ Axios HTTP
┌─────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  REST API Routes:                                    │   │
│  │  • /api/problems       (Get problem bank)            │   │
│  │  • /api/run            (Compile & simulate Verilog) │   │
│  │  • /api/comments       (Discussion threads)          │   │
│  │  • /api/contests       (Competitive coding)          │   │
│  │  • /api/blogs          (User-generated content)      │   │
│  │  • /api/feed           (RSS feed aggregation)        │   │
│  │  • /api/google-login   (Firebase sync)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
      ↓              ↓                   ↓
 MongoDB        JDoodle API         RSS Feeds
(User data)   (Verilog compilation) (News aggregation)
```

---

## Interview Question Answers

### 1. How did JDoodle API integration work?

#### The Flow:
1. **User writes Verilog code** in Monaco Editor on frontend
2. **User clicks "Run"** → sends POST to `/api/run` endpoint
3. **Backend execution process**:
   ```
   verilogRunner.ts:
   a) Extract testbench for the problem
   b) Inject $monitor() statements for waveform capture
   c) Combine user code + enhanced testbench
   d) POST to JDoodle API with credentials (JDOODLE_CLIENT_ID, JDOODLE_CLIENT_SECRET)
   ```

#### JDoodle Request Format:
```typescript
await axios.post('https://api.jdoodle.com/v1/execute', {
  clientId: JDOODLE_CLIENT_ID,
  clientSecret: JDOODLE_CLIENT_SECRET,
  script: combinedScript,        // User code + testbench
  language: 'verilog',
  versionIndex: '0',
}, { timeout: 15000 });
```

#### Why JDoodle?
- **Cloud-based compilation**: Don't need Verilog tools (iverilog, VVP) locally installed
- **Scalability**: Multiple concurrent compilations without server overload
- **Reliability**: Professional service with SLA
- **Cost**: Free tier adequate for learning platform

#### Waveform Extraction:
- Inject `$monitor()` into testbench to log signals at every time step
- Output format: `#WAVE|<time>|sig1=val1,sig2=val2,...`
- Parse output to separate simulation results from waveform data
- Send both output and waveform data back to frontend

#### Error Handling:
```
Rate limiting (429)    → "Daily API quota exceeded"
Timeout (>15s)         → "Infinite loop detected"
Network errors         → Fallback message
Compilation errors     → Return JDoodle error output
```

---

### 2. Explain the architecture of the platform.

#### High-Level Components:

**A. Authentication Layer (Firebase SSO)**
- Google & GitHub login via Firebase
- User exists in two places: Firebase (authentication) + MongoDB (profile data)
- Flow: Frontend Firebase login → Backend sync to MongoDB

**B. Problem Engine**
- Problems stored in MongoDB with Verilog template code and testbench
- Fallback: Hardcoded problems if DB unavailable
- Problem ID → Look up testbench → Execute with user code

**C. Execution Pipeline**
```
User Code + Testbench → JDoodle API → Output + Waveforms → Frontend Visualization
```

**D. Discussion System (Nested Comments)**
- MongoDB schema with `parentId` field for threaded replies
- GET `/api/comments/:problemId` returns flat array (frontend builds tree)
- Likes system: Array of userIds who liked each comment

**E. Contest System**
- Problems hidden until contest starts
- User progress tracked in `ContestParticipant` collection
- Real-time scoring based on problem solves

**F. Blog & Knowledge Base**
- User-created blogs (markdown support)
- Curated articles (admin-added)
- RSS feed aggregation (IEEE Spectrum, EE Times, Hackaday, etc.)

---

### 3. What happens internally when a user compiles Verilog code?

#### Step-by-Step Execution:

**Frontend (ProblemPage.tsx)**
```typescript
1. User enters Verilog code in Monaco Editor
2. Click "Run" button or Alt+Shift+R shortcut
3. POST /api/run with { code: string, problemId: string }
4. Display "Compiling and Simulating..." spinner
```

**Backend (/api/run endpoint)**
```typescript
1. Receive userCode and problemId
2. Find problem → Get testbench from MongoDB
3. Call runVerilog(userCode, testbench)
4. Return { output: string, waveformData: string[] }
```

**Backend (verilogRunner.ts)**
```typescript
1. injectWaveformLogging(testbench):
   - Parse all "reg" and "wire" declarations
   - Build $monitor statement to log signals
   - Insert after "initial begin"
   
   Example injection:
   $monitor("#WAVE|%0t|clk=%b,reset=%b,output=%d", $time, clk, reset, output);

2. Combine scripts:
   combinedScript = userCode + "\n\n// --- Testbench ---\n" + enhancedTestbench;

3. API Request:
   POST https://api.jdoodle.com/v1/execute
   - Credentials from env vars
   - 15-second timeout
   - Async/await for response

4. Parse Response:
   - Split output into two streams:
     * Simulation results (pass/fail messages)
     * Waveform data (lines starting with #WAVE|)
   - Return both to frontend

5. Error Handling:
   - 429: Rate limit → "Daily quota exceeded"
   - Timeout: > 15s → "Infinite loop detected"  
   - Other: Return JDoodle error message
```

**Frontend (ProblemPage.tsx)**
```typescript
1. Receive response
2. Clean output (remove VCD headers, $finish messages)
3. Display in console tab
4. Parse waveform data → Send to WaveformViewer
5. Check if output contains "Passed":
   - If yes: POST /api/solve to track solved problem
   - Update user's solvedProblems array
```

#### Example Execution Flow:
```
Input: NAND gate implementation (user code)
Testbench: 4 test cases

→ Inject $monitor() for signals: a, b, output
→ Combine + send to JDoodle
→ JDoodle simulates in Verilog
→ Output:
  [Test 1] a=0, b=0 → PASS
  [Test 2] a=0, b=1 → PASS
  [Test 3] a=1, b=0 → PASS
  [Test 4] a=1, b=1 → PASS
  #WAVE|0|a=0,b=0,output=1
  #WAVE|10|a=0,b=1,output=1
  #WAVE|20|a=1,b=0,output=1
  #WAVE|30|a=1,b=1,output=0
→ Frontend parses → Display results + draw waveform
```

---

### 4. How did you track execution states?

#### State Tracking Mechanisms:

**A. User Problem Progress**
```typescript
// User model tracks solved problems
User {
  username: string,
  email: string,
  solvedProblems: ObjectId[]  // Array of problem IDs solved
}

// After successful compilation:
POST /api/solve { userId, problemId }
→ Check if already in solvedProblems
→ If not, push problemId
→ Return solvedCount for UI update
```

**B. Contest Problem Status**
```typescript
// ContestParticipant tracks per-problem attempts and solve time
ContestParticipant {
  contestId: ObjectId,
  userId: string,
  problemStatus: Map<problemId, {
    solved: boolean,
    attempts: number,
    solvedAt: Date  // When they solved it (for ranking)
  }>,
  score: number,  // Total points
  finishTime: Date // Last problem solved time (for tiebreaker)
}

// After each submission:
POST /api/contests/:id/submit { userId, problemId, passed }
→ Increment attempts
→ If passed: Set solved=true, record solvedAt, +100 points
→ Update finishTime for leaderboard ranking
```

**C. Real-time Compilation State (Frontend)**
```typescript
const [isRunning, setIsRunning] = useState(false);
const [output, setOutput] = useState("");
const [waveformData, setWaveformData] = useState<string[]>([]);
const [bottomTab, setBottomTab] = useState<'console' | 'waveform'>('console');

// State flow:
isRunning: false → User clicks Run → isRunning: true
Display "Compiling..." → Wait for response
Response received → isRunning: false
Display output in console tab
If waveformData.length > 0 → Auto-switch to waveform tab
```

**D. Comment System State**
```typescript
// Comments in problem discussion
Comment {
  problemId: ObjectId,
  userId: string,
  username: string,
  text: string,
  likes: string[],      // Array of user IDs who liked
  parentId: ObjectId | null,  // null = top-level, else = reply
  createdAt: Date       // Timestamp for "10m ago" display
}

// Frontend builds tree structure:
const topLevel = comments.filter(c => !c.parentId);
const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

// Format time: "Just now", "10m ago", "2h ago", "3d ago"
```

**E. Waveform State**
```typescript
// Raw waveform lines from backend:
[
  "#WAVE|0|clk=0,reset=1",
  "#WAVE|5|clk=1,reset=1",
  "#WAVE|10|clk=0,reset=0",
  ...
]

// Frontend parser converts to structured signals:
{
  name: "clk",
  values: [
    { time: 0, value: 0 },
    { time: 5, value: 1 },
    { time: 10, value: 0 }
  ]
}

// Canvas visualizer draws transitions
```

---

### 5. What is Firebase SSO?

#### Firebase Authentication Overview:

**Firebase** is Google's Backend-as-a-Service for authentication.

**SSO (Single Sign-On)** means users log in using existing Google/GitHub accounts instead of creating new passwords.

#### How It Works:

**Step 1: Frontend (React)**
```typescript
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";

const handleGoogleLogin = async () => {
  // Firebase popup window
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;  // { email, displayName, uid, photoURL, ... }
};
```

**Step 2: Firebase Popup**
- User clicks "Login with Google"
- Google popup appears
- User authenticates with their Google account
- Redirects back with Firebase ID token

**Step 3: Backend Sync (Critical!)**
```typescript
// Frontend sends user data to backend
POST /api/google-login {
  email: user.email,
  username: user.displayName || user.email.split('@')[0],
  googleId: user.uid
}

// Backend:
1. Check if user exists in MongoDB by email
2. If NOT: Create new user with GOOGLE_AUTH_USER as password placeholder
3. Return userId, username, profilePicture
4. Frontend stores in localStorage
```

**Step 4: localStorage Storage**
```typescript
localStorage.setItem('token', response.data.token);
localStorage.setItem('userId', response.data.user._id);  // ← Critical for profile & solved problems
localStorage.setItem('username', response.data.user.username);
localStorage.setItem('profilePicture', response.data.user.profilePicture);
```

#### Why This Architecture?

**Problem Solved:**
- Firebase handles passwords securely (OAuth 2.0)
- User doesn't need to create/remember passwords
- We leverage Google/GitHub's trusted authentication

**Integration Challenge:**
- Firebase validates authentication
- But we need MongoDB user profile for:
  - Tracking solved problems
  - User profile picture
  - Username consistency across platform
- Solution: Sync Firebase → MongoDB after login

**Supported Providers:**
```typescript
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Alternatively: GitHub OAuth
const result = await signInWithPopup(auth, githubProvider);
```

**Error Handling:**
```typescript
if (error.code === 'auth/account-exists-with-different-credential') {
  // User tried Gmail first, then GitHub with same email
  alert('Use Google instead');
}
```

---

### 6. Explain your REST API design for nested replies.

#### Problem Statement:
Traditional comment systems flatten all comments. How do we support threaded discussions with replies?

#### Solution: Parent ID Pattern

**Database Design**
```typescript
// Comment model
Comment {
  problemId: ObjectId,
  userId: string,
  username: string,
  text: string,
  likes: string[],           // Array of userIds
  parentId: ObjectId | null, // ← KEY: Links to parent comment
  createdAt: Date,
  updatedAt: Date
}

// MongoDB Index for efficient queries
db.comments.createIndex({ problemId: 1 });
db.comments.createIndex({ parentId: 1 });
```

**API Endpoints**

**GET /api/comments/:problemId**
```typescript
// Fetch ALL comments for a problem (frontend builds tree)
Returns: [
  {
    _id: "123",
    text: "How to fix this?",
    parentId: null,  // ← Top-level comment
    likes: ["user1", "user2"],
    createdAt: "2025-05-20T10:00:00Z"
  },
  {
    _id: "456",
    text: "Try adding a reset signal",
    parentId: "123",  // ← REPLY to comment "123"
    likes: ["user1"],
    createdAt: "2025-05-20T10:05:00Z"
  },
  {
    _id: "789",
    text: "That fixed it!",
    parentId: "456",  // ← NESTED REPLY (reply to a reply)
    likes: [],
    createdAt: "2025-05-20T10:10:00Z"
  }
]

// Query: db.comments.find({ problemId })
// Simple flat query - frontend responsibility to build tree
```

**POST /api/comments**
```typescript
// Create a top-level comment or a reply

// Top-level comment:
{
  problemId: "prob123",
  userId: "user1",
  username: "alice",
  text: "How do I implement this?",
  parentId: null  // ← Top-level
}

// Reply:
{
  problemId: "prob123",
  userId: "user2",
  username: "bob",
  text: "Use a state machine",
  parentId: "comment456"  // ← Links to parent comment
}

// Both use same endpoint, parentId differentiates
```

**Frontend Tree Building**
```typescript
// Receive flat array from API
const comments = [
  { _id: "1", text: "Q1", parentId: null },
  { _id: "2", text: "A1", parentId: "1" },
  { _id: "3", text: "Follow-up", parentId: "2" },
  { _id: "4", text: "Q2", parentId: null }
];

// Build tree structure:
const topLevel = comments.filter(c => !c.parentId);    // [1, 4]
const getReplies = (id) => comments.filter(c => c.parentId === id);

// Render:
<Comment comment={comments[0]}>                    // Q1
  <Comment comment={comments[1]}>                  // ├─ A1
    <Comment comment={comments[2]} />              // │  └─ Follow-up
  </Comment>
</Comment>
<Comment comment={comments[3]} />                  // Q2
```

**Liking a Comment**
```typescript
POST /api/comments/:id/like { userId }

// Backend:
1. Find comment by ID
2. If userId in comment.likes → remove (unlike)
3. If userId not in likes → add (like)
4. Save and return updated comment

comment.likes = ["user1"]
// User "user1" likes again?
if (comment.likes.indexOf("user1") !== -1) {
  comment.likes.splice(index, 1);  // Remove = unlike
}
```

**Deleting a Comment**
```typescript
DELETE /api/comments/:id { userId, secret }

// Authorization:
isAuthor = (userId === comment.userId)
isAdmin = (secret === "admin-123")
if (!isAuthor && !isAdmin) return 403;

// Delete cascade:
await Comment.deleteMany({ parentId: id });  // Delete all replies
await Comment.findByIdAndDelete(id);         // Delete the comment
```

**Advantages of This Design:**
| Aspect | Benefit |
|--------|---------|
| **Simple DB** | Just a parentId field, no complex structures |
| **Flexible nesting** | Unlimited reply depth |
| **Query efficient** | Single index on parentId |
| **Frontend freedom** | Client decides tree layout |
| **Scalable** | Easy to paginate comments later |

**Disadvantage:**
- Frontend must assemble tree (O(n) complexity)
- For 10k comments, might be slow on first load
- Future optimization: Return paginated top-level only, lazy-load replies

---

### 7. How would you optimize the discussion forum for scale?

#### Current State (Vulnerable):
```typescript
// Current: Fetch ALL comments for a problem
GET /api/comments/:problemId
→ db.comments.find({ problemId })
// Problem: If 100k comments on popular problem → 100k MongoDB docs loaded
```

#### Optimization Strategy:

**A. Pagination (Quick Win)**
```typescript
// Before:
GET /api/comments/:problemId
Returns all comments

// After:
GET /api/comments/:problemId?page=1&limit=20
Returns top-level comments only, 20 per page

// Implementation:
const { page = 1, limit = 20 } = req.query;
const skip = (page - 1) * limit;
const comments = await Comment
  .find({ problemId, parentId: null })  // Only top-level
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .exec();

// Lazy-load replies when user expands:
GET /api/comments/:parentId/replies?limit=5
```

**B. Database Indexing**
```typescript
// Composite index for efficient queries
db.comments.createIndex({ 
  problemId: 1, 
  parentId: 1,
  createdAt: -1 
});

// Separate index for likes (if you query by "most liked"):
db.comments.createIndex({ likes: 1 });

// These speeds up:
// 1. Find top-level comments for problem
// 2. Find replies to a comment
// 3. Sort by date
```

**C. Caching Layer**
```typescript
// Cache popular comments in Redis/Memory
const commentCache = new Map();  // problemId → { comments, expiry }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

GET /api/comments/:problemId
→ Check cache (fast)
→ If fresh, return cached
→ If expired, query DB and cache again

// Update strategy:
POST /api/comments (new comment)
→ Save to DB
→ Invalidate cache for this problemId
→ Return new comment to client
```

**D. Denormalization**
```typescript
// Current schema: problemId, userId, text, parentId, likes[]
// Add this field:
Comment {
  ...,
  replyCount: number,      // How many direct replies?
  likeCount: number,        // Cache instead of likes.length
  lastActivity: Date        // For "sort by newest activity"
}

// Update on every like/reply:
if (liked) {
  comment.likeCount++;
  comment.lastActivity = now;
}

// Benefit: No need to count array length on every read
```

**E. Full-Text Search**
```typescript
// Problem: Search for keywords in comments
// Solution: MongoDB full-text index

db.comments.createIndex({ text: "text" });

// Query:
GET /api/comments/:problemId/search?q="state machine"
db.comments.find(
  { problemId, $text: { $search: "state machine" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

**F. Read Replicas (MongoDB)**
```
// Distribute load:
Primary (write) ← POST /api/comments
Read Replicas (read)  ← GET /api/comments
                       ← GET /api/comments/:id/replies
                       ← Search queries

// Connection routing:
Write: mongodb+srv://primary.cluster.mongodb.net
Read: mongodb+srv://replica.cluster.mongodb.net
```

**G. Rate Limiting**
```typescript
// Prevent spam
import rateLimit from 'express-rate-limit';

const commentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 5                     // 5 comments per minute per user
});

app.post('/api/comments', commentLimiter, async (req, res) => {
  // ...
});
```

**H. UI Optimization**
```typescript
// Frontend: Virtual scrolling (only render visible comments)
// Library: react-window or react-virtual

// Instead of rendering 1000 comments:
// Render only visible 20 → huge performance gain
```

**Scaling Roadmap:**
```
1k comments    → Status quo works
10k comments   → Add pagination + indexing
100k comments  → Add caching + denormalization
1M comments    → Add read replicas + full-text search
```

---

### 8. How did you deploy the app?

#### Deployment Architecture:

```
┌──────────────────────┐         ┌──────────────────────┐
│   FRONTEND (Vercel)  │         │  BACKEND (Render)    │
│ ┌──────────────────┐ │         │ ┌──────────────────┐ │
│ │  React SPA       │ │         │ │  Express Server  │ │
│ │  Vite build      │ │         │ │  Node.js         │ │
│ │  Tailwind CSS    │ │         │ │  MongoDB driver  │ │
│ └──────────────────┘ │         │ └──────────────────┘ │
│                      │         │                      │
│  vercel.json config  │         │  render.yaml config  │
└──────────────────────┘         └──────────────────────┘
          ↓                               ↓
  DNS: client.com              DNS: api.eceplat.com
  HTTPS + CDN                  Auto HTTPS
```

#### Frontend Deployment (Vercel)

**Why Vercel?**
- Optimized for React/Next.js (but supports any SPA)
- Automatic CI/CD from GitHub
- Edge network for fast global delivery
- Free tier sufficient for learning platform

**Configuration: vercel.json**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
**Purpose:** Single-Page App routing - all routes return index.html, React Router handles client-side navigation

**Build Process:**
```bash
# Vercel automatically:
1. npm install                    # Install dependencies
2. npm run build                  # Vite builds to /dist
3. Serve /dist on edge network
```

**Frontend Build Command:**
```json
"scripts": {
  "build": "vite build"  // Vite creates optimized bundle
}
```

**Environment Variables (set in Vercel dashboard):**
```
VITE_API_URL=https://api.eceplat.com  // Injected at build time
```

#### Backend Deployment (Render.com)

**Why Render?**
- Free tier for learning projects
- Automatic git deployment
- Environment variables management
- PostgreSQL/MongoDB support

**Configuration: render.yaml**
```yaml
services:
  - type: web                    # Web service type
    name: ece-platform-backend
    env: node                     # Node.js runtime
    rootDir: server               # Working directory
    buildCommand: npm run render-build
    startCommand: npm start
    envVars:
      - key: MONGO_URI           # Set in Render dashboard
        sync: false
      - key: JDOODLE_CLIENT_ID
        sync: false
      - key: JDOODLE_CLIENT_SECRET
        sync: false
      - key: CORS_ORIGIN
        value: '*'
```

**Build Process:**
```bash
# Render automatically:
1. npm run render-build        # npm install + npm run build (tsc)
2. npm start                   # node dist/index.js
```

**Backend Build Script:**
```json
"scripts": {
  "build": "tsc",                           // TypeScript → JavaScript
  "start": "node dist/index.js",            // Run compiled JS
  "render-build": "npm install && npm run build"
}
```

#### Database Setup (MongoDB Atlas)

**Configuration:**
```
MongoDB Atlas (Cloud)
  ├─ Project: ECE Platform
  ├─ Cluster: M0 (free tier, 512MB)
  ├─ Database: ece_platform
  └─ Collections: problems, users, comments, contests, etc.
```

**Connection String (in .env):**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ece_platform?retryWrites=true&w=majority
```

**Fallback Mechanism:**
```typescript
if (!MONGO_URI) {
  console.log("Using hardcoded problem data");
  // Serve hardcoded problems without DB
}
```

#### Environment Variables

**Backend (.env file)**
```bash
MONGO_URI=mongodb+srv://...
PORT=5000
CORS_ORIGIN=https://client.vercel.app
JDOODLE_CLIENT_ID=xxxx
JDOODLE_CLIENT_SECRET=xxxx
```

**Frontend (build-time injection)**
```bash
VITE_API_URL=https://api.eceplat.com
```

#### CI/CD Pipeline

**Automatic Deployment:**
```
1. Push to GitHub (main branch)
   ↓
2. Vercel/Render webhooks trigger
   ↓
3. Build commands run
   ↓
4. Tests (if configured)
   ↓
5. Deploy to production
   ↓
6. Live update (no downtime)
```

#### Domain Setup

**Frontend:**
- Vercel auto-generates: `project-name.vercel.app`
- Custom domain: Add CNAME to DNS

**Backend:**
- Render auto-generates: `service-name.onrender.com`
- Point API_URL to this in frontend config

**CORS Configuration:**
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',  // Allow frontend origin
  credentials: true
}));
```

#### Monitoring & Debugging

**Vercel Logs:**
```
Dashboard → Deployments → View Logs
Shows: Build errors, console.log outputs
```

**Render Logs:**
```
Dashboard → Service → Logs
Shows: Server startup, request logs, errors
```

**Real-time Debugging:**
```typescript
// In backend:
console.log("🔥 Firebase Success:", user.email);
console.log("❌ Connection Error:", err.message);

// Appears in Render logs immediately
```

#### Deployment Checklist

- [ ] Frontend: `npm run build` succeeds locally
- [ ] Backend: `npm run build` compiles TypeScript without errors
- [ ] Set env vars in Vercel dashboard
- [ ] Set env vars in Render.com dashboard
- [ ] Test frontend → backend API calls
- [ ] Test Firebase authentication
- [ ] Test JDoodle API integration
- [ ] Verify MongoDB connection from server
- [ ] Test file uploads (if applicable)
- [ ] Monitor first 24h for errors

---

## Additional Technical Details

### Problem Bank Structure

```typescript
Problem {
  _id: ObjectId,
  title: string,
  description: string,
  difficulty: "Easy" | "Medium" | "Hard",
  category: string,
  templateCode: string,       // Initial code for user
  testbench: string,          // Verilog testbench with test cases
  createdAt: Date
}

// Example:
{
  title: "4-to-1 Multiplexer",
  description: "Implement a 4-to-1 multiplexer using Verilog",
  templateCode: `module mux4to1(
    input [3:0] data,
    input [1:0] sel,
    output y
  );
    // TODO: implement
  endmodule`,
  testbench: `initial begin
    // Test case 1
    data = 4'b1010; sel = 2'b00; #10;
    assert(y == 1) else $error("Test 1 failed");
    // ...
  end`
}
```

### Authentication Flow Diagram

```
User clicks "Login with Google"
         ↓
Firebase popup (Google login)
         ↓
User authenticates at Google servers
         ↓
Firebase returns: { email, displayName, uid, ... }
         ↓
Frontend: POST /api/google-login { email, displayName, uid }
         ↓
Backend: 
  ├─ Search MongoDB for user with this email
  ├─ If exists: Return existing user ID
  ├─ If NOT exists: Create new user in MongoDB
  └─ Return { token, user { _id, username, email, ... } }
         ↓
Frontend: Store userId in localStorage
         ↓
All future requests include userId for profile tracking
```

### Execution Timeline Example

```
T=0ms:    User clicks "Run"
T=10ms:   POST /api/run sent to backend
T=50ms:   Backend prepares combined script
T=60ms:   Backend POSTs to JDoodle API
T=200ms:  JDoodle compiles Verilog
T=300ms:  JDoodle simulates (runs testbench)
T=500ms:  JDoodle returns output + waveform data
T=510ms:  Backend parses and returns to frontend
T=520ms:  Frontend renders output in console
T=525ms:  Frontend draws waveform on canvas
T=530ms:  User sees results
```

---

## Key Takeaways for Interview

1. **Full-stack integration**: Frontend (React) → Backend (Express) → JDoodle (cloud compiler) → MongoDB
2. **Authentication**: Firebase SSO with MongoDB sync for profile persistence
3. **Discussion system**: Clever use of `parentId` field for nested threads without complex nested documents
4. **Scalability thinking**: Problem → Paginated comments, caching, indexing, read replicas
5. **Real-time execution tracking**: Waveform capture via `$monitor()`, signal parsing, canvas visualization
6. **Deployment**: Modern practices (CI/CD, environment variables, fallback mechanisms)

---

## Quick Reference: Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/problems` | GET | List all problems |
| `/api/problems/:id` | GET | Get problem details |
| `/api/run` | POST | Compile and simulate Verilog |
| `/api/solve` | POST | Mark problem as solved |
| `/api/comments/:problemId` | GET | Get all comments for problem |
| `/api/comments` | POST | Post new comment or reply |
| `/api/comments/:id/like` | POST | Toggle like |
| `/api/comments/:id` | DELETE | Delete comment (cascade) |
| `/api/contests` | GET | List contests |
| `/api/contests/:id/register` | POST | Join contest |
| `/api/contests/:id/submit` | POST | Submit solution |
| `/api/blogs` | GET | List blogs |
| `/api/blogs` | POST | Create blog |
| `/api/feed` | GET | Get RSS feed articles |
| `/api/google-login` | POST | Firebase sync |

