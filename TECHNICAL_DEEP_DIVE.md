# ECE Platform - Technical Deep Dive

## Table of Contents
1. JDoodle Integration Deep Dive
2. Waveform Data Flow
3. Comment Threading Implementation
4. Firebase SSO Integration
5. Contest Execution System
6. Performance Optimization Strategies
7. Error Handling Patterns

---

## 1. JDoodle Integration Deep Dive

### What is JDoodle?
JDoodle is a cloud-based code execution platform that supports 60+ languages including Verilog.

**Endpoint:** `https://api.jdoodle.com/v1/execute`

### Request Flow

**Step 1: Code Preparation (Backend)**
```typescript
// From /api/run endpoint
const { code, problemId } = req.body;

// Fetch the problem's testbench
const problem = await Problem.findById(problemId);
const testbench = problem.testbench;

// Pass to verilogRunner
const result = await runVerilog(code, testbench);
```

**Step 2: Waveform Injection**
```typescript
function injectWaveformLogging(testbench: string): string {
  // Extract all signal declarations using regex
  const declRegex = /\b(reg|wire)\s+(\[\d+:\d+\])?\s*([^;]+);/g;
  
  const signals: { name: string; isBus: boolean; width: string }[] = [];
  let match;
  
  while ((match = declRegex.exec(testbench)) !== null) {
    const busWidth = match[2] || '';              // e.g., "[3:0]"
    const isBus = !!match[2];                     // true if bus
    const names = match[3].split(',').map(n => n.trim());
    
    for (const name of names) {
      if (/^[a-zA-Z_]\w*$/.test(name)) {         // Valid identifier?
        signals.push({ name, isBus, width: busWidth });
      }
    }
  }
  
  // Build $monitor statement
  // Format: #WAVE|<time>|sig1=val1,sig2=val2,...
  const formatParts = signals.map(
    s => `${s.name}=${s.isBus ? '%d' : '%b'}`    // %d for bus, %b for bit
  );
  const formatStr = `"#WAVE|%0t|${formatParts.join(',')}"`;
  const args = ['$time', ...signals.map(s => s.name)].join(', ');
  const monitorLine = `$monitor(${formatStr}, ${args});`;
  
  // Insert right after "initial begin"
  const insertPoint = testbench.search(/initial\s+begin/i);
  const beginMatch = testbench.match(/initial\s+begin/i);
  const afterBegin = insertPoint + beginMatch[0].length;
  
  return testbench.slice(0, afterBegin) + '\n      ' + monitorLine + testbench.slice(afterBegin);
}

// Example transformation:
// INPUT:
// initial begin
//   x = 2'b00;
// end

// OUTPUT:
// initial begin
//   $monitor("#WAVE|%0t|x=%b,y=%b", $time, x, y);
//   x = 2'b00;
// end
```

**Step 3: Script Combination**
```typescript
const combinedScript = `${userCode}\n\n// --- Testbench ---\n${enhancedTestbench}`;

// Example combined script:
/*
module mux4to1(input [3:0] data, input [1:0] sel, output y);
  assign y = data[sel];
endmodule

// --- Testbench ---
module testbench;
  reg [3:0] data;
  reg [1:0] sel;
  wire y;
  
  mux4to1 dut(data, sel, y);
  
  initial begin
    $monitor("#WAVE|%0t|data=%d,sel=%b,y=%b", $time, data, sel, y);
    data = 4'b1010; sel = 2'b00; #10;
    if (y !== 1) $error("Failed");
  end
endmodule
*/
```

**Step 4: JDoodle API Request**
```typescript
const response = await axios.post(
  'https://api.jdoodle.com/v1/execute',
  {
    clientId: process.env.JDOODLE_CLIENT_ID,        // API credentials
    clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    script: combinedScript,
    language: 'verilog',                            // Must be exact
    versionIndex: '0',                              // Verilog version
  },
  { timeout: 15000 }                                // 15 second timeout
);
```

**Step 5: Response Parsing**
```typescript
const { output, statusCode } = response.data;

