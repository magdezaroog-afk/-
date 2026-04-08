
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
  Droplet,
  HeartPulse,
  Share2,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles as SparklesIcon,
  Home,
  Archive,
  Settings,
  Users,
  FileText,
  BarChart3,
  Stethoscope,
  LayoutDashboard
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

  const adminNavItems = [
    { label: 'لوحة التحكم', path: 'admin-dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'إدارة المطالبات', path: 'admin-claims', icon: <FileText className="w-4 h-4" /> },
    { label: 'الأمراض المزمنة', path: 'chronic-enrollment', icon: <Stethoscope className="w-4 h-4" /> },
    { label: 'إدارة الموظفين', path: 'admin-users', icon: <Users className="w-4 h-4" /> },
    { label: 'التقارير المالية', path: 'admin-reports', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'الإعدادات', path: 'settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const isEmployee = user.role === UserRole.EMPLOYEE;

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('تم نسخ رابط المشاركة بنجاح!');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-cairo flex flex-col" dir="rtl">
      {/* Top Header */}
      <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-white/20 flex items-center justify-between px-6 sm:px-12 sticky top-0 z-30 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActivePath('dashboard')}>
            <div className="w-12 h-12 bg-gradient-to-br from-litcBlue to-litcDark rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[0_10px_25px_rgba(0,92,132,0.3)] group-hover:scale-110 transition-transform">
              LT
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">LITC 2030</h1>
              <p className="text-[9px] font-black text-litcOrange uppercase tracking-[0.4em] mt-1">Future Health Hub</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActivePath(item.path)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-[1.5rem] font-black text-xs transition-all duration-500
                  ${activePath === item.path 
                    ? 'bg-litcBlue text-white shadow-[0_10px_25px_rgba(0,92,132,0.3)]' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-litcBlue'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={() => setActivePath('archive')}
              className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-litcBlue hover:border-litcBlue transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
            >
              <Archive className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-litcOrange relative cursor-pointer hover:scale-110 transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-4 p-1.5 bg-white rounded-[1.5rem] border border-slate-100 hover:border-litcBlue transition-all duration-500 group shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:-translate-y-1"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform overflow-hidden border border-slate-200">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="hidden md:block text-right pl-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-black text-slate-900 leading-none">مرحباً، {user.name.split(' ')[0]}</p>
                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded-md border border-slate-200">
                      <Activity className="w-2.5 h-2.5" />
                      {user.healthProfile?.age || '--'} سنة
                    </span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded-md border border-rose-100">
                      <Droplet className="w-2.5 h-2.5" />
                      {user.healthProfile?.bloodType || '--'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ROLE_LABELS[user.role]}</p>
                </div>
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

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar - Only for non-employees */}
        {!isEmployee && (
          <aside className="hidden lg:flex w-72 bg-white border-l border-slate-100 flex-col shrink-0 z-20 shadow-[10px_0_40px_rgba(0,92,132,0.05)]">
            <div className="p-6 border-b border-slate-50">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-3xl border border-slate-100">
                <Shield className="w-5 h-5 text-litcOrange" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">صلاحية النظام</p>
                  <p className="text-xs font-black text-slate-900">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {adminNavItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePath(item.path)}
                  className={`
                    w-full flex items-center gap-4 px-5 py-4 rounded-3xl font-black text-xs transition-all duration-300
                    ${activePath === item.path 
                      ? 'bg-litcBlue text-white shadow-[0_10px_25px_rgba(0,92,132,0.2)]' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-litcBlue'}
                  `}
                >
                  <div className={`p-2 rounded-2xl ${activePath === item.path ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'}`}>
                    {item.icon}
                  </div>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-slate-50">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-3xl font-black text-xs text-rose-500 hover:bg-rose-50 transition-all duration-300"
              >
                <div className="p-2 rounded-2xl bg-rose-100">
                  <LogOut className="w-4 h-4" />
                </div>
                تسجيل الخروج
              </button>
            </div>
          </aside>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className={`${isEmployee ? 'max-w-6xl' : 'max-w-[1600px]'} mx-auto px-4 py-8 w-full`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
