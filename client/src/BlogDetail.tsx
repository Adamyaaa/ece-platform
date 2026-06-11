import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_URL } from './config';
import { ArrowLeft, Calendar, User, Heart, Trash2 } from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  tags: string[];
  likes: string[];
  createdAt: string;
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    if (!id) return;
    axios.get(`${API_URL}/api/blogs/${id}`)
      .then(res => {
        setBlog(res.data);
        setLikeCount(res.data.likes?.length || 0);
        setLiked(res.data.likes?.includes(userId));
      })
      .catch(() => setError('Blog not found'))
      .finally(() => setLoading(false));
  }, [id, userId]);

  const handleLike = async () => {
    if (!userId) { alert('Please log in to like posts.'); return; }
    try {
      const res = await axios.post(`${API_URL}/api/blogs/${id}/like`, { userId });
      setLikeCount(res.data.likes.length);
      setLiked(res.data.likes.includes(userId));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this blog?')) return;
    try {
      await axios.delete(`${API_URL}/api/blogs/${id}`, { data: { userId } });
      navigate('/blogs');
    } catch (err) { console.error(err); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) return (<div className="min-h-screen bg-[#060606] flex items-center justify-center"><div className="text-gray-500 animate-pulse font-mono">Loading...</div></div>);
  if (error || !blog) return (<div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center gap-4"><p className="text-gray-500">{error || 'Not found'}</p><Link to="/blogs" className="text-blue-500 text-sm flex items-center gap-1"><ArrowLeft size={14} /> Back</Link></div>);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] text-white">
      <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/blogs" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-400 text-sm mb-8 transition-colors"><ArrowLeft size={14} />Back to Blogs</Link>

        <article>
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map(t => (<span key={t} className="text-[10px] font-bold uppercase tracking-wider bg-blue-600/15 text-blue-400 px-2.5 py-1 rounded border border-blue-600/20">{t}</span>))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{blog.title}</h1>

          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-800/50">
            <span className="flex items-center gap-1.5"><User size={14} /><span className="text-gray-300 font-medium">{blog.authorName}</span></span>
            <span className="flex items-center gap-1.5"><Calendar size={14} />{fmtDate(blog.createdAt)}</span>
            <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ml-auto ${liked ? 'bg-red-600/15 border-red-600/30 text-red-400' : 'border-gray-800 text-gray-500 hover:text-red-400 hover:border-red-600/30'}`}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} /><span className="text-xs font-bold">{likeCount}</span>
            </button>
            {userId === blog.authorId && (
              <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-800 text-gray-500 hover:text-red-400 hover:border-red-600/30 transition-all"><Trash2 size={14} /><span className="text-xs font-bold">Delete</span></button>
            )}
          </div>

          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-gray-100 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-800/50 prose-h3:text-lg prose-p:text-gray-400 prose-p:leading-relaxed prose-a:text-blue-400 prose-strong:text-gray-200 prose-code:text-blue-300 prose-code:bg-blue-600/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-lg prose-blockquote:border-l-blue-600 prose-blockquote:text-gray-400 prose-ul:text-gray-400 prose-ol:text-gray-400 prose-li:marker:text-gray-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-800/50 flex items-center justify-between">
            <div className="text-xs text-gray-600">Written by <span className="text-gray-400 font-medium">{blog.authorName}</span></div>
            <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${liked ? 'bg-red-600/15 border-red-600/30 text-red-400' : 'border-gray-800 text-gray-500 hover:text-red-400 hover:border-red-600/30'}`}>
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} /><span className="text-sm font-bold">{liked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
