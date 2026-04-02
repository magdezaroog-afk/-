
import React from 'react';
import { Claim } from '../types';
import { STATUS_UI } from '../constants';
import { Calendar, CreditCard, ChevronLeft, MapPin, Activity } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
  onClick: (claim: Claim) => void;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onClick }) => {
  const status = STATUS_UI[claim.status];

  return (
    <div 
      onClick={() => onClick(claim)}
      className="bg-white/70 backdrop-blur-md rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 border border-white/50 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-litcBlue/50 transition-all duration-500 cursor-pointer group relative overflow-hidden h-full flex flex-col"
      dir="rtl"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-bl-[5rem] -translate-y-12 translate-x-12 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-700"></div>
      
      <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
             <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-litcOrange animate-pulse"></div>
             <span className="text-[8px] sm:text-[10px] font-black text-litcBlue uppercase tracking-[0.1em] sm:tracking-[0.2em]">Ticket #{claim.id}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-litcBlue transition-colors leading-tight">{claim.employeeName}</h3>
        </div>
        <div className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black ${status.color} shadow-sm border border-current/10 shrink-0`}>
          {status.icon}
          {status.label}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 mb-8 sm:mb-10 flex-1 relative z-10">
        <div className="flex items-center gap-3 sm:gap-4 text-slate-500 text-xs sm:text-sm font-bold bg-slate-50/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100">
          <Calendar className="text-litcOrange w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span>تقديم: {claim.submissionDate}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-slate-500 text-xs sm:text-sm font-bold bg-slate-50/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100">
          <MapPin className="text-litcBlue w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span className="truncate">{claim.location || 'غير محدد'}</span>
        </div>
        
        <div className="mt-4 p-4 sm:p-6 bg-gradient-to-br from-litcBlue/5 to-white rounded-[2rem] sm:rounded-[2.5rem] border border-litcBlue/10 shadow-inner group-hover:from-litcBlue/10 transition-all">
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المطالب به</p>
                 <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{claim.totalAmount.toLocaleString()} <span className="text-[10px] sm:text-xs font-bold text-slate-400">دينار</span></p>
              </div>
              <Activity className="text-litcOrange opacity-20 group-hover:opacity-100 transition-opacity w-6 h-6 sm:w-8 sm:h-8" />
           </div>
        </div>
      </div>

      <div className="pt-6 sm:pt-8 border-t border-slate-100 flex items-center justify-between text-litcBlue text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] relative z-10">
        <span className="group-hover:text-litcOrange transition-colors">مراجعة المعاملة</span>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center group-hover:bg-litcBlue group-hover:text-white transition-all shadow-inner group-hover:shadow-litcBlue/20">
           <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default ClaimCard;
