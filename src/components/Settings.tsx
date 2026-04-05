import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Info, 
  User, 
  ChevronRight, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ArrowLeft,
  Edit2,
  CreditCard,
  Globe,
  Lock,
  Trash2
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  onBack?: () => void;
  onClearData?: () => void;
}

export function Settings({ onBack, onClearData }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const { user, profile, logout, updateProfile } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [incomeBracket, setIncomeBracket] = useState(profile?.incomeBracket || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || 'English');
  const [goals, setGoals] = useState<string[]>(profile?.goals || []);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setIncomeBracket(profile.incomeBracket || '');
      setPreferredLanguage(profile.preferredLanguage || 'English');
      setGoals(profile.goals || []);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        incomeBracket,
        preferredLanguage,
        goals
      });
      setToastMessage('Profile updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setToastMessage('Failed to update profile');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const addGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (goalToRemove: string) => {
    setGoals(goals.filter(g => g !== goalToRemove));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme !== 'system') {
      setToastMessage(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode on`);
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'dark', label: 'Dark', icon: Moon },
  ] as const;

  return (
    <div className="space-y-8 pb-8">
      {/* Zone 1: Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-surface-card border border-glass-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-2xl font-bold text-text-primary">Profile</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Zone 2: Profile Summary */}
        <div className="lg:col-span-1 glass-card p-6 rounded-[2.5rem] border-glass-border flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-5 pointer-events-none" />
          
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-brand-primary/20 shadow-xl">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-brand-primary" />
                </div>
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl brand-gradient text-white flex items-center justify-center shadow-lg border-4 border-surface-base active:scale-90 transition-transform">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary">{user?.displayName || 'FinSathi User'}</h3>
            <p className="text-sm text-text-secondary">{user?.email || 'user@example.com'}</p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <div className="flex-1 glass-card p-3 rounded-2xl border-glass-border">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Plan</p>
              <p className="text-xs font-bold text-brand-primary">Free Tier</p>
            </div>
            <div className="flex-1 glass-card p-3 rounded-2xl border-glass-border">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Joined</p>
              <p className="text-xs font-bold text-text-primary">April 2026</p>
            </div>
          </div>
        </div>

        {/* Zone 3: Settings List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4">Personal Information</h4>
            <div className="glass-card p-6 rounded-[2rem] border-glass-border space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary px-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface-raised border border-glass-border rounded-xl px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  placeholder="Your Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary px-1">Income Bracket (Annual)</label>
                  <select 
                    value={incomeBracket}
                    onChange={(e) => setIncomeBracket(e.target.value)}
                    className="w-full bg-surface-raised border border-glass-border rounded-xl px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none"
                  >
                    <option value="">Select Bracket</option>
                    <option value="0-5L">0 - 5 Lakhs</option>
                    <option value="5-10L">5 - 10 Lakhs</option>
                    <option value="10-20L">10 - 20 Lakhs</option>
                    <option value="20L+">20 Lakhs +</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary px-1">Preferred Language</label>
                  <select 
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full bg-surface-raised border border-glass-border rounded-xl px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary px-1">Financial Goals</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    className="flex-1 bg-surface-raised border border-glass-border rounded-xl px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    placeholder="Add a goal (e.g. Buy a car)"
                  />
                  <button 
                    onClick={addGoal}
                    className="px-4 bg-brand-primary text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {goals.map((goal, i) => (
                    <div key={i} className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-brand-primary/20">
                      <span>{goal}</span>
                      <button onClick={() => removeGoal(goal)} className="hover:text-red-500 transition-colors">
                        <ArrowLeft className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "w-full py-4 brand-gradient text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2",
                  isSaving && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4">Account Details</h4>
            <div className="glass-card rounded-[2rem] border-glass-border overflow-hidden divide-y divide-glass-border">
              {[
                { icon: CreditCard, label: 'Subscription Plan', color: 'text-purple-500' },
                { icon: Globe, label: 'Language & Region', color: 'text-orange-500' },
              ].map((item, i) => (
                <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-surface-raised active:bg-surface-raised transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-10", item.color.replace('text-', 'bg-'))}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <span className="text-sm font-bold text-text-primary">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4">Preferences</h4>
            <div className="glass-card rounded-[2rem] border-glass-border overflow-hidden divide-y divide-glass-border">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-primary/10">
                    <Monitor className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Theme Mode</p>
                    <p className="text-[10px] text-text-secondary font-medium">Current: {theme}</p>
                  </div>
                </div>
                <div className="flex bg-surface-raised p-1 rounded-xl border border-glass-border">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleThemeChange(opt.id)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        theme === opt.id ? "bg-brand-primary text-white shadow-lg" : "text-text-secondary"
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10">
                    <Bell className="w-5 h-5 text-pink-500" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Notifications</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4">Security</h4>
            <div className="glass-card rounded-[2rem] border-glass-border overflow-hidden divide-y divide-glass-border">
              {[
                { icon: Lock, label: 'Privacy Policy', color: 'text-green-500' },
                { icon: Shield, label: 'Security Settings', color: 'text-cyan-500' },
                { icon: HelpCircle, label: 'Help & Support', color: 'text-yellow-500' },
              ].map((item, i) => (
                <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-10", item.color.replace('text-', 'bg-'))}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <span className="text-sm font-bold text-text-primary">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
              
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-red-500">Clear Data</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={logout}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-red-500">Logout</span>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-card p-8 rounded-[2.5rem] border-glass-border max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Clear All Data?</h3>
              <p className="text-sm text-text-secondary mb-8">
                This will permanently delete all your transactions and chat history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-surface-raised text-text-primary font-bold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onClearData?.();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 brand-gradient text-white rounded-full shadow-2xl flex items-center gap-2 z-[100]"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
