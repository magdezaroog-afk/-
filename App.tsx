
import React, { useState } from 'react';
import { User, UserRole, Claim, ClaimStatus, Invoice } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SubmitClaim from './pages/SubmitClaim';
import ClaimDetail from './pages/ClaimDetail';
import Profile from './pages/Profile';
import DataEntry from './pages/DataEntry';
import AdminDashboard from './pages/AdminDashboard';
import Archive from './pages/Archive';
import { 
  Loader2, ShieldCheck, UserCircle, 
  ChevronRight, Database, UserCheck, Stethoscope, HeartPulse, Activity, 
  Shield, Pill, Syringe, ClipboardList, Sparkles, Heart
} from 'lucide-react';

const INITIAL_CLAIMS: Claim[] = [];

export const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحي قرقاب', email: 'yahya@litc.ly', team: 'وحدة الصيدليات' },
  { id: 'DE-2', name: 'محمود الدعوكي', email: 'mahmoud@litc.ly', team: 'وحدة المستشفيات' },
  { id: 'DE-3', name: 'عباس طنيش', email: 'abbas@litc.ly', team: 'وحدة العيادات والمختبرات' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePath, setActivePath] = useState('dashboard');
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStep, setLoginStep] = useState<'initial' | 'official' | 'data-entry-select'>('initial');

  const handleLogin = (role: UserRole, specificUser?: any) => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setUser({
        id: specificUser?.id || (role === UserRole.EMPLOYEE ? 'USR-1' : 'STF-1'),
        email: specificUser?.email || `${role.toLowerCase()}@litc.ly`,
        role: role,
        name: specificUser?.name || (role === UserRole.EMPLOYEE ? 'مجدي الزروق' : 'مسؤول النظام'),
        healthProfile: role === UserRole.EMPLOYEE ? {
          bloodType: '',
          height: 0,
          weight: 0,
          age: 0,
          chronicDiseases: [],
          pathway: 'healthy',
          dailyWaterIntake: 0,
          systolicBP: 0,
          diastolicBP: 0,
          hba1c: 0
        } : undefined
      });
      setIsLoggingIn(false);
      setActivePath('dashboard');
    }, 1200);
  };

  const handleUpdateHealthProfile = (profile: any) => {
    if (!user) return;
    setUser({ ...user, healthProfile: profile });
  };

  const handleUpdatePlans = (plans: any[]) => {
    if (!user) return;
    setUser({ ...user, activePlans: plans });
  };

  const handleUpdateClaimStatus = (newStatus: ClaimStatus, comment?: string) => {
    if (!selectedClaim || !user) return;
    const updatedClaims = claims.map(c => {
      if (c.id === selectedClaim.id) {
        return {
          ...c,
          status: newStatus,
          auditTrail: [
            ...c.auditTrail,
            {
              id: Math.random().toString(),
              userId: user.id,
              userName: user.name,
              action: `تغيير الحالة إلى: ${newStatus}`,
              timestamp: new Date().toLocaleString('ar-LY'),
              comment
            }
          ]
        };
      }
      return c;
    });
    setClaims(updatedClaims);
    setSelectedClaim(null);
  };

  const handleInvoiceAssign = (claimId: string, invoiceIds: string[], staffId: string) => {
    const staffMember = DATA_ENTRY_STAFF.find(s => s.id === staffId);
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        const updatedInvoices = c.invoices.map(inv => {
          if (invoiceIds.includes(inv.id)) {
            return { 
              ...inv, 
              assignedToId: staffId, 
              assignedToName: staffMember?.name,
              status: ClaimStatus.PENDING_DATA_ENTRY
            };
          }
          return inv;
        });
        
        // التحقق مما إذا كانت جميع الفواتير قد أُسندت
        const allAssigned = updatedInvoices.every(inv => !!inv.assignedToId);
        
        return {
          ...c,
          invoices: updatedInvoices,
          // لا تتغير حالة المعاملة الكلية إلى PENDING_DATA_ENTRY إلا إذا أُسندت جميع الفواتير
          status: allAssigned ? ClaimStatus.PENDING_DATA_ENTRY : ClaimStatus.PENDING_HEAD,
          auditTrail: [
            ...c.auditTrail,
            {
              id: Math.random().toString(),
              userId: user!.id,
              userName: user!.name,
              action: `إسناد ${invoiceIds.length} فاتورة للموظف: ${staffMember?.name}`,
              timestamp: new Date().toLocaleString('ar-LY')
            }
          ]
        };
      }
      return c;
    }));
    // نغلق التفاصيل فقط إذا تم إسناد كل شيء، أو نتركها مفتوحة إذا أراد الرئيس إسناد الباقي
    // للأفضل: سنتركها مفتوحة ونقوم بتحديث المعروض في ClaimDetail
  };

  const handleInvoiceStatusUpdate = (claimId: string, invoiceId: string, newStatus: ClaimStatus, comment?: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          invoices: c.invoices.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv),
          auditTrail: [...c.auditTrail, {
             id: Math.random().toString(),
             userId: user!.id,
             userName: user!.name,
             action: `تعديل حالة فاتورة فردية إلى ${newStatus}`,
             timestamp: new Date().toLocaleString('ar-LY'),
             comment
          }]
        };
      }
      return c;
    }));
  };

  const handleSaveDataEntry = (updatedInvoices: Invoice[]) => {
    if (!selectedClaim) return;
    setClaims(prev => prev.map(c => {
      if (c.id === selectedClaim.id) {
        const mergedInvoices = c.invoices.map(inv => {
          const updated = updatedInvoices.find(u => u.id === inv.id);
          // إذا كانت الفاتورة المحدثة تخص الموظف الحالي، نحدث حالتها إلى بانتظار الاعتماد من الرئيس
          return updated ? { ...updated, status: ClaimStatus.PENDING_HEAD } : inv;
        });
        
        // نغير حالة المعاملة الكلية لـ PENDING_HEAD فقط إذا انتهى جميع الموظفين من إدخالاتهم
        const allBackToHead = mergedInvoices.every(i => i.status === ClaimStatus.PENDING_HEAD);
        
        return {
          ...c,
          invoices: mergedInvoices,
          status: allBackToHead ? ClaimStatus.PENDING_HEAD : c.status,
          auditTrail: [...c.auditTrail, {
            id: Math.random().toString(),
            userId: user!.id,
            userName: user!.name,
            action: `الموظف ${user!.name} أكمل إدخال بيانات فواتيره وحولها للرئيس`,
            timestamp: new Date().toLocaleString('ar-LY')
          }]
        };
      }
      return c;
    }));
    setSelectedClaim(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-cairo overflow-hidden relative" dir="rtl">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
           <div className="absolute top-10 left-[10%] rotate-12 text-litcOrange animate-bounce duration-[4s]"><HeartPulse size={120} /></div>
           <div className="absolute top-[30%] right-[5%] -rotate-12 text-litcOrange"><Stethoscope size={100} /></div>
           <div className="absolute bottom-[20%] left-[15%] rotate-45 text-litcOrange animate-pulse"><Shield size={140} /></div>
           <div className="absolute top-[50%] right-[25%] -rotate-45 text-litcOrange"><Pill size={80} /></div>
           <div className="absolute bottom-10 right-[15%] rotate-12 text-litcOrange"><Activity size={150} /></div>
           <div className="absolute top-20 left-1/2 -translate-x-1/2 text-litcOrange opacity-50"><Heart size={60} /></div>
           <div className="absolute bottom-1/3 left-[8%] -rotate-12 text-litcOrange"><ClipboardList size={90} /></div>
        </div>

        {isLoggingIn ? (
          <div className="text-center space-y-10 animate-in fade-in zoom-in duration-700 relative z-10">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-litcOrange/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
               <Loader2 size={100} className="text-litcBlue relative z-10 animate-spin" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-litcBlue tracking-[0.1em] mb-2">جاري فحص الصلاحيات</h2>
               <p className="text-litcOrange font-bold animate-pulse tracking-widest text-sm uppercase">LITC Smart Security System</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[4rem] p-16 shadow-[0_40px_100px_rgba(0,92,132,0.1)] border border-slate-100 animate-in zoom-in duration-700 relative z-10">
            <div className="flex flex-col items-center gap-6 mb-16 text-center">
               <div className="relative group transition-transform duration-700 hover:scale-110">
                  <div className="absolute -inset-6 bg-gradient-to-tr from-litcBlue/20 to-litcOrange/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                  <div className="w-28 h-28 bg-gradient-to-br from-litcBlue to-litcDark rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-[0_20px_50px_rgba(0,92,132,0.4)] relative border-4 border-white">
                     <span className="tracking-tighter">LT</span>
                     <div className="absolute -bottom-3 -right-3 bg-white p-2.5 rounded-[1.2rem] shadow-xl border border-slate-100 ring-4 ring-white">
                        <Activity className="text-litcOrange w-7 h-7 animate-pulse" />
                     </div>
                  </div>
               </div>
               <div className="space-y-1">
                  <h1 className="text-4xl font-black text-litcBlue tracking-tight">نظام الرعاية الذكي</h1>
                  <p className="text-[10px] font-black text-litcOrange uppercase tracking-[0.6em] opacity-80">LITC Digital Health Hub</p>
               </div>
            </div>

            <div className="space-y-6">
              {loginStep === 'initial' && (
                <>
                  <button onClick={() => handleLogin(UserRole.EMPLOYEE)} className="w-full group relative p-8 bg-slate-50 hover:bg-litcBlue rounded-[2.5rem] transition-all duration-500 flex items-center justify-between border border-slate-100 overflow-hidden shadow-sm hover:shadow-[0_20px_40px_rgba(0,92,132,0.15)] hover:-translate-y-1">
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-litcBlue transition-all shadow-inner group-hover:scale-110 group-hover:rotate-6">
                         <UserCircle size={32} />
                      </div>
                      <div className="text-right">
                         <p className="font-black text-xl text-slate-900 group-hover:text-white transition-colors">بوابة الموظف</p>
                         <p className="text-[10px] font-bold text-slate-400 group-hover:text-white/60 uppercase tracking-widest">Employee Portal</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-litcOrange group-hover:text-white transition-colors group-hover:translate-x-2" />
                  </button>

                  <button onClick={() => setLoginStep('official')} className="w-full group p-8 bg-litcDark hover:bg-litcBlue text-white rounded-[2.5rem] transition-all duration-500 flex items-center justify-between shadow-2xl border border-white/5 overflow-hidden hover:-translate-y-1">
                     <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-white/10 group-hover:bg-litcOrange rounded-[1.5rem] flex items-center justify-center text-litcOrange group-hover:text-white transition-all shadow-inner group-hover:scale-110 group-hover:-rotate-6">
                           <ShieldCheck size={32} />
                        </div>
                        <div className="text-right">
                           <p className="font-black text-xl">الدخول كمسؤول</p>
                           <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Medical Admin & Audit</p>
                        </div>
                     </div>
                     <ChevronRight size={20} className="text-white/50 group-hover:text-white transition-colors group-hover:translate-x-2" />
                  </button>
                </>
              )}

              {loginStep === 'official' && (
                <div className="grid grid-cols-2 gap-5 animate-in slide-in-from-bottom-10">
                   {[
                     { role: UserRole.DOCTOR, label: 'طبيب مراجع', icon: <Stethoscope size={24}/>, color: 'hover:bg-litcBlue/5 hover:text-litcBlue hover:border-litcBlue' },
                     { role: UserRole.HEAD_OF_UNIT, label: 'رئيس الوحدة', icon: <ShieldCheck size={24}/>, color: 'hover:bg-litcBlue/5 hover:text-litcBlue hover:border-litcBlue' },
                     { role: UserRole.DATA_ENTRY, label: 'إدخال فني', icon: <Database size={24}/>, color: 'hover:bg-litcOrange/5 hover:text-litcOrange hover:border-litcOrange', action: () => setLoginStep('data-entry-select') },
                     { role: UserRole.AUDITOR, label: 'المراجعة', icon: <UserCheck size={24}/>, color: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-600' }
                   ].map(o => (
                      <button key={o.role} onClick={o.action || (() => handleLogin(o.role))} className={`p-8 bg-white border border-slate-100 rounded-[2.5rem] text-slate-600 transition-all flex flex-col items-center gap-4 group shadow-sm hover:shadow-xl hover:-translate-y-1 ${o.color}`}>
                         <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all">{o.icon}</div>
                         <span className="font-black text-sm">{o.label}</span>
                      </button>
                   ))}
                   <button onClick={() => setLoginStep('initial')} className="col-span-2 py-4 text-slate-400 font-black text-xs hover:text-litcBlue transition-colors uppercase tracking-[0.4em]">الرجوع للرئيسية</button>
                </div>
              )}

              {loginStep === 'data-entry-select' && (
                <div className="space-y-4 animate-in slide-in-from-right-10">
                   {DATA_ENTRY_STAFF.map(s => (
                     <button key={s.id} onClick={() => handleLogin(UserRole.DATA_ENTRY, s)} className="w-full p-6 bg-white hover:bg-litcOrange hover:text-white text-slate-700 rounded-[2rem] transition-all flex items-center justify-between group border border-slate-100 shadow-sm hover:shadow-xl">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black group-hover:bg-white/20 group-hover:text-white">{s.name.charAt(0)}</div>
                           <div className="text-right">
                              <p className="font-black">{s.name}</p>
                              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{s.team}</p>
                           </div>
                        </div>
                        <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                     </button>
                   ))}
                   <button onClick={() => setLoginStep('official')} className="w-full py-4 text-slate-400 font-black text-xs hover:text-litcBlue transition-colors">رجوع</button>
                </div>
              )}
            </div>
            
            <div className="mt-12 text-center">
               <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  <Sparkles size={12} className="text-litcOrange" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">v2.8 Enterprise Health Engine</p>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderContent = () => {
    // نمرر المعاملة المختارة المحدثة دوماً من حالة App
    const currentClaim = selectedClaim ? claims.find(c => c.id === selectedClaim.id) || selectedClaim : null;

    if (currentClaim) {
      if (user.role === UserRole.DATA_ENTRY) {
        return <DataEntry claim={currentClaim} user={user} onSave={handleSaveDataEntry} onBack={() => setSelectedClaim(null)} />;
      }
      return (
        <ClaimDetail 
          claim={currentClaim} 
          user={user} 
          onClose={() => setSelectedClaim(null)}
          onUpdateStatus={handleUpdateClaimStatus}
          onInvoiceAssign={handleInvoiceAssign}
          onInvoiceStatusUpdate={handleInvoiceStatusUpdate}
        />
      );
    }

    switch (activePath) {
      case 'dashboard':
        return <Dashboard 
          user={user} 
          claims={user.role === UserRole.EMPLOYEE ? claims.filter(c => c.employeeId === user.id) : claims} 
          onSelectClaim={setSelectedClaim} 
          onNavigate={setActivePath} 
          onAssign={handleInvoiceAssign} 
        />;
      case 'profile':
        return <Profile 
          user={user} 
          claims={claims.filter(c => c.employeeId === user.id)} 
          onNavigate={setActivePath} 
          onSelectClaim={setSelectedClaim} 
          onUpdateHealthProfile={handleUpdateHealthProfile}
          onUpdatePlans={handleUpdatePlans}
        />;
      case 'submit-claim':
        return <SubmitClaim user={user} onCancel={() => setActivePath('dashboard')} onSubmit={(data) => {
          const newClaim: Claim = {
            id: `MC-${Math.floor(1000 + Math.random() * 9000)}`,
            employeeId: user.id,
            employeeName: user.name,
            submissionDate: new Date().toISOString().split('T')[0],
            status: ClaimStatus.PENDING_DR,
            totalAmount: data.totalAmount,
            referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
            invoiceCount: data.invoices.length,
            description: data.description,
            location: data.location,
            department: data.department,
            invoices: data.invoices.map((inv: any) => ({ 
              ...inv, 
              status: ClaimStatus.PENDING_DR,
              id: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            })),
            auditTrail: [{ id: 'L-0', userId: user.id, userName: user.name, action: 'تم إنشاء المطالبة وإرسالها للمراجعة الطبية', timestamp: new Date().toLocaleString() }]
          };
          setClaims([newClaim, ...claims]);
          setActivePath('dashboard');
        }} />;
      case 'archive':
        return <Archive claims={claims.filter(c => c.employeeId === user.id)} onSelectClaim={setSelectedClaim} />;
      case 'admin-dashboard':
        return <AdminDashboard claims={claims} />;
      default:
        return <Dashboard user={user} claims={claims} onSelectClaim={setSelectedClaim} onNavigate={setActivePath} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={() => setUser(null)} 
      activePath={activePath} 
      setActivePath={setActivePath}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
