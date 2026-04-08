
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
    <div className="max-w-6xl mx-auto px-4 space-y-10 animate-in fade-in duration-1000 font-cairo pb-20" dir="rtl">
      {/* Welcome Header */}
      <div className="pt-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">مرحباً بك، {user.name.split(' ')[0]}</h1>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Tile 1: New Claim Trigger (Action Hub) */}
        <button 
          onClick={() => onNavigate('new-claim')}
          className="md:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(8,112,184,0.1)] flex flex-col items-center justify-center group overflow-hidden relative hover:scale-[1.02] hover:shadow-[0_30px_60px_rgba(0,92,132,0.2)] transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 group-hover:translate-x-10 transition-all duration-1000"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-litcBlue text-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(0,92,132,0.3)] group-hover:rotate-90 group-hover:scale-[1.2] transition-all duration-700">
              <PlusCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">تقديم معاملة طبية جديدة</h2>
          </div>
        </button>

        {/* Tile 2: Active Plan (Medium) */}
        <div className="md:col-span-4 bg-gradient-to-br from-litcBlue to-litcDark p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,92,132,0.2)] text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-litcOrange" />
            </div>
            <h3 className="text-xl font-black mb-2">الخطة النشطة</h3>
            <p className="text-xs font-medium text-white/60 leading-relaxed">
              {user.activePlans && user.activePlans.length > 0 
                ? (user.activePlans[0].goal === 'weight_loss' ? 'برنامج إنقاص الوزن الذكي' : 'برنامج الرعاية المتكاملة')
                : 'لا توجد خطة نشطة حالياً'}
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-4 h-4 text-litcOrange" />
              <span className="text-[10px] font-black uppercase tracking-widest">الموعد القادم: 12 أبريل</span>
            </div>
            <button 
              onClick={() => onNavigate('profile')}
              className="w-full py-4 bg-white text-litcBlue rounded-2xl font-black text-xs hover:bg-litcOrange hover:text-white transition-all duration-500 shadow-lg"
            >
              عرض تفاصيل الخطة
            </button>
          </div>
        </div>

        {/* Tile 3: Active Claims (Wide) */}
        <div className="md:col-span-12 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
              <Activity className="text-litcBlue w-8 h-8" /> المعاملات النشطة
            </h3>
            <button 
              onClick={() => onNavigate('archive')}
              className="text-xs font-black text-litcBlue hover:text-litcOrange transition-all duration-500 flex items-center gap-2"
            >
              عرض الأرشيف الكامل <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeClaims.slice(0, 2).length > 0 ? (
              activeClaims.slice(0, 2).map((claim) => (
                <div 
                  key={claim.id}
                  onClick={() => onSelectClaim(claim)}
                  className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(8,112,184,0.1)] hover:shadow-[0_30px_70px_rgba(8,112,184,0.2)] transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-litcBlue/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-litcBlue shadow-sm group-hover:bg-litcBlue group-hover:text-white transition-all duration-500">
                          <Stethoscope className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">#{claim.id.slice(-6)}</p>
                          <h4 className="text-xl font-black text-slate-900">{claim.invoices?.[0]?.hospitalName || 'خدمة طبية'}</h4>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-medium text-slate-400 uppercase mb-1">القيمة</p>
                        <p className="text-2xl font-black text-litcBlue">{claim.totalAmount.toLocaleString()} <span className="text-xs font-medium">د.ل</span></p>
                      </div>
                    </div>

                    {/* Minimalist Neon Stepper */}
                    <div className="relative pt-6">
                      {/* Background Dotted Line */}
                      <div className="absolute top-8 left-0 w-full h-[2px] border-t-2 border-dotted border-slate-200"></div>
                      <div className="flex justify-between items-center relative">
                        {['Sent', 'Received', 'Review', 'Paid'].map((step, idx) => {
                          const currentIndex = getStepIndex(claim.status);
                          const isCompleted = idx < currentIndex;
                          const isCurrent = idx === currentIndex;
                          
                          return (
                            <div key={idx} className="flex flex-col items-center gap-3 flex-1 relative">
                              {/* Solid Blue Line for Completed Stages */}
                              {idx < 3 && (
                                <div className={`absolute top-2 -left-1/2 w-full h-[2px] transition-all duration-1000 ${
                                  idx < currentIndex ? 'bg-litcBlue shadow-[0_0_10px_rgba(0,92,132,0.5)]' : 'bg-transparent'
                                }`}></div>
                              )}
                              
                              <div className="relative">
                                {isCurrent && (
                                  <motion.div 
                                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-litcBlue rounded-full blur-md"
                                  />
                                )}
                                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${
                                  isCompleted ? 'bg-litcBlue border-litcBlue shadow-[0_0_10px_rgba(0,92,132,0.5)]' : 
                                  isCurrent ? 'bg-white border-litcBlue shadow-[0_0_15px_rgba(0,92,132,0.8)]' : 
                                  'bg-white border-slate-200'
                                }`}></div>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-tighter ${isCurrent ? 'text-litcBlue' : 'text-slate-400'}`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 p-20 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                  <Search className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">لا توجد معاملات نشطة</p>
                  <p className="text-sm font-medium text-slate-400 mt-2">ابدأ بتقديم طلب جديد من خلال الزر أعلاه</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
