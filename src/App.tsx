import React, { useState, useEffect } from 'react';
import { 
  Home,
  MessageSquare, 
  Upload as UploadIcon, 
  TrendingUp,
  User as UserIcon,
  Shield,
  Trash2,
  Bell,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Chat } from './components/Chat';
import { UploadZone } from './components/UploadZone';
import { Settings } from './components/Settings';
import { Insights } from './components/Insights';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Transaction, ChatMessage, UserProfile } from './types';
import { cn } from './lib/utils';

function MainApp() {
  const { user, profile, loading, signIn, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'chat' | 'insights' | 'profile'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const tPath = `users/${user.uid}/transactions`;
      const tSnap = await getDocs(query(collection(db, tPath)));
      setTransactions(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      const cPath = `users/${user.uid}/chats`;
      const cSnap = await getDocs(query(collection(db, cPath)));
      setChats(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)).sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    }
  };

  const handleOnboardingComplete = async (data: any) => {
    await updateProfile(data);
  };

  const handleUpload = async (newTransactions: Transaction[]) => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      newTransactions.forEach(t => {
        const ref = doc(collection(db, 'users', user.uid, 'transactions'));
        batch.set(ref, t);
      });
      
      await batch.commit();
      setTransactions(prev => [...prev, ...newTransactions]);
      setActiveTab('home');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  };

  const handleNewChatMessage = async (msg: ChatMessage) => {
    if (!user) return;
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'chats'), msg);
      setChats(prev => [...prev, { ...msg, id: ref.id }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/chats`);
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Delete transactions
      const tSnap = await getDocs(collection(db, 'users', user.uid, 'transactions'));
      tSnap.docs.forEach(d => batch.delete(d.ref));
      
      // Delete chats
      const cSnap = await getDocs(collection(db, 'users', user.uid, 'chats'));
      cSnap.docs.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      setTransactions([]);
      setChats([]);
      setActiveTab('home');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-6 text-center transition-colors">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 shadow-2xl shadow-brand-primary/20"
        >
          <Shield className="w-10 h-10 text-white -rotate-12" />
        </motion.div>
        <h1 className="text-5xl font-black text-text-primary mb-4 tracking-tight font-display">FinSathi</h1>
        <p className="text-xl text-text-secondary mb-12 max-w-md">
          Your AI-powered personal financial consultant. Secure, private, and built for India.
        </p>
        <button
          onClick={signIn}
          className="px-10 py-5 bg-brand-primary hover:opacity-90 text-white rounded-3xl font-bold text-lg transition-all shadow-xl shadow-brand-primary/20 flex items-center gap-3 active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
          Continue with Google
        </button>
        <div className="mt-12 flex items-center gap-8 text-sm text-text-secondary font-medium">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>DPDP Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Zero-Retention</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile?.incomeBracket) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const NavItem = ({ id, icon: Icon, label, isSidebar = false }: { id: typeof activeTab, icon: any, label: string, isSidebar?: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex transition-all duration-200 relative",
        isSidebar 
          ? "w-full items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-raised" 
          : "flex-col items-center justify-center gap-1",
        activeTab === id 
          ? (isSidebar ? "bg-brand-primary/10 text-brand-primary" : "text-brand-primary") 
          : "text-text-secondary"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform", activeTab === id && "scale-105")} />
      <span className={cn(
        "font-bold uppercase tracking-wider",
        isSidebar ? "text-xs" : "text-[9px]"
      )}>{label}</span>
      {activeTab === id && !isSidebar && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full"
        />
      )}
    </button>
  );

  return (
    <div className="h-screen bg-surface-base flex flex-col md:flex-row transition-colors overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-card border-r border-glass-border p-4 z-50">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-text-primary tracking-tight font-display">FinSathi</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem id="home" icon={Home} label="Home" isSidebar />
          <NavItem id="upload" icon={UploadIcon} label="Upload" isSidebar />
          <NavItem id="chat" icon={MessageSquare} label="Chat" isSidebar />
          <NavItem id="insights" icon={TrendingUp} label="Insights" isSidebar />
          <NavItem id="profile" icon={UserIcon} label="Profile" isSidebar />
        </nav>

        <div className="mt-auto p-3 glass-card rounded-2xl border-glass-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand-primary/20">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-brand-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{user?.displayName || 'User'}</p>
              <p className="text-[9px] text-text-secondary truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full"
              >
              {activeTab === 'home' && (
                <Dashboard transactions={transactions} onQuickAction={(tab) => setActiveTab(tab as any)} />
              )}
              {activeTab === 'upload' && (
                <UploadZone onUpload={handleUpload} userId={user.uid} onBack={() => setActiveTab('home')} />
              )}
              {activeTab === 'chat' && (
                <Chat 
                  transactions={transactions} 
                  profile={profile} 
                  initialMessages={chats}
                  onNewMessage={handleNewChatMessage}
                  onBack={() => setActiveTab('home')}
                />
              )}
              {activeTab === 'insights' && (
                <Insights transactions={transactions} onBack={() => setActiveTab('home')} />
              )}
              {activeTab === 'profile' && (
                <Settings onBack={() => setActiveTab('home')} onClearData={handleClearData} />
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 glass-card border-t-0 rounded-t-2xl flex items-center justify-around px-4 z-50 md:hidden">
        <NavItem id="home" icon={Home} label="Home" />
        <NavItem id="upload" icon={UploadIcon} label="Upload" />
        
        {/* Center FAB */}
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "w-12 h-12 brand-gradient rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/40 -mt-10 border-4 border-surface-base transition-transform active:scale-90",
            activeTab === 'chat' && "scale-110"
          )}
        >
          <Plus className={cn("w-6 h-6 text-white transition-transform", activeTab === 'chat' && "rotate-45")} />
        </button>

        <NavItem id="insights" icon={TrendingUp} label="Insights" />
        <NavItem id="profile" icon={UserIcon} label="Profile" />
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
