
import React, { useState } from 'react';
import { Claim, User, ClaimStatus } from '../types';
import { 
  Database, 
  Clock, 
  CheckCircle2, 
  Search, 
  Eye, 
  FileEdit,
  Table,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DataEntryDashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onGrab: (claimId: string) => void;
}

const DataEntryDashboard: React.FC<DataEntryDashboardProps> = ({ user, claims, onSelectClaim, onGrab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pool of claims approved medically, waiting for financial indexing
  const poolClaims = claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_FINANCIAL);
  // Claims assigned to this data entry clerk
  const myTasks = claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.PENDING_FINANCIAL);

  const filteredPool = poolClaims.filter(c => 
    c.employeeName.includes(searchTerm) || 
    c.referenceNumber.includes(searchTerm)
  );

  const stats = [
    { label: 'بانتظار الفهرسة المالية', value: poolClaims.length, icon: <Table className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'مهامي الحالية', value: myTasks.length, icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'منجز اليوم', value: 18, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة المعالجة المالية</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">فهرسة الفواتير وإدخال البيانات المالية بدقة عالية.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[200px]">
              <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-xl font-black text-slate-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Database className="text-litcBlue w-6 h-6" /> حوض المهام المالية
          </h2>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث باسم الموظف أو رقم المرجع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-litcBlue outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,92,132,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم المرجع</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ الاعتماد الطبي</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ التقديري</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPool.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-slate-900">{claim.referenceNumber}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                          {claim.employeeName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{claim.employeeName}</p>
                          <p className="text-[9px] font-bold text-slate-400">{claim.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500">{claim.submissionDate}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-litcBlue">{claim.totalAmount.toLocaleString()} ر.س</span>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => onGrab(claim.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-litcBlue text-white rounded-xl text-[10px] font-black hover:bg-litcDark transition-all shadow-lg shadow-litcBlue/20"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> سحب للفهرسة
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPool.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <CheckCircle2 className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-bold">لا توجد معاملات بانتظار الفهرسة المالية حالياً.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntryDashboard;
