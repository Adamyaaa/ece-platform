import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Trophy, BookOpen, ArrowRight } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-6 leading-tight">
          Master <span className="text-blue-500">Digital Design</span> <br />
          & Hardware Engineering
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          The world's first competitive programming platform dedicated to ECE. 
          Practice Verilog, simulate waveforms, and compete in global contests.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/problems" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all">
            Start Coding <ArrowRight size={20} />
          </Link>
          <Link to="/roadmap" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-bold text-lg border border-gray-700 transition-all">
            View Roadmap
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Code2 className="text-blue-400" size={40} />}
            title="Verilog Interpreter"
            desc="Run Verilog code directly in your browser with instant waveform feedback."
          />
          <FeatureCard 
            icon={<Trophy className="text-yellow-400" size={40} />}
            title="Weekly Contests"
            desc="Compete with thousands of ECE students worldwide and build your rating."
          />
          <FeatureCard 
            icon={<BookOpen className="text-green-400" size={40} />}
            title="Curated Roadmap"
            desc="Step-by-step guide to mastering Digital Electronics, from Gates to Processors."
          />
        </div>
      </section>
    </div>
  );
}

// Helper Component for the cards
function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all">
      <div className="mb-4 bg-gray-900 w-16 h-16 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

export default Home;