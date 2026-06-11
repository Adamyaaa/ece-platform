import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_URL } from './config';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Send, Eye, Edit3, X } from 'lucide-react';

const TAG_OPTIONS = ['VLSI', 'RISC-V', 'Embedded', 'IoT', 'FPGA', 'Verilog', 'Analog', 'Digital', 'Project', 'Internship', 'Placement', 'Research'];

export default function CreateBlog() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ uid: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({ uid: fbUser.uid, name: fbUser.displayName || 'Anonymous', email: fbUser.email || '' });
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handlePublish = async () => {
    if (!user) { setError('Please log in to publish a blog.'); return; }
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim()) { setError('Content is required.'); return; }

    const userId = localStorage.getItem('userId');
    if (!userId) { setError('User ID not found. Please log in again.'); return; }

    setPublishing(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/api/blogs`, {
        title: title.trim(),
        content,
        tags: selectedTags,
        authorId: userId,
        authorName: user.name,
        authorEmail: user.email,
      });
      navigate(`/blogs/${res.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish. Try again.');
      setPublishing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Please log in to write a blog post.</p>
        <button onClick={() => navigate('/login')} className="text-blue-500 hover:text-blue-400 text-sm font-medium">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] text-white">
      <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Write a Blog</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(!preview)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${preview ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'text-gray-500 border-gray-800 hover:text-gray-300'}`}>
              {preview ? <><Edit3 size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
            </button>
            <button onClick={handlePublish} disabled={publishing} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={13} /> {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          placeholder="Blog title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-3xl font-bold text-white placeholder-gray-700 mb-4"
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {TAG_OPTIONS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${selectedTags.includes(tag) ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'text-gray-600 border-gray-800 hover:text-gray-400 hover:border-gray-700'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Editor / Preview */}
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#0a0a0a]">
          {preview ? (
            <div className="p-6 min-h-[400px] prose prose-invert prose-sm max-w-none prose-headings:text-gray-100 prose-h2:text-xl prose-p:text-gray-400 prose-p:leading-relaxed prose-a:text-blue-400 prose-strong:text-gray-200 prose-code:text-blue-300 prose-code:bg-blue-600/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-[#111] prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-lg prose-blockquote:border-l-blue-600 prose-blockquote:text-gray-400 prose-ul:text-gray-400 prose-ol:text-gray-400">
              {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p className="text-gray-600 italic">Nothing to preview yet...</p>}
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 border-b border-gray-800/50 text-xs text-gray-600">
                Markdown supported — use **bold**, *italic*, # headings, ```code blocks```, - lists
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your knowledge, experience, or project learnings...&#10;&#10;Tip: Use Markdown for formatting.&#10;# Heading&#10;**bold** *italic*&#10;- bullet points&#10;```code blocks```"
                className="w-full min-h-[400px] p-6 bg-transparent text-gray-300 text-sm font-mono leading-relaxed resize-y outline-none placeholder-gray-700"
              />
            </div>
          )}
        </div>

        {/* Writing as */}
        <div className="mt-4 text-xs text-gray-600">
          Publishing as <span className="text-gray-400 font-medium">{user.name}</span>
        </div>
      </div>
    </div>
  );
}
