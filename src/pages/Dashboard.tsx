
import React, { useState, useEffect } from 'react';
import { Claim, User, UserRole, ClaimStatus, HealthPlan, FamilyMember } from '../types';
import { STATUS_UI, ROLE_LABELS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Check, X, Search, AlertCircle, LayoutDashboard, Database, Send, Eye, Glasses, Stethoscope, PlusCircle, SearchCheck, Briefcase, CreditCard, CheckCircle2,
  TrendingUp, Target, Wallet, Activity, Calendar, ChevronLeft, ArrowUpRight, History as HistoryIcon, Archive, FileText,
  Utensils, Dumbbell, User as UserIcon, Users, Sparkles
} from 'lucide-react';
import { createHealthPlan } from '../services/healthService';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onNavigate: (path: string) => void;
  onAssign?: (claimId: string, invoiceIds: string[], staffId: string) => void;
  onGrab?: (claimId: string) => void;
  onUpdateStatus?: (newStatus: ClaimStatus, comment?: string, extraData?: any) => void;
  isProfessionalView?: boolean;
}

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحيى قرقاب', team: 'وحدة الصيدليات', stats: '90% منجز' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات', stats: '88% منجز' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات', stats: '95% منجز' },
];

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  claims, 
  onSelectClaim, 
  onNavigate, 
  onAssign, 
  onGrab,
  onUpdateStatus,
  isProfessionalView = false
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'pool' | 'sent'>('my-tasks');
  const [showAllActive, setShowAllActive] = useState(false);
  
  const isEmployee = user.role === UserRole.EMPLOYEE;
  
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(user.id);
  const [healthPlan, setHealthPlan] = useState<HealthPlan | null>(null);

  useEffect(() => {
    if (!isEmployee) return;

    // Listen to the selected beneficiary's health plan
    const planId = selectedBeneficiaryId === user.id ? `plan-${user.id}` : `plan-${selectedBeneficiaryId}`;
    const unsub = onSnapshot(doc(db, 'healthPlans', planId), (docSnap) => {
      if (docSnap.exists()) {
        setHealthPlan(docSnap.data() as HealthPlan);
      } else {
        // Generate a default plan if none exists
        const beneficiary = selectedBeneficiaryId === user.id 
          ? user 
          : user.dependents?.find(d => d.id === selectedBeneficiaryId);
        
        if (beneficiary) {
          const defaultProfile = {
            bloodType: 'O+',
            age: 30,
            dailyWaterIntake: 2,
            height: (beneficiary as any).height || 175,
            weight: (beneficiary as any).weight || 75,
            chronicDiseases: (beneficiary as any).chronicDiseases || [],
            pathway: 'preventive' as any
          };
          const newPlan = createHealthPlan(defaultProfile as any, selectedBeneficiaryId === user.id);
          setHealthPlan(newPlan);
        }
      }
    });

    return () => unsub();
  }, [selectedBeneficiaryId, user, isEmployee]);

  const toggleTask = async (taskId: string) => {
    if (!healthPlan) return;
    
    const updatedTasks = healthPlan.dailyTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    const planId = selectedBeneficiaryId === user.id ? `plan-${user.id}` : `plan-${selectedBeneficiaryId}`;
    await updateDoc(doc(db, 'healthPlans', planId), {
      dailyTasks: updatedTasks
    });
  };

  const completedTasks = healthPlan?.dailyTasks.filter(t => t.completed).length || 0;
  const totalTasks = healthPlan?.dailyTasks.length || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  // Role-Based Filtering Logic
  const getMyTasks = () => {
    switch (user.role) {
      case UserRole.RECEPTIONIST:
        return claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.PENDING_PHYSICAL);
      case UserRole.DOCTOR:
        return claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.PENDING_MEDICAL);
      case UserRole.DATA_ENTRY:
        return claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.PENDING_FINANCIAL);
      case UserRole.HEAD_OF_UNIT:
        return claims.filter(c => c.status === ClaimStatus.PENDING_APPROVAL);
      case UserRole.INTERNAL_AUDITOR:
        return claims.filter(c => c.status === ClaimStatus.PENDING_AUDIT);
      default:
        return claims.filter(c => c.employeeId === user.id);
    }
  };

  const getPoolClaims = () => {
    switch (user.role) {
      case UserRole.RECEPTIONIST:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_PHYSICAL);
      case UserRole.DOCTOR:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_MEDICAL);
      case UserRole.DATA_ENTRY:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_FINANCIAL);
      case UserRole.HEAD_OF_UNIT:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_APPROVAL);
      case UserRole.INTERNAL_AUDITOR:
        return claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_AUDIT);
      default:
        return [];
    }
  };

  const getSentClaims = () => {
    return claims.filter(c => c.assignedToId === user.id && c.status !== ClaimStatus.PENDING_PHYSICAL && c.status !== ClaimStatus.DRAFT);
  };

  const myAssignments = getMyTasks();
  const poolClaims = getPoolClaims();
  const activeClaims = myAssignments.filter(c => 
    c.status !== ClaimStatus.PAID && 
    c.status !== ClaimStatus.REJECTED
  );
  const visibleActiveClaims = showAllActive ? activeClaims : activeClaims.slice(0, 2);

  const getStepIndex = (status: ClaimStatus) => {
    const steps = [
      ClaimStatus.DRAFT,
      ClaimStatus.PENDING_PHYSICAL,
      ClaimStatus.PENDING_MEDICAL,
      ClaimStatus.PENDING_FINANCIAL,
      ClaimStatus.PENDING_APPROVAL,
      ClaimStatus.PENDING_AUDIT,
      ClaimStatus.PAID
    ];
    return steps.indexOf(status);
  };

  const getNextStatus = (status: ClaimStatus): ClaimStatus | null => {
    const steps = [
      ClaimStatus.DRAFT,
      ClaimStatus.PENDING_PHYSICAL,
      ClaimStatus.PENDING_MEDICAL,
      ClaimStatus.PENDING_FINANCIAL,
      ClaimStatus.PENDING_APPROVAL,
      ClaimStatus.PENDING_AUDIT,
      ClaimStatus.PAID
    ];
    const currentIndex = steps.indexOf(status);
    if (currentIndex !== -1 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1];
    }
    return null;
  };

  const getActionLabel = (status: ClaimStatus): string => {
    switch (status) {
      case ClaimStatus.PENDING_PHYSICAL: return 'اعتماد الاستلام';
      case ClaimStatus.PENDING_MEDICAL: return 'اعتماد طبي';
      case ClaimStatus.PENDING_FINANCIAL: return 'معالجة مالية';
      case ClaimStatus.PENDING_APPROVAL: return 'اعتماد نهائي';
      case ClaimStatus.PENDING_AUDIT: return 'تأكيد الصرف';
      default: return 'تحديث الحالة';
    }
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
    <div className="max-w-7xl mx-auto px-4 space-y-8 animate-in fade-in duration-1000 font-cairo pb-20 bg-[#F4F7F6]" dir="rtl">
      {/* Welcome Header */}
      <div className="pt-12 flex justify-between items-end">
        <div>
          <p className="text-[#FF6B00] font-bold text-sm mb-1 uppercase tracking-widest">نظام LITC المتطور</p>
          <h1 className="text-4xl font-black text-[#003366] tracking-tight">
            {isProfessionalView ? `لوحة التحكم: ${ROLE_LABELS[user.role]}` : `مرحباً بك، ${user.name.split(' ')[0]}`}
          </h1>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-slate-400 uppercase">التاريخ اليوم</p>
          <p className="text-sm font-black text-[#003366]">{new Date().toLocaleDateString('ar-LY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Bento Grid Layout - Only for Personal View */}
      {(!isProfessionalView && isEmployee) ? (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-auto relative">
          {/* Global Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden select-none">
            <h1 className="text-[20vw] font-black text-[#003366] whitespace-nowrap -rotate-12">LITC - AI VERIFIED</h1>
          </div>
          
          {/* Card 1 [Large]: Smart Health Roadmap */}
          <div className="lg:col-span-8 lg:row-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#003366] via-[#FF6B00] to-[#003366] bg-[length:200%_100%] animate-gradient-x"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-[#003366]">خارطة الطريق الصحية</h3>
                  <div className="px-3 py-1 bg-[#F4F7F6] rounded-full flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#FF6B00]" />
                    <span className="text-[10px] font-black text-[#003366] uppercase tracking-tighter">AI Powered</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 max-w-md">خطة مخصصة بناءً على مؤشراتك الحيوية لضمان حياة صحية مستدامة.</p>
              </div>

              {/* Beneficiary Toggle */}
              <div className="flex bg-[#F4F7F6] p-1 rounded-2xl self-end sm:self-start">
                <button 
                  onClick={() => setSelectedBeneficiaryId(user.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                    selectedBeneficiaryId === user.id ? "bg-white text-[#003366] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <UserIcon className="w-3 h-3" /> أنا
                </button>
                {user.dependents?.map(dep => (
                  <button 
                    key={dep.id}
                    onClick={() => setSelectedBeneficiaryId(dep.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                      selectedBeneficiaryId === dep.id ? "bg-white text-[#003366] shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Users className="w-3 h-3" /> {dep.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center relative">
                {/* Progress Ring */}
                <svg className="w-56 h-56 sm:w-64 sm:h-64 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    className="text-slate-50"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="40%"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray="251.2%"
                    initial={{ strokeDashoffset: "251.2%" }}
                    animate={{ strokeDashoffset: `${251.2 * (1 - progressPercent / 100)}%` }}
                    strokeLinecap="round"
                    className="text-[#FF6B00] transition-all duration-1000 ease-out"
                    style={{ strokeDasharray: "251.2" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    key={progressPercent}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-black text-[#003366]"
                  >
                    {progressPercent}%
                  </motion.span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">إنجاز اليوم</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">المهام اليومية</h4>
                  <span className="text-[10px] font-bold text-[#FF6B00]">{completedTasks}/{totalTasks} مكتمل</span>
                </div>
                
                <div className="space-y-3">
                  {healthPlan?.dailyTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/task",
                        task.completed 
                          ? "bg-emerald-50 border-emerald-100" 
                          : "bg-[#F4F7F6] border-transparent hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          task.completed ? "bg-emerald-500 text-white" : "bg-white text-slate-400 group-hover/task:text-[#003366]"
                        )}>
                          {task.category === 'Meal' && <Utensils className="w-5 h-5" />}
                          {task.category === 'Exercise' && <Dumbbell className="w-5 h-5" />}
                          {task.category === 'Measurement' && <Activity className="w-5 h-5" />}
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-black",
                            task.completed ? "text-emerald-700 line-through opacity-60" : "text-[#003366]"
                          )}>
                            {task.label}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">{task.category}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        task.completed 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-slate-200 text-transparent"
                      )}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => onNavigate('profile')}
                  className="w-full mt-4 py-4 bg-[#003366] text-white rounded-2xl font-black text-sm hover:bg-[#FF6B00] transition-all duration-300 shadow-lg shadow-[#003366]/10 flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" /> عرض تفاصيل الخطة
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 [Medium]: Quick Claim Submission */}
          <button 
            onClick={() => onNavigate('submit-claim')}
            className="lg:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-[#FF6B00]/30 transition-all duration-300"
          >
            <div className="w-20 h-20 bg-[#F4F7F6] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <PlusCircle className="w-10 h-10 text-[#FF6B00]" />
            </div>
            <h3 className="text-xl font-black text-[#003366] mb-2">تقديم معاملة سريعة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">ارفع فواتيرك الطبية الآن للحصول على معالجة فورية.</p>
          </button>

          {/* Card 4 [Small]: Financial Balance */}
          <div className="lg:col-span-4 bg-[#003366] p-8 rounded-[2rem] text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <span className="text-[10px] font-bold bg-[#FF6B00] px-2 py-1 rounded-lg">نشط</span>
              </div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">الرصيد المتاح</p>
              <h3 className="text-3xl font-black">
                {(100000 - (user.annualCeilingUsed || 0)).toLocaleString()} <span className="text-sm font-medium">د.ل</span>
              </h3>
            </div>
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-white/40 mb-1">السقف السنوي</p>
                <p className="text-xs font-bold">100,000 د.ل</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#FF6B00]" />
            </div>
          </div>

          {/* Card 3 [Wide]: Recent Activity */}
          <div className="lg:col-span-12 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#003366] flex items-center gap-3">
                <HistoryIcon className="w-6 h-6 text-[#FF6B00]" /> النشاط الأخير
              </h3>
              <button 
                onClick={() => onNavigate('archive')}
                className="text-xs font-black text-[#003366] hover:text-[#FF6B00] transition-colors flex items-center gap-2"
              >
                الأرشيف الكامل <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {activeClaims.length > 0 ? (
                activeClaims.slice(0, 1).map((claim) => (
                  <div key={claim.id} className="p-6 bg-[#F4F7F6] rounded-3xl border border-slate-50">
                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#003366] shadow-sm">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">معاملة #{claim.id.slice(-6)}</p>
                          <h4 className="text-lg font-black text-[#003366]">{claim.invoices?.[0]?.hospitalName || 'خدمة طبية'}</h4>
                        </div>
                      </div>

                      {/* 7-Stage Stepper */}
                      <div className="flex-1 max-w-3xl">
                        <div className="relative flex justify-between items-center">
                          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2"></div>
                          {[
                            { label: 'مسودة', status: ClaimStatus.DRAFT },
                            { label: 'الاستلام', status: ClaimStatus.PENDING_PHYSICAL },
                            { label: 'المراجعة', status: ClaimStatus.PENDING_MEDICAL },
                            { label: 'المعالجة', status: ClaimStatus.PENDING_FINANCIAL },
                            { label: 'الاعتماد', status: ClaimStatus.PENDING_APPROVAL },
                            { label: 'التدقيق', status: ClaimStatus.PENDING_AUDIT },
                            { label: 'الصرف', status: ClaimStatus.PAID }
                          ].map((step, idx) => {
                            const currentIndex = getStepIndex(claim.status);
                            const isCompleted = idx < currentIndex;
                            const isCurrent = idx === currentIndex;
                            
                            return (
                              <div key={idx} className="relative flex flex-col items-center gap-2">
                                <div className={`w-3 h-3 rounded-full z-10 transition-all duration-500 ${
                                  isCompleted ? 'bg-[#FF6B00]' : 
                                  isCurrent ? 'bg-[#003366] ring-4 ring-[#003366]/20' : 
                                  'bg-slate-300'
                                }`}></div>
                                <span className={`text-[9px] font-bold whitespace-nowrap ${isCurrent ? 'text-[#003366]' : 'text-slate-400'}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">القيمة الإجمالية</p>
                        <p className="text-2xl font-black text-[#003366]">{claim.totalAmount.toLocaleString()} <span className="text-xs">د.ل</span></p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-bold">لا توجد أنشطة حديثة لعرضها.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Professional View / Task Pool Interface */
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setActiveTab('my-tasks')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'my-tasks' ? 'bg-white text-litcBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                مهامي الحالية ({myAssignments.length})
              </button>
              <button 
                onClick={() => setActiveTab('pool')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'pool' ? 'bg-white text-litcBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                حوض المهام ({poolClaims.length})
              </button>
              <button 
                onClick={() => setActiveTab('sent')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'sent' ? 'bg-white text-litcBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                المنجزة ({sentClaims.length})
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث برقم المعاملة أو اسم الموظف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-litcBlue outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,92,132,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعاملة</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">القيمة</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">#{claim.id.slice(-6)}</p>
                            <p className="text-[9px] font-bold text-slate-400">{claim.submissionDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-slate-900">{claim.employeeName}</p>
                        <p className="text-[9px] font-bold text-slate-400">{claim.department}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${getStatusColor(claim.status)}`}>
                          {getStatusLabel(claim.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-litcBlue">{claim.totalAmount.toLocaleString()} ر.س</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onSelectClaim(claim)}
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-litcBlue hover:text-white transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {activeTab === 'pool' && onGrab && (
                            <button 
                              onClick={() => onGrab(claim.id)}
                              className="px-4 py-2 bg-litcBlue text-white rounded-xl text-[10px] font-black hover:bg-litcDark transition-all shadow-lg shadow-litcBlue/20"
                            >
                              سحب المعاملة
                            </button>
                          )}
                          {activeTab === 'my-tasks' && onUpdateStatus && (
                            <button 
                              onClick={() => {
                                const next = getNextStatus(claim.status);
                                if (next) onUpdateStatus(next);
                              }}
                              className="px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-[10px] font-black hover:bg-[#e66000] transition-all shadow-lg shadow-[#FF6B00]/20"
                            >
                              {getActionLabel(claim.status)}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClaims.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Search className="w-12 h-12 opacity-20" />
                          <p className="text-sm font-bold">لا توجد نتائج تطابق بحثك.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
