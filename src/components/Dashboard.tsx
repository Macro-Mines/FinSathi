import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  AlertCircle, 
  PieChart as PieIcon,
  Bell,
  User as UserIcon,
  Upload as UploadIcon,
  MessageSquare,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction, CATEGORIES, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';

interface DashboardProps {
  transactions: Transaction[];
  onQuickAction?: (tab: string) => void;
}

const LIGHT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#22D3EE', '#FB923C', '#818CF8', '#2DD4BF'];

export function Dashboard({ transactions, onQuickAction }: DashboardProps) {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const COLORS = resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const stats = useMemo(() => {
    const totalInflow = transactions
      .filter(t => t.type === 'credit')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const totalOutflow = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);

    const savingsRatio = totalInflow > 0 ? ((totalInflow - totalOutflow) / totalInflow) * 100 : 0;

    const categoryData = CATEGORIES.map(cat => ({
      name: cat,
      value: transactions
        .filter(t => t.category === cat && t.type === 'debit')
        .reduce((acc, t) => acc + t.amount, 0)
    })).filter(d => d.value > 0);

    const dailyData = transactions.reduce((acc: any, t) => {
      const date = t.date;
      if (!acc[date]) acc[date] = { date, inflow: 0, outflow: 0 };
      if (t.type === 'credit') acc[date].inflow += t.amount;
      else acc[date].outflow += t.amount;
      return acc;
    }, {});

    const chartData = Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return { totalInflow, totalOutflow, savingsRatio, categoryData, chartData };
  }, [transactions]);

  return (
    <div className="space-y-4 pb-4">
      {/* Zone 1: Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-primary/20 shadow-sm">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-brand-primary" />
              </div>
            )}
          </div>
          <div>
            <p className="text-text-secondary text-[10px] font-accent uppercase tracking-widest">Namaste,</p>
            <h2 className="text-lg font-bold text-text-primary leading-tight">{user?.displayName?.split(' ')[0] || 'Friend'}</h2>
          </div>
        </div>
        <button className="w-10 h-10 rounded-xl bg-surface-card border border-glass-border flex items-center justify-center relative active:scale-90 transition-transform">
          <Bell className="w-5 h-5 text-text-secondary" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-base" />
        </button>
      </div>

      {/* Zone 2: Hero Balance Card */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative h-[160px] rounded-[2rem] overflow-hidden shadow-xl shadow-brand-primary/10"
      >
        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 brand-gradient opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#06B6D4,transparent)] mix-blend-overlay animate-pulse" />
        
        {/* Glass Overlay */}
        <div className="absolute inset-0 glass-card border-none" />

        <div className="relative h-full p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-[10px] font-accent uppercase tracking-widest mb-0.5">Total Balance</p>
              <motion.h1 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-white font-display"
              >
                {formatCurrency(stats.totalInflow - stats.totalOutflow)}
              </motion.h1>
            </div>
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <p className="text-white/60 text-[9px] uppercase tracking-wider mb-0.5">Inflow</p>
              <p className="text-white font-bold text-xs">{formatCurrency(stats.totalInflow)}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <p className="text-white/60 text-[9px] uppercase tracking-wider mb-0.5">Outflow</p>
              <p className="text-white font-bold text-xs">{formatCurrency(stats.totalOutflow)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Zone 3: Quick Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'upload', icon: UploadIcon, label: 'Upload', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { id: 'chat', icon: MessageSquare, label: 'Ask AI', color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { id: 'insights', icon: PieIcon, label: 'Insights', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { id: 'profile', icon: UserIcon, label: 'Export', color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => onQuickAction?.(action.id)}
            className="glass-card p-3 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", action.bg)}>
              <action.icon className={cn("w-5 h-5", action.color)} />
            </div>
            <span className="text-[10px] font-bold text-text-primary">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Zone 4: Recent Transactions & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Recent Activity</h3>
            <button className="text-brand-primary text-[9px] font-bold uppercase tracking-wider">View All</button>
          </div>

          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
            {transactions.length === 0 ? (
              <div className="glass-card p-6 rounded-2xl text-center border-dashed border-glass-border">
                <p className="text-[10px] text-text-secondary">No transactions yet. Upload a statement to get started.</p>
              </div>
            ) : (
              transactions.slice(0, 15).map((t, i) => (
                <motion.div
                  key={t.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass-card p-2 rounded-xl flex items-center gap-2 active:bg-surface-raised transition-colors group"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                    t.type === 'credit' ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    {t.type === 'credit' ? (
                      <ArrowUpRight className="w-4 h-4 text-credit-green" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-debit-red" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-text-primary truncate">{t.description}</h4>
                    <p className="text-[8px] text-text-secondary font-medium uppercase tracking-wider">{t.category} • {t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[11px] font-bold font-mono",
                      t.type === 'credit' ? "text-credit-green" : "text-text-primary"
                    )}>
                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="hidden lg:block space-y-3">
          <div className="glass-card p-4 rounded-[1.5rem] border-glass-border">
            <h3 className="text-[10px] font-bold text-text-primary mb-2 uppercase tracking-widest">Savings Ratio</h3>
            <div className="h-28 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Savings', value: Math.max(0, stats.savingsRatio) },
                      { name: 'Expenses', value: 100 - Math.max(0, stats.savingsRatio) }
                    ]}
                    innerRadius={35}
                    outerRadius={45}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill={resolvedTheme === 'dark' ? '#374151' : '#f3f4f6'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-bold text-text-primary">{Math.round(stats.savingsRatio)}%</p>
                <p className="text-[8px] text-text-secondary font-bold uppercase tracking-widest">Saved</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-[1.5rem] border-glass-border">
            <h3 className="text-[9px] font-bold text-text-primary mb-2 uppercase tracking-widest">Top Categories</h3>
            <div className="space-y-2">
              {stats.categoryData.slice(0, 3).map((cat, i) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-text-primary truncate max-w-[80px]">{cat.name}</span>
                    <span className="text-text-secondary">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-1 bg-surface-raised rounded-full overflow-hidden">
                    <div 
                      className="h-full brand-gradient" 
                      style={{ width: `${(cat.value / stats.totalOutflow) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