// Example output from JDoodle:
/*
VCD info: dumpfile "dump.vcd" opened for writing.
#WAVE|0|data=10,sel=0,y=0
#WAVE|10|data=10,sel=0,y=1
[Test 1] a=0, b=0 → PASS
[Test 2] a=0, b=1 → PASS
$finish called at 100
*/

if (statusCode === 200) {
  return splitOutput(output);
} else {
  // statusCode 429: Rate limit
  // statusCode 500: Compilation error
  // etc.
}
```

**Step 6: Output Splitting**
```typescript
function splitOutput(raw: string): RunResult {
  const lines = raw.split('\n');
  const waveformData: string[] = [];
  const outputLines: string[] = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('#WAVE|')) {
      waveformData.push(line.trim());  // Separate waveform lines
    } else {
      outputLines.push(line);           // Keep test results
    }
  }
  
  return {
    output: outputLines.join('\n'),
    waveformData
  };
}
```

### Error Handling Strategy

```typescript
try {
  const response = await axios.post(JDOODLE_API_URL, {...}, {timeout: 15000});
} catch (error: any) {
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 429) {
      // Rate limiting: Daily quota exceeded
      return {
        output: '❌ Rate Limit: Daily API quota exceeded. Try again tomorrow.',
        waveformData: []
      };
    } else if (status >= 500) {
      // Server error
      return {
        output: `❌ API Error (${status}): ${data?.error}`,
        waveformData: []
      };
    }
  } else if (error.code === 'ECONNABORTED') {
    // Timeout: Simulation took >15s
    return {
      output: '❌ Timeout: Simulation took too long (>15s). Check for infinite loops.',
      waveformData: []
    };
  } else if (error.code === 'ECONNREFUSED') {
    // Network unreachable
    return {
      output: '❌ Network Error: Could not reach compilation server.',
      waveformData: []
    };
  }
}
```

---

## 2. Waveform Data Flow

### Data Format

**Raw Format from Backend:**
```
#WAVE|0|clk=0,reset=1,output=0
#WAVE|5|clk=1,reset=1,output=0
#WAVE|10|clk=0,reset=0,output=1
#WAVE|15|clk=1,reset=0,output=1
```

**Time:** Simulation time (nanoseconds typically)
**Signals:** signal_name=value pairs

### Frontend Parsing

```typescript
// WaveformViewer.tsx
function parseWaveformData(lines: string[]): WaveformSignal[] {
  const signalMap = new Map<string, { time: number; value: number }[]>();
  const signalOrder: string[] = [];
  
  for (const line of lines) {
    // Format: #WAVE|<time>|sig1=val1,sig2=val2,...
    const parts = line.replace('#WAVE|', '').split('|');
    if (parts.length < 2) continue;
    
    const time = parseInt(parts[0], 10);
    if (isNaN(time)) continue;
    
    // Parse signal=value pairs
    const pairs = parts[1].split(',');
    for (const pair of pairs) {
      const [name, valStr] = pair.split('=');
      if (!name || valStr === undefined) continue;
      
      const value = parseInt(valStr.trim(), 10);
      if (isNaN(value)) continue;
      
      // Initialize if first time seeing this signal
      if (!signalMap.has(name)) {
        signalMap.set(name, []);
        signalOrder.push(name);  // Maintain order
      }
      
      signalMap.get(name)!.push({ time, value });
    }
  }
  
  // Deduplicate: only keep entries where value changes
  return signalOrder.map(name => {
    const raw = signalMap.get(name)!;
    const deduped: { time: number; value: number }[] = [];
    
    for (const entry of raw) {
      if (
        deduped.length === 0 ||
        deduped[deduped.length - 1].value !== entry.value
      ) {
        deduped.push(entry);
      }
    }
    
    return { name, values: deduped };
  });
}

