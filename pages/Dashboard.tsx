
import React, { useState } from 'react';
import { Claim, User, UserRole, ClaimStatus } from '../types';
import ClaimCard from '../components/ClaimCard';
import { 
  Activity, TrendingUp, Sparkles, Clock, 
  UserPlus, ListChecks, ArrowUpRight, 
  Layers, Wallet, CheckCircle2, ChevronRight, HeartPulse, ShieldCheck,
  Check, X, User as UserIcon, Droplet, Target, Scale
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

  const pendingActions = claims.filter(c => {
    if (user.role === UserRole.DOCTOR) return c.status === ClaimStatus.PENDING_DR;
    
    if (user.role === UserRole.HEAD_OF_UNIT) {
      // رئيس الوحدة يرى المعاملات التي تحتاج لقراره أو لإسناد فواتيرها
      const hasUnassignedInvoices = c.invoices.some(inv => !inv.assignedToId);
      return (c.status === ClaimStatus.PENDING_HEAD) || 
             (c.status === ClaimStatus.PENDING_DATA_ENTRY && hasUnassignedInvoices) ||
             (c.status === ClaimStatus.PENDING_DR && hasUnassignedInvoices); // حالة نادرة لكن ممكنة
    }
    
    if (user.role === UserRole.DATA_ENTRY) {
      // موظف الإدخال يرى المعاملات التي بها فواتير تخصه
      return c.invoices.some(i => i.assignedToId === user.id);
    }

    if (user.role === UserRole.AUDITOR) {
      // مكتب المراجعة يرى المعاملات المحولة له
      return c.status === ClaimStatus.PENDING_AUDIT;
    }
    return false;
  });

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
      {user.role === UserRole.HEAD_OF_UNIT && selectedIds.length > 0 && (
        <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-litcDark text-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center gap-4 sm:gap-10 border border-white/10 animate-in slide-in-from-bottom-10 w-[90%] sm:w-auto">
           <div className="flex items-center gap-3 sm:gap-4 border-b sm:border-b-0 sm:border-l border-white/20 pb-3 sm:pb-0 sm:pl-8 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-litcOrange rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-base">{selectedIds.length}</div>
              <p className="font-black text-[10px] sm:text-sm text-center sm:text-right">معاملات محددة<br/>للإسناد الفوري</p>
           </div>
           
           <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <p className="text-[9px] sm:text-xs font-bold text-white/50 ml-1 sm:ml-2">إسناد الكل إلى:</p>
              {DATA_ENTRY_STAFF.map(s => (
                <button 
                   key={s.id} 
                   onClick={() => handleBulkAssign(s.id)}
                   className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 hover:bg-litcOrange rounded-xl sm:rounded-2xl text-[9px] sm:text-xs font-black transition-all border border-white/5 active:scale-95 flex items-center gap-1 sm:gap-2"
                >
                   <UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                   {s.name}
                </button>
              ))}
           </div>

           <button onClick={() => setSelectedIds([])} className="p-2 sm:p-3 bg-white/5 hover:bg-rose-500 rounded-lg sm:rounded-xl transition-all absolute top-2 left-2 sm:static">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
           </button>
        </div>
      )}

      {/* Smart Profile Summary at Top */}
      {user.role === UserRole.EMPLOYEE && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-700 max-w-md mx-auto sm:max-w-none">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-8 border border-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              <button 
                onClick={() => onNavigate('profile')}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-litcBlue to-litcDark rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl hover:scale-105 transition-all shrink-0"
              >
                {user.name.charAt(0)}
              </button>
              <div className="cursor-pointer" onClick={() => onNavigate('profile')}>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">ملفي الصحي الذكي</h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500">متابعة حية للمؤشرات الحيوية والمسار المعتمد</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-3 sm:gap-4">
              {user.healthProfile && (
                <>
                  <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center"><ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">الطول</p>
                      <p className="text-xs sm:text-sm font-black text-slate-900">{user.healthProfile.height} سم</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center"><Scale className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">الوزن</p>
                      <p className="text-xs sm:text-sm font-black text-slate-900">{user.healthProfile.weight} كجم</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-50 text-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center"><Droplet className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">الفصيلة</p>
                      <p className="text-xs sm:text-sm font-black text-slate-900">{user.healthProfile.bloodType}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => onNavigate('profile')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-litcBlue text-white rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-xs shadow-lg shadow-litcBlue/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              فتح الملف الصحي الذكي <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {user.activePlans && user.activePlans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user.activePlans.filter(p => p.status === 'active').slice(0, 3).map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-litcBlue transition-all cursor-pointer" onClick={() => onNavigate('profile')}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.type === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-litcBlue'}`}>
                      {plan.type === 'healthy' ? <Activity className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">هدف نشط</p>
                      <p className="text-sm font-black text-slate-900">
                        {plan.goal === 'weight_loss' ? 'إنقاص الوزن' : 
                         plan.goal === 'muscle_building' ? 'بناء العضلات' : 'تنظيم المؤشرات'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-litcBlue group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-center xl:items-end gap-6 sm:gap-8 bg-white/30 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] border border-white/50 backdrop-blur-xl shadow-sm text-center xl:text-right max-w-md mx-auto sm:max-w-none">
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
          { label: 'تحت الإجراء', val: pendingActions.length, icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'litc-gradient text-white', sub: 'تتطلب مراجعة أو إسناد' },
          { label: 'نسبة الإنجاز', val: '94%', icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'bg-white text-emerald-600', sub: 'معدل نجاح التحويل الفني' },
          { label: 'الوقت المستغرق', val: '12h', icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />, color: 'bg-white text-litcOrange', sub: 'متوسط وقت الاعتماد' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-black/5`}>
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
              const isPartiallyAssigned = unassignedCount > 0 && unassignedCount < claim.invoices.length;
              
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
                      <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black border ${
                        claim.status === ClaimStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        claim.status === ClaimStatus.REJECTED ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {claim.status === ClaimStatus.APPROVED ? 'تم الاعتماد والصرف' :
                         claim.status === ClaimStatus.REJECTED ? 'مرفوضة' :
                         claim.status === ClaimStatus.PENDING_DR ? 'بانتظار مراجعة الطبيب' :
                         claim.status === ClaimStatus.PENDING_HEAD ? 'بانتظار رئيس الوحدة' :
                         claim.status === ClaimStatus.PENDING_DATA_ENTRY ? 'جاري إدخال البيانات' :
                         claim.status === ClaimStatus.PENDING_AUDIT ? 'بانتظار المراجعة المالية' : 'قيد المعالجة'}
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
