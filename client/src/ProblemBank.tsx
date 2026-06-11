import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import { Terminal, CheckCircle, ArrowRight, Search, Filter, Zap, Trophy, Target } from 'lucide-react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Problem {
  _id?: string;
  id?: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  description: string;
}

function ProblemBank() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  useEffect(() => {
    axios.get(`${API_URL}/api/problems`)
      .then((res) => setProblems(res.data))
      .catch((err) => console.error("Error fetching problems:", err));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            const userRes = await axios.get(`${API_URL}/api/users/${userId}`);
            setSolvedIds(userRes.data.solvedProblems || []);
          } catch (error) {
            console.error("Error fetching user data:", error);
            setSolvedIds([]);
          }
        } else {
          setSolvedIds([]);
        }
      } else {
        setSolvedIds([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter logic
  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  // Stats
  const totalSolved = solvedIds.length;
  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  if (loading) return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center">
      <div className="text-gray-500 animate-pulse text-lg font-mono">Loading Challenges...</div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] text-white">

      {/* Header Section */}
      <div className="border-b border-gray-800/60 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                Problem Bank
              </h1>
              <p className="text-gray-500 text-sm">
                Master digital logic design — from basic gates to complex FSMs.
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] border border-gray-800 text-sm">
                <Trophy size={14} className="text-yellow-500" />
                <span className="text-gray-400">Solved</span>
                <span className="font-bold text-white">{totalSolved}/{problems.length}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] border border-gray-800 text-sm">
                <Zap size={14} className="text-green-500" />
                <span className="text-green-400 font-medium">{easyCount}</span>
                <span className="text-yellow-400 font-medium">{mediumCount}</span>
                <span className="text-red-400 font-medium">{hardCount}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#111] border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 p-1 rounded-lg bg-[#111] border border-gray-800">
              {['All', 'Easy', 'Medium', 'Hard'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${difficultyFilter === level
                      ? level === 'Easy' ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : level === 'Medium' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                          : level === 'Hard' ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                            : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problem List — Table Style */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Column Headers */}
        <div className="hidden md:grid md:grid-cols-[40px_1fr_100px_100px_140px] gap-4 items-center px-4 py-2 text-xs text-gray-600 font-bold uppercase tracking-wider border-b border-gray-800/50 mb-2">
          <span>#</span>
          <span>Problem</span>
          <span>Category</span>
          <span>Difficulty</span>
          <span className="text-right">Status</span>
        </div>

        {/* Problem Rows */}
        <div className="flex flex-col gap-1.5">
          {filteredProblems.map((problem, index) => {
            const problemId = problem._id || problem.id;
            const isSolved = problemId && solvedIds.includes(problemId);
            if (!problemId) return null;

            return (
              <Link
                key={problemId}
                to={`/problems/${problemId}`}
                className={`group grid grid-cols-1 md:grid-cols-[40px_1fr_100px_100px_140px] gap-4 items-center px-4 py-3.5 rounded-lg border transition-all duration-200 ${isSolved
                    ? 'bg-[#0a0f0a] border-green-900/30 hover:border-green-700/40'
                    : 'bg-[#0c0c0c] border-gray-800/40 hover:border-blue-600/40 hover:bg-[#0e0e14]'
                  }`}
              >
                {/* Number */}
                <span className="text-gray-600 font-mono text-sm hidden md:block">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Title + Description */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm truncate transition-colors ${isSolved ? 'text-gray-300 group-hover:text-green-400' : 'text-gray-200 group-hover:text-blue-400'
                      }`}>
                      {problem.title.replace(/^\d+\.\s*/, '')}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs mt-0.5 truncate">{problem.description}</p>
                </div>

                {/* Category */}
                <span className="text-gray-500 text-xs font-medium hidden md:block">
                  {problem.category || '—'}
                </span>

                {/* Difficulty */}
                <span className={`text-xs font-bold hidden md:block ${problem.difficulty === 'Easy' ? 'text-green-500' :
                    problem.difficulty === 'Medium' ? 'text-yellow-500' :
                      'text-red-500'
                  }`}>
                  {problem.difficulty}
                </span>

                {/* Status / Action */}
                <div className="flex justify-end">
                  {isSolved ? (
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold">
                      <CheckCircle size={14} />
                      <span>Solved</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-blue-400 text-xs font-medium transition-colors">
                      <span>Solve</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProblems.length === 0 && (
          <div className="text-center py-20">
            <Target size={40} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500 text-sm">No problems match your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setDifficultyFilter('All'); }}
              className="mt-3 text-blue-500 text-xs hover:text-blue-400 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemBank;