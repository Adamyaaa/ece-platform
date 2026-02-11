import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import ProblemBank from './ProblemBank';
import ProblemPage from './ProblemPage';
import Login from './Login';   // <--- These imports were likely missing
import Signup from './Signup'; // <--- or not used in the Routes below
import Profile from './Profile';
import ContestList from './ContestList'; // <--- The New File (Menu)
import ContestPage from './ContestPage'; // <--- The Old File (Exam)

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Navbar />
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<ProblemBank />} />
          {/* 🚨 THE MISSING ROUTE 🚨 */}
          {/* This tells React: "If the URL is /problems/123, show ProblemPage and treat '123' as the ID" */}
          <Route path="/problems/:id" element={<ProblemPage />} />  {/* <--- ADD THIS LINE */}

          <Route path="/contests" element={<ContestList />} /> 
          <Route path="/contest/:id" element={<ContestPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;