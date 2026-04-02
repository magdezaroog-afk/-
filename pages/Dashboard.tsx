
import React, { useState } from 'react';
import { Claim, User, UserRole, ClaimStatus } from '../types';
import { STATUS_UI } from '../constants';
import ClaimCard from '../components/ClaimCard';
import { 
  Activity, TrendingUp, Sparkles, Clock, 
  UserPlus, ListChecks, ArrowUpRight, 
  Layers, Wallet, CheckCircle2, ChevronRight, HeartPulse, ShieldCheck,
  Check, X, User as UserIcon, Droplet, Target, Scale, MapPin, Building2, Briefcase,
  Search, Hand, AlertCircle
} from 'lucide-react';

interface DashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onNavigate: (path: string) => void;
  onAssign?: (claimId: string, invoiceIds: string[], staffId: string) => void;
}

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحيى قرقاب', team: 'وحدة الصيدليات', stats: '90% منجز' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات', stats: '88% منجز' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات', stats: '95% منجز' },
];

const Dashboard: React.FC<DashboardProps> = ({ user, claims, onSelectClaim, onNavigate, onAssign }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClaims = claims.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.id.toLowerCase().includes(query) || 
           c.employeeName.toLowerCase().includes(query) ||
           c.referenceNumber.toLowerCase().includes(query) ||
           c.invoices.some(inv => inv.invoiceNumber.toLowerCase().includes(query));
  });

  const pendingActions = filteredClaims.filter(c => {
    if (user.role === UserRole.DOCTOR) return c.status === ClaimStatus.PENDING_DR;
    
    if (user.role === UserRole.HEAD_OF_UNIT) {
      const hasUnassignedInvoices = c.invoices.some(inv => !inv.assignedToId);
      return (c.status === ClaimStatus.PENDING_HEAD) || 
             (c.status === ClaimStatus.PENDING_DATA_ENTRY && hasUnassignedInvoices);
    }
    
    if (user.role === UserRole.DATA_ENTRY) {
      return c.invoices.some(i => i.assignedToId === user.id);
    }

    if (user.role === UserRole.AUDITOR) {
      return c.status === ClaimStatus.PENDING_AUDIT;
    }
    return false;
  });

  const poolClaims = filteredClaims.filter(c => {
    if (user.role !== UserRole.DATA_ENTRY) return false;
    
    // Claims in the pool are those that are unassigned
    const isUnassigned = c.invoices.every(inv => !inv.assignedToId);
    if (!isUnassigned) return false;

    // Check 24h rule
    if (c.submittedAt) {
      const submittedDate = new Date(c.submittedAt);
      const now = new Date();
      const diffHours = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
      return diffHours >= 24;
    }
    return true; // If no submittedAt, assume it's old enough
  });

  const ceilingLimit = 100000;
  const ceilingUsed = user.annualCeilingUsed || 0;
  const ceilingRemaining = ceilingLimit - ceilingUsed;
  const ceilingPercentage = (ceilingUsed / ceilingLimit) * 100;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAssign = (staffId: string) => {
    if (onAssign && selectedIds.length > 0) {
      selectedIds.forEach(id => {
         const claim = claims.find(c => c.id === id);
         if (claim) {
            const unassignedInvoiceIds = claim.invoices
              .filter(inv => !inv.assignedToId)
              .map(inv => inv.id);
            
            if (unassignedInvoiceIds.length > 0) {
              onAssign(id, unassignedInvoiceIds, staffId);
            }
         }
      });
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 font-cairo px-4 sm:px-0" dir="rtl">
      {/* Bulk Assignment Bar for Unit Head */}
      {user.role === UserRole.HEAD_OF_UNIT && selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 border-4 border-white rounded-[3rem] p-6 sm:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-right">
              <p className="text-white text-xl sm:text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 bg-litcOrange rounded-xl flex items-center justify-center text-white shadow-lg">{selectedIds.length}</div>
                تم اختيار معاملات للإسناد
              </p>
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold mt-1">اختر الموظف المناسب من القائمة لإتمام عملية الإسناد الفني</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {DATA_ENTRY_STAFF.map(staff => (
                <button 
                  key={staff.id}
                  onClick={() => handleBulkAssign(staff.id)}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/10 p-4 sm:p-5 rounded-[2rem] transition-all flex items-center gap-4 text-right min-w-[200px]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-litcBlue rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-xs sm:text-sm font-black">{staff.name}</p>
                    <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{staff.stats}</p>
                  </div>
                  <div className="absolute inset-0 bg-litcBlue/0 group-hover:bg-litcBlue/5 rounded-[2rem] transition-all"></div>
                </button>
              ))}
              <button 
                onClick={() => setSelectedIds([])}
                className="p-4 sm:p-5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[2rem] transition-all font-black text-xs flex items-center gap-2"
              >
                <X className="w-5 h-5" /> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Dashboard & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 border border-slate-100 shadow-xl flex flex-col sm:flex-row items-center gap-8">
          <div className="w-full sm:w-1/3 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">سقف التغطية السنوي</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-litcBlue">100,000</span>
              <span className="text-xs font-bold text-slate-400">د.ل</span>
            </div>
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase">المتبقي</p>
                <p className="text-xl font-black text-slate-900">{ceilingRemaining.toLocaleString()} د.ل</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase">المستهلك</p>
                <p className="text-sm font-black text-litcBlue">{ceilingUsed.toLocaleString()} د.ل ({ceilingPercentage.toFixed(1)}%)</p>
              </div>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-litcBlue to-litcOrange transition-all duration-1000"
                style={{ width: `${Math.min(ceilingPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 border border-slate-100 shadow-xl flex flex-col justify-center">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="بحث برقم الفاتورة، الاسم، أو المعرف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-[1.5rem] py-4 pr-12 pl-6 text-sm font-bold focus:ring-2 focus:ring-litcBlue transition-all"
            />
          </div>
        </div>
      </div>

      {/* User Profile Summary Card */}
      <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group max-w-md mx-auto lg:max-w-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-litcBlue/10 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-litcBlue to-litcDark rounded-[2rem] flex items-center justify-center text-3xl text-white font-black shadow-2xl border-4 border-white transform group-hover:rotate-3 transition-transform">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{user.name}</h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {user.location || 'الموقع غير محدد'}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> {user.building || 'المبنى غير محدد'}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> {user.jobTitle || 'الوظيفة غير محددة'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {user.healthProfile && (
              <>
                <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner"><ArrowUpRight className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">الطول</p>
                    <p className="text-sm font-black text-slate-900">{user.healthProfile.height} سم</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner"><Scale className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">الوزن</p>
                    <p className="text-sm font-black text-slate-900">{user.healthProfile.weight} كجم</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:bg-white transition-colors">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner"><Droplet className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">الفصيلة</p>
                    <p className="text-sm font-black text-slate-900">{user.healthProfile.bloodType}</p>
                  </div>
                </div>
              </>
            )}
            <button 
              onClick={() => onNavigate('profile')}
              className="px-8 py-4 bg-litcBlue text-white rounded-[2rem] font-black text-xs shadow-xl shadow-litcBlue/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              الملف الصحي <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


      <div className="flex flex-col xl:flex-row justify-between items-center xl:items-end gap-6 sm:gap-8 bg-white rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-10 border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] text-center xl:text-right max-w-md mx-auto sm:max-w-none">
        <div className="space-y-2 sm:space-y-3 w-full">
          <div className="flex items-center justify-center xl:justify-start gap-2 sm:gap-3 text-litcBlue font-black text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-litcBlue/5 w-fit mx-auto xl:mx-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border border-litcBlue/10 shadow-inner">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-litcOrange animate-pulse" />
            منصة الرعاية الذكية | LITC HUB
          </div>
          <h1 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center xl:justify-start">
             <div className="relative inline-block">
                <HeartPulse className="text-litcOrange animate-bounce w-6 h-6 sm:w-8 sm:h-8" />
                <div className="absolute inset-0 bg-litcOrange/20 blur-xl rounded-full"></div>
             </div>
             أهلاً بك، {user.name.split(' ')[0]} 
          </h1>
          <p className="text-slate-500 font-bold text-sm sm:text-lg max-w-xl mx-auto xl:mx-0">أنت تشرف الآن على <span className="text-litcBlue font-black underline decoration-litcOrange/30">{pendingActions.length} معاملة</span> تتطلب إجراءً منك.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 max-w-md mx-auto sm:max-w-none">
        {[
          { label: 'إجمالي السجلات', val: '1,254', icon: <Activity className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'bg-white text-litcBlue', sub: 'سجل طبي مجمع' },
          { label: 'تحت الإجراء', val: pendingActions.length, icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'bg-litcBlue text-white', sub: 'تتطلب مراجعة أو إسناد' },
          { label: 'نسبة الإنجاز', val: '94%', icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'bg-white text-emerald-600', sub: 'معدل نجاح التحويل الفني' },
          { label: 'الوقت المستغرق', val: '12h', icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'bg-white text-litcOrange', sub: 'متوسط وقت الاعتماد' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-slate-100`}>
             <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-current opacity-5 rounded-bl-[3rem] sm:rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
             <div className="mb-4 sm:mb-6 group-hover:translate-x-2 transition-transform text-right">{stat.icon}</div>
             <p className="text-3xl sm:text-5xl font-black mb-1 text-right">{stat.val}</p>
             <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60 mb-2 sm:mb-3 text-right">{stat.label}</p>
             <p className="text-[9px] sm:text-[10px] font-bold opacity-40 text-right">{stat.sub}</p>
          </div>
        ))}
      </div>

      <section className="space-y-6 sm:space-y-10 relative max-w-md mx-auto sm:max-w-none">
        <div className="flex items-center gap-4 px-4 sm:px-6 justify-end">
           <div className="text-right">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900">المعاملات النشطة والمهام</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">المعاملات التي لم يتم إسناد كافة فواتيرها تظهر بمؤشر "نقص إسناد"</p>
           </div>
           <div className="w-10 h-10 sm:w-12 sm:h-12 bg-litcBlue rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg"><Layers className="w-5 h-5 sm:w-6 sm:h-6" /></div>
        </div>

        {pendingActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
            {pendingActions.map(claim => {
              const unassignedCount = claim.invoices.filter(i => !i.assignedToId).length;
              
              return (
                <div key={claim.id} className="relative group">
                  {user.role === UserRole.HEAD_OF_UNIT && (
                     <div 
                        onClick={(e) => { e.stopPropagation(); toggleSelect(claim.id); }}
                        className={`absolute -top-4 -right-4 z-[45] w-14 h-14 rounded-2xl border-4 cursor-pointer transition-all flex items-center justify-center shadow-2xl ${selectedIds.includes(claim.id) ? 'bg-litcOrange border-white text-white rotate-12 scale-110 shadow-litcOrange/40' : 'bg-white border-slate-100 text-slate-200 hover:border-litcBlue hover:text-litcBlue'}`}
                     >
                        <CheckCircle2 className="w-7 h-7" strokeWidth={3} />
                     </div>
                  )}

                  {unassignedCount > 0 && (
                     <div className="absolute -top-4 -left-4 z-[45] bg-rose-500 text-white px-5 py-2 rounded-2xl font-black text-[10px] shadow-xl flex items-center gap-2 border-2 border-white animate-in zoom-in">
                        <UserPlus className="w-3.5 h-3.5" /> {unassignedCount} فواتير بلا موظف
                     </div>
                  )}

                  <ClaimCard claim={claim} onClick={onSelectClaim} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-48 bg-white/40 rounded-[5rem] border-4 border-dashed border-white flex flex-col items-center justify-center text-slate-300 backdrop-blur-sm">
             <HeartPulse className="w-24 h-24 sm:w-28 sm:h-28 opacity-10 animate-pulse mb-8" />
             <p className="text-3xl font-black text-slate-400 mb-2 text-center">لا توجد أي معاملات معلقة</p>
             <p className="text-sm font-bold opacity-60 text-center">أنت الآن متابع لكافة الطلبات والمراجعات بنسبة 100%.</p>
          </div>
        )}
      </section>

      {/* The Pool Section */}
      {user.role === UserRole.DATA_ENTRY && poolClaims.length > 0 && (
        <section className="space-y-6 sm:space-y-10">
          <div className="flex items-center gap-4 px-4 sm:px-6 justify-end">
             <div className="text-right">
                <h2 className="text-xl sm:text-3xl font-black text-rose-600">المجمع العام (The Pool)</h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">معاملات تجاوزت 24 ساعة بدون إسناد - متاحة للالتقاط</p>
             </div>
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg"><Hand className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-10">
            {poolClaims.map(claim => (
              <div key={claim.id} className="relative group">
                <div className="absolute -top-4 -left-4 z-[45] bg-amber-500 text-white px-5 py-2 rounded-2xl font-black text-[10px] shadow-xl flex items-center gap-2 border-2 border-white animate-bounce">
                  <AlertCircle className="w-3.5 h-3.5" /> متاح للالتقاط
                </div>
                <div className="absolute bottom-6 left-6 z-[45] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onAssign?.(claim.id, claim.invoices.map(i => i.id), user.id); 
                    }}
                    className="bg-litcBlue text-white px-8 py-4 rounded-[2rem] font-black text-sm shadow-2xl hover:bg-litcOrange transition-all flex items-center gap-3 border-4 border-white"
                  >
                    <Hand className="w-5 h-5" /> التقاط المعاملة الآن
                  </button>
                </div>
                <ClaimCard claim={claim} onClick={onSelectClaim} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transactions Tracking Section */}
      {user.role === UserRole.EMPLOYEE && (
        <section className="bg-white/50 backdrop-blur-md p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4.5rem] border border-white shadow-sm space-y-8 sm:space-y-10 max-w-md mx-auto sm:max-w-none">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900">تتبع معاملاتي</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">دورة حياة مطالباتك المالية والطبية</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-litcOrange/10 text-litcOrange rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner">
              <ListChecks className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {claims.filter(c => c.employeeId === user.id).length > 0 ? (
              claims.filter(c => c.employeeId === user.id).map(claim => (
                <div key={claim.id} className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-all text-center sm:text-right">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                      claim.status === ClaimStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' :
                      claim.status === ClaimStatus.REJECTED ? 'bg-rose-50 text-rose-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {claim.status === ClaimStatus.APPROVED ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-xs font-black text-slate-400 mb-1">مرجع: {claim.referenceNumber}</p>
                      <p className="text-base sm:text-lg font-black text-slate-900">{claim.description || 'مطالبة طبية'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 sm:gap-10">
                    <div className="text-center">
                      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">المبلغ</p>
                      <p className="text-xs sm:text-sm font-black text-litcBlue">{claim.totalAmount.toLocaleString()} د.ل</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase mb-1">الحالة الحالية</p>
                      <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black border ${STATUS_UI[claim.status].color} border-current/10`}>
                        {claim.status === ClaimStatus.APPROVED ? 'تم الاعتماد والصرف' :
                         claim.status === ClaimStatus.REJECTED ? 'مرفوضة' :
                         STATUS_UI[claim.status].label}
                      </span>
                    </div>
                    <button 
                      onClick={() => onSelectClaim(claim)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-litcBlue hover:text-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-300">
                <p className="font-black">لا توجد معاملات سابقة لتتبعها</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
