"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  GitBranch,
  Linkedin,
  SendHorizonal,
  Sparkles,
  Bot,
  ChevronRight,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Say hello 👋",
  "Crawl a GitHub repo",
  "Crawl a LinkedIn profile",
  "What can you do?",
];

const THREAD_ID = "thread-" + Math.random().toString(36).slice(2, 7);
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function ChatUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<null | {
    tool_name: string;
    tool_args: Record<string, string>;
    description: string;
  }>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: THREAD_ID, message: trimmed }),
      });
      const data = await res.json();
      if (data.status === "awaiting_approval") {
        setPending(data.pending);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Could not reach the backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

const handleApproval = async (approved: boolean) => {
    setPending(null);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/approval`, {  // ← /approval not /approve
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: THREAD_ID,
          decision: approved ? "approve" : "reject",  // ← string not boolean
          feedback: null,
        }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Approval request failed." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="flex flex-col items-center gap-6 py-6 px-3 w-14 border-r border-white/5 bg-white/[0.02]">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
          <Bot size={16} />
        </div>
        <div className="flex-1 flex flex-col items-center gap-4 mt-4">
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition" title="Chat">
            <MessageSquare size={18} />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition" title="GitHub">
            <GitBranch size={18} />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition" title="LinkedIn">
            <Linkedin size={18} />
          </button>
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
          Y
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-sm font-medium text-gray-200">HITL Assistant</span>
          </div>
          <span className="text-xs text-gray-600 font-mono">{THREAD_ID}</span>
        </header>

        {/* Messages / Empty state */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

          {messages.length === 0 && !pending ? (
            /* ── Empty / Welcome state ── */
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center h-full text-center gap-6 pt-16"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-xl shadow-blue-600/10">
                  <Bot size={28} className="text-blue-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  What can I help with?
                </h1>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  Chat naturally, or let me crawl GitHub repos and LinkedIn
                  profiles — with your approval before every action.
                </p>
              </div>

              {/* Capability pills */}
              <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                <div className="flex gap-2 flex-wrap justify-center">
                  {[
                    { icon: <GitBranch size={12} />, label: "GitHub repo crawl" },
                    { icon: <Linkedin size={12} />, label: "LinkedIn profile" },
                    { icon: <MessageSquare size={12} />, label: "General chat" },
                  ].map(({ icon, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-400"
                    >
                      {icon} {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Try suggestions */}
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <p className="text-xs text-gray-600 uppercase tracking-widest">Try</p>
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => send(s)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-gray-300 transition"
                  >
                    {s}
                    <ChevronRight size={14} className="text-gray-600" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Approval Card */}
              <AnimatePresence>
                {pending && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="mx-auto w-full max-w-md bg-amber-500/10 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 space-y-3"
                  >
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                      ⚠ Approval Required
                    </p>
                    <p className="text-sm text-gray-200">{pending.description}</p>
                    <div className="bg-black/30 rounded-xl p-3 font-mono text-xs text-gray-400 space-y-1">
                      <div><span className="text-amber-500">tool</span>: {pending.tool_name}</div>
                      {Object.entries(pending.tool_args).map(([k, v]) => (
                        <div key={k}><span className="text-amber-500">{k}</span>: {v}</div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleApproval(true)}
                        className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition"
                      >
                        ✅ Approve
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleApproval(false)}
                        className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition"
                      >
                        ❌ Reject
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Floating Input Bar ── */}
        <div className="px-4 pb-5 pt-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/40 focus-within:border-blue-500/50 focus-within:shadow-blue-900/30 transition-all duration-200">
              <GitBranch size={16} className="text-gray-600 shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                placeholder="Message the assistant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                disabled={loading || !!pending}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => send(input)}
                disabled={loading || !!pending || !input.trim()}
                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 flex items-center justify-center transition shrink-0"
              >
                <SendHorizonal size={13} />
              </motion.button>
            </div>
            <p className="text-center text-[10px] text-gray-700 mt-2">
              All sensitive actions require your approval before execution.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}