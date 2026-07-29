import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import { Shield, Plus, Save, Terminal, Code, Trash2, Newspaper, ExternalLink } from 'lucide-react';

interface Problem {
  _id: string;
  title: string;
  difficulty: string;
}

interface ArticleItem {
  _id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  tags: string[];
}

function AdminDashboard() {
  // Form State
  const [secret, setSecret] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    difficulty: "Easy",
    category: "Digital Logic",
    description: "",
    templateCode: "module top_module( input a, input b, output out );\n    // Your code\nendmodule",
    driverCode: "",
    testbench: "module test;\n  // Write Verilog test cases here\nendmodule"
  });

  const [status, setStatus] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [deleteStatus, setDeleteStatus] = useState("");

  // Article state
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [articleForm, setArticleForm] = useState({ title: '', url: '', source: 'GeeksForGeeks', summary: '', tags: '' });
  const [articleStatus, setArticleStatus] = useState('');

  // Fetch existing problems
  useEffect(() => {
    axios.get(`${API_URL}/api/problems`)
      .then(res => setProblems(res.data))
      .catch(err => console.error(err));
    axios.get(`${API_URL}/api/articles`)
      .then(res => setArticles(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("⏳ Saving...");

    try {
      await axios.post(`${API_URL}/api/problems`, {
        ...formData,
        secret: secret
      });
      setStatus("✅ Problem Published Successfully!");
    } catch (err: any) {
      setStatus("❌ Error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleAddArticle = async () => {
    if (!secret) { setArticleStatus('Enter Admin Key above first.'); return; }
    if (!articleForm.title || !articleForm.url) { setArticleStatus('Title and URL required.'); return; }
    setArticleStatus('⏳ Adding...');
    try {
      const res = await axios.post(`${API_URL}/api/articles`, {
        ...articleForm,
        tags: articleForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        secret,
      });
      setArticles(prev => [res.data, ...prev]);
      setArticleForm({ title: '', url: '', source: 'GeeksForGeeks', summary: '', tags: '' });
      setArticleStatus('✅ Article added!');
    } catch (err: any) {
      setArticleStatus('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-4">
          <div className="bg-red-900/20 p-3 rounded-lg border border-red-900">
            <Shield className="text-red-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Admin Command Center</h1>
            <p className="text-gray-500">Add new challenges to the database.</p>
          </div>
        </div>

        {/* The Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Security & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Admin Key</label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter Secret Key..."
                className="w-full bg-[#111] border border-gray-800 rounded p-3 focus:border-red-500 outline-none text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full bg-[#111] border border-gray-800 rounded p-3 focus:border-blue-500 outline-none text-white"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-[#111] border border-gray-800 rounded p-3 focus:border-blue-500 outline-none text-white"
            >
              <option>Digital Logic</option>
              <option>Analog Circuits</option>
              <option>Verilog</option>
              <option>Embedded Systems</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Problem Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. 4-bit Counter"
              className="w-full bg-[#111] border border-gray-800 rounded p-3 focus:border-blue-500 outline-none text-xl font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Description (Markdown Supported)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the circuit requirements..."
              className="w-full bg-[#111] border border-gray-800 rounded p-3 focus:border-blue-500 outline-none text-gray-300 font-mono text-sm"
            />
          </div>

          {/* 2. Code Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase">
                <Code size={14} /> Student Template
              </label>
              <textarea
                name="templateCode"
                value={formData.templateCode}
                onChange={handleChange}
                rows={10}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 focus:border-blue-500 outline-none text-gray-300 font-mono text-xs leading-relaxed"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase">
                <Terminal size={14} /> Validation Testbench
              </label>
              <textarea
                name="testbench"
                value={formData.testbench}
                onChange={handleChange}
                rows={10}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-3 focus:border-green-500 outline-none text-gray-300 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-800">
            <div className={`font-bold ${status.includes("Error") ? "text-red-500" : "text-green-500"}`}>
              {status}
            </div>
            <button
              type="submit"
              className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded font-bold flex items-center gap-2 transition-transform active:scale-95"
            >
              <Save size={18} /> Publish Problem
            </button>
          </div>

        </form>

        {/* Manage Existing Problems */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <h2 className="text-xl font-bold mb-6 text-gray-200">Manage Problems</h2>
          {deleteStatus && (
            <p className={`mb-4 text-sm font-bold ${deleteStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {deleteStatus}
            </p>
          )}
          <div className="space-y-3">
            {problems.length === 0 ? (
              <p className="text-gray-500 text-sm">No problems found.</p>
            ) : (
              problems.map(p => (
                <div key={p._id} className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${p.difficulty === 'Easy' ? 'text-green-400 border-green-900 bg-green-900/20' :
                        p.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-900 bg-yellow-900/20' :
                          'text-red-400 border-red-900 bg-red-900/20'
                      }`}>{p.difficulty}</span>
                    <span className="text-gray-300 font-medium">{p.title}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!secret) { setDeleteStatus('Enter the Admin Key above first.'); return; }
                      if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
                      try {
                        await axios.delete(`${API_URL}/api/problems/${p._id}`, { data: { secret } });
                        setProblems(prev => prev.filter(x => x._id !== p._id));
                        setDeleteStatus(`Deleted: ${p.title}`);
                      } catch (err: any) {
                        setDeleteStatus('Error: ' + (err.response?.data?.error || err.message));
                      }
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded hover:bg-red-500/10"
                    title="Delete Problem"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ===== CURATED ARTICLES SECTION ===== */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <Newspaper className="text-purple-400" size={20} />
            <h2 className="text-xl font-bold text-gray-200">Curated Articles</h2>
          </div>

          {/* Add Article Form */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-5 mb-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase">Add External Article</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Article Title"
                value={articleForm.title}
                onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2.5 text-sm text-white outline-none focus:border-purple-500"
              />
              <input
                placeholder="URL (https://...)"
                value={articleForm.url}
                onChange={e => setArticleForm({ ...articleForm, url: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2.5 text-sm text-white outline-none focus:border-purple-500"
              />
              <select
                value={articleForm.source}
                onChange={e => setArticleForm({ ...articleForm, source: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2.5 text-sm text-white outline-none focus:border-purple-500"
              >
                <option>GeeksForGeeks</option>
                <option>IEEE</option>
                <option>Semiconductor Engineering</option>
                <option>EE Times</option>
                <option>All About Circuits</option>
                <option>Other</option>
              </select>
              <input
                placeholder="Tags (comma separated: VLSI, FPGA)"
                value={articleForm.tags}
                onChange={e => setArticleForm({ ...articleForm, tags: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2.5 text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
            <input
              placeholder="Short summary (optional)"
              value={articleForm.summary}
              onChange={e => setArticleForm({ ...articleForm, summary: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded p-2.5 text-sm text-white outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-between">
              {articleStatus && <span className={`text-sm font-bold ${articleStatus.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>{articleStatus}</span>}
              <button
                onClick={handleAddArticle}
                className="ml-auto bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Plus size={14} /> Add Article
              </button>
            </div>
          </div>

          {/* Article List */}
          <div className="space-y-2">
            {articles.length === 0 ? (
              <p className="text-gray-500 text-sm">No curated articles yet.</p>
            ) : (
              articles.map(a => (
                <div key={a._id} className="flex items-center justify-between bg-[#0c0c0c] border border-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded border border-purple-600/30 shrink-0">{a.source}</span>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 font-medium text-sm truncate hover:text-purple-400 transition-colors flex items-center gap-1">
                      {a.title} <ExternalLink size={10} className="shrink-0 opacity-50" />
                    </a>
                  </div>
                  <button
                    onClick={async () => {
                      if (!secret) { setArticleStatus('Enter Admin Key first.'); return; }
                      if (!window.confirm(`Delete article "${a.title}"?`)) return;
                      try {
                        await axios.delete(`${API_URL}/api/articles/${a._id}`, { data: { secret } });
                        setArticles(prev => prev.filter(x => x._id !== a._id));
                      } catch (err: any) {
                        setArticleStatus('❌ ' + (err.response?.data?.error || err.message));
                      }
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded hover:bg-red-500/10 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;