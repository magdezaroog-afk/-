
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
  Clock
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const navItems = NAV_ITEMS[user.role] || [];

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('تم نسخ رابط المشاركة بنجاح!');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-cairo flex" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 w-72 bg-white border-l border-slate-100 z-50 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-litcBlue rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                LT
              </div>
              <div>
                <h1 className="text-lg font-black text-litcBlue tracking-tight">نظام الرعاية</h1>
                <p className="text-[8px] font-black text-litcOrange uppercase tracking-[0.3em]">Smart Health Hub</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Employee Dashboard Card in Sidebar */}
          {user.role === UserRole.EMPLOYEE && (
            <div className="mb-8 p-5 bg-slate-900 rounded-2xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-litcBlue/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">الرصيد المتبقي</p>
                  <CreditCard className="w-4 h-4 text-litcOrange" />
                </div>
                <p className="text-2xl font-black">{(100000 - (user.annualCeilingUsed || 0)).toLocaleString()} <span className="text-xs opacity-50">د.ل</span></p>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">نشطة</p>
                    <p className="text-sm font-black flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> 3</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">مكتملة</p>
                    <p className="text-sm font-black flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> 12</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-1">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActivePath(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all
                  ${activePath === item.path 
                    ? 'bg-litcBlue text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-litcBlue'}
                `}
              >
                <span className={`${activePath === item.path ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-2">
            <button 
              onClick={handleShare}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
            >
              <Share2 className="w-5 h-5 text-slate-400" />
              مشاركة الرابط
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sm:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 w-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-litcBlue transition-all group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">الدور الحالي</p>
                  <p className="text-xs font-black text-litcBlue leading-none">{ROLE_LABELS[user.role]}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-litcBlue shadow-sm group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
              </button>

              {showRoleSelector && (
                <div className="absolute top-full left-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setShowRoleSelector(false);
                      }}
                      className={`
                        w-full text-right px-4 py-2.5 rounded-lg text-xs font-bold transition-all
                        ${user.role === role ? 'bg-litcBlue text-white' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-10 h-10 bg-litcOrange/10 rounded-xl flex items-center justify-center text-litcOrange relative cursor-pointer hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-black text-slate-900 leading-none mb-1">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 leading-none">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
