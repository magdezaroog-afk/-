
import React, { useState } from 'react';
import { Claim, User, UserRole, ClaimStatus } from '../types';
import { STATUS_UI } from '../constants';
import { 
  Clock, Check, X, Search, AlertCircle, LayoutDashboard, Database, Send, Eye, Glasses, Stethoscope, PlusCircle, SearchCheck, Briefcase, CreditCard, CheckCircle2,
  TrendingUp, Target, Wallet
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 font-cairo pb-20" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة التحكم - رعاية LITC</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">مرحباً بك مجدداً، {user.name}</p>
        </div>
        {isEmployee && (
          <button 
            onClick={() => onNavigate('submit-claim')}
            className="w-full sm:w-auto bg-litcBlue text-white py-4 px-8 rounded-2xl font-black text-sm shadow-xl shadow-litcBlue/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            تقديم طلب جديد
          </button>
        )}
      </div>

      {/* Top 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Annual Limit Progress Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-litcBlue/10 rounded-lg flex items-center justify-center text-litcBlue">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase">السقف السنوي</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">5,000 د.ل</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-black">
              <span className="text-slate-600">المستهلك: {(user.annualCeilingUsed || 0).toLocaleString()} د.ل</span>
              <span className={(user.annualCeilingUsed || 0) > 4000 ? 'text-orange-600' : 'text-litcBlue'}>
                {(5000 - (user.annualCeilingUsed || 0)).toLocaleString()} د.ل متبقي
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  (user.annualCeilingUsed || 0) > 4000 ? 'bg-orange-500' : 'bg-litcBlue'
                }`}
                style={{ width: `${Math.min(100, Math.round(((user.annualCeilingUsed || 0) / 5000) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Claims Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">المعاملات النشطة</p>
            <p className="text-2xl font-black text-slate-900">{myAssignments.length + poolClaims.length}</p>
          </div>
        </div>

        {/* Card 3: Last Update Date */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">آخر تحديث</p>
            <p className="text-lg font-black text-slate-900">
              {claims.length > 0 
                ? new Date(claims[0].submissionDate).toLocaleDateString('ar-LY') 
                : 'لا يوجد'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('my-tasks')}
          className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'my-tasks' ? 'bg-white text-litcBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {isEmployee ? 'طلباتي' : 'مهامي'}
        </button>
        {!isEmployee && (
          <button 
            onClick={() => setActiveTab('pool')}
            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'pool' ? 'bg-white text-litcBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            الحوض العام
          </button>
        )}
        <button 
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'sent' ? 'bg-white text-litcBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          المكتملة
        </button>
      </div>

      {/* Recent Activity List (Card Style) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-lg font-black text-slate-800">النشاط الأخير</h2>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input 
              type="text" 
              placeholder="بحث في المعاملات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pr-9 pl-4 text-xs font-bold outline-none focus:border-litcBlue transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-20 flex flex-col items-center justify-center text-slate-300">
              <SearchCheck className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-black">لا توجد معاملات حالياً</p>
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div 
                key={claim.id}
                onClick={() => onSelectClaim(claim)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${getStatusColor(claim.status).split(' ')[0].replace('bg-', 'bg-')}`}>
                    {claim.invoices?.[0]?.isGlasses ? <Glasses className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900">{claim.employeeName}</h3>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">#{claim.id.slice(-5)}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500">{claim.invoices?.[0]?.hospitalName || 'جهة طبية'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">القيمة</p>
                    <p className="text-sm font-black text-litcBlue">{claim.totalAmount?.toLocaleString()} د.ل</p>
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">الحالة</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusColor(claim.status)}`}>
                      {getStatusLabel(claim.status)}
                    </span>
                  </div>

                  <div className="text-center sm:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">التاريخ</p>
                    <p className="text-xs font-bold text-slate-600">{new Date(claim.submissionDate).toLocaleDateString('ar-LY')}</p>
                  </div>

                  <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-litcBlue group-hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
