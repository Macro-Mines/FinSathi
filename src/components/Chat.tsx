import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  Info,
  Mic,
  Paperclip,
  ArrowLeft,
  MoreVertical,
  CheckCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Transaction, UserProfile } from '../types';
import { getFinancialAdvice } from '../services/gemini';
import { cn } from '../lib/utils';

interface ChatProps {
  transactions: Transaction[];
  profile: UserProfile;
  initialMessages?: ChatMessage[];
  onNewMessage?: (msg: ChatMessage) => void;
  onBack?: () => void;
}

const QUICK_CHIPS = [
  'Show my top 5 expense categories 📊',
  'What\'s my savings rate this month? 💰',
  'Am I overspending on food? 🍔',
  'Suggest a budget plan next month 📈',
  'Where can I cut back? ✂️',
  'Tell me a finance joke 😄'
];

interface ChatProps {
  transactions: Transaction[];
  profile: UserProfile;
  initialMessages?: ChatMessage[];
  onNewMessage?: (msg: ChatMessage) => void;
  onBack?: () => void;
}

export function Chat({ transactions, profile, initialMessages = [], onNewMessage, onBack }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll if messages length changed or loading state changed
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      userId: profile.uid,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    onNewMessage?.(userMsg);
    setInput('');
    setIsLoading(true);

    try {
      // Use pro model for advice
      const response = await getFinancialAdvice(text, transactions, profile, [...messages, userMsg]);
      const botMsg: ChatMessage = {
        userId: profile.uid,
        role: 'model',
        content: response || 'I am sorry, I could not process that request.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);
      onNewMessage?.(botMsg);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        userId: profile.uid,
        role: 'model',
        content: "Mitr, I ran into an error. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden glass-card rounded-[2rem] border-glass-border bg-surface-base shadow-2xl relative">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0"
        style={{ 
          backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass-border bg-surface-raised/80 backdrop-blur-xl z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center active:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-text-primary" />
          </button>
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 transition-all group-hover:scale-105">
              <Sparkles className="w-6 h-6 text-brand-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-4 border-surface-base shadow-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-text-primary leading-tight tracking-tight">FinSathi AI</h3>
              <span className="px-1.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest">Pro</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Ready to help</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all active:scale-95">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60%] text-center p-6 space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="w-24 h-24 bg-brand-primary/5 rounded-[2.5rem] flex items-center justify-center shadow-inner relative"
              >
                <div className="absolute inset-0 bg-brand-primary/10 rounded-[2.5rem] blur-2xl animate-pulse" />
                <Bot className="w-12 h-12 text-brand-primary drop-shadow-sm" />
              </motion.div>
              <div className="space-y-2 max-w-xs">
                <h4 className="text-xl font-black text-text-primary tracking-tight">Namaste! I'm your FinSathi</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  I've analyzed your {transactions.length} transactions. Ask me anything about your spending or goals!
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {QUICK_CHIPS.slice(0, 3).map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="px-4 py-2 rounded-2xl bg-surface-card border border-glass-border text-xs font-bold text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0 : 0 }}
              className={cn(
                "flex flex-col max-w-[88%] md:max-w-[75%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-3 rounded-2xl shadow-sm relative group transition-all",
                msg.role === 'user' 
                  ? "brand-gradient text-white rounded-tr-none shadow-brand-primary/10" 
                  : "bg-surface-card text-text-primary border border-glass-border rounded-tl-none"
              )}>
                <div className="text-[13px] leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className={cn(
                  "flex items-center justify-end gap-1.5 mt-2",
                  msg.role === 'user' ? "text-white/60" : "text-text-secondary/60"
                )}>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'user' && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mr-auto flex flex-col gap-2"
            >
              <div className="bg-surface-card border border-glass-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--brand-primary),0.5)]" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--brand-primary),0.5)]" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(var(--brand-primary),0.5)]" />
                </div>
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] animate-pulse">Analyzing Data</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface-raised/80 backdrop-blur-xl border-t border-glass-border z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 max-w-full">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="px-4 py-2 rounded-2xl bg-surface-card border border-glass-border text-[10px] font-black text-text-secondary whitespace-nowrap hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95 shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 flex items-center gap-2 bg-surface-card border border-glass-border rounded-3xl px-4 py-2 min-h-[48px] focus-within:border-brand-primary/50 transition-all shadow-inner">
            <button className="text-text-secondary hover:text-brand-primary transition-all active:scale-90">
              <Paperclip className="w-5 h-5 rotate-45" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
              placeholder="Ask FinSathi anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder:text-text-secondary/40 resize-none max-h-32 py-2"
              rows={1}
            />
            <button className="text-brand-primary hover:scale-110 transition-all active:scale-90">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-12 h-12 rounded-3xl flex items-center justify-center shadow-xl transition-all active:scale-90",
              input.trim() ? "brand-gradient text-white shadow-brand-primary/30" : "bg-surface-raised text-text-secondary"
            )}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
