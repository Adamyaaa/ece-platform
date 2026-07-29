import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from './api';
import Editor from "@monaco-editor/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Play, RotateCcw, CheckCircle, XCircle, Terminal, GripVertical, GripHorizontal, Activity } from 'lucide-react';
import DiscussionTab from './components/DiscussionTab';
import WaveformViewer from './components/WaveformViewer';
import { useChatContext } from './ChatContext';

interface Problem {
  title: string;
  description: string;
  templateCode: string;
  difficulty: string; // Added
  category?: string;  // Added
}

function ProblemPage() {
  const { id } = useParams();
  const { setProblemContext } = useChatContext();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'discussion'>('description');

  // Editor States
  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [waveformData, setWaveformData] = useState<string[]>([]);
  const [bottomTab, setBottomTab] = useState<'console' | 'waveform'>('console');

  // 1. Fetch Data Hook
  useEffect(() => {
    api.get(`/api/problems/${id}`)
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
    setWaveformData([]);

    try {
      const response = await api.post(`/api/run`, {
        code: userCode,
        problemId: id
      });

      const rawOutput = response.data.output;
      const waveLines: string[] = response.data.waveformData || [];

      // 🧹 CLEANUP: Remove file paths, system noise, AND the $finish message
      const cleanOutput = rawOutput
        .replace(/.*\.vvp:.*\n?/g, "")       // Removes "temp/xyz/testbench.vvp"
        .replace(/^VCD info:.*\n?/g, "")     // Removes "VCD info: dumpfile..."
        .replace(/.*\$finish called at.*\n?/g, "") // Removes "$finish called at..."
        .trim(); // Removes extra whitespace

      setOutput(cleanOutput);
      setWaveformData(waveLines);

      // Auto-switch to waveform tab if data is available
      if (waveLines.length > 0) {
        setBottomTab('waveform');
      }

      // Check for success
      if (cleanOutput.includes("Passed") && !cleanOutput.includes("Failed")) {
        if (localStorage.getItem("userId")) {
          await api.post(`/api/solve`, { problemId: id });
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

  // 4. Publish current problem/code/output so the chat assistant can use it as context
  useEffect(() => {
    if (!id) return;
    setProblemContext({ problemId: id, code: userCode, output });
    return () => setProblemContext(null);
  }, [id, userCode, output, setProblemContext]);

  // 5. Loading Check
  if (!problem) return <div className="text-white text-center p-20 animate-pulse">Loading Problem...</div>;

  return (
    <div className="h-[calc(100vh-64px)] bg-black text-white overflow-hidden">

      {/* ↔️ MAIN HORIZONTAL SPLIT (Description vs Code) */}
      <PanelGroup direction="horizontal">

        {/* LEFT PANEL: Description & Discussion */}
        <Panel defaultSize={40} minSize={20} className="flex flex-col bg-[#0a0a0a] border-r border-gray-800">

          {/* Tabs Header */}
          <div className="flex items-center border-b border-gray-800 bg-[#111]">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'description' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              📜 Description
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'discussion' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              💬 Discussion
            </button>
            <div className="flex-1 text-right pr-4">
              <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded border border-gray-700">Problem #{id?.slice(-3)}</span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {activeTab === 'description' ? (
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
                <div className="flex gap-2 mb-6">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${problem.difficulty === 'Easy' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                    problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                      'border-red-500/30 text-red-400 bg-red-500/10'
                    }`}>
                    {problem.difficulty}
                  </span>
                  {problem.category && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold border border-blue-500/30 text-blue-400 bg-blue-500/10">
                      {problem.category}
                    </span>
                  )}
                </div>
                <div className="prose prose-invert max-w-none text-gray-300">
                  <p className="whitespace-pre-wrap leading-relaxed">{problem.description}</p>
                </div>
              </div>
            ) : (
              <DiscussionTab problemId={id || ''} />
            )}
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
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${isRunning ? 'bg-blue-900/50 text-blue-300 cursor-wait' : 'bg-green-600 hover:bg-green-500 text-white'
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

            {/* BOTTOM RIGHT: Terminal + Waveform */}
            <Panel defaultSize={30} minSize={10} className="flex flex-col bg-black">
              <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBottomTab('console')}
                    className={`text-xs font-mono flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${bottomTab === 'console'
                        ? 'text-white bg-gray-700/60'
                        : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <Terminal size={12} /> Console
                  </button>
                  <button
                    onClick={() => setBottomTab('waveform')}
                    className={`text-xs font-mono flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${bottomTab === 'waveform'
                        ? 'text-white bg-gray-700/60'
                        : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <Activity size={12} /> Waveform
                    {waveformData.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </button>
                </div>

                {/* 🟢 REFINED LOGIC: Only show badge if NOT running AND output exists */}
                {!isRunning && output && bottomTab === 'console' && (
                  <span className={`text-xs font-bold flex items-center gap-1 ${output.includes("Passed") ? "text-green-500" : "text-red-400"
                    }`}>
                    {output.includes("Passed") ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {output.includes("Passed") ? "Success" : "Failed"}
                  </span>
                )}
              </div>

              {bottomTab === 'console' ? (
                <pre className="flex-1 p-4 font-mono text-sm overflow-y-auto text-gray-300 custom-scrollbar">
                  {output || <span className="text-gray-600 italic">// Run your code to see results...</span>}
                </pre>
              ) : (
                <WaveformViewer rawLines={waveformData} />
              )}
            </Panel>

          </PanelGroup>
        </Panel>

      </PanelGroup>
    </div>
  );
}

export default ProblemPage;