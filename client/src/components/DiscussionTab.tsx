import React, { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, User, Send, Trash2 } from 'lucide-react';
import api from '../api';

interface Comment {
    _id: string;
    problemId: string;
    userId: string;
    username: string;
    text: string;
    likes: string[];
    parentId: string | null;
    createdAt: string;
}

interface Props {
    problemId: string;
}

export default function DiscussionTab({ problemId }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState("");

    const currentUserId = localStorage.getItem("userId");
    const currentUsername = localStorage.getItem("username");

    // Fetch comments
    useEffect(() => {
        if (!problemId) return;
        api.get(`/api/comments/${problemId}`)
            .then(res => { setComments(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [problemId]);

    // Post a comment
    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId || !currentUsername) return;

        try {
            const res = await api.post(`/api/comments`, {
                problemId,
                text: newComment,
                parentId: null,
            });
            setComments([res.data, ...comments]);
            setNewComment("");
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    // Post a reply
    const handleReply = async (parentId: string, text: string) => {
        if (!text.trim() || !currentUserId || !currentUsername) return;

        try {
            const res = await api.post(`/api/comments`, {
                problemId,
                text,
                parentId,
            });
            setComments([...comments, res.data]);
        } catch (error) {
            console.error("Error posting reply:", error);
        }
    };

    // Toggle like
    const handleLike = async (commentId: string) => {
        if (!currentUserId) return;

        try {
            const res = await api.post(`/api/comments/${commentId}/like`, {});
            setComments(comments.map(c => c._id === commentId ? res.data : c));
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    // Delete comment
    const handleDelete = async (commentId: string) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        try {
            await api.delete(`/api/comments/${commentId}`, {
                data: { secret: adminKey }
            });
            // Remove the deleted comment and its replies from state
            setComments(prev => prev.filter(c => c._id !== commentId && c.parentId !== commentId));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    // Admin mode toggle
    const handleAdminToggle = () => {
        if (isAdmin) {
            setIsAdmin(false);
            setAdminKey("");
        } else {
            const key = window.prompt("Enter admin key:");
            if (key) {
                setAdminKey(key);
                setIsAdmin(true);
            }
        }
    };

    // Build threaded structure
    const topLevel = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Input Area */}
            <div className="p-4 border-b border-gray-800 bg-[#111]">
                {currentUserId ? (
                    <form onSubmit={handlePost} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {currentUsername?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Ask a question or share your thoughts..."
                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none transition-colors text-white"
                                rows={2}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                >
                                    <Send size={12} /> Post Comment
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-2">Log in to join the discussion.</p>
                )}
            </div>

            {/* Admin Mode Toggle + Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {currentUserId && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleAdminToggle}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${isAdmin
                                    ? 'border-red-500/50 text-red-400 bg-red-500/10'
                                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {isAdmin ? 'Admin Mode ON' : 'Admin Mode'}
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="text-center text-gray-500 py-10 animate-pulse">Loading comments...</div>
                ) : topLevel.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <MessageSquare className="mx-auto mb-2 opacity-50" />
                        No comments yet. Be the first to start the discussion!
                    </div>
                ) : (
                    topLevel.map(comment => (
                        <CommentItem
                            key={comment._id}
                            comment={comment}
                            replies={getReplies(comment._id)}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onLike={handleLike}
                            onReply={handleReply}
                            onDelete={handleDelete}
                            formatTime={formatTime}
                            getReplies={getReplies}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface CommentItemProps {
    comment: Comment;
    replies: Comment[];
    currentUserId: string | null;
    isAdmin: boolean;
    onLike: (id: string) => void;
    onReply: (parentId: string, text: string) => void;
    onDelete: (id: string) => void;
    formatTime: (d: string) => string;
    getReplies: (parentId: string) => Comment[];
}

function CommentItem({ comment, replies, currentUserId, isAdmin, onLike, onReply, onDelete, formatTime, getReplies }: CommentItemProps) {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState("");
    const isLiked = currentUserId ? comment.likes.includes(currentUserId) : false;

    const handleSubmitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onReply(comment._id, replyText);
        setReplyText("");
        setShowReplyBox(false);
    };

    return (
        <div className="group">
            <div className="flex gap-3">
                <div className="mt-1 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-xs font-bold text-gray-400">
                        {comment.username.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-300">{comment.username}</span>
                        <span className="text-xs text-gray-600">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-2 break-words">{comment.text}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button
                            onClick={() => onLike(comment._id)}
                            className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-blue-400' : 'hover:text-blue-400'}`}
                        >
                            <ThumbsUp size={12} fill={isLiked ? "currentColor" : "none"} /> {comment.likes.length}
                        </button>
                        {currentUserId && (
                            <button
                                onClick={() => setShowReplyBox(!showReplyBox)}
                                className="hover:text-blue-400 transition-colors"
                            >
                                Reply
                            </button>
                        )}
                        {(isAdmin || (currentUserId && currentUserId === comment.userId)) && (
                            <button
                                onClick={() => onDelete(comment._id)}
                                className="flex items-center gap-1 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        )}
                    </div>

                    {/* Reply Input */}
                    {showReplyBox && (
                        <form onSubmit={handleSubmitReply} className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!replyText.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors"
                            >
                                Reply
                            </button>
                        </form>
                    )}

                    {/* Nested Replies */}
                    {replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-800 space-y-4">
                            {replies.map(reply => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    replies={getReplies(reply._id)}
                                    currentUserId={currentUserId}
                                    isAdmin={isAdmin}
                                    onLike={onLike}
                                    onReply={onReply}
                                    onDelete={onDelete}
                                    formatTime={formatTime}
                                    getReplies={getReplies}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
