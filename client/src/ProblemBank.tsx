import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Terminal, CheckCircle, ArrowRight } from 'lucide-react';

// 1. UPDATED INTERFACE (Handles both _id and id)
interface Problem {
  _id?: string; 
  id?: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
}

function ProblemBank() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem("userId");

        const problemsRes = await axios.get('http://localhost:5000/api/problems');
        console.log("🔍 Debug Problems:", problemsRes.data); // Check console to see real IDs
        setProblems(problemsRes.data);

        if (userId) {
          const userRes = await axios.get(`http://localhost:5000/api/users/${userId}`);
          setSolvedIds(userRes.data.solvedProblems || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-white text-center p-20 animate-pulse">Loading Challenges...</div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Verilog Problem Bank
          </h1>
          <p className="text-gray-400 text-lg">Master digital logic design, one module at a time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem) => {
            // 2. ROBUST ID CHECK (Uses _id OR id)
            const problemId = problem._id || problem.id;
            
            // 3. ROBUST SOLVED CHECK
            // We check if the ID exists in the solved list
            const isSolved = problemId && solvedIds.includes(problemId);

            if (!problemId) return null; // Skip if ID is broken

            return (
              <div 
                key={problemId} 
                className={`group relative p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${
                  isSolved 
                    ? 'bg-[#111] border-green-900/50 shadow-lg shadow-green-900/10' 
                    : 'bg-[#161616] border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${
                    isSolved ? 'bg-green-900/20 text-green-500' : 'bg-blue-900/20 text-blue-400'
                  }`}>
                    <Terminal size={24} />
                  </div>
                  
                  {isSolved ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-bold border border-green-800">
                      <CheckCircle size={14} /> Solved
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      problem.difficulty === 'Easy' ? 'bg-green-900/20 text-green-400 border-green-900' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900' :
                      'bg-red-900/20 text-red-400 border-red-900'
                    }`}>
                      {problem.difficulty}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                  {problem.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">
                  {problem.description}
                </p>

                {/* 4. THE FIX: Link uses the verified 'problemId' */}
                <Link 
                  to={`/problems/${problemId}`} 
                  className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all mt-auto ${
                    isSolved 
                      ? 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border border-gray-800' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSolved ? 'Re-attempt' : 'Solve Challenge'} 
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProblemBank;