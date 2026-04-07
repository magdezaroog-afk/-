
import React, { useState } from 'react';
import { Claim, User, UserRole, ClaimStatus } from '../types';
import { STATUS_UI } from '../constants';
import { 
  Clock, Check, X, Search, AlertCircle, LayoutDashboard, Database, Send, Eye, Glasses, Stethoscope, PlusCircle, SearchCheck, Briefcase, CreditCard, CheckCircle2
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 font-cairo pb-20 px-4 sm:px-0" dir="rtl">
      {/* Consolidated Header */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-100 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex-1 space-y-6 w-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-litcBlue to-litcDark flex items-center justify-center text-2xl text-white font-black shadow-2xl border-4 border-white">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">مرحباً بك، {user.name}</h1>
                <p className="text-xs font-bold text-slate-400 mt-1">بوابتك الصحية الذكية لإدارة المطالبات الطبية</p>
              </div>
            </div>

            {isEmployee && (
              <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-white shadow-inner">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-litcBlue w-4 h-4" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">السقف السنوي (5,000 د.ل)</span>
                  </div>
                  <span className="text-sm font-black text-litcBlue">{(5000 - (user.annualCeilingUsed || 0)).toLocaleString()} <span className="text-[10px] opacity-50">د.ل متبقي</span></span>
                </div>
                <div className="h-4 bg-slate-200/50 rounded-full overflow-hidden border border-white shadow-inner relative">
                  <div 
                    className="h-full bg-gradient-to-r from-litcBlue to-litcOrange transition-all duration-1000 shadow-lg"
                    style={{ width: `${Math.min(100, Math.round(((user.annualCeilingUsed || 0) / 5000) * 100))}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white mix-blend-difference">
                      {Math.round(((user.annualCeilingUsed || 0) / 5000) * 100)}% مستهلك
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto">
            {isEmployee && (
              <button 
                onClick={() => onNavigate('submit-claim')}
                className="flex-1 lg:w-64 bg-litcBlue text-white py-5 px-8 rounded-2xl font-black text-lg shadow-2xl shadow-litcBlue/30 hover:scale-105 hover:bg-litcDark transition-all flex items-center justify-center gap-3 group"
              >
                <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                تقديم طلب استرجاع جديد
              </button>
            )}
            <div className="relative flex-1 lg:w-64 group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-litcBlue transition-colors w-4 h-4" />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-12 pl-6 font-bold text-xs outline-none focus:border-litcBlue focus:ring-4 focus:ring-litcBlue/5 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit mx-auto sm:mx-0">
        <button 
          onClick={() => setActiveTab('my-tasks')}
          className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'my-tasks' ? 'bg-white text-litcBlue shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Briefcase className="w-4 h-4" /> {isEmployee ? 'طلباتي الحالية' : 'مهامي المكلف بها'}
          {myAssignments.length > 0 && <span className="bg-litcBlue text-white px-2 py-0.5 rounded-full text-[10px]">{myAssignments.length}</span>}
        </button>
        {!isEmployee && (
          <button 
            onClick={() => setActiveTab('pool')}
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'pool' ? 'bg-white text-litcBlue shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database className="w-4 h-4" /> {user.role === UserRole.DOCTOR ? 'المراجعة الطبية' : 'الحوض العام'}
            {poolClaims.length > 0 && <span className="bg-litcOrange text-white px-2 py-0.5 rounded-full text-[10px]">{poolClaims.length}</span>}
          </button>
        )}
        <button 
          onClick={() => setActiveTab('sent')}
          className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'sent' ? 'bg-white text-litcBlue shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Send className="w-4 h-4" /> {isEmployee ? 'طلبات مكتملة' : 'مرسلة للمراجعة'}
        </button>
      </div>

      {/* Bulk Assignment Bar for Unit Head */}
      {user.role === UserRole.HEAD_OF_UNIT && selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 border-4 border-white rounded-[3rem] p-6 sm:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-right">
              <p className="text-white text-xl sm:text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 bg-litcOrange rounded-xl flex items-center justify-center text-white shadow-lg">{selectedIds.length}</div>
                تم اختيار معاملات للإسناد
              </p>
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

      {/* Main Content Area - Luxury White Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative min-h-[600px] max-w-6xl mx-auto">
        
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-6 bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
          <div className="col-span-1">ID</div>
          <div className="col-span-2">اسم الموظف / الجهة</div>
          <div className="col-span-2">المستفيد</div>
          <div className="col-span-1">التاريخ</div>
          <div className="col-span-2 text-center">الحالة</div>
          <div className="col-span-2">القيمة الإجمالية</div>
          <div className="col-span-2 text-left">الإجراءات</div>
        </div>

        <div className="divide-y divide-slate-50 overflow-x-auto">
          <div className="min-w-[1000px] md:min-w-0">
            {filteredClaims.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                <SearchCheck className="w-20 h-20 mb-6 opacity-20" />
                <p className="font-black text-lg">لا توجد معاملات مطابقة للبحث</p>
              </div>
            ) : (
              filteredClaims.map((claim) => (
                <div 
                  key={claim.id} 
                  onClick={() => onSelectClaim(claim)}
                  className="grid grid-cols-12 gap-4 px-6 sm:px-10 py-6 items-center hover:bg-slate-50/80 transition-all group relative cursor-pointer"
                >
                  {/* Selection Checkbox for Unit Head */}
                  {user.role === UserRole.HEAD_OF_UNIT && activeTab === 'pool' && (
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(claim.id)}
                        onChange={() => toggleSelect(claim.id)}
                        className="w-5 h-5 rounded-lg border-2 border-slate-200 text-litcBlue focus:ring-litcBlue transition-all cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Claim ID & Type Icon */}
                  <div className="col-span-1 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-litcBlue/10 group-hover:text-litcBlue transition-colors">
                      {claim.invoices?.[0]?.isGlasses ? <Glasses className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 font-mono">#{claim.id.slice(-5)}</span>
                  </div>

                  {/* Employee Info */}
                  <div className="col-span-2">
                    <p className="text-sm font-black text-slate-900 truncate">{claim.employeeName}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{claim.invoices?.[0]?.hospitalName || 'جهة غير محددة'}</p>
                  </div>

                  {/* Beneficiary */}
                  <div className="col-span-2">
                    <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                      {claim.invoices?.[0]?.relationship || 'الموظف نفسه'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">{new Date(claim.submissionDate || Date.now()).toLocaleDateString('ar-LY')}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border ${getStatusColor(claim.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {getStatusLabel(claim.status)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <p className="text-sm font-black text-litcBlue">
                      {claim.totalAmount?.toLocaleString()} <span className="text-[10px] opacity-60">د.ل</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {activeTab === 'pool' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onSelectClaim(claim)}
                          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black hover:border-litcBlue hover:text-litcBlue transition-all shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> عرض التفاصيل
                        </button>
                        <button 
                          onClick={() => onGrab && onGrab(claim.id)}
                          className="flex items-center gap-2 bg-litcOrange text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> سحب المعاملة
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onSelectClaim(claim)}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black hover:border-litcBlue hover:text-litcBlue transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> {activeTab === 'sent' ? 'عرض التفاصيل' : 'بدء المعالجة'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
