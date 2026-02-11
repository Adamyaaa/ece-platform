import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, User, LogOut } from 'lucide-react';
import { auth } from './firebaseConfig'; // Import auth
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();

  // 👂 Listen for login state changes automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update state when user logs in/out
    });
    return () => unsubscribe(); // Cleanup listener
  }, []);

  // 🚪 Logout Function
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/'); // Go home after logout
    });
  };

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
          <Link to="/problems" className="text-gray-300 hover:text-white transition-colors">Problem Bank</Link>
          <Link to="/contests" className="text-gray-300 hover:text-white transition-colors">Contests</Link>
          <Link to="/roadmap" className="text-gray-300 hover:text-white transition-colors">Roadmap</Link>
        </div>

        {/* Right Side: Auth Logic */}
        <div className="flex items-center gap-4">
          {user ? (
            // ✅ SHOW THIS IF LOGGED IN
            <>
              <Link to="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-600" />
                ) : (
                  <div className="bg-gray-700 p-1.5 rounded-full">
                    <User size={20} />
                  </div>
                )}
                <span className="font-medium hidden sm:block">{user.displayName?.split(' ')[0] || "User"}</span>
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
            // ❌ SHOW THIS IF LOGGED OUT
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