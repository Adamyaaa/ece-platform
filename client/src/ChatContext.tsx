import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ProblemContext {
  problemId: string;
  code: string;
  output: string;
}

interface ChatContextValue {
  problemContext: ProblemContext | null;
  setProblemContext: (ctx: ProblemContext | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatContextProvider({ children }: { children: React.ReactNode }) {
  const [problemContext, setProblemContextState] = useState<ProblemContext | null>(null);
  const setProblemContext = useCallback((ctx: ProblemContext | null) => setProblemContextState(ctx), []);

  return (
    <ChatContext.Provider value={{ problemContext, setProblemContext }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within a ChatContextProvider');
  return ctx;
}
