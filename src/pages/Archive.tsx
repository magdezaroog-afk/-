
import React, { useState, useMemo } from 'react';
import { Claim, ClaimStatus, User, UserRole } from '../types';
import { STATUS_UI } from '../constants';
import { Search, Filter, Calendar, Building2, ChevronLeft, History, FileText, LayoutGrid, List, User as UserIcon } from 'lucide-react';

interface ArchiveProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

const Archive: React.FC<ArchiveProps> = ({ user, claims, onSelectClaim }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterFamily, setFilterFamily] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '30DAYS'>('ALL');

  const filteredClaims = useMemo(() => {
    const baseClaims = user.role === UserRole.EMPLOYEE 
      ? claims.filter(c => c.employeeId === user.id)
      : claims;

    return baseClaims.filter(claim => {
      const matchesSearch = 
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.invoices.some(inv => 
          inv.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = filterStatus === 'ALL' || claim.status === filterStatus;
      
      const claimDate = new Date(claim.submissionDate);
      const matchesMonth = filterMonth === 'ALL' || (claimDate.getMonth() + 1).toString() === filterMonth;

      const matchesFamily = filterFamily === 'ALL' || claim.invoices.some(inv => inv.beneficiaryName === filterFamily);
      
      const matchesTime = timeFilter === 'ALL' || (Date.now() - claimDate.getTime() <= 30 * 24 * 60 * 60 * 1000);

      return matchesSearch && matchesStatus && matchesMonth && matchesFamily && matchesTime;
    });
  }, [claims, searchTerm, filterStatus, filterMonth, filterFamily, timeFilter, user.id, user.role]);

  const months = [
    { id: '1', label: 'يناير' }, { id: '2', label: 'فبراير' }, { id: '3', label: 'مارس' },
    { id: '4', label: 'أبريل' }, { id: '5', label: 'مايو' }, { id: '6', label: 'يونيو' },
    { id: '7', label: 'يوليو' }, { id: '8', label: 'أغسطس' }, { id: '9', label: 'سبتمبر' },
    { id: '10', label: 'أكتوبر' }, { id: '11', label: 'نوفمبر' }, { id: '12', label: 'ديسمبر' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-cairo" dir="rtl">
      {/* Header & Search Bar */}
      <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
        <div className="text-center sm:text-right">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
             <History className="text-litcBlue w-8 h-8 sm:w-10 sm:h-10" /> أرشيف المعاملات
          </h1>
          <p className="text-[10px] sm:text-sm font-bold text-slate-500 mt-1 sm:mt-2">ابحث في سجلاتك الطبية، الفواتير، والمصحات السابقة بسهولة.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-litcBlue transition-colors w-5 h-5" />
              <input 
                type="text" 
                placeholder="ابحث برقم المعاملة، اسم المصحة..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pr-12 pl-6 font-black text-sm focus:outline-none focus:border-litcBlue focus:ring-8 focus:ring-litcBlue/5 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => { setTimeFilter('ALL'); setFilterFamily('ALL'); setFilterStatus('ALL'); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all border ${timeFilter === 'ALL' && filterFamily === 'ALL' && filterStatus === 'ALL' ? 'bg-litcBlue text-white border-litcBlue shadow-lg shadow-litcBlue/20' : 'bg-white text-slate-500 border-slate-100 hover:border-litcBlue hover:text-litcBlue'}`}
            >
              عرض الكل
            </button>
            <button 
              onClick={() => setTimeFilter('30DAYS')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all border ${timeFilter === '30DAYS' ? 'bg-litcBlue text-white border-litcBlue shadow-lg shadow-litcBlue/20' : 'bg-white text-slate-500 border-slate-100 hover:border-litcBlue hover:text-litcBlue'}`}
            >
              آخر 30 يوم
            </button>
            <div className="relative">
               <select 
                 value={filterFamily}
                 onChange={(e) => setFilterFamily(e.target.value)}
                 className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all border appearance-none cursor-pointer pr-10 ${filterFamily !== 'ALL' ? 'bg-litcBlue text-white border-litcBlue shadow-lg shadow-litcBlue/20' : 'bg-white text-slate-500 border-slate-100 hover:border-litcBlue hover:text-litcBlue'}`}
               >
                  <option value="ALL">حسب المستفيد</option>
                  <option value={user.name}>الموظف نفسه</option>
                  {user.familyMembers?.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
               </select>
               <UserIcon className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${filterFamily !== 'ALL' ? 'text-white' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="flex items-center justify-between px-6">
         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">تم العثور على {filteredClaims.length} معاملة</p>
      </div>

      {/* Claims Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
        {filteredClaims.length > 0 ? (
          filteredClaims.map(claim => (
            <div 
              key={claim.id} 
              onClick={() => onSelectClaim(claim)}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-litcBlue/5 transition-all"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-litcBlue group-hover:text-white transition-all shadow-inner">
                    #{claim.id.slice(-4)}
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm border ${STATUS_UI[claim.status]?.color || 'bg-slate-50 text-slate-600'}`}>
                    {STATUS_UI[claim.status]?.label || claim.status}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-litcBlue transition-colors truncate">{claim.description || "مطالبة علاجية"}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{claim.invoices[0]?.hospitalName || "مصحة عامة"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{claim.submissionDate}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">
                    {claim.totalAmount.toLocaleString()} <span className="text-[10px] font-medium opacity-50">د.ل</span>
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 bg-white rounded-2xl border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-slate-300">
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
