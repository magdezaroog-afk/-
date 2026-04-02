
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { NAV_ITEMS, ROLE_LABELS } from '../constants';
import { LogOut, Bell, Menu, X, HeartPulse, Activity, UserCircle, Search, Settings } from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activePath: string;
  setActivePath: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activePath, setActivePath }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const items = NAV_ITEMS[user.role as UserRole] || [];

  return (
    <div className="flex h-screen overflow-hidden font-cairo bg-slate-50" dir="rtl">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with Premium Gradient */}
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-80' : 'translate-x-full lg:translate-x-0 lg:w-24'} fixed lg:relative inset-y-0 right-0 litc-gradient border-l border-white/5 transition-all duration-500 flex flex-col z-50 shadow-[10px_0_50px_rgba(0,0,0,0.2)]`}>
        <div className="p-8 mb-8 relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
               <div className="absolute -inset-3 bg-litcOrange/30 rounded-2xl blur-xl group-hover:bg-litcOrange/50 transition duration-500 opacity-50"></div>
               <div className="w-14 h-14 bg-gradient-to-br from-white to-slate-200 rounded-2xl flex items-center justify-center text-litcBlue shadow-2xl relative border border-white/20 overflow-hidden transform group-hover:rotate-6 transition-transform">
                  <span className="font-black text-2xl tracking-tighter z-10">LT</span>
                  <Activity className="absolute -bottom-1 -right-1 text-litcOrange w-8 h-8 opacity-40" />
               </div>
            </div>
            {isSidebarOpen && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                <h1 className="text-xl font-black text-white leading-none mb-1">الرعاية الذكية</h1>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-litcOrange animate-pulse"></div>
                   <p className="text-[10px] font-black text-white/60 tracking-[0.2em] uppercase">LITC Enterprise</p>
                </div>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-5 space-y-3 overflow-y-auto custom-scrollbar">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                setActivePath(item.path);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${activePath === item.path ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              {activePath === item.path && (
                 <div className="absolute inset-0 bg-gradient-to-r from-litcOrange/10 to-transparent pointer-events-none"></div>
              )}
              <div className={`${activePath === item.path ? 'text-litcOrange scale-110' : 'text-white/30 group-hover:text-litcOrange group-hover:scale-110'} transition-all duration-300`}>
                {item.icon}
              </div>
              {isSidebarOpen && <span className="font-black text-sm tracking-wide">{item.label}</span>}
              {activePath === item.path && isSidebarOpen && (
                <div className="absolute left-2 w-1.5 h-6 bg-litcOrange rounded-full shadow-[0_0_15px_#f58220]"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/10">
          <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 text-white/40 hover:bg-rose-500/10 hover:text-rose-400 rounded-2xl transition-all font-black text-xs group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span>تسجيل الخروج الآمن</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 lg:h-24 litc-glass border-b border-slate-200/50 flex items-center justify-between px-4 lg:px-10 z-30 sticky top-0">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 lg:p-3 bg-slate-100/50 hover:bg-white rounded-xl lg:rounded-2xl text-litcBlue transition-all shadow-sm">
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex items-center bg-slate-100/50 rounded-2xl px-6 py-3 border border-slate-200/50 group focus-within:bg-white transition-all">
               <Search className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-litcBlue" />
               <input placeholder="البحث في المعاملات..." className="bg-transparent border-none outline-none pr-4 text-sm font-bold text-slate-600 w-48" />
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="relative group cursor-pointer">
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 lg:w-3 h-3 bg-litcOrange rounded-full border-2 border-white animate-bounce"></div>
                <Bell className="text-slate-400 group-hover:text-litcBlue transition-colors w-5 h-5" />
              </div>
              <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3 lg:gap-4 group cursor-pointer">
                <div className="text-left hidden sm:block">
                  <p className="text-xs lg:text-sm font-black text-slate-900 group-hover:text-litcBlue transition-colors">{user.name}</p>
                  <p className="text-[8px] lg:text-[9px] text-litcBlue font-black uppercase tracking-widest bg-litcBlue/5 px-2 py-0.5 rounded-md mt-0.5">{ROLE_LABELS[user.role]}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-litcBlue to-litcDark flex items-center justify-center text-white font-black text-base lg:text-lg shadow-xl shadow-litcBlue/20 border-2 border-white group-hover:scale-105 transition-all">
                  {user.name.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-12 scroll-smooth">
          <div className="max-w-[1500px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
