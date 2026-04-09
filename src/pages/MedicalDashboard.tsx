
import React, { useState } from 'react';
import { Claim, User, ClaimStatus } from '../types';
import { 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye, 
  TrendingUp,
  Activity,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { STATUS_UI } from '../constants';

interface MedicalDashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const MedicalDashboard: React.FC<MedicalDashboardProps> = ({ user, claims, onSelectClaim }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter for claims pending medical review
  const pendingClaims = claims.filter(c => c.status === ClaimStatus.PAPER_RECEIVED);
  const urgentClaims = pendingClaims.filter(c => c.totalAmount > 5000);
  
  const filteredClaims = pendingClaims.filter(c => 
    c.employeeName.includes(searchTerm) || 
    c.referenceNumber.includes(searchTerm)
  );

  const stats = [
    { label: 'حالات بانتظار المراجعة', value: pendingClaims.length, icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'تمت معالجتها اليوم', value: 12, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'حالات عاجلة (High Risk)', value: urgentClaims.length, icon: <ShieldAlert className="w-5 h-5" />, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة المراجعة الطبية</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">مراجعة وتدقيق التقارير الطبية والوصفات الدوائية.</p>
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
            <Activity className="text-litcBlue w-6 h-6" /> قائمة الانتظار الطبية
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
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ الوصول</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ الإجمالي</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الأولوية</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClaims.map((claim) => (
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
                      {claim.totalAmount > 5000 ? (
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black border border-rose-100">عالية</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black border border-slate-100">عادية</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => onSelectClaim(claim)}
                        className="flex items-center gap-2 px-4 py-2 bg-litcBlue text-white rounded-xl text-[10px] font-black hover:bg-litcDark transition-all shadow-lg shadow-litcBlue/20"
                      >
                        <Eye className="w-3.5 h-3.5" /> مراجعة طبية
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <CheckCircle2 className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-bold">لا توجد حالات بانتظار المراجعة الطبية حالياً.</p>
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

export default MedicalDashboard;
