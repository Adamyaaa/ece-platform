import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Play, RotateCcw, CheckCircle, XCircle, Terminal, GripVertical, GripHorizontal } from 'lucide-react';

interface Problem {
  title: string;
  description: string;
  templateCode: string;
}

function ProblemPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  
  // Editor States
  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // 1. Fetch Data Hook
  useEffect(() => {
    axios.get(`http://localhost:5000/api/problems/${id}`)
      .then((res) => {
        setProblem(res.data);
        setUserCode(res.data.templateCode || "");
      })
      .catch((err) => console.error(err));
  }, [id]);

  // 2. Define Run Function
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Compiling and Simulating...");

    try {
      const response = await axios.post('http://localhost:5000/api/run', {
        code: userCode,
        problemId: id 
      });

      let rawOutput = response.data.output;

      // 🧹 CLEANUP: Remove file paths, system noise, AND the $finish message
      let cleanOutput = rawOutput
        .replace(/.*\.vvp:.*\n?/g, "")       // Removes "temp/xyz/testbench.vvp"
        .replace(/^VCD info:.*\n?/g, "")     // Removes "VCD info: dumpfile..."
        .replace(/.*\$finish called at.*\n?/g, "") // Removes "$finish called at..."
        .trim(); // Removes extra whitespace

      setOutput(cleanOutput);

      // Check for success
      if (cleanOutput.includes("Passed") && !cleanOutput.includes("Failed")) {
        const userId = localStorage.getItem("userId");
        if (userId) {
           await axios.post('http://localhost:5000/api/solve', { userId, problemId: id });
        }
      }

    } catch (error: any) {
      setOutput("❌ Error: Could not connect to the compiler.\nIs the server running?");
    } finally {
      setIsRunning(false);
    }
  };

  // 3. Keyboard Shortcut Hook (MOVED UP to prevent Hook Rule Violation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌨️ SHORTCUT: Alt + Shift + R
      if (e.altKey && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault(); 
        
        if (!isRunning) {
          handleRunCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userCode, isRunning]); 

  // 4. Loading Check
  if (!problem) return <div className="text-white text-center p-20 animate-pulse">Loading Problem...</div>;

  return (
    <div className="h-[calc(100vh-64px)] bg-black text-white overflow-hidden">
      
      {/* ↔️ MAIN HORIZONTAL SPLIT (Description vs Code) */}
      <PanelGroup direction="horizontal">
        
        {/* LEFT PANEL: Description */}
        <Panel defaultSize={40} minSize={20} className="flex flex-col bg-[#1a1a1a] border-r border-gray-800">
          <div className="p-4 bg-[#262626] border-b border-gray-700 font-bold flex justify-between items-center">
             <span>📜 Description</span>
             <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Problem #{id?.slice(-3)}</span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="whitespace-pre-wrap leading-relaxed">{problem.description}</p>
            </div>
          </div>
        </Panel>

        {/* DRAG HANDLE (Left/Right) */}
        <PanelResizeHandle className="w-2 bg-black hover:bg-blue-600 transition-colors flex items-center justify-center cursor-col-resize">
          <GripVertical size={12} className="text-gray-600" />
        </PanelResizeHandle>

        {/* RIGHT PANEL: Code & Terminal */}
        <Panel minSize={30}>
          <PanelGroup direction="vertical">
            
            {/* TOP RIGHT: Editor */}
            <Panel defaultSize={70} minSize={20} className="flex flex-col bg-[#1e1e1e]">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#262626] border-b border-black">
                <span className="text-xs text-gray-400 font-mono flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  solution.v
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setUserCode(problem.templateCode)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
                    title="Reset Code"
                  >
                    <RotateCcw size={14} />
                  </button>
                  
                  {/* ▶️ RUN BUTTON with TOOLTIP */}
                  <button 
                    onClick={handleRunCode}
                    disabled={isRunning}
                    title="Run Code (Alt + Shift + R)" // <--- TOOLTIP ADDED HERE
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${
                      isRunning ? 'bg-blue-900/50 text-blue-300 cursor-wait' : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    {isRunning ? 'Running...' : <><Play size={14} /> Run Code</>}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="verilog"
                  theme="vs-dark"
                  value={userCode}
                  onChange={(val) => setUserCode(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16 }
                  }}
                />
              </div>
            </Panel>

            {/* DRAG HANDLE (Up/Down) */}
            <PanelResizeHandle className="h-2 bg-black hover:bg-blue-600 transition-colors flex items-center justify-center cursor-row-resize">
              <GripHorizontal size={12} className="text-gray-600" />
            </PanelResizeHandle>

            {/* BOTTOM RIGHT: Terminal */}
            <Panel defaultSize={30} minSize={10} className="flex flex-col bg-black">
              <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                  <Terminal size={12} /> Console Output
                </span>
                
                {/* 🟢 REFINED LOGIC: Only show badge if NOT running AND output exists */}
                {!isRunning && output && (
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    output.includes("Passed") ? "text-green-500" : "text-red-400"
                  }`}>
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
  );
}

export default ProblemPage;