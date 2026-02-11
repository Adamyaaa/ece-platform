import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Timer, ArrowRight, Zap, Code } from 'lucide-react';

function ContestList() {
  const contests = [
    {
      _id: "1",
      title: "Digital Logic Speedrun",
      description: "60 minutes. 3 Fundamental Logic Problems. Prove your speed.",
      durationMinutes: 60,
      problemCount: 3,
      difficulty: "Beginner"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Flat & Clean */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Trophy className="text-yellow-500" size={40} />
            <span className="text-white">Contest Arena</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Compete in offline mode. No internet required.
          </p>
        </div>

        {/* Contest Card - No Glows, Just Borders */}
        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {contests.map((contest) => (
            <div key={contest._id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8 hover:border-yellow-600 transition-colors group">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white group-hover:text-yellow-500 transition-colors mb-2">
                    {contest.title}
                  </h2>
                  <span className="inline-block bg-[#1a1a1a] text-blue-400 border border-gray-800 px-2 py-0.5 text-xs font-mono uppercase tracking-wide">
                    {contest.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#111] border border-gray-800 px-4 py-2 rounded text-gray-300">
                  <Timer size={20} className="text-yellow-600" /> 
                  <span className="font-mono font-bold text-lg">{contest.durationMinutes}</span>
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>

              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                {contest.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <div className="flex items-center gap-4 text-sm text-gray-500 font-mono">
                  <span className="flex items-center gap-2"><Zap size={16} /> Rated</span>
                  <span className="flex items-center gap-2"><Code size={16} /> Verilog</span>
                </div>

                <Link 
                  to={`/contest/${contest._id}`}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-transform active:scale-95"
                >
                  Start Contest <ArrowRight size={18} />
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContestList;