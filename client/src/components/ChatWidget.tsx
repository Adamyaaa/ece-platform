import React, { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { API_URL } from '../config';
import { useChatContext } from '../ChatContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { problemContext } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !user) return;

    setError('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: nextMessages,
          problemContext: problemContext || undefined,
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <span className="font-bold text-sm flex items-center gap-2 text-white">
              <Bot size={16} className="text-blue-400" /> VeriCode AI
            </span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {!user ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-400 text-sm">
              Log in to chat with VeriCode AI.
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-xs text-center mt-4">
                    Ask about Verilog concepts, the current problem, or anything on VeriCode.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      {m.content || (sending && i === messages.length - 1 ? '…' : '')}
                    </div>
                  </div>
                ))}
                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-gray-800 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-3 py-2 transition-colors"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl flex items-center justify-center transition-colors"
        title="Ask VeriCode AI"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
