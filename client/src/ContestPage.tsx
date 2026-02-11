import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { 
  Play, Terminal, GripVertical, GripHorizontal, Clock, 
  List, CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';

// 🟢 OFFLINE DATA
const MOCK_CONTEST = {
  _id: "1",
  title: "Digital Logic Speedrun",
  durationMinutes: 60,
  problems: [
    {
      _id: "p1",
      title: "Problem 1: AND Gate",
      description: "Design a module that implements a bitwise AND gate.\n\nModule Declaration:\nmodule top_module( input a, input b, output out );",
      templateCode: "module top_module( input a, input b, output out );\n    // Write your code here\n    \nendmodule"
    },
    {
      _id: "p2",
      title: "Problem 2: NOR Gate",
      description: "Design a module that implements a NOR gate.\n\nModule Declaration:\nmodule top_module( input a, input b, output out );",
      templateCode: "module top_module( input a, input b, output out );\n    // Write your code here\n    \nendmodule"
    },
    {
      _id: "p3",
      title: "Problem 3: XNOR Gate",
      description: "Design a module that implements an XNOR gate.\n\nModule Declaration:\nmodule top_module( input a, input b, output out );",
      templateCode: "module top_module( input a, input b, output out );\n    // Write your code here\n    \nendmodule"
    }
  ]
};

function ContestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState<any>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExamOver, setIsExamOver] = useState(false);
  
  // Editor States
  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // 1. Load Data
  useEffect(() => {
    if (id === "1") {
      setContest(MOCK_CONTEST);
      setUserCode(MOCK_CONTEST.problems[0].templateCode);

      // Timer Logic
      const storageKey = `contest_start_${id}`;
      let startTime = localStorage.getItem(storageKey);
      
      if (!startTime) {
        startTime = Date.now().toString();
        localStorage.setItem(storageKey, startTime);
      }

      const elapsedSeconds = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      const totalSeconds = MOCK_CONTEST.durationMinutes * 60;
      const remaining = totalSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setIsExamOver(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }
  }, [id]);

  // 2. Countdown
  useEffect(() => {
    if (timeLeft <= 0 || isExamOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExamOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isExamOver]);

  const switchProblem = (index: number) => {
    setCurrentProblemIndex(index);
    setUserCode(contest.problems[index].templateCode); 
    setOutput("");
  };

  const handleRunCode = async () => {
    if (isExamOver) return;
    setIsRunning(true);
    setOutput("Compiling...");

    try {
      const response = await axios.post('http://localhost:5000/api/run', {
        code: userCode,
        problemId: contest.problems[currentProblemIndex]._id 
      });

      let cleanOutput = response.data.output
        .replace(/.*\.vvp:.*\n?/g, "")
        .replace(/^VCD info:.*\n?/g, "")
        .replace(/.*\$finish called at.*\n?/g, "")
        .trim();

      setOutput(cleanOutput);
    } catch (error) {
      setOutput("❌ Error: Could not reach the compiler.");
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!contest) return <div className="text-white p-20 text-center">Loading Arena...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-black text-white overflow-hidden">
      
      {/* 🔴 FLAT HEADER */}
      <div className="h-16 bg-[#111] border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg tracking-wide text-gray-200">{contest.title}</h1>
          <span className="text-gray-600 text-sm">|</span>
          <span className="text-gray-400 text-sm flex items-center gap-2 font-mono">
            <List size={14} /> {currentProblemIndex + 1}/{contest.problems.length}
          </span>
        </div>

        {/* ⏳ FLAT TIMER (Industrial Look) */}
        <div className={`flex items-center gap-3 px-4 py-1.5 rounded-lg font-mono text-lg font-bold transition-colors ${
          timeLeft < 300 
            ? 'text-red-500 bg-red-900/10' 
            : 'text-gray-300 bg-[#1a1a1a]'
        }`}>
          <Clock size={18} />
          {isExamOver ? "TIME UP" : formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => navigate('/contests')}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          Exit Exam
        </button>
      </div>

      {/* 🔒 TIME UP OVERLAY */}
      {isExamOver && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
          <AlertTriangle size={64} className="text-red-500 mb-6" />
          <h2 className="text-5xl font-bold text-white mb-4">Time's Up!</h2>
          <p className="text-gray-400 mb-8 text-xl">The contest has ended.</p>
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
            Problem List
          </div>
          <div className="flex-1 overflow-y-auto">
            {contest.problems.map((p: any, idx: number) => (
              <button
                key={p._id}
                onClick={() => switchProblem(idx)}
                className={`w-full text-left px-5 py-4 border-l-2 transition-all ${
                  currentProblemIndex === idx 
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
                         disabled={isRunning || isExamOver}
                         title="Run Code (Alt + Shift + R)"
                         className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all ${
                           isRunning ? 'bg-blue-900/50 text-blue-300' : 'bg-green-600 hover:bg-green-500 text-white'
                         }`}
                      >
                         {isRunning ? 'Running...' : <><Play size={14} /> Run Code</>}
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
                          <Terminal size={12}/> Console Output
                       </span>
                       {output && !isRunning && (
                          <span className={`text-xs font-bold flex items-center gap-1 ${output.includes("Passed") ? "text-green-500" : "text-red-400"}`}>
                             {output.includes("Passed") ? <CheckCircle size={12} /> : <XCircle size={12} />}
                             {output.includes("Passed") ? "Success" : "Failed"}
                          </span>
                       )}
                    </div>
                    <pre className="flex-1 p-4 font-mono text-sm overflow-y-auto text-gray-300 custom-scrollbar">
                       {output || <span className="text-gray-600 italic">// Run your code to see results...</span>}
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