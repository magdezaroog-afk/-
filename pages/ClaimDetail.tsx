
import React, { useState } from 'react';
import { Claim, ClaimStatus, User, UserRole } from '../types';
import { STATUS_UI } from '../constants';
import { 
  ArrowRight, Check, X, ImageIcon, 
  Maximize2, RotateCcw, MessageSquare, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Calculator, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Send, Clock, User as UserIcon,
  Stethoscope, ShieldAlert, FileSearch, CheckCircle
} from 'lucide-react';

interface ClaimDetailProps {
  claim: Claim;
  user: User;
  onClose: () => void;
  onUpdateStatus: (newStatus: ClaimStatus, comment?: string) => void;
  onInvoiceAssign: (claimId: string, invoiceIds: string[], staffId: string) => void;
  onInvoiceStatusUpdate: (claimId: string, invoiceId: string, newStatus: ClaimStatus, comment?: string) => void;
}

const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, user, onClose, onUpdateStatus, onInvoiceAssign, onInvoiceStatusUpdate }) => {
  const [globalComment, setGlobalComment] = useState('');
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isHead = user.role === UserRole.HEAD_OF_UNIT;
  const isDoctor = user.role === UserRole.DOCTOR;
  const activeInvoice = claim.invoices[activeInvoiceIndex];

  // فرز الفواتير لاتخاذ القرار الجماعي النهائي
  const approvedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.APPROVED);
  const rejectedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.RETURNED_TO_EMPLOYEE || i.status === ClaimStatus.RETURNED_TO_DR);

  const handleInvoiceDecision = (invoiceId: string, decision: 'APPROVE' | 'REJECT') => {
    const status = decision === 'APPROVE' ? ClaimStatus.APPROVED : ClaimStatus.RETURNED_TO_EMPLOYEE;
    onInvoiceStatusUpdate(claim.id, invoiceId, status, globalComment || 'تمت المراجعة والفرز');
  };

  return (
    <div className="max-w-full mx-auto pb-64 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {/* Premium Header Container */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-8 relative z-10">
          <button onClick={onClose} className="p-5 bg-slate-50 hover:bg-litcBlue hover:text-white rounded-[2rem] transition-all shadow-inner border border-slate-100"><ArrowRight size={28} /></button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">{claim.employeeName}</h2>
            <p className="text-[11px] font-black text-slate-400 mt-1 uppercase tracking-[0.3em]">معاملة طبية رقم: #{claim.id} | الإجمالي: {claim.totalAmount.toLocaleString()} د.ل</p>
          </div>
        </div>
        <div className={`px-8 py-4 rounded-[2rem] text-[11px] font-black flex items-center gap-4 ${STATUS_UI[claim.status].color} shadow-sm border border-current/10 relative z-10`}>
          {STATUS_UI[claim.status].icon} {STATUS_UI[claim.status].label}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Document Interaction Area */}
        <div className="xl:col-span-8 space-y-8 text-right">
           <div className="relative group">
              <section className="bg-slate-900 rounded-[4.5rem] h-[750px] relative flex items-center justify-center overflow-hidden border-[12px] border-white shadow-2xl">
                 <div className="w-full h-full flex items-center justify-center transition-transform duration-500" style={{ transform: `scale(${zoomLevel})` }}>
                    <img src={activeInvoice?.imageUrl} className="max-w-full max-h-full object-contain rounded-3xl" alt="Medical Document" />
                 </div>
                 
                 {/* Navigation Controls */}
                 <div className="absolute bottom-12 inset-x-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-3 bg-black/60 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/20 shadow-2xl">
                      <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 3))} className="w-16 h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-3xl transition-all flex items-center justify-center"><ZoomIn size={28} /></button>
                      <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 1))} className="w-16 h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-3xl transition-all flex items-center justify-center"><ZoomOut size={28} /></button>
                    </div>
                 </div>

                 {claim.invoices.length > 1 && (
                   <div className="absolute inset-y-0 left-8 right-8 flex items-center justify-between pointer-events-none">
                      <button onClick={() => setActiveInvoiceIndex(prev => (prev - 1 + claim.invoices.length) % claim.invoices.length)} className="w-20 h-20 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-[2.5rem] backdrop-blur-xl transition-all flex items-center justify-center pointer-events-auto shadow-2xl border border-white/10"><ChevronRight size={48} /></button>
                      <button onClick={() => setActiveInvoiceIndex(prev => (prev + 1) % claim.invoices.length)} className="w-20 h-20 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-[2.5rem] backdrop-blur-xl transition-all flex items-center justify-center pointer-events-auto shadow-2xl border border-white/10"><ChevronLeft size={48} /></button>
                   </div>
                 )}
              </section>
           </div>
           
           <section className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-xl">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><FileSearch className="text-litcBlue" /> تدقيق بنود الفاتورة الحالية</h3>
                 <span className="bg-slate-50 px-6 py-2 rounded-2xl text-[10px] font-black text-slate-400 border border-slate-100 shadow-inner">الفاتورة {activeInvoiceIndex + 1} من {claim.invoices.length}</span>
              </div>
              <div className="overflow-hidden rounded-[3rem] border border-slate-50 shadow-inner">
                 <table className="w-full text-right">
                    <thead className="bg-slate-50">
                       <tr>
                          <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase">اسم البند / الخدمة</th>
                          <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase">القيمة (د.ل)</th>
                          <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase">النوع الفني</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                       {activeInvoice?.lineItems?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-10 py-5 font-bold text-sm text-slate-700">{item.itemName}</td>
                             <td className="px-10 py-5 font-black text-litcBlue text-sm">{item.price.toLocaleString()}</td>
                             <td className="px-10 py-5">
                                <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 border border-slate-200">{item.serviceType || 'خدمة عامة'}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {activeInvoice?.ocrData?.auditorComment && (
                 <div className="mt-10 p-8 bg-amber-50 rounded-[3rem] border border-amber-100 flex items-start gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                    <AlertCircle className="text-amber-500 shrink-0 mt-1" size={28} />
                    <div>
                       <p className="text-[11px] font-black text-amber-600 mb-2 uppercase tracking-widest flex items-center gap-2">ملاحظة المدقق الفني <CheckCircle size={14} /></p>
                       <p className="text-base font-bold text-slate-700 leading-relaxed italic">"{activeInvoice.ocrData.auditorComment}"</p>
                    </div>
                 </div>
              )}
           </section>
        </div>

        {/* Right Action Panel */}
        <div className="xl:col-span-4 space-y-8 text-right">
           <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-litcBlue/5 rounded-full blur-2xl"></div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 relative z-10"><Calculator className="text-litcBlue" /> الفرز والتحقق النهائي</h3>
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                 {claim.invoices.map((inv, idx) => (
                    <div key={inv.id} onClick={() => setActiveInvoiceIndex(idx)} className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer group shadow-sm ${activeInvoiceIndex === idx ? 'bg-litcBlue border-litcBlue text-white shadow-2xl scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-litcBlue/20'}`}>
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-lg ${activeInvoiceIndex === idx ? 'bg-white/10 border border-white/20' : 'bg-white text-slate-300 shadow-inner'}`}>{idx + 1}</div>
                             <p className="font-black text-sm group-hover:translate-x-1 transition-transform">{inv.hospitalName}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${inv.status === ClaimStatus.APPROVED ? 'bg-emerald-500 text-white' : inv.status === ClaimStatus.RETURNED_TO_EMPLOYEE ? 'bg-rose-500 text-white' : 'bg-slate-300'}`}>
                             {inv.status === ClaimStatus.APPROVED ? <Check size={18} /> : inv.status === ClaimStatus.RETURNED_TO_EMPLOYEE ? <X size={18} /> : <Clock size={18} />}
                          </div>
                       </div>
                       
                       {(isHead || isDoctor) && activeInvoiceIndex === idx && (
                         <div className="mt-6 flex gap-3 animate-in slide-in-from-top-4" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleInvoiceDecision(inv.id, 'APPROVE')} className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] transition-all flex items-center justify-center gap-2 ${inv.status === ClaimStatus.APPROVED ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white/10 text-white border border-white/20 hover:bg-emerald-500'}`}>
                               <CheckCircle size={14} /> اعتماد
                            </button>
                            <button onClick={() => handleInvoiceDecision(inv.id, 'REJECT')} className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] transition-all flex items-center justify-center gap-2 ${inv.status === ClaimStatus.RETURNED_TO_EMPLOYEE ? 'bg-rose-500 text-white shadow-xl' : 'bg-white/10 text-white border border-white/20 hover:bg-rose-500'}`}>
                               <ShieldAlert size={14} /> رفض
                            </button>
                         </div>
                       )}
                    </div>
                 ))}
              </div>
           </section>

           <section className="bg-litcDark rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-xl font-black mb-10 flex items-center gap-4"><Clock size={24} className="text-litcOrange" /> سجل التحركات</h3>
              <div className="space-y-8 max-h-[250px] overflow-y-auto pr-4 custom-scrollbar-white">
                 {claim.auditTrail.map((log, i) => (
                    <div key={i} className="relative pr-8 border-r-2 border-white/10 pb-8 last:pb-0">
                       <div className="absolute -right-[9px] top-1 w-4 h-4 rounded-full bg-litcOrange border-4 border-litcDark shadow-lg"></div>
                       <p className="text-sm font-black text-white leading-tight">{log.action}</p>
                       <p className="text-[10px] text-white/40 font-bold mt-2 flex items-center gap-2 tracking-widest"><UserIcon size={12}/> {log.userName} • {log.timestamp}</p>
                       {log.comment && <p className="mt-3 text-[11px] bg-white/5 p-4 rounded-2xl border border-white/5 font-bold text-blue-200 leading-relaxed italic">"{log.comment}"</p>}
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      {/* FIXED ACTION FOOTER - COMPLETE WORKFLOW */}
      <div className="fixed bottom-0 inset-x-0 h-44 bg-white/80 backdrop-blur-3xl border-t border-slate-100 z-50 flex flex-col items-center justify-center px-10 gap-8 shadow-[0_-30px_60px_rgba(0,0,0,0.1)]">
         <div className="w-full max-w-4xl relative">
            <MessageSquare className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input 
               value={globalComment} 
               onChange={e => setGlobalComment(e.target.value)} 
               placeholder="أضف الملاحظات الختامية للإقرار النهائي..." 
               className="w-full bg-slate-50 border-2 border-slate-100 rounded-[3rem] py-6 pr-20 pl-10 font-bold text-xl outline-none focus:bg-white focus:border-litcBlue transition-all shadow-inner" 
            />
         </div>

         <div className="flex gap-8">
            {isDoctor && (
              <>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.PENDING_HEAD, globalComment || 'تم الاعتماد طبياً وتحويلها لرئيس الوحدة')} 
                   className="bg-litcBlue text-white px-16 py-6 rounded-[3rem] font-black text-xl shadow-2xl hover:bg-litcDark hover:-translate-y-1 transition-all flex items-center gap-4 shadow-litcBlue/30 group"
                 >
                    <Stethoscope size={28} className="group-hover:rotate-12 transition-transform" /> اعتماد طبي وتحويل لرئيس الوحدة
                 </button>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.RETURNED_TO_EMPLOYEE, globalComment || 'إرجاع للموظف لنقص البيانات الطبية')} 
                   className="bg-rose-500 text-white px-16 py-6 rounded-[3rem] font-black text-xl shadow-2xl hover:bg-rose-600 hover:-translate-y-1 transition-all flex items-center gap-4 shadow-rose-500/30"
                 >
                    <RotateCcw size={28} /> إرجاع للموظف للتصحيح
                 </button>
              </>
            )}

            {isHead && (
              <>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.PENDING_AUDIT, globalComment || 'تم الاعتماد النهائي وتحويل الفواتير للمراجعة المالية')} 
                   disabled={approvedInvoices.length === 0} 
                   className="bg-emerald-600 text-white px-14 py-6 rounded-[3rem] font-black text-xl shadow-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-4 disabled:opacity-30 disabled:grayscale shadow-emerald-500/30"
                 >
                    <ShieldCheck size={28} /> تحويل المعتمد ({approvedInvoices.length}) للمالية
                 </button>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.PENDING_DATA_ENTRY, globalComment || 'إرجاع الفواتير المرفوضة للمدقق للتصحيح')} 
                   disabled={rejectedInvoices.length === 0} 
                   className="bg-amber-500 text-white px-14 py-6 rounded-[3rem] font-black text-xl shadow-2xl hover:bg-amber-600 hover:-translate-y-1 transition-all flex items-center gap-4 disabled:opacity-30 disabled:grayscale shadow-amber-500/30"
                 >
                    <RotateCcw size={28} /> إرجاع المرفوض ({rejectedInvoices.length}) للمدقق
                 </button>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.REJECTED, globalComment || 'رفض المعاملة بالكامل')} 
                   className="bg-slate-900 text-white px-10 py-6 rounded-[3rem] font-black text-xl hover:bg-rose-600 transition-all flex items-center gap-4 shadow-2xl"
                 >
                    <ShieldAlert size={28} /> رفض بالكامل
                 </button>
              </>
            )}
         </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
