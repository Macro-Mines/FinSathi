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
  'Show my top 5 expense categories',
  'What\'s my savings rate this month?',
  'Am I overspending on food?',
  'Suggest a budget plan for next month',
  'Where can I cut back?'
];

export function Chat({ transactions, profile, initialMessages = [], onNewMessage, onBack }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      const response = await getFinancialAdvice(text, transactions, profile, messages);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden glass-card rounded-[2rem] border-glass-border bg-surface-base">
      {/* Zone 1: WhatsApp-style Header */}
      <div className="flex items-center justify-between p-3 border-b border-glass-border bg-surface-raised/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center active:bg-surface-raised"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
              <Bot className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-base" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary leading-tight">FinSathi AI</h3>
            <p className="text-[10px] text-green-500 font-medium">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-raised">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Zone 2: Message History with WhatsApp Background */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{ 
            backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
            backgroundSize: '400px',
            backgroundRepeat: 'repeat',
          }}
        />
        
        <div 
          ref={scrollRef} 
          className="h-full overflow-y-auto p-4 space-y-3 no-scrollbar relative z-0"
        >
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-8 h-8 text-brand-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-text-primary">How can I help today?</h4>
                <p className="text-xs text-text-secondary max-w-[200px] mx-auto">
                  I can analyze your spending, suggest budgets, or answer any financial questions.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[85%] md:max-w-[70%]",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-3 py-2 rounded-2xl shadow-sm relative",
                msg.role === 'user' 
                  ? "bg-brand-primary text-white rounded-tr-none" 
                  : "bg-surface-card text-text-primary border border-glass-border rounded-tl-none"
              )}>
                <div className="text-xs leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className={cn(
                  "flex items-center justify-end gap-1 mt-1",
                  msg.role === 'user' ? "text-white/70" : "text-text-secondary"
                )}>
                  <span className="text-[8px] font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'user' && <CheckCheck className="w-3 h-3 text-blue-300" />}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mr-auto bg-surface-card border border-glass-border px-3 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2"
            >
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-brand-primary rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-brand-primary rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-brand-primary rounded-full" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Thinking...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone 3: WhatsApp-style Input Area */}
      <div className="p-3 bg-surface-raised/50 backdrop-blur-md border-t border-glass-border">
        {/* Quick Prompt Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-full bg-surface-card border border-glass-border text-[9px] font-bold text-text-secondary whitespace-nowrap hover:border-brand-primary transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-card border border-glass-border rounded-2xl px-3 py-1.5 min-h-[40px]">
            <button className="text-text-secondary hover:text-brand-primary transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder:text-text-secondary/50 resize-none max-h-32 py-1"
              rows={1}
            />
            <button className="text-text-secondary hover:text-brand-primary transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90",
              input.trim() ? "brand-gradient text-white" : "bg-surface-raised text-text-secondary"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
