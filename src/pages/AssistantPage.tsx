import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generateAcademicAiResponse } from '@/lib/academicAiClient';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Calculator,
  FileText,
  Lightbulb,
  GraduationCap,
  Loader2,
  Trash2,
  Cpu,
  Code2,
} from 'lucide-react';

interface ChatMessage {
  id?: number | string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const API_URL = 'http://localhost:5001';

const suggestions = [
  { icon: Code2, text: 'Explain Binary Search Tree insertion in Python' },
  { icon: BookOpen, text: 'Explain Database Normalization (1NF, 2NF, 3NF, BCNF)' },
  { icon: Cpu, text: 'How are students given sections at KL University?' },
  { icon: Lightbulb, text: 'Explain Dijkstra shortest path algorithm with time complexity' },
  { icon: GraduationCap, text: 'What is the UGC 75% attendance rule and semester eligibility?' },
  { icon: Code2, text: 'Compare Process vs Thread and the 4 Coffman deadlock conditions' },
];

export default function AssistantPage() {
  const { profile } = useAuth();
  const userId = Number(profile?.user_id || profile?.id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function fetchMessages() {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/ai/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const formatted: ChatMessage[] = [];
        data.forEach((item: any) => {
          if (item.question) {
            formatted.push({
              id: `q-${item.chat_id}`,
              role: 'user',
              content: item.question,
              created_at: item.created_at,
            });
          }
          if (item.answer) {
            formatted.push({
              id: `a-${item.chat_id}`,
              role: 'assistant',
              content: item.answer,
              created_at: item.created_at,
            });
          }
        });
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(textToSend?: string) {
    const userMessage = (textToSend || input).trim();
    if (!userMessage || !userId || sending) return;

    setInput('');
    setSending(true);

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('AI query failed');
      }

      const data = await response.json();
      const reply = data.reply || 'I am ready to assist you with your academic questions.';

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Backend AI error, switching to academic knowledge engine:', err);
      const fallbackReply = generateAcademicAiResponse(userMessage, { user_id: userId });
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fallbackReply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    if (!userId) return;
    try {
      await fetch(`${API_URL}/api/ai/chats/${userId}`, {
        method: 'DELETE',
      });
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-xs">Loading AI academic conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-fade-in">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                KL University AI Academic Assistant
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                GPT-4o Mini Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive academic tutoring, problem-solving, and study concepts
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
            <div className="w-16 h-16 rounded-2xl bg-red-700 text-white flex items-center justify-center mb-4 shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
              How can I assist your studies today?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Ask anything regarding your university coursework, coding problems, database queries, algorithms, or exam preparation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(s.text)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start gap-3 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    : 'bg-red-700 text-white'
                }`}
              >
                {msg.role === 'user' ? (
                  <GraduationCap className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line font-sans">{msg.content}</div>
                {msg.created_at && (
                  <p
                    className={`text-[9px] mt-2 ${
                      msg.role === 'user' ? 'text-red-200' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Generating academic explanation...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your academic or technical question..."
            className="input-field flex-1 text-xs"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary py-2.5 px-4 h-10"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
