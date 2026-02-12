import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Trophy, BookOpen, ArrowRight } from 'lucide-react';

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 text-center max-w-6xl mx-auto relative z-10">

        <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-md">
          The Future of Hardware Design
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
          Master <span className="text-blue-400">Digital Logic</span> <br />
          <span className="text-white text-5xl md:text-7xl">Like a Pro.</span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Write Verilog in your browser, visualize waveforms instantly, and compete with engineers worldwide.
          No installation required.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6 items-center">
          <Link to="/problems" className="btn-primary group">
            Start Coding Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/roadmap" className="btn-secondary">
            View Learning Path
          </Link>
        </div>

        {/* Dashboard Preview (Glass Card) */}
        <div className="mt-24 p-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl relative">
          <div className="rounded-xl bg-[#0d1117] p-6 min-h-[300px] flex flex-col">
            {/* Mock Editor Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="text-gray-500 text-xs ml-2 font-mono">counter.v</span>
            </div>
            {/* Mock Code Lines */}
            <div className="font-mono text-sm text-left space-y-1 text-gray-400">
              <p><span className="text-purple-400">module</span> <span className="text-blue-300">counter</span> (</p>
              <p className="pl-6"><span className="text-purple-400">input</span> clk, reset,</p>
              <p className="pl-6"><span className="text-purple-400">output reg</span> [3:0] count</p>
              <p>);</p>
              <p className="mt-2"><span className="text-purple-400">always</span> @(<span className="text-purple-400">posedge</span> clk) <span className="text-purple-400">begin</span></p>
              <p className="pl-6"><span className="text-purple-400">if</span> (reset) count &lt;= <span className="text-green-400">4'b0000</span>;</p>
              <p className="pl-6"><span className="text-purple-400">else</span> count &lt;= count + <span className="text-green-400">1</span>;</p>
              <p><span className="text-purple-400">end</span></p>
              <p><span className="text-purple-400">endmodule</span></p>
            </div>
          </div>
        </div>

      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Code2 className="text-blue-400" size={32} />}
            title="Instant Simulation"
            desc="Run Verilog code directly in your browser. No EDA tools, no installation, just pure logic design."
          />
          <FeatureCard
            icon={<Trophy className="text-yellow-400" size={32} />}
            title="Global Leaderboards"
            desc="Compete in weekly contests. Climb the ranks from Novice to Principal Engineer."
          />
          <FeatureCard
            icon={<BookOpen className="text-purple-400" size={32} />}
            title="Interactive Learning"
            desc="Curated roadmaps guiding you from basic logic gates to advanced RISC-V processor design."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Code2 size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Veri<span className="text-blue-500">Code</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The open platform for mastering digital logic design. Write, simulate, and compete — all in your browser.
              </p>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><Link to="/problems" className="text-gray-400 text-sm hover:text-white transition-colors">Problem Bank</Link></li>
                <li><Link to="/contests" className="text-gray-400 text-sm hover:text-white transition-colors">Contests</Link></li>
                <li><Link to="/roadmap" className="text-gray-400 text-sm hover:text-white transition-colors">Learning Roadmap</Link></li>
                <li><Link to="/blogs" className="text-gray-400 text-sm hover:text-white transition-colors">Blogs</Link></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Verilog Reference</a></li>
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">API Guide</a></li>
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Community Links */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Community</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} VeriCode. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Component for the cards
function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="glass-card p-10 rounded-2xl hover:-translate-y-2 group">
      <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-base">{desc}</p>
    </div>
  );
}

export default Home;