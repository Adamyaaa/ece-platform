import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Play, Terminal, GripVertical, GripHorizontal, Clock,
  List, CheckCircle, XCircle, AlertTriangle, Lock
} from 'lucide-react';
import { auth } from './firebaseConfig'; // User Auth

function ContestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [contestStatus, setContestStatus] = useState<'UPCOMING' | 'LIVE' | 'ENDED'>('UPCOMING');

  // Editor States
  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);

  // 1. Fetch Contest Data
  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/contests/${id}`);
        setContest(res.data);

        // Initial Code Setup (if problems exist)
        if (res.data.problems && res.data.problems.length > 0) {
          setUserCode(res.data.problems[0].templateCode);
        }

        calculateTime(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching contest:", error);
        setLoading(false);
      }
    };
    fetchContest();

    // Auto-refresh every minute to check status changes (e.g. Upcoming -> Live)
    const interval = setInterval(fetchContest, 60000);
    return () => clearInterval(interval);
  }, [id]);

  // 2. Timer Logic
  const calculateTime = (data: any) => {
    const now = Date.now();
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();

    if (now < start) {
      setContestStatus('UPCOMING');
      setTimeLeft(Math.floor((start - now) / 1000));
    } else if (now >= start && now < end) {
      setContestStatus('LIVE');
      setTimeLeft(Math.floor((end - now) / 1000));
    } else {
      setContestStatus('ENDED');
      setTimeLeft(0);
    }
  };

  // 3. Countdown Effect
  useEffect(() => {
    if (contestStatus === 'ENDED') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time hit zero, refresh data to switch state
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [contestStatus]);

  const switchProblem = (index: number) => {
    setCurrentProblemIndex(index);
    if (contest.problems[index]) {
      setUserCode(contest.problems[index].templateCode);
    }
    setOutput("");
  };

  const handleRunCode = async () => {
    if (contestStatus !== 'LIVE') return;
    setIsRunning(true);
    setOutput("Compiling...");

    const problem = contest.problems[currentProblemIndex];
    const userId = localStorage.getItem("userId");

    try {
      // 1. Run Logic
      const runRes = await axios.post(`${API_URL}/api/run`, {
        code: userCode,
        problemId: problem._id
      });

      let cleanOutput = runRes.data.output
        .replace(/.*\.vvp:.*\n?/g, "")
        .replace(/^VCD info:.*\n?/g, "")
        .replace(/.*\$finish called at.*\n?/g, "")
        .trim();

      setOutput(cleanOutput);

      const passed = cleanOutput.includes("Passed") && !cleanOutput.includes("Failed");

      // 2. Submit to Contest API
      if (userId) {
        // Register first! (Idempotent)
        const username = localStorage.getItem("username") || "User";
        await axios.post(`${API_URL}/api/contests/${id}/register`, {
          userId,
          username
        });

        // Then Submit
        await axios.post(`${API_URL}/api/contests/${id}/submit`, {
          userId,
          problemId: problem._id,
          passed
        });
      }

    } catch (error: any) {
      console.error("Run Code Error:", error);
      const msg = error.response?.data?.error || error.message || "Unknown Error";
      setOutput(`❌ Error: ${msg}\nDetails: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-white p-20 text-center animate-pulse">Syncing Time...</div>;
  if (!contest) return <div className="text-white p-20 text-center">Contest not found.</div>;

  // VIEW: PRE-CONTEST (LOBBY)
  if (contestStatus === 'UPCOMING') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <Clock size={64} className="text-blue-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold mb-2">{contest.title}</h1>
        <p className="text-gray-500 mb-8 max-w-lg">{contest.description}</p>

        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 min-w-[300px]">
          <div className="text-sm text-gray-400 font-mono mb-2 uppercase tracking-wide">Contest Starts In</div>
          <div className="text-5xl font-mono font-bold text-white">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="mt-8 text-gray-600 text-sm">
          The problems will appear automatically when the timer hits zero.
        </div>
      </div>
    );
  }

  // VIEW: LIVE CONTEST
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-black text-white overflow-hidden">

      {/* 🔴 HEADER */}
      <div className="h-16 bg-[#111] border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg tracking-wide text-gray-200">{contest.title}</h1>
          <span className="text-gray-600 text-sm">|</span>
          <span className="text-gray-400 text-sm flex items-center gap-2 font-mono">
            <List size={14} /> {currentProblemIndex + 1}/{contest.problems.length}
          </span>
        </div>

        {/* ⏳ TIMER */}
        <div className={`flex items-center gap-3 px-4 py-1.5 rounded-lg font-mono text-lg font-bold transition-colors ${contestStatus === 'ENDED' ? 'bg-gray-800 text-gray-400' :
          timeLeft < 300 ? 'text-red-500 bg-red-900/10 animate-pulse' : 'text-gray-300 bg-[#1a1a1a]'
          }`}>
          <Clock size={18} />
          {contestStatus === 'ENDED' ? "CONTEST ENDED" : formatTime(timeLeft)}
        </div>

        <button
          onClick={() => navigate('/contests')}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          Exit Exam
        </button>
      </div>

      {/* 🔒 ENDED OVERLAY */}
      {contestStatus === 'ENDED' && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
          <Lock size={64} className="text-gray-500 mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Contest Ended</h2>
          <p className="text-gray-400 mb-8 text-lg">Submissions are now closed.</p>
          <button onClick={() => navigate('/contests')} className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200">
            Return to Lobby
          </button>
        </div>
      )}

      {/* 🏗️ MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-64 bg-[#0a0a0a] border-r border-gray-800 flex flex-col">
          <div className="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
            Problems
          </div>
          <div className="flex-1 overflow-y-auto">
            {contest.problems.map((p: any, idx: number) => (
              <button
                key={p._id}
                onClick={() => switchProblem(idx)}
                className={`w-full text-left px-5 py-4 border-l-2 transition-all ${currentProblemIndex === idx
                  ? 'bg-[#1a1a1a] border-yellow-600 text-white'
                  : 'border-transparent text-gray-500 hover:bg-[#161616] hover:text-gray-300'
                  }`}
              >
                <div className="font-medium text-sm truncate mb-1">Problem {idx + 1}</div>
                <div className="text-xs truncate text-gray-400 font-mono">{p.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 bg-black">
          <PanelGroup direction="horizontal">

            {/* LEFT: Description */}
            <Panel defaultSize={40} minSize={20} className="flex flex-col bg-[#111] border-r border-gray-800">
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6 text-white">{contest.problems[currentProblemIndex].title}</h2>
                <div className="prose prose-invert max-w-none text-gray-300">
                  <p className="whitespace-pre-wrap leading-relaxed">{contest.problems[currentProblemIndex].description}</p>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1.5 bg-black hover:bg-blue-600 transition-colors cursor-col-resize flex justify-center items-center">
              <GripVertical size={12} className="text-gray-700" />
            </PanelResizeHandle>

            {/* RIGHT: Editor + Terminal */}
            <Panel minSize={30}>
              <PanelGroup direction="vertical">

                {/* EDITOR */}
                <Panel defaultSize={70} className="flex flex-col bg-[#1e1e1e]">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#262626] border-b border-black">
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div> solution.v
                    </span>
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning || contestStatus !== 'LIVE'}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all ${isRunning ? 'bg-blue-900/50 text-blue-300' :
                        contestStatus !== 'LIVE' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' :
                          'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                    >
                      {isRunning ? 'Running...' : <><Play size={14} /> Submit</>}
                    </button>
                  </div>
                  <Editor
                    height="100%"
                    defaultLanguage="verilog"
                    theme="vs-dark"
                    value={userCode}
                    onChange={(val) => setUserCode(val || "")}
                    options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                  />
                </Panel>

                <PanelResizeHandle className="h-1.5 bg-black hover:bg-blue-600 transition-colors cursor-row-resize flex justify-center items-center">
                  <GripHorizontal size={12} className="text-gray-700" />
                </PanelResizeHandle>

                {/* TERMINAL */}
                <Panel defaultSize={30} className="bg-black flex flex-col">
                  <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                      <Terminal size={12} /> Console Output
                    </span>
                    {output && !isRunning && (
                      <span className={`text-xs font-bold flex items-center gap-1 ${output.includes("Passed") ? "text-green-500" : "text-red-400"}`}>
                        {output.includes("Passed") ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {output.includes("Passed") ? "Success" : "Failed"}
                      </span>
                    )}
                  </div>
                  <pre className="flex-1 p-4 font-mono text-sm overflow-y-auto text-gray-300 custom-scrollbar">
                    {output || <span className="text-gray-600 italic">// Run to submit to contest...</span>}
                  </pre>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}

export default ContestPage;