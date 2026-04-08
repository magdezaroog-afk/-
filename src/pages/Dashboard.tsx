
import React, { useState } from 'react';
import { Claim, User, UserRole, ClaimStatus } from '../types';
import { STATUS_UI } from '../constants';
import { motion } from 'motion/react';
import { 
  Clock, Check, X, Search, AlertCircle, LayoutDashboard, Database, Send, Eye, Glasses, Stethoscope, PlusCircle, SearchCheck, Briefcase, CreditCard, CheckCircle2,
  TrendingUp, Target, Wallet, Activity, Calendar, ChevronLeft, ArrowUpRight, History as HistoryIcon, Archive
} from 'lucide-react';

interface DashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onNavigate: (path: string) => void;
  onAssign?: (claimId: string, invoiceIds: string[], staffId: string) => void;
  onGrab?: (claimId: string) => void;
}

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحيى قرقاب', team: 'وحدة الصيدليات', stats: '90% منجز' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات', stats: '88% منجز' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات', stats: '95% منجز' },
];

const Dashboard: React.FC<DashboardProps> = ({ user, claims, onSelectClaim, onNavigate, onAssign, onGrab }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'pool' | 'sent'>('my-tasks');
  const [showAllActive, setShowAllActive] = useState(false);

  // Role-Based Filtering Logic
  const getMyTasks = () => {
    switch (user.role) {
      case UserRole.RECEPTIONIST:
        return claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.WAITING_FOR_PAPER);
      case UserRole.DOCTOR:
        return claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.PAPER_RECEIVED);
      case UserRole.DATA_ENTRY:
        return claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.MEDICALLY_APPROVED);
      case UserRole.HEAD_OF_UNIT:
        return claims.filter(c => c.status === ClaimStatus.FINANCIALLY_PROCESSED || c.status === ClaimStatus.CHIEF_APPROVED);
      default:
        return claims.filter(c => c.employeeId === user.id);
    }
  };

  const getPoolClaims = () => {
    switch (user.role) {
      case UserRole.RECEPTIONIST:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.WAITING_FOR_PAPER);
      case UserRole.DOCTOR:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PAPER_RECEIVED);
      case UserRole.DATA_ENTRY:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.MEDICALLY_APPROVED);
      case UserRole.HEAD_OF_UNIT:
        return claims.filter(c => !c.assignedToId); // Chief sees all unassigned
      default:
        return [];
    }
  };

  const getSentClaims = () => {
    return claims.filter(c => c.assignedToId === user.id && c.status !== ClaimStatus.WAITING_FOR_PAPER);
  };

  const isEmployee = user.role === UserRole.EMPLOYEE;
  const myAssignments = getMyTasks();
  const poolClaims = getPoolClaims();
  const activeClaims = myAssignments.filter(c => 
    c.status !== ClaimStatus.PAID && 
    c.status !== ClaimStatus.REJECTED && 
    c.status !== ClaimStatus.MEDICALLY_REJECTED
  );
  const visibleActiveClaims = showAllActive ? activeClaims : activeClaims.slice(0, 2);

  const getStepIndex = (status: ClaimStatus) => {
    const steps = [
      ClaimStatus.WAITING_FOR_PAPER,
      ClaimStatus.PAPER_RECEIVED,
      ClaimStatus.MEDICALLY_APPROVED,
      ClaimStatus.FINANCIALLY_PROCESSED
    ];
    return steps.indexOf(status);
  };
  const sentClaims = getSentClaims();

  const displayClaims = activeTab === 'my-tasks' ? myAssignments : 
                        activeTab === 'pool' ? poolClaims : sentClaims;

  const filteredClaims = displayClaims.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getStatusColor = (status: ClaimStatus) => {
    return STATUS_UI[status]?.color || 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getStatusLabel = (status: ClaimStatus) => {
    return STATUS_UI[status]?.label || status;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 animate-in fade-in duration-700 font-cairo pb-20" dir="rtl">
      {/* Welcome Header & Slim Financial Bar */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">مرحباً بك، {user.name.split(' ')[0]}</h1>
            <p className="text-sm font-bold text-slate-400 mt-1">نظام رعاية LITC الذكي - لوحة التحكم</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => onNavigate('archive')} 
               className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-100"
             >
               <Archive className="w-4 h-4" />
               الأرشيف
             </button>
             <button 
               onClick={() => onNavigate('new-claim')} 
               className="px-5 py-2.5 bg-litcBlue text-white rounded-xl font-bold text-xs shadow-lg shadow-litcBlue/20 hover:scale-105 transition-all flex items-center gap-2"
             >
               <PlusCircle className="w-4 h-4" />
               طلب جديد
             </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-litcBlue" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">السقف المالي السنوي (5,000 د.ل)</p>
            </div>
            <p className="text-xs font-black text-litcBlue">{(user.annualCeilingUsed || 0).toLocaleString()} د.ل مستهلك</p>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round(((user.annualCeilingUsed || 0) / 5000) * 100))}%` }}
              className="h-full bg-gradient-to-l from-litcBlue to-litcOrange rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Active Plan Glass Card */}
      {user.activePlans && user.activePlans.length > 0 && (
        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-litcOrange/10 text-litcOrange rounded-full text-[10px] font-black uppercase tracking-wider">
              {user.activePlans[0].goal === 'weight_loss' ? 'إنقاص الوزن' : 
               user.activePlans[0].goal === 'muscle_building' ? 'بناء العضلات' : 'خطة صحية'}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold">الموعد القادم: {new Date().toLocaleDateString('ar-LY', { day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              const newPlans = user.activePlans?.filter((_, i) => i !== 0) || [];
              if (window.confirm('هل أنت متأكد من إلغاء الخطة؟')) {
                // In a real app we'd call onUpdatePlans, but here we just navigate or let user handle it
                onNavigate('profile');
              }
            }}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* Active Claims Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Activity className="text-litcBlue w-6 h-6" /> المعاملات النشطة
            </h3>
            <span className="px-3 py-1 bg-blue-50 text-litcBlue rounded-full text-[10px] font-black">
              {activeClaims.length} طلب قيد المعالجة
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {visibleActiveClaims.length > 0 ? (
              visibleActiveClaims.map((claim) => (
                <div 
                  key={claim.id}
                  onClick={() => onSelectClaim(claim)}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-litcBlue group-hover:bg-litcBlue group-hover:text-white transition-all">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">#{claim.id.slice(-6)}</p>
                          <h4 className="text-lg font-black text-slate-900">{claim.invoices?.[0]?.hospitalName || 'خدمة طبية'}</h4>
                        </div>
                      </div>

                      {/* Horizontal Stepper UI */}
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-2 px-2">
                          {['تقديم', 'استلام', 'مراجعة', 'مالية'].map((step, idx) => {
                            const currentIndex = getStepIndex(claim.status);
                            const isCompleted = idx < currentIndex;
                            const isCurrent = idx === currentIndex;
                            
                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 flex-1 relative">
                                {idx < 3 && (
                                  <div className={`absolute top-2 -left-1/2 w-full h-0.5 ${idx < currentIndex ? 'bg-litcBlue' : 'bg-slate-100'}`}></div>
                                )}
                                <div className="relative">
                                  {isCurrent && (
                                    <motion.div 
                                      animate={{ scale: [1, 1.5, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="absolute inset-0 bg-litcBlue/20 rounded-full blur-md"
                                    />
                                  )}
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center z-10 border-2 transition-all relative ${
                                    isCompleted ? 'bg-litcBlue border-litcBlue text-white' : 
                                    isCurrent ? 'bg-white border-litcBlue text-litcBlue' : 
                                    'bg-white border-slate-100 text-slate-300'
                                  }`}>
                                    {isCompleted && <Check className="w-2 h-2" />}
                                  </div>
                                </div>
                                <span className={`text-[8px] font-black ${isCurrent ? 'text-litcBlue' : 'text-slate-400'}`}>{step}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-4">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">القيمة الإجمالية</p>
                        <p className="text-xl font-black text-litcBlue">{claim.totalAmount.toLocaleString()} <span className="text-xs">د.ل</span></p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 ${getStatusColor(claim.status)}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                        {getStatusLabel(claim.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-400">لا توجد معاملات نشطة حالياً</p>
              </div>
            )}
          </div>

          {activeClaims.length > 2 && (
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => setShowAllActive(!showAllActive)}
                className="px-8 py-3 bg-white border border-slate-100 rounded-2xl font-black text-xs text-slate-600 hover:bg-slate-50 hover:text-litcBlue transition-all shadow-sm flex items-center gap-3 group"
              >
                {showAllActive ? 'إخفاء المعاملات' : 'عرض الكل'}
                <ChevronLeft className={`w-4 h-4 transition-transform ${showAllActive ? 'rotate-90' : 'group-hover:-translate-x-1'}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
