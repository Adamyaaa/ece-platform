import React, { useEffect, useState } from 'react';
import api from './api';
import { Code, Trophy, MapPin, AlertTriangle, Camera, Check, X } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Fluffy&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Bubba&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Scooter&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Dusty&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Tiger&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Milo&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Circuit&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Chip&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Logic&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Verilog&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=FPGA&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Synth&backgroundColor=b6e3f4',
];

function Profile() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setError("No User ID found. Please Log In again.");
      setLoading(false);
      return;
    }

    api.get(`/api/users/${userId}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Error:", err);
        setError("Server Error: Could not fetch user data. Is the backend running?");
        setLoading(false);
      });
  }, [userId]);

  const updateProfilePicture = async (url: string) => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/users/${userId}/profile-picture`, {
        profilePicture: url
      });
      setUser(res.data);
      localStorage.setItem('profilePicture', url);
      setShowAvatarPicker(false);
      setCustomUrl("");
    } catch (err) {
      console.error("Error updating profile picture:", err);
    }
    setSaving(false);
  };

  const removeProfilePicture = async () => {
    await updateProfilePicture('');
    localStorage.removeItem('profilePicture');
  };

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

  const firstLetter = (user.username || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-black text-white p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-800 pb-8 mb-8">

          {/* Profile Picture with Edit Button */}
          <div className="relative group">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-2 border-blue-500/50 shadow-lg">
                {firstLetter}
              </div>
            )}
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute bottom-0 right-0 bg-gray-800 border border-gray-600 p-1.5 rounded-full hover:bg-gray-700 transition-colors group-hover:scale-110"
              title="Change Avatar"
            >
              <Camera size={14} className="text-gray-300" />
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-bold">{user.username || "Unknown User"}</h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <MapPin size={16} /> Verilog Developer
            </p>
          </div>
        </div>

        {/* Avatar Picker */}
        {showAvatarPicker && (
          <div className="mb-8 p-6 bg-[#0a0a0a] border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-200">Choose Avatar</h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preset Avatars */}
            <div className="grid grid-cols-6 gap-3 mb-6">
              {AVATAR_OPTIONS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => updateProfilePicture(url)}
                  className={`rounded-xl border-2 p-1 transition-all hover:scale-105 ${user.profilePicture === url
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-500'
                    }`}
                >
                  <img src={url} alt={`Avatar ${i + 1}`} className="w-full rounded-lg" />
                </button>
              ))}
            </div>

            {/* Custom URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="Or paste a custom image URL..."
                className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
              <button
                onClick={() => { if (customUrl.trim()) updateProfilePicture(customUrl.trim()); }}
                disabled={!customUrl.trim() || saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Check size={14} /> Set
              </button>
            </div>

            {/* Remove Button */}
            {user.profilePicture && (
              <button
                onClick={removeProfilePicture}
                className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove profile picture
              </button>
            )}
          </div>
        )}

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