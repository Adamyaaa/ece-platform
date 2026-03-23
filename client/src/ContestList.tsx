import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import { Trophy, Timer, ArrowRight, Zap, Code, Calendar, Clock } from 'lucide-react';

interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "Live" | "Upcoming" | "Past";
  problemCount?: number;
}

function ContestList() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/contests`)
      .then(res => {
        setContests(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching contests:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-gray-500 animate-pulse text-lg font-mono">Loading Arena...</div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Trophy className="text-yellow-500" size={40} />
            <span className="text-white">Contest Arena</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Compete in real-time. Prove your Verilog skills.
          </p>
        </div>

        {/* Contest List */}
        <div className="flex flex-col gap-6">
          {contests.length === 0 && (
            <div className="text-center text-gray-500 py-10">No contests scheduled. check back later.</div>
          )}

          {contests.map((contest) => {
            const isLive = contest.status === 'Live';
            const isUpcoming = contest.status === 'Upcoming';
            const isPast = contest.status === 'Past';

            return (
              <div
                key={contest._id}
                className={`relative bg-[#0a0a0a] border rounded-xl p-6 transition-all group overflow-hidden ${isLive
                    ? 'border-red-900/50 shadow-[0_0_30px_-5px_rgba(220,38,38,0.2)]'
                    : isUpcoming ? 'border-blue-900/30 hover:border-blue-700/50'
                      : 'border-gray-800 opacity-70 hover:opacity-100'
                  }`}
              >
                {/* Status Badge */}
                <div className="absolute top-0 right-0">
                  {isLive && (
                    <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping mr-1"></span> LIVE
                    </div>
                  )}
                  {isUpcoming && (
                    <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      UPCOMING
                    </div>
                  )}
                  {isPast && (
                    <div className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-bl-lg">
                      ENDED
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className={`text-2xl font-bold ${isLive ? 'text-white' : 'text-gray-200'}`}>
                        {contest.title}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${contest.difficulty === 'Beginner' ? 'border-green-800 text-green-400 bg-green-900/10' :
                          contest.difficulty === 'Intermediate' ? 'border-yellow-800 text-yellow-400 bg-yellow-900/10' :
                            'border-red-800 text-red-400 bg-red-900/10'
                        }`}>
                        {contest.difficulty}
                      </span>
                    </div>

                    <p className="text-gray-400 mb-4 text-sm max-w-xl">
                      {contest.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(contest.startTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {contest.durationMinutes} mins
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Code size={14} /> Verilog
                      </span>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div>
                    {isLive ? (
                      <Link
                        to={`/contest/${contest._id}`}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-900/20"
                      >
                        Enter Contest <ArrowRight size={18} />
                      </Link>
                    ) : isUpcoming ? (
                      <button
                        disabled
                        className="bg-[#1a1a1a] border border-gray-700 text-gray-400 font-bold px-6 py-3 rounded-lg flex items-center gap-2 cursor-not-allowed"
                      >
                        Starts Soon <Clock size={18} />
                      </button>
                    ) : (
                      <Link
                        to={`/contest/${contest._id}`}
                        className="bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        View Results <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ContestList;