// Result:
/*
[
  {
    name: "clk",
    values: [
      { time: 0, value: 0 },
      { time: 5, value: 1 },
      { time: 10, value: 0 },
      { time: 15, value: 1 }
    ]
  },
  {
    name: "reset",
    values: [
      { time: 0, value: 1 },
      { time: 10, value: 0 }
    ]
  },
  ...
]
*/
```

### Canvas Rendering

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  if (!ctx || signals.length === 0) return;
  
  // Canvas setup
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const W = rect.width;
  const H = rect.height;
  
  // Layout
  const labelWidth = 100;
  const signalHeight = 50;
  const waveAreaWidth = W - labelWidth - 20;
  
  // Find time range
  let maxTime = 0;
  for (const signal of signals) {
    for (const point of signal.values) {
      maxTime = Math.max(maxTime, point.time);
    }
  }
  
  // Draw each signal
  signals.forEach((signal, idx) => {
    const y = idx * signalHeight + 25;
    
    // Draw label
    ctx.fillStyle = '#fff';
    ctx.fillText(signal.name, 10, y + 10);
    
    // Draw baseline
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(labelWidth, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    
    // Draw signal transitions
    ctx.strokeStyle = COLORS[idx % COLORS.length];
    ctx.lineWidth = 2;
    
    for (let i = 0; i < signal.values.length - 1; i++) {
      const curr = signal.values[i];
      const next = signal.values[i + 1];
      
      // Calculate x positions (time-based)
      const x1 = labelWidth + (curr.time / maxTime) * waveAreaWidth;
      const x2 = labelWidth + (next.time / maxTime) * waveAreaWidth;
      
      // y position: 1 = up, 0 = down
      const yHigh = y - 15;
      const yLow = y + 15;
      
      // Draw current value (horizontal line)
      ctx.beginPath();
      ctx.moveTo(x1, curr.value === 1 ? yHigh : yLow);
      ctx.lineTo(x2, curr.value === 1 ? yHigh : yLow);
      ctx.stroke();
      
      // Draw transition (vertical line)
      ctx.beginPath();
      ctx.moveTo(x2, curr.value === 1 ? yHigh : yLow);
      ctx.lineTo(x2, next.value === 1 ? yHigh : yLow);
      ctx.stroke();
    }
  });
}, [signals]);
```

### Visual Example

```
Signal: clk           │ Signal: reset
  Time → 0  5  10  15 │  Time → 0  5  10  15
  ─────────────────── │  ─────────────────────
  ┌──┐  ┌──┐  ┌──┐    │  ┌────────┐
  │  └──┘  └──┘  └──   │  │        └────────
  0  5 10 15 (time)    │  0  5 10 15 (time)
```

---

## 3. Comment Threading Implementation

### Database Schema Strategy

