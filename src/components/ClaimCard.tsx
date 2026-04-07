
import React from 'react';
import { Claim, ClaimStatus } from '../types';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  Calendar,
  DollarSign,
  SearchCheck,
  Activity,
  ShieldCheck,
  Database
} from 'lucide-react';
import { STATUS_UI } from '../constants';

interface ClaimCardProps {
  claim: Claim;
  onClick: (claim: Claim) => void;
}

const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onClick }) => {
  const status = STATUS_UI[claim.status] || { label: claim.status, color: 'text-slate-500 bg-slate-50', icon: <Clock className="w-4 h-4" /> };

  return (
    <div 
      onClick={() => onClick(claim)}
      className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden text-right"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-slate-100 transition-all"></div>
      
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`p-4 rounded-3xl ${status.color} transition-transform group-hover:scale-110 shadow-sm`}>
          {status.icon}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">رقم المرجع</span>
          <span className="text-sm font-black text-slate-900 tracking-tighter">{claim.referenceNumber}</span>
        </div>
      </div>

      <div className="space-y-4 mb-8 relative z-10">
        <div className="flex items-center justify-between text-right">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold">{claim.submissionDate}</span>
          </div>
          <p className="text-xs font-black text-slate-500">تاريخ التقديم</p>
        </div>
        
        <div className="flex items-center justify-between text-right">
          <div className="flex items-center gap-2 text-litcBlue">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-black">{claim.invoiceCount} فواتير</span>
          </div>
          <p className="text-xs font-black text-slate-500">عدد المستندات</p>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المبلغ</span>
          <div className="flex items-center gap-1">
            <span className="text-xl font-black text-litcBlue">{claim.totalAmount.toLocaleString()}</span>
            <span className="text-[10px] font-black text-slate-400">LYD</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black border flex items-center gap-2 ${status.color} border-current/10`}>
          {status.label}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-litcBlue font-black text-[10px] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        عرض تفاصيل المعاملة
        <ChevronLeft className="w-4 h-4" />
      </div>
    </div>
  );
};

export default ClaimCard;
