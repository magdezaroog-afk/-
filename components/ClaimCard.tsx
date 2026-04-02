
import React from 'react';
import { Claim } from '../types';
import { STATUS_UI } from '../constants';
import { Calendar, CreditCard, ChevronLeft, MapPin, Activity, Hash, User, Building2, Briefcase } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
  onClick: (claim: Claim) => void;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onClick }) => {
  const status = STATUS_UI[claim.status];

  return (
    <div 
      onClick={() => onClick(claim)}
      className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,92,132,0.1)] hover:border-litcBlue/30 transition-all duration-500 cursor-pointer group relative overflow-hidden h-full flex flex-col"
      dir="rtl"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-litcBlue/5 rounded-br-[5rem] -translate-y-12 -translate-x-12 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-700"></div>
      
      <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-litcOrange transition-colors">
                <Hash className="w-4 h-4" />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{claim.id}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-litcBlue transition-colors leading-tight flex items-center gap-2">
            <User className="w-5 h-5 text-litcBlue/30" />
            {claim.employeeName}
          </h3>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black ${status.color} shadow-sm border border-current/10 shrink-0`}>
          {React.isValidElement(status.icon) && React.cloneElement(status.icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' })}
          {status.label}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10 flex-1 relative z-10">
        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
          <Calendar className="text-litcOrange w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">تاريخ التقديم</span>
            <span>{claim.submissionDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
          <MapPin className="text-litcBlue w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">الموقع</span>
            <span className="truncate">{claim.location || 'غير محدد'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
          <Briefcase className="text-purple-500 w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">الإدارة</span>
            <span className="truncate">{claim.department || 'غير محدد'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
          <CreditCard className="text-emerald-500 w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase tracking-tighter">عدد الفواتير</span>
            <span>{claim.invoiceCount} فواتير</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-litcBlue group-hover:border-litcBlue transition-all duration-500 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-0 group-hover:opacity-10 rounded-full -translate-y-12 translate-x-12 transition-all"></div>
         <div className="flex items-end justify-between relative z-10">
            <div>
               <p className="text-[9px] font-black text-slate-400 group-hover:text-white/60 uppercase tracking-widest mb-1">إجمالي القيمة</p>
               <p className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-white leading-none transition-colors">{claim.totalAmount.toLocaleString()} <span className="text-[10px] sm:text-xs font-bold opacity-50">د.ل</span></p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-litcBlue shadow-sm group-hover:scale-110 transition-all">
               <ChevronLeft className="w-6 h-6 group-hover:text-litcOrange transition-colors" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default ClaimCard;
