import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from './config';
import {
  Calendar, User, ArrowRight, Search, Heart, PenLine,
  ExternalLink, BookOpen, Newspaper, Tag, Sparkles
} from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  summary: string;
  content: string;
  authorName: string;
  tags: string[];
  likes: string[];
  createdAt: string;
}

interface Article {
  _id?: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  tags: string[];
  addedAt?: string;
  publishedAt?: string;
}

const PREDEFINED_TAGS = ['VLSI', 'RISC-V', 'Embedded', 'IoT', 'FPGA', 'Verilog', 'Analog', 'Digital', 'Project', 'Internship', 'Placement', 'Research'];

const SOURCE_COLORS: Record<string, string> = {
  'GeeksForGeeks': 'bg-green-600/20 text-green-400 border-green-600/30',
  'IEEE': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  'IEEE Spectrum': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  'Semiconductor Engineering': 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  'EE Times': 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  'All About Circuits': 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30',
  'Hackaday': 'bg-red-600/20 text-red-400 border-red-600/30',
  'default': 'bg-gray-600/20 text-gray-400 border-gray-600/30',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState<'blogs' | 'articles'>('blogs');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [feedArticles, setFeedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/blogs`).then(res => setBlogs(res.data)).catch(() => setBlogs([])),
      axios.get(`${API_URL}/api/articles`).then(res => setArticles(res.data)).catch(() => setArticles([]))
    ]).finally(() => setLoading(false));
  }, []);

  // Fetch RSS feed articles when Curated Articles tab is selected
  useEffect(() => {
    if (activeTab === 'articles' && feedArticles.length === 0) {
      setFeedLoading(true);
      axios.get(`${API_URL}/api/feed`)
        .then(res => setFeedArticles(res.data))
        .catch(() => setFeedArticles([]))
        .finally(() => setFeedLoading(false));
    }
  }, [activeTab]);

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || b.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Merge admin-added articles with auto-fetched RSS feed articles
  const allArticles = [...articles, ...feedArticles];

  const filteredArticles = allArticles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || a.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Collect all tags from current data
  const allTags = Array.from(new Set([
    ...blogs.flatMap(b => b.tags),
    ...allArticles.flatMap(a => a.tags),
  ])).filter(Boolean);

  if (loading) return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center">
      <div className="text-gray-500 animate-pulse text-lg font-mono">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] text-white">

      {/* Header */}
      <div className="border-b border-gray-800/60 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                Community <span className="text-blue-400">&</span> Insights
              </h1>
              <p className="text-gray-500 text-sm">
                Share your knowledge, learn from peers, and stay updated with the ECE world.
              </p>
            </div>

            <Link
              to="/blogs/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-600/20 shrink-0"
            >
              <PenLine size={16} />
              Write a Blog
            </Link>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 mt-6 p-1 rounded-lg bg-[#111] border border-gray-800 w-fit">
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'blogs'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
            >
              <BookOpen size={14} />
              Community Blogs
              {blogs.length > 0 && <span className="ml-1 text-xs opacity-60">({blogs.length})</span>}
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'articles'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
            >
              <Newspaper size={14} />
              Curated Articles
              {allArticles.length > 0 && <span className="ml-1 text-xs opacity-60">({allArticles.length})</span>}
            </button>
          </div>

          {/* Search & Tag Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                placeholder={activeTab === 'blogs' ? 'Search blogs...' : 'Search articles...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#111] border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 p-1 rounded-lg bg-[#111] border border-gray-800 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setSelectedTag('All')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${selectedTag === 'All'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
              >All</button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${selectedTag === tag
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                >{tag}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ===== COMMUNITY BLOGS TAB ===== */}
        {activeTab === 'blogs' && (
          <>
            {filteredBlogs.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles size={40} className="mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500 text-sm mb-2">
                  {blogs.length === 0 ? 'No blogs yet. Be the first to share your knowledge!' : 'No blogs match your filters.'}
                </p>
                {blogs.length === 0 && (
                  <Link
                    to="/blogs/create"
                    className="inline-flex items-center gap-2 mt-3 text-blue-500 text-sm hover:text-blue-400 transition-colors font-medium"
                  >
                    <PenLine size={14} /> Write the first blog
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map(blog => (
                  <Link
                    key={blog._id}
                    to={`/blogs/${blog._id}`}
                    className="group glass-card rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Gradient top accent */}
                    <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />

                    <div className="p-5">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {blog.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-blue-600/15 text-blue-400 px-2 py-0.5 rounded border border-blue-600/20">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold mb-2 text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                        {blog.summary}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <User size={12} /> {blog.authorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatDate(blog.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Heart size={12} />
                          {blog.likes.length}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== CURATED ARTICLES TAB ===== */}
        {activeTab === 'articles' && (
          <>
            {feedLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Fetching latest articles...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20">
                <Newspaper size={40} className="mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500 text-sm">
                  {allArticles.length === 0 ? 'No articles available right now. Check back later!' : 'No articles match your filters.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredArticles.map(article => {
                  const sourceStyle = SOURCE_COLORS[article.source] || SOURCE_COLORS['default'];
                  return (
                    <a
                      key={article._id || article.url}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-1 md:grid-cols-[1fr_140px_120px_100px] gap-4 items-center px-5 py-4 rounded-lg bg-[#0c0c0c] border border-gray-800/40 hover:border-purple-600/40 hover:bg-[#0e0e14] transition-all duration-200"
                    >
                      {/* Title & Summary */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-gray-200 group-hover:text-purple-400 transition-colors truncate">
                            {article.title}
                          </h3>
                          <ExternalLink size={12} className="text-gray-600 group-hover:text-purple-400 shrink-0 transition-colors" />
                        </div>
                        {article.summary && (
                          <p className="text-gray-600 text-xs truncate">{article.summary}</p>
                        )}
                      </div>

                      {/* Source badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border w-fit ${sourceStyle}`}>
                        {article.source}
                      </span>

                      {/* Tags */}
                      <div className="flex gap-1 flex-wrap">
                        {article.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <span className="text-xs text-gray-600 text-right hidden md:block">
                        {formatDate(article.addedAt || article.publishedAt || '')}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
