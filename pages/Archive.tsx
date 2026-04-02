
import React, { useState, useMemo } from 'react';
import { Claim, ClaimStatus } from '../types';
import { STATUS_UI } from '../constants';
import { Search, Filter, Calendar, Building2, ChevronLeft, History, FileText, LayoutGrid, List } from 'lucide-react';

interface ArchiveProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const Archive: React.FC<ArchiveProps> = ({ claims, onSelectClaim }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesSearch = 
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.invoices.some(inv => 
          inv.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = filterStatus === 'ALL' || claim.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [claims, searchTerm, filterStatus]);

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-cairo" dir="rtl">
      {/* Header & Search Bar */}
      <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
        <div className="text-center sm:text-right">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
             <History className="text-[#5351f1] w-8 h-8 sm:w-10 sm:h-10" /> أرشيف المعاملات
          </h1>
          <p className="text-[10px] sm:text-sm font-bold text-slate-500 mt-1 sm:mt-2">ابحث في سجلاتك الطبية، الفواتير، والمصحات السابقة بسهولة.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5351f1] transition-colors w-5 h-5 sm:w-6 sm:h-6" />
            <input 
              type="text" 
              placeholder="ابحث برقم المعاملة، اسم المصحة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl sm:rounded-[2.5rem] py-4 sm:py-6 pr-12 sm:pr-16 pl-6 sm:pl-8 font-black text-sm sm:text-lg focus:outline-none focus:border-[#5351f1] focus:ring-8 focus:ring-indigo-600/5 transition-all shadow-sm"
            />
          </div>
          
          <div className="md:w-64 relative">
             <Filter className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4.5 h-4.5 sm:w-5 sm:h-5" />
             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="w-full bg-white border-2 border-slate-100 rounded-2xl sm:rounded-[2.5rem] py-4 sm:py-6 pr-12 sm:pr-14 pl-6 sm:pl-8 font-black text-xs sm:text-sm focus:outline-none appearance-none cursor-pointer shadow-sm"
             >
                <option value="ALL">جميع الحالات</option>
                {Object.keys(STATUS_UI).map(status => (
                  <option key={status} value={status}>{STATUS_UI[status as ClaimStatus].label}</option>
                ))}
             </select>
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="flex items-center justify-between px-6">
         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">تم العثور على {filteredClaims.length} معاملة</p>
         <div className="flex gap-2">
            <button className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400"><LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5" /></button>
            <button className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-[#5351f1]"><List className="w-4 h-4 sm:w-4.5 sm:h-4.5" /></button>
         </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {filteredClaims.length > 0 ? (
          filteredClaims.map(claim => (
            <button 
              key={claim.id} 
              onClick={() => onSelectClaim(claim)}
              className="w-full bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-8 group text-center sm:text-right"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full md:w-auto">
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-50 rounded-xl sm:rounded-[2rem] flex items-center justify-center text-slate-300 font-black text-[10px] sm:text-sm group-hover:bg-[#5351f1] group-hover:text-white transition-all">
                  #{claim.id.slice(-4)}
                </div>
                <div className="flex-1">
                   <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1 group-hover:text-[#5351f1] transition-colors">{claim.description || "مطالبة علاجية"}</h3>
                   <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-[10px] sm:text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {claim.submissionDate}</span>
                      <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {claim.invoices[0]?.hospitalName || "مصحة عامة"}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right sm:text-left">
                   <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المبلغ</p>
                   <p className="text-xl sm:text-2xl font-black text-slate-900">{claim.totalAmount.toLocaleString()} <span className="text-[10px] sm:text-xs font-medium">د.ل</span></p>
                </div>
                <div className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase flex items-center gap-1.5 sm:gap-2 ${STATUS_UI[claim.status].color}`}>
                  {STATUS_UI[claim.status].icon}
                  {STATUS_UI[claim.status].label}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-[#5351f1] transition-all">
                   <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-slate-300">
            <Search className="w-16 h-16 mb-6 opacity-10 animate-pulse" />
            <p className="text-xl font-black text-slate-400">لم نعثر على نتائج مطابقة لبحثك</p>
            <p className="text-sm font-bold mt-2">جرب البحث بكلمات مختلفة أو رقم المعاملة.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
