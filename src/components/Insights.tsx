import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  ArrowLeft, 
  Sparkles, 
  TrendingDown,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction, CATEGORIES } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useTheme } from '../ThemeContext';

interface InsightsProps {
  transactions: Transaction[];
  onBack?: () => void;
}

const LIGHT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#22D3EE', '#FB923C', '#818CF8', '#2DD4BF'];

export function Insights({ transactions, onBack }: InsightsProps) {
  const { resolvedTheme } = useTheme();
  const COLORS = resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const stats = useMemo(() => {
    const categoryData = CATEGORIES.map(cat => ({
      name: cat,
      value: transactions
        .filter(t => t.category === cat && t.type === 'debit')
        .reduce((acc, t) => acc + t.amount, 0)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const dailyData = transactions.reduce((acc: any, t) => {
      const date = t.date;
      if (!acc[date]) acc[date] = { date, inflow: 0, outflow: 0 };
      if (t.type === 'credit') acc[date].inflow += t.amount;
      else acc[date].outflow += t.amount;
      return acc;
    }, {});

    const chartData = Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date));

    return { categoryData, chartData };
  }, [transactions]);

  return (
    <div className="space-y-4 pb-4">
      {/* Zone 1: Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface-card border border-glass-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-xl font-bold text-text-primary">Financial Insights</h2>
        </div>
        <div className="flex bg-surface-raised p-1 rounded-xl border border-glass-border">
          {['Week', 'Month', 'Year'].map((period) => (
            <button
              key={period}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                period === 'Month' ? "bg-brand-primary text-white shadow-md" : "text-text-secondary"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Zone 3 & 4: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending Breakdown */}
        <div className="glass-card p-4 rounded-[2rem] border-glass-border space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <PieIcon className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Spending by Category</h3>
          </div>

          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: resolvedTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                    fontSize: '10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest">Total</p>
              <p className="text-sm font-bold text-text-primary">
                {formatCurrency(stats.categoryData.reduce((acc, d) => acc + d.value, 0))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {stats.categoryData.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-text-primary flex-1 truncate">{cat.name}</span>
                <span className="text-[9px] font-mono text-text-secondary">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow Trend */}
        <div className="glass-card p-4 rounded-[2rem] border-glass-border space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Cash Flow Trend</h3>
          </div>

          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#374151' : '#f3f4f6'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: resolvedTheme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  tickFormatter={(val) => val.split('-').slice(2).join('/')}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: resolvedTheme === 'dark' ? '#1F2937' : '#FFFFFF',
                    fontSize: '10px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="outflow" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorFlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Zone 5: AI Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary">Smart Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="glass-card p-3 rounded-2xl border-glass-border flex gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-text-primary">Subscription Leak</h4>
              <p className="text-[9px] text-text-secondary mt-0.5 leading-tight">You have 3 active subscriptions totaling ₹2,499. One hasn't been used in 30 days.</p>
            </div>
          </div>

          <div className="glass-card p-3 rounded-2xl border-glass-border flex gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-text-primary">Savings Potential</h4>
              <p className="text-[9px] text-text-secondary mt-0.5 leading-tight">Based on your current spending, you could save an extra ₹5,000 by optimizing food expenses.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
