
import React, { useState } from 'react';
import { Claim, User, UserRole, ClaimStatus } from '../types';
import ClaimCard from '../components/ClaimCard';
import { 
  Activity, TrendingUp, Sparkles, Clock, 
  UserPlus, ListChecks, ArrowUpRight, 
  Layers, Wallet, CheckCircle2, ChevronRight, HeartPulse, ShieldCheck,
  Check, X
} from 'lucide-react';

interface DashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onNavigate: (path: string) => void;
  onAssign?: (claimId: string, invoiceIds: string[], staffId: string) => void;
}

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحي قرقاب', team: 'وحدة الصيدليات', stats: '90% منجز' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات', stats: '88% منجز' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات', stats: '95% منجز' },
];

const Dashboard: React.FC<DashboardProps> = ({ user, claims, onSelectClaim, onNavigate, onAssign }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingActions = claims.filter(c => {
    if (user.role === UserRole.DOCTOR) return c.status === ClaimStatus.PENDING_DR;
    
    if (user.role === UserRole.HEAD_OF_UNIT) {
      // رئيس الوحدة يرى المعاملات في حالة PENDING_HEAD 
      // أو التي في حالة PENDING_DATA_ENTRY ولكن لا يزال بها فواتير غير مسندة
      const hasUnassignedInvoices = c.invoices.some(inv => !inv.assignedToId);
      return (c.status === ClaimStatus.PENDING_HEAD) || 
             (c.status === ClaimStatus.PENDING_DATA_ENTRY && hasUnassignedInvoices);
    }
    
    if (user.role === UserRole.DATA_ENTRY) {
      // موظف الإدخال يرى فقط الفواتير المسندة إليه داخل المعاملة
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
            // إسناد الفواتير التي لم تُسند بعد فقط
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
                   className="px-6 py-3 bg-white/10 hover:bg-litcOrange rounded-2xl text-xs font-black transition-all border border-white/5 active:scale-95"
                >
                   {s.name}
                </button>
              ))}
           </div>

           <button onClick={() => setSelectedIds([])} className="p-3 bg-white/5 hover:bg-rose-500 rounded-xl transition-all">
              <X size={20} />
           </button>
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
          <p className="text-slate-500 font-bold text-lg max-w-xl">أنت الآن في لوحة التحكم المركزية لـ <span className="text-litcBlue font-black underline decoration-litcOrange/30">رئيس وحدة الرعاية</span>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {[
          { label: 'إجمالي السجلات', val: '1,254', icon: <Activity />, color: 'bg-white text-litcBlue', sub: 'سجل طبي مجمع' },
          { label: 'تحت الإجراء', val: pendingActions.length, icon: <Clock />, color: 'litc-gradient text-white', sub: 'تتطلب مراجعة فورية' },
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
           <h2 className="text-3xl font-black text-slate-900 text-right">المعاملات النشطة والمهام</h2>
           <div className="w-12 h-12 bg-litcBlue rounded-2xl flex items-center justify-center text-white shadow-lg"><Layers size={24} /></div>
        </div>

        {pendingActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {pendingActions.map(claim => (
              <div key={claim.id} className="relative group">
                {user.role === UserRole.HEAD_OF_UNIT && (
                   <div 
                      onClick={(e) => { e.stopPropagation(); toggleSelect(claim.id); }}
                      className={`absolute -top-4 -right-4 z-[45] w-14 h-14 rounded-2xl border-4 cursor-pointer transition-all flex items-center justify-center shadow-2xl ${selectedIds.includes(claim.id) ? 'bg-litcOrange border-white text-white rotate-12 scale-110 shadow-litcOrange/40' : 'bg-white border-slate-100 text-slate-200 hover:border-litcBlue hover:text-litcBlue'}`}
                   >
                      <CheckCircle2 size={28} strokeWidth={3} />
                   </div>
                )}
                <ClaimCard claim={claim} onClick={onSelectClaim} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-48 bg-white/40 rounded-[5rem] border-4 border-dashed border-white flex flex-col items-center justify-center text-slate-300 backdrop-blur-sm">
             <HeartPulse size={100} className="opacity-10 animate-pulse mb-8" />
             <p className="text-3xl font-black text-slate-400 mb-2 text-center">لا توجد أي معاملات معلقة</p>
             <p className="text-sm font-bold opacity-60 text-center">أنت الآن متابع لكافة الطلبات والمراجعات بنسبة 100%.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
