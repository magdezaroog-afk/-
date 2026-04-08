
import React, { useState } from 'react';
import { Claim, ClaimStatus, User } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { STATUS_UI } from '../constants';

interface AdminClaimsProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const AdminClaims: React.FC<AdminClaimsProps> = ({ user, claims, onSelectClaim }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Claim; direction: 'asc' | 'desc' } | null>(null);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSort = (key: keyof Claim) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === undefined || bVal === undefined) return 0;
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المطالبات الطبية</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">مراجعة وتدقيق كافة مطالبات الموظفين في النظام.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" /> تصدير البيانات
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgba(0,92,132,0.05)] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث باسم الموظف أو رقم المرجع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-litcBlue outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-slate-600 focus:ring-0 outline-none"
            >
              <option value="ALL">كل الحالات</option>
              {Object.entries(STATUS_UI).map(([status, ui]) => (
                <option key={status} value={status}>{ui.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,92,132,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-litcBlue transition-colors" onClick={() => handleSort('referenceNumber')}>
                  <div className="flex items-center gap-2">
                    رقم المرجع <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-litcBlue transition-colors" onClick={() => handleSort('employeeName')}>
                  <div className="flex items-center gap-2">
                    الموظف <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-litcBlue transition-colors" onClick={() => handleSort('submissionDate')}>
                  <div className="flex items-center gap-2">
                    تاريخ التقديم <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-litcBlue transition-colors" onClick={() => handleSort('totalAmount')}>
                  <div className="flex items-center gap-2">
                    المبلغ <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-xs font-black text-slate-900">{claim.referenceNumber}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                        {claim.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{claim.employeeName}</p>
                        <p className="text-[9px] font-bold text-slate-400">{claim.department || 'قطاع غير محدد'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-500">{claim.submissionDate}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-black text-litcBlue">{claim.totalAmount.toLocaleString()} ر.س</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${STATUS_UI[claim.status]?.color || ''}`}>
                      {STATUS_UI[claim.status]?.label || claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onSelectClaim(claim)}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-litcBlue hover:text-white rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedClaims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Search className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-bold">لم يتم العثور على أي مطالبات تطابق البحث.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400">عرض {sortedClaims.length} من أصل {filteredClaims.length} مطالبة</p>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminClaims;
