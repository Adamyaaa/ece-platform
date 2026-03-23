import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './navbar';

// Lazy Load Pages for Performance
const Home = React.lazy(() => import('./Home'));
const ProblemBank = React.lazy(() => import('./ProblemBank'));
const ProblemPage = React.lazy(() => import('./ProblemPage'));
const BlogPage = React.lazy(() => import('./BlogPage'));
const ContestList = React.lazy(() => import('./ContestList'));
const ContestPage = React.lazy(() => import('./ContestPage'));
const Profile = React.lazy(() => import('./Profile'));
const Login = React.lazy(() => import('./Login'));
const Signup = React.lazy(() => import('./Signup'));
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));

// Loading Spinner Component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Navbar />
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Main Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/problems" element={<ProblemBank />} />
            <Route path="/problems/:id" element={<ProblemPage />} />
            <Route path="/blogs" element={<BlogPage />} />

            <Route path="/contests" element={<ContestList />} />
            <Route path="/contest/:id" element={<ContestPage />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin" element={<AdminDashboard />} />

          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;