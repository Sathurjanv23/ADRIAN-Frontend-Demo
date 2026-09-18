'use client';

import { useState, useRef, useEffect } from 'react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Send, Mic, ChevronRight, AlertTriangle, Users, Package, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import type { CopilotMessage } from '@/types';
import type { CopilotChatResponse, CopilotStatusResponse } from '@/lib/copilot/types';

// ─── Suggested Prompts ─────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "What are the most critical active incidents?",
  "Which incident should we respond to first?",
  "Which rescue teams are currently available?",
  "Where should we deploy the nearest rescue team?",
  "Which zones are at highest risk?",
  "Which hospitals have available ICU capacity?",
  "What resources are running low in stock?",
  "Give me a summary of the current emergency situation.",
];

export default function CopilotPage() {
  const { incidents, rescueTeams, resources } = useNovaStore();

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello, I'm **ADRIAN Copilot** — your AI emergency operations assistant. I have full situational awareness of all active incidents, team deployments, hospital capacities, and risk predictions in the system.\n\nHow can I assist you right now?",
      timestamp: new Date().toISOString(),
      sources: ['Live Database', 'Local Reasoning Engine'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [modelName, setModelName] = useState('llama3.2');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  // Check local reasoning engine health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/copilot/status');
        if (res.ok) {
          const data: CopilotStatusResponse = await res.json();
          setServiceStatus(data.online ? 'online' : 'offline');
          if (data.model) setModelName(data.model);
        } else {
          setServiceStatus('offline');
        }
      } catch {
        setServiceStatus('offline');
      }
    }
    checkHealth();
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userText = text.trim();
    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setErrorMessage(null);

    // Build recent conversation history
    const conversationHistory = messages.slice(-6).map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversation: conversationHistory,
        }),
      });

      const data: CopilotChatResponse = await res.json();

      if (data.success && data.message) {
        const aiMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          confidence: data.confidence,
          sources: data.sources,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setServiceStatus('online');
      } else {
        const errorContent = data.message || 'ADRIAN Copilot is temporarily unavailable because the local AI service is offline.';
        const errorMsg: CopilotMessage = {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Service Notice:** ${errorContent}`,
          timestamp: new Date().toISOString(),
          sources: data.sources || ['System Health'],
        };
        setMessages((prev) => [...prev, errorMsg]);
        if (res.status === 503) setServiceStatus('offline');
      }
    } catch {
      const fallbackMsg: CopilotMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ **Network Notice:** Unable to reach the ADRIAN Copilot service. Please try again in a moment.',
        timestamp: new Date().toISOString(),
        sources: ['Local Connection'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setServiceStatus('offline');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Markdown-like formatter
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-nova-text font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-em-text-dim">$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-er-blue font-bold text-sm mt-3 mb-1.5">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-nova-text font-bold text-sm mt-4 mb-2">$1</h2>')
      .replace(/^• (.+)$/gm, '<div class="flex gap-2 mt-1"><span class="text-er-blue mt-0.5 flex-shrink-0">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 mt-1"><span class="text-er-blue font-mono text-xs mt-0.5 flex-shrink-0">→</span><span>$1</span></div>')
      .replace(/\n\n/g, '</p><p class="mt-2.5">')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-em-bg">
      <TopNav role="officer" />
      <DashboardShell role="officer">
        <div className="h-[calc(100vh-116px)] flex">
          {/* Main Chat */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="border-b border-em-border px-6 py-4 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-nova-bg",
                  serviceStatus === 'online' ? "bg-nova-low" : serviceStatus === 'offline' ? "bg-red-500" : "bg-yellow-400"
                )} />
              </div>
              <div>
                <h1 className="text-base font-bold text-nova-text">ADRIAN Copilot</h1>
                <p className="text-xs text-purple-400">
                  AI Emergency Operations Assistant · {serviceStatus === 'online' ? `Online (${modelName})` : serviceStatus === 'offline' ? 'Offline (reasoning engine unavailable)' : 'Checking Service...'}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-em-text-muted">
                <div className={cn("w-1.5 h-1.5 rounded-full", serviceStatus === 'online' ? "bg-nova-low" : "bg-red-400")} />
                {serviceStatus === 'online' ? 'Full operational context' : 'Local AI Offline'}
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                      <Cpu className="w-4 h-4 text-purple-400" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-nova-cyan text-nova-bg rounded-br-sm'
                      : 'bg-white border border-em-border rounded-bl-sm'
                  )}>
                    {msg.role === 'assistant' ? (
                      <div>
                        <div
                          className="text-sm text-nova-text leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: `<p>${formatContent(msg.content)}</p>` }}
                        />
                        {/* Sources Pill list */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-em-border flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-em-text-muted font-bold uppercase tracking-wider">Sources:</span>
                            {msg.sources.map((src, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/25 text-purple-300">
                                {src}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium">{msg.content}</p>
                    )}
                    <div className={cn('flex items-center gap-2 mt-2', msg.role === 'user' ? 'justify-end text-nova-bg/60' : 'text-em-text-muted')}>
                      <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                      {msg.confidence !== undefined && msg.confidence > 0 ? (
                        <span className="text-[10px] text-purple-400 font-mono">Data Coverage: {msg.confidence}%</span>
                      ) : msg.role === 'assistant' ? (
                        <span className="text-[10px] text-em-text-muted">Data Coverage: Unavailable</span>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="bg-white border border-em-border rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>NOVA AI is analyzing live operational context & reasoning...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-em-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <button
                  type="button"
                  title="Voice input"
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-white border border-em-border flex items-center justify-center text-em-text-muted hover:text-nova-text hover:border-em-border-strong transition-all"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ADRIAN Copilot about incidents, teams, hospital capacity, risk predictions..."
                  disabled={isTyping}
                  className="flex-1 bg-white border border-em-border rounded-xl px-4 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/40 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-nova-cyan text-nova-bg flex items-center justify-center hover:bg-nova-cyan-dim transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right sidebar — Suggested queries & live stats */}
          <div className="w-64 border-l border-em-border bg-white/30 p-4 space-y-4 overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">Suggested Queries</p>
              <div className="space-y-1.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={isTyping}
                    className="w-full text-left text-xs text-em-text-dim hover:text-nova-text hover:bg-em-subtle px-3 py-2 rounded-lg border border-transparent hover:border-em-border transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3 flex-shrink-0 text-er-blue" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-em-border pt-4">
              <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">Live System Context</p>
              <div className="space-y-2">
                {[
                  {
                    icon: <AlertTriangle className="w-3.5 h-3.5" />,
                    label: 'Active Incidents',
                    value: incidents.filter((i) => i.status !== 'resolved').length.toString(),
                    color: 'text-red-400',
                  },
                  {
                    icon: <Users className="w-3.5 h-3.5" />,
                    label: 'Teams Deployed',
                    value: rescueTeams.filter((t) => t.status !== 'available').length.toString(),
                    color: 'text-er-blue',
                  },
                  {
                    icon: <Package className="w-3.5 h-3.5" />,
                    label: 'Low Resources',
                    value: resources.filter((r) => r.status === 'low_stock' || r.status === 'critical_stock').length.toString(),
                    color: 'text-orange-400',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-white border border-em-border">
                    <div className="flex items-center gap-2 text-em-text-muted">
                      {item.icon}
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <span className={cn('text-sm font-bold font-mono', item.color)}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
