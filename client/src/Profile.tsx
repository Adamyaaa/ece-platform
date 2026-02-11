import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Code, Trophy, MapPin, AlertTriangle } from 'lucide-react';

function Profile() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setError("No User ID found. Please Log In again.");
      setLoading(false);
      return;
    }

    axios.get(`http://localhost:5000/api/users/${userId}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ API Error:", err);
        setError("Server Error: Could not fetch user data. Is the backend running?");
        setLoading(false);
      });
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-pulse text-blue-500 font-mono text-xl">Loading Profile...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <AlertTriangle className="text-red-500 mb-4" size={48} />
      <h2 className="text-2xl font-bold text-red-400 mb-2">Profile Error</h2>
      <p className="text-gray-400 mb-6">{error}</p>
      <a href="/login" className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-500 transition-all">
        Go to Login
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-800 pb-8 mb-8">
          
          {/* 🐱 CAT IMAGE FOR ALL USERS */}
          {/* Make sure you saved the image as 'cat-profile.jpg' in your 'public' folder */}
          <img 
            src="/cat-profile.jpg" 
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-800 shadow-lg"
          />
          
          <div>
            <h1 className="text-3xl font-bold">{user.username || "Unknown User"}</h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <MapPin size={16} /> Verilog Developer
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg"><Code size={24} /></div>
              <span className="text-gray-400 font-medium">Problems Solved</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {user.solvedProblems ? user.solvedProblems.length : 0}
            </div>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-lg"><Trophy size={24} /></div>
              <span className="text-gray-400 font-medium">Rank</span>
            </div>
            <div className="text-4xl font-bold text-white">#42</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;