
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 font-cairo" dir="rtl">
      {user.role === UserRole.HEAD_OF_UNIT && selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-litcDark text-white p-6 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center gap-10 border border-white/10 animate-in slide-in-from-bottom-10">
           <div className="flex items-center gap-4 border-l border-white/20 pl-8">
              <div className="w-12 h-12 bg-litcOrange rounded-2xl flex items-center justify-center font-black">{selectedIds.length}</div>
              <p className="font-black text-sm text-right">معاملات محددة<br/>للإسناد الفوري</p>
           </div>
           
           <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-white/50 ml-2">إسناد الكل إلى:</p>
              {DATA_ENTRY_STAFF.map(s => (
                <button 
                   key={s.id} 
                   onClick={() => handleBulkAssign(s.id)}
                   className="px-6 py-3 bg-white/10 hover:bg-litcOrange rounded-2xl text-xs font-black transition-all border border-white/5 active:scale-95 flex items-center gap-2"
                >
                   <UserIcon size={12} />
                   {s.name}
                </button>
              ))}
           </div>

           <button onClick={() => setSelectedIds([])} className="p-3 bg-white/5 hover:bg-rose-500 rounded-xl transition-all">
              <X size={20} />
           </button>
        </div>
      )}

      {/* Smart Profile Summary at Top */}
      {user.role === UserRole.EMPLOYEE && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="bg-white/70 backdrop-blur-xl rounded-[3.5rem] p-8 border border-white shadow-sm flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => onNavigate('profile')}
                className="w-20 h-20 bg-gradient-to-br from-litcBlue to-litcDark rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl hover:scale-105 transition-all"
              >
                {user.name.charAt(0)}
              </button>
              <div className="cursor-pointer" onClick={() => onNavigate('profile')}>
                <h2 className="text-2xl font-black text-slate-900">ملفي الصحي الذكي</h2>
                <p className="text-xs font-bold text-slate-500">متابعة حية للمؤشرات الحيوية والمسار المعتمد</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {user.healthProfile && (
                <>
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ArrowUpRight size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">الطول</p>
                      <p className="text-sm font-black text-slate-900">{user.healthProfile.height} سم</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Scale size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">الوزن</p>
                      <p className="text-sm font-black text-slate-900">{user.healthProfile.weight} كجم</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><Droplet size={20} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">الفصيلة</p>
                      <p className="text-sm font-black text-slate-900">{user.healthProfile.bloodType}</p>
                    </div>
                  </div>
                  {(user.healthProfile.chronicDiseases.includes('سكري نوع 1') || user.healthProfile.chronicDiseases.includes('سكري نوع 2')) && user.healthProfile.hba1c && (
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 bg-litcBlue/10 text-litcBlue rounded-xl flex items-center justify-center"><Activity size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">التراكمي</p>
                        <p className="text-sm font-black text-slate-900">{user.healthProfile.hba1c}%</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Target size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase">الخطط</p>
                  <p className="text-sm font-black text-slate-900">{user.activePlans?.length || 0} خطط</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onNavigate('profile')}
              className="px-8 py-4 bg-litcBlue text-white rounded-3xl font-black text-xs shadow-lg shadow-litcBlue/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              فتح العيادة الذكية <ArrowUpRight size={16} />
            </button>
          </div>

          {user.activePlans && user.activePlans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user.activePlans.filter(p => p.status === 'active').slice(0, 3).map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-litcBlue transition-all cursor-pointer" onClick={() => onNavigate('profile')}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.type === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-litcBlue'}`}>
                      {plan.type === 'healthy' ? <Activity size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">هدف نشط</p>
                      <p className="text-sm font-black text-slate-900">
                        {plan.goal === 'weight_loss' ? 'إنقاص الوزن' : 
                         plan.goal === 'muscle_building' ? 'بناء العضلات' : 'تنظيم المؤشرات'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-litcBlue group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-white/30 p-10 rounded-[3.5rem] border border-white/50 backdrop-blur-xl shadow-sm">
        <div className="space-y-3 text-right">
          <div className="flex items-center gap-3 text-litcBlue font-black text-[10px] uppercase tracking-[0.4em] bg-litcBlue/5 w-fit px-5 py-2 rounded-full border border-litcBlue/10 shadow-inner">
            <ShieldCheck size={14} className="text-litcOrange animate-pulse" />
            منصة الرعاية الذكية | LITC HUB
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 justify-end">
             <div className="relative inline-block">
                <HeartPulse className="text-litcOrange animate-bounce" size={40} />
                <div className="absolute inset-0 bg-litcOrange/20 blur-xl rounded-full"></div>
             </div>
             أهلاً بك، {user.name.split(' ')[0]} 
          </h1>
          <p className="text-slate-500 font-bold text-lg max-w-xl">أنت تشرف الآن على <span className="text-litcBlue font-black underline decoration-litcOrange/30">{pendingActions.length} معاملة</span> تتطلب إجراءً منك.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          { label: 'إجمالي السجلات', val: '1,254', icon: <Activity />, color: 'bg-white text-litcBlue', sub: 'سجل طبي مجمع' },
          { label: 'تحت الإجراء', val: pendingActions.length, icon: <Clock />, color: 'litc-gradient text-white', sub: 'تتطلب مراجعة أو إسناد' },
          { label: 'نسبة الإنجاز', val: '94%', icon: <TrendingUp />, color: 'bg-white text-emerald-600', sub: 'معدل نجاح التحويل الفني' },
          { label: 'الوقت المستغرق', val: '12h', icon: <Sparkles />, color: 'bg-white text-litcOrange', sub: 'متوسط وقت الاعتماد' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-black/5`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-bl-[4rem] group-hover:scale-110 transition-transform"></div>
             <div className="mb-6 group-hover:translate-x-2 transition-transform text-right">{stat.icon}</div>
             <p className="text-5xl font-black mb-1 text-right">{stat.val}</p>
             <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-3 text-right">{stat.label}</p>
             <p className="text-[10px] font-bold opacity-40 text-right">{stat.sub}</p>
          </div>
        ))}
      </div>

      <section className="space-y-10 relative">
        <div className="flex items-center gap-4 px-6 justify-end">
           <div className="text-right">
              <h2 className="text-3xl font-black text-slate-900">المعاملات النشطة والمهام</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">المعاملات التي لم يتم إسناد كافة فواتيرها تظهر بمؤشر "نقص إسناد"</p>
           </div>
           <div className="w-12 h-12 bg-litcBlue rounded-2xl flex items-center justify-center text-white shadow-lg"><Layers size={24} /></div>
        </div>

        {pendingActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
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
                        <CheckCircle2 size={28} strokeWidth={3} />
                     </div>
                  )}

                  {unassignedCount > 0 && (
                     <div className="absolute -top-4 -left-4 z-[45] bg-rose-500 text-white px-5 py-2 rounded-2xl font-black text-[10px] shadow-xl flex items-center gap-2 border-2 border-white animate-in zoom-in">
                        <UserPlus size={14} /> {unassignedCount} فواتير بلا موظف
                     </div>
                  )}

                  <ClaimCard claim={claim} onClick={onSelectClaim} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-48 bg-white/40 rounded-[5rem] border-4 border-dashed border-white flex flex-col items-center justify-center text-slate-300 backdrop-blur-sm">
             <HeartPulse size={100} className="opacity-10 animate-pulse mb-8" />
             <p className="text-3xl font-black text-slate-400 mb-2 text-center">لا توجد أي معاملات معلقة</p>
             <p className="text-sm font-bold opacity-60 text-center">أنت الآن متابع لكافة الطلبات والمراجعات بنسبة 100%.</p>
          </div>
        )}
      </section>

      {/* Transactions Tracking Section */}
      {user.role === UserRole.EMPLOYEE && (
        <section className="bg-white/50 backdrop-blur-md p-12 rounded-[4.5rem] border border-white shadow-sm space-y-10">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h2 className="text-3xl font-black text-slate-900">تتبع معاملاتي</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">دورة حياة مطالباتك المالية والطبية</p>
            </div>
            <div className="w-14 h-14 bg-litcOrange/10 text-litcOrange rounded-2xl flex items-center justify-center shadow-inner">
              <ListChecks size={28} />
            </div>
          </div>

          <div className="space-y-6">
            {claims.filter(c => c.employeeId === user.id).length > 0 ? (
              claims.filter(c => c.employeeId === user.id).map(claim => (
                <div key={claim.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6 hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      claim.status === ClaimStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' :
                      claim.status === ClaimStatus.REJECTED ? 'bg-rose-50 text-rose-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {claim.status === ClaimStatus.APPROVED ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 mb-1">مرجع: {claim.referenceNumber}</p>
                      <p className="text-lg font-black text-slate-900">{claim.description || 'مطالبة طبية'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المبلغ</p>
                      <p className="text-sm font-black text-litcBlue">{claim.totalAmount.toLocaleString()} د.ل</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الحالة الحالية</p>
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border ${
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
                      className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-litcBlue hover:text-white transition-all"
                    >
                      <ChevronRight size={20} className="rotate-180" />
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
