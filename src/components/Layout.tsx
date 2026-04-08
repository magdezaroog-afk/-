
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  Bell, 
  Search,
  User as UserIcon,
  Shield,
  Activity,
  HeartPulse,
  Share2,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles as SparklesIcon,
  Home,
  Archive,
  Settings
} from 'lucide-react';
import { NAV_ITEMS, ROLE_LABELS } from '../constants';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activePath: string;
  setActivePath: (path: string) => void;
  onRoleChange: (role: UserRole) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  onLogout, 
  activePath, 
  setActivePath, 
  onRoleChange,
  children 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const navItems = [
    { label: 'الرئيسية', path: 'dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'الأرشيف', path: 'archive', icon: <Archive className="w-4 h-4" /> },
    { label: 'الملف الصحي', path: 'profile', icon: <HeartPulse className="w-4 h-4" /> },
  ];

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('تم نسخ رابط المشاركة بنجاح!');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-cairo flex flex-col" dir="rtl">
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sm:px-10 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePath('dashboard')}>
            <div className="w-10 h-10 bg-litcBlue rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              LT
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-litcBlue tracking-tight leading-none">نظام الرعاية</h1>
              <p className="text-[8px] font-black text-litcOrange uppercase tracking-[0.3em] mt-1">Smart Health Hub</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActivePath(item.path)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all
                  ${activePath === item.path 
                    ? 'bg-litcBlue/10 text-litcBlue' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-litcBlue'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => setActivePath('archive')}
              className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-litcBlue hover:border-litcBlue transition-all"
              title="الأرشيف"
            >
              <Archive className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-litcOrange/10 rounded-xl flex items-center justify-center text-litcOrange relative cursor-pointer hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1 bg-slate-50 rounded-xl border border-slate-100 hover:border-litcBlue transition-all group"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="hidden md:block text-right pl-2">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 leading-none">{ROLE_LABELS[user.role]}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-50 mb-2">
                  <p className="text-sm font-black text-slate-900">{user.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                </div>
                
                <button 
                  onClick={() => { setActivePath('profile'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <HeartPulse className="w-4 h-4 text-litcBlue" />
                  الملف الصحي الذكي
                </button>

                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowRoleSelector(!showRoleSelector); }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-litcOrange" />
                      تبديل الدور
                    </div>
                    <ChevronLeft className={`w-4 h-4 transition-transform ${showRoleSelector ? '-rotate-90' : ''}`} />
                  </button>

                  {showRoleSelector && (
                    <div className="mt-1 space-y-1 px-2 pb-2">
                      {Object.values(UserRole).map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            onRoleChange(role);
                            setShowRoleSelector(false);
                            setShowUserMenu(false);
                          }}
                          className={`
                            w-full text-right px-4 py-2 rounded-lg text-[10px] font-bold transition-all
                            ${user.role === role ? 'bg-litcBlue/10 text-litcBlue' : 'text-slate-500 hover:bg-slate-50'}
                          `}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-50 my-2" />
                
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Share2 className="w-4 h-4 text-slate-400" />
                  مشاركة الرابط
                </button>

                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