**Old approach (doesn't scale):**
```typescript
// Nested comments within comments (MongoDB growth limit)
Comment {
  text: string,
  replies: [
    { text: string, replies: [...] }  // Nested infinitely
  ]
}
```

**Our approach (flat + parent reference):**
```typescript
Comment {
  problemId: ObjectId,
  userId: string,
  username: string,
  text: string,
  likes: string[],           // Array of user IDs
  parentId: ObjectId | null, // Reference to parent comment
  createdAt: Date,
  updatedAt: Date
}
```

### Query Patterns

**Pattern 1: Fetch all comments for a problem**
```typescript
const comments = await Comment.find({ problemId })
  .sort({ createdAt: -1 });
  
// Single query, then build tree in frontend
```

**Pattern 2: Get top-level comments (paginated)**
```typescript
const page = req.query.page || 1;
const limit = req.query.limit || 20;
const skip = (page - 1) * limit;

const topLevel = await Comment.find({
  problemId: req.params.id,
  parentId: null           // Only top-level
})
.sort({ createdAt: -1 })
.skip(skip)
.limit(limit);
```

**Pattern 3: Get replies to a specific comment**
```typescript
const replies = await Comment.find({
  parentId: commentId
})
.sort({ createdAt: 1 });  // Chronological order for replies
```

### Frontend Tree Building

```typescript
// DiscussionTab.tsx
export default function DiscussionTab({ problemId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Build tree structure
  const topLevel = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => 
    comments.filter(c => c.parentId === parentId);
  
  return (
    <div>
      {topLevel.map(comment => (
        <CommentItem
          key={comment._id}
          comment={comment}
          replies={getReplies(comment._id)}
          onReply={handleReply}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

// CommentItem.tsx
function CommentItem({ comment, replies, onReply, onDelete }: Props) {
  return (
    <div className="comment">
      <div className="author">{comment.username}</div>
      <div className="text">{comment.text}</div>
      <div className="actions">
        <button onClick={() => onLike(comment._id)}>
          👍 {comment.likes.length}
        </button>
        <button onClick={() => setReplyMode(true)}>Reply</button>
      </div>
      
      {/* Recursively render replies */}
      {replies.length > 0 && (
        <div className="replies">
          {replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              replies={getReplies(reply._id)}  // Nested replies
              onReply={onReply}
            />
          ))}
        </div>
      )}
      
      {/* Reply input */}
      {replyMode && (
        <form onSubmit={() => onReply(comment._id, replyText)}>
          <textarea value={replyText} onChange={...} />
          <button type="submit">Post Reply</button>
        </form>
      )}
    </div>
  );
}
```

### Like System

```typescript
// Toggle like endpoint
app.post('/api/comments/:id/like', async (req, res) => {
  const { userId } = req.body;
  const comment = await Comment.findById(req.params.id);
  
  const index = comment.likes.indexOf(userId);
  
  if (index === -1) {
    // User hasn't liked → add like
    comment.likes.push(userId);
  } else {
    // User has liked → remove like (unlike)
    comment.likes.splice(index, 1);
  }
  
  await comment.save();
  res.json(comment);
});

// Frontend:
const [localLikes, setLocalLikes] = useState(comment.likes);

const handleLike = async () => {
  setLocalLikes(
    localLikes.includes(userId)
      ? localLikes.filter(id => id !== userId)
      : [...localLikes, userId]
  );
  
  await axios.post(`/api/comments/${comment._id}/like`, { userId });
};
```

### Cascading Delete

```typescript
app.delete('/api/comments/:id', async (req, res) => {
  const { userId, secret } = req.body;
  
  const comment = await Comment.findById(req.params.id);
  
  // Authorization check
  const isAuthor = userId === comment.userId;
  const isAdmin = secret === "admin-123";
  
  if (!isAuthor && !isAdmin) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  // Delete cascading: comment + all replies + nested replies
  // MongoDB doesn't have CASCADE, so we do it manually
  
  async function deleteCommentTree(commentId: string) {
    // Find all direct replies
    const replies = await Comment.find({ parentId: commentId });
    
    // Recursively delete each reply's tree
    for (const reply of replies) {
      await deleteCommentTree(reply._id);
    }
    
    // Delete the comment itself
    await Comment.findByIdAndDelete(commentId);
  }
  
  await deleteCommentTree(req.params.id);
  res.json({ success: true });
});
```

---

## 4. Firebase SSO Integration

### Configuration

```typescript
// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZV7emkWS1TW_qM09GykTBMsT1DD8KqY4",
  authDomain: "vericode-86f89.firebaseapp.com",
  projectId: "vericode-86f89",
  storageBucket: "vericode-86f89.firebasestorage.app",
  messagingSenderId: "817521093818",
  appId: "1:817521093818:web:92ae6733b462cc3b60a683"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
```

### Google Login Flow

```typescript
const handleGoogleLogin = async () => {
  try {
    // Step 1: Firebase popup authentication
    const result = await signInWithPopup(auth, googleProvider);
    const { user } = result;
    
    // Step 2: Backend sync (critical!)
    const response = await axios.post(`${API_URL}/api/google-login`, {
      email: user.email,
      username: user.displayName || user.email?.split('@')[0],
      googleId: user.uid
    });
    
    // Step 3: Store in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', response.data.user._id);
    localStorage.setItem('username', response.data.user.username);
    localStorage.setItem('profilePicture', response.data.user.profilePicture || '');
    
    // Step 4: Navigate
    navigate('/problems');
    
  } catch (error) {
    console.error("Login failed:", error);
    alert("Authentication error");
  }
};
```

### Backend Sync

```typescript
app.post('/api/google-login', async (req, res) => {
  const { email, username } = req.body;
  
  try {
    // Check if user exists in MongoDB
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      console.log("Creating new Google user:", email);
      user = new User({
        username,
        email,
        passwordHash: "GOOGLE_AUTH_USER",  // Placeholder
        solvedProblems: []
      });
      await user.save();
    }
    
    // Return user data to frontend
    res.json({
      success: true,
      token: "dummy-token-123",
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
```

### Why Two Authentication Systems?

| Aspect | Firebase | MongoDB |
|--------|----------|---------|
| Purpose | Password security | User profile data |
| Handles | Google/GitHub login | Username, profile pic, solved problems |
| Can't do | Track solved problems | Secure OAuth 2.0 |
| Lives in | Google servers | Our database |

**Integration:** Firebase authenticates → MongoDB stores profile

---

## 5. Contest Execution System

### Data Model

```typescript
Contest {
  title: string,
  description: string,
  startTime: Date,
  endTime: Date,
  durationMinutes: number,
  problems: ObjectId[],        // Problem IDs
  difficulty: "Beginner" | "Intermediate" | "Advanced",
  participants: ObjectId[]     // User IDs registered
}

ContestParticipant {
  contestId: ObjectId,
  userId: string,
  username: string,
  score: number,               // Total points
  problemStatus: Map<          // Per-problem tracking
    problemId: string,
    {
      solved: boolean,
      attempts: number,
      solvedAt: Date
    }
  >,
  finishTime: Date            // For leaderboard ranking
}
```

### Contest Lifecycle

**Status Determination:**
```typescript
GET /api/contests/:id

const now = new Date();
if (now < contest.startTime) status = "Upcoming";   // Hide problems
else if (now >= startTime && now <= endTime) status = "Live";  // Show problems
else status = "Past";  // Completed
```

**Problem Visibility:**
```typescript
app.get('/api/contests/:id', async (req, res) => {
  const contest = await Contest.findById(req.params.id)
    .populate('problems');
  
  const now = new Date();
  
  // If upcoming, don't send problem details
  if (now < contest.startTime) {
    contest.problems = [];  // Empty array
  }
  
  res.json(contest);
});
```

### Submission Flow

```typescript
POST /api/contests/:id/submit
{
  userId: "user123",
  problemId: "prob456",
  passed: true
}
```

**Backend Processing:**
```typescript
app.post('/api/contests/:id/submit', async (req, res) => {
  const { userId, problemId, passed } = req.body;
  const contestId = req.params.id;
  
  // Validate contest is active
  const contest = await Contest.findById(contestId);
  const now = new Date();
  
  if (now < contest.startTime || now > contest.endTime) {
    return res.status(400).json({ error: "Contest is not active" });
  }
  
  // Get participant
  let participant = await ContestParticipant.findOne({ contestId, userId });
  if (!participant) {
    return res.status(403).json({ error: "Not registered" });
  }
  
  // Get or initialize problem status
  if (!participant.problemStatus) {
    participant.problemStatus = new Map();
  }
  
  let status = participant.problemStatus.get(problemId) || {
    solved: false,
    attempts: 0
  };
  
  // Increment attempts
  status.attempts += 1;
  
  // If passed and not already solved
  if (passed && !status.solved) {
    status.solved = true;
    status.solvedAt = now;
    participant.score += 100;      // 100 points per problem
    participant.finishTime = now;  // Update for leaderboard
  }
  
  participant.problemStatus.set(problemId, status);
  participant.markModified('problemStatus');  // Mark Map as changed
  await participant.save();
  
  res.json({ success: true, score: participant.score });
});
```

### Leaderboard Ranking

```typescript
// Ranking criteria:
// 1. Higher score wins
// 2. Tie-breaker: Earlier finishTime (solved faster)

GET /api/contests/:id/leaderboard

const participants = await ContestParticipant
  .find({ contestId })
  .sort([
    ["score", -1],           // Descending score
    ["finishTime", 1]        // Ascending time (earlier = better)
  ]);

// Return with rankings:
participants.map((p, idx) => ({
  rank: idx + 1,
  username: p.username,
  score: p.score,
  finishTime: p.finishTime,
  problemsSolved: Array.from(p.problemStatus.values())
    .filter(s => s.solved).length
}))
```

---

## 6. Performance Optimization Strategies

### Query Optimization

**Before: Fetch All Comments**
```typescript
// Slow: 100k comments × network latency
db.comments.find({ problemId })
```

**After: Pagination + Indexing**
```typescript
// Create composite index
db.comments.createIndex({ problemId: 1, parentId: 1, createdAt: -1 });

// Query: Only top-level, 20 per page
db.comments.find(
  { problemId, parentId: null }
).sort({ createdAt: -1 }).skip(0).limit(20);
```

### Caching Strategy

```typescript
// In-memory cache for popular problems
const commentCache = new Map<
  string,  // problemId
  {
    data: Comment[],
    expiry: number
  }
>();

GET /api/comments/:problemId
→ Check cache.has(problemId)
→ If fresh: Return cached
→ If expired: Query DB, update cache
→ If miss: Query DB, cache result
```

### Denormalization

**Before:**
```typescript
Comment {
  likes: string[]  // Array of user IDs
}
// Need to calculate likes.length on every read
```

**After:**
```typescript
Comment {
  likes: string[],
  likeCount: number  // Denormalized
}
// Direct access: comment.likeCount
```

### Full-Text Search

```typescript
// Create text index
db.comments.createIndex({ text: "text" });

// Search by keyword
GET /api/comments/:problemId/search?q=state+machine

db.comments.find(
  { problemId, $text: { $search: "state machine" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

---

## 7. Error Handling Patterns

### JDoodle Errors

```typescript
const JDoodleErrors = {
  429: "Rate Limit: Daily quota exceeded. Try again tomorrow.",
  500: "API Error: JDoodle server error.",
  'ECONNABORTED': "Timeout: Simulation took too long (>15s).",
  'ECONNREFUSED': "Network Error: Could not reach server.",
  'ENOTFOUND': "DNS Error: Invalid API endpoint."
};
```

### MongoDB Errors

```typescript
app.get('/api/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      // Not found
      return res.status(404).json({ error: "Problem not found" });
    }
    
    res.json(problem);
    
  } catch (error) {
    // Could be invalid ID format, connection error, etc.
    console.error("Error fetching problem:", error);
    res.status(500).json({ error: "Server Error" });
  }
});
```

### Validation Errors

```typescript
app.post('/api/comments', async (req, res) => {
  const { problemId, userId, username, text, parentId } = req.body;
  
  // Validate required fields
  if (!problemId || !userId || !username || !text) {
    return res.status(400).json({
      error: "Missing required fields: problemId, userId, username, text"
    });
  }
  
  // Validate text length
  if (text.length > 5000) {
    return res.status(400).json({
      error: "Comment too long (max 5000 characters)"
    });
  }
  
  try {
    const comment = new Comment({...});
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});
```

### Fallback Mechanisms

```typescript
// If MongoDB unavailable, serve hardcoded data
if (!dbConnected) {
  const listing = hardcodedWithIds.map(({ testbench, ...rest }) => rest);
  return res.json(listing);
}

try {
  const problems = await Problem.find();
  res.json(problems);
} catch (error) {
  // On query error, fallback too
  const listing = hardcodedWithIds.map(({ testbench, ...rest }) => rest);
  res.json(listing);
}
```

---

## Quick Debug Checklist

- [ ] Frontend console for client-side errors
- [ ] `console.log()` in backend routes
- [ ] Check `process.env` for missing env vars
- [ ] Verify MongoDB connection status
- [ ] Test JDoodle API directly with curl
- [ ] Check CORS origin in headers
- [ ] Verify Firebase config (apiKey, projectId)
- [ ] Check rate limits (429 responses from JDoodle)
- [ ] Monitor network tab for failed requests
- [ ] Verify userId is persisted in localStorage
