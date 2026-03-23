import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, User, LogOut } from 'lucide-react';
import { auth } from './firebaseConfig'; // Import auth
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();

  // Listen for login state changes automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update state when user logs in/out
    });
    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Logout Function
  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      localStorage.removeItem('profilePicture');
      navigate('/'); // Go home after logout
    });
  };

  const profilePicture = localStorage.getItem('profilePicture');
  const displayName = user?.displayName?.split(' ')[0] || localStorage.getItem('username') || "User";
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
            <Cpu size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Veri<span className="text-blue-500">Code</span>
          </span>
        </Link>

        {/* Middle Links */}
        <div className="flex items-center gap-6">
          <Link to="/problems" className="text-gray-300 hover:text-white hover:text-shadow-glow transition-all">Problem Bank</Link>
          <Link to="/contests" className="text-gray-300 hover:text-white hover:text-shadow-glow transition-all">Contests</Link>
          <Link to="/blogs" className="text-gray-300 hover:text-white hover:text-shadow-glow transition-all">Blogs</Link>
          <Link to="/admin" className="text-red-400 hover:text-red-300 font-bold border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition-all">
            Admin
          </Link>
        </div>

        {/* Right Side: Auth Logic */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-8 h-8 rounded-full border border-gray-600 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm border border-blue-500/50">
                    {firstLetter}
                  </div>
                )}
                <span className="font-medium hidden sm:block">{displayName}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors p-2"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white font-medium">Log In</Link>
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-medium transition-all">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;