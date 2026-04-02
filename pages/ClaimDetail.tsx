
import React, { useState } from 'react';
import { Claim, ClaimStatus, User, UserRole } from '../types';
import { STATUS_UI } from '../constants';
import { 
  ArrowRight, Check, X, ImageIcon, 
  Maximize2, RotateCcw, MessageSquare, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Calculator, CheckCircle2,
  AlertCircle, ShieldCheck, FileText, Send, Clock, User as UserIcon,
  Stethoscope, ShieldAlert, FileSearch, CheckCircle, UserPlus, SearchCheck,
  CheckCircle2 as CheckCircle2Icon
} from 'lucide-react';

interface ClaimDetailProps {
  claim: Claim;
  user: User;
  onClose: () => void;
  onUpdateStatus: (newStatus: ClaimStatus, comment?: string) => void;
  onInvoiceAssign: (claimId: string, invoiceIds: string[], staffId: string) => void;
  onInvoiceStatusUpdate: (claimId: string, invoiceId: string, newStatus: ClaimStatus, comment?: string) => void;
}

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحيى قرقاب', team: 'وحدة الصيدليات' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات' },
];

const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, user, onClose, onUpdateStatus, onInvoiceAssign, onInvoiceStatusUpdate }) => {
  const [globalComment, setGlobalComment] = useState('');
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isHead = user.role === UserRole.HEAD_OF_UNIT;
  const isDoctor = user.role === UserRole.DOCTOR;
  const isAuditor = user.role === UserRole.AUDITOR;
  const isEmployee = user.role === UserRole.EMPLOYEE;
  const isAdmin = user.role === UserRole.ADMIN;
  const activeInvoice = claim.invoices[activeInvoiceIndex];

  // فرز الفواتير لاتخاذ القرار الجماعي النهائي
  const approvedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.APPROVED);
  const rejectedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.RETURNED_TO_EMPLOYEE || i.status === ClaimStatus.RETURNED_TO_DR);

  const handleInvoiceDecision = (invoiceId: string, decision: 'APPROVE' | 'REJECT') => {
    const status = decision === 'APPROVE' ? ClaimStatus.APPROVED : ClaimStatus.RETURNED_TO_EMPLOYEE;
    onInvoiceStatusUpdate(claim.id, invoiceId, status, globalComment || 'تمت المراجعة والفرز');
  };

  return (
    <div className="max-w-full mx-auto pb-64 animate-in fade-in duration-700 font-cairo px-4 sm:px-0" dir="rtl">
      {/* Premium Header Container */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 sm:gap-6 bg-white p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[4rem] shadow-sm border border-slate-100 mb-6 sm:mb-8 relative overflow-hidden text-center xl:text-right max-w-md mx-auto xl:max-w-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full blur-3xl"></div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-8 relative z-10">
          <button onClick={onClose} className="p-2.5 sm:p-5 bg-slate-50 hover:bg-litcBlue hover:text-white rounded-xl sm:rounded-[2rem] transition-all shadow-inner border border-slate-100"><ArrowRight className="w-4.5 h-4.5 sm:w-7 sm:h-7" /></button>
          <div>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 leading-tight">{claim.employeeName}</h2>
            <p className="text-[8px] sm:text-[11px] font-black text-slate-400 mt-1 uppercase tracking-widest sm:tracking-[0.3em]">معاملة طبية رقم: #{claim.id} | الإجمالي: {claim.totalAmount.toLocaleString()} د.ل</p>
          </div>
        </div>
        <div className={`px-4 py-2 sm:px-8 sm:py-4 rounded-lg sm:rounded-[2rem] text-[8px] sm:text-[11px] font-black flex items-center gap-2 sm:gap-4 ${STATUS_UI[claim.status].color} shadow-sm border border-current/10 relative z-10`}>
          {STATUS_UI[claim.status].icon} {STATUS_UI[claim.status].label}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        {/* Document Interaction Area */}
        <div className="xl:col-span-8 space-y-6 sm:space-y-8 text-right">
           <div className="relative group max-w-md mx-auto xl:max-w-none">
              <section className="bg-slate-900 rounded-[1.5rem] sm:rounded-[4.5rem] h-[300px] sm:h-[750px] relative flex items-center justify-center overflow-hidden border-4 sm:border-[12px] border-white shadow-2xl">
                 <div className="w-full h-full flex items-center justify-center transition-transform duration-500" style={{ transform: `scale(${zoomLevel})` }}>
                    <img src={activeInvoice?.imageUrl} className="max-w-full max-h-full object-contain rounded-xl sm:rounded-3xl" alt="Medical Document" />
                 </div>
                 
                 {/* Navigation Controls */}
                 <div className="absolute bottom-4 sm:bottom-12 inset-x-0 flex justify-center gap-2 sm:gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2 sm:gap-3 bg-black/60 backdrop-blur-2xl p-2 sm:p-4 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/20 shadow-2xl">
                       <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 3))} className="w-10 h-10 sm:w-16 sm:h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl sm:rounded-3xl transition-all flex items-center justify-center"><ZoomIn className="w-4.5 h-4.5 sm:w-7 sm:h-7" /></button>
                       <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 1))} className="w-10 h-10 sm:w-16 sm:h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl sm:rounded-3xl transition-all flex items-center justify-center"><ZoomOut className="w-4.5 h-4.5 sm:w-7 sm:h-7" /></button>
                    </div>
                 </div>

                 {claim.invoices.length > 1 && (
                   <div className="absolute inset-y-0 left-2 right-2 sm:left-8 sm:right-8 flex items-center justify-between pointer-events-none">
                      <button onClick={() => setActiveInvoiceIndex(prev => (prev - 1 + claim.invoices.length) % claim.invoices.length)} className="w-10 h-10 sm:w-20 sm:h-20 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg sm:rounded-[2.5rem] backdrop-blur-xl transition-all flex items-center justify-center pointer-events-auto shadow-2xl border border-white/10"><ChevronRight className="w-5 h-5 sm:w-12 sm:h-12" /></button>
                      <button onClick={() => setActiveInvoiceIndex(prev => (prev + 1) % claim.invoices.length)} className="w-10 h-10 sm:w-20 sm:h-20 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg sm:rounded-[2.5rem] backdrop-blur-xl transition-all flex items-center justify-center pointer-events-auto shadow-2xl border border-white/10"><ChevronLeft className="w-5 h-5 sm:w-12 sm:h-12" /></button>
                   </div>
                 )}
              </section>
           </div>
           
           <section className="bg-white p-4 sm:p-12 rounded-[1.5rem] sm:rounded-[4.5rem] border border-slate-100 shadow-xl max-w-md mx-auto xl:max-w-none">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-10 text-center sm:text-right">
                 <h3 className="text-base sm:text-2xl font-black text-slate-900 flex items-center gap-2 sm:gap-4"><FileSearch className="text-litcBlue shrink-0 w-5 h-5 sm:w-6 sm:h-6" /> تدقيق بنود الفاتورة الحالية</h3>
                 <span className="bg-slate-50 px-3 py-1 sm:px-6 sm:py-2 rounded-lg sm:rounded-2xl text-[8px] sm:text-[10px] font-black text-slate-400 border border-slate-100 shadow-inner shrink-0">الفاتورة {activeInvoiceIndex + 1} من {claim.invoices.length}</span>
              </div>
              <div className="overflow-x-auto rounded-xl sm:rounded-[3rem] border border-slate-50 shadow-inner custom-scrollbar">
                 <table className="w-full text-right min-w-[350px] sm:min-w-[500px]">
                    <thead className="bg-slate-50">
                       <tr>
                          <th className="px-4 py-3 sm:px-10 sm:py-6 text-[8px] sm:text-[11px] font-black text-slate-400 uppercase">اسم البند / الخدمة</th>
                          <th className="px-4 py-3 sm:px-10 sm:py-6 text-[8px] sm:text-[11px] font-black text-slate-400 uppercase">القيمة (د.ل)</th>
                          <th className="px-4 py-3 sm:px-10 sm:py-6 text-[8px] sm:text-[11px] font-black text-slate-400 uppercase">النوع الفني</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                       {activeInvoice?.lineItems?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-4 py-3 sm:px-10 sm:py-5 font-bold text-[10px] sm:text-sm text-slate-700">{item.itemName}</td>
                             <td className="px-4 py-3 sm:px-10 sm:py-5 font-black text-litcBlue text-[10px] sm:text-sm">{item.price.toLocaleString()}</td>
                             <td className="px-4 py-3 sm:px-10 sm:py-5">
                                <span className="px-2 py-0.5 sm:px-4 sm:py-1.5 bg-slate-100 rounded-md sm:rounded-xl text-[7px] sm:text-[10px] font-black text-slate-500 border border-slate-200">{item.serviceType || 'خدمة عامة'}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {activeInvoice?.ocrData?.auditorComment && (
                 <div className="mt-6 sm:mt-10 p-4 sm:p-8 bg-amber-50 rounded-[1.2rem] sm:rounded-[3rem] border border-amber-100 flex items-start gap-3 sm:gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 sm:w-2 h-full bg-amber-400"></div>
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5 sm:mt-1 w-4.5 h-4.5 sm:w-7 sm:h-7" />
                    <div>
                       <p className="text-[8px] sm:text-[11px] font-black text-amber-600 mb-1 sm:mb-2 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">ملاحظة المدقق الفني <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /></p>
                       <p className="text-xs sm:text-base font-bold text-slate-700 leading-relaxed italic">"{activeInvoice.ocrData.auditorComment}"</p>
                    </div>
                 </div>
              )}
           </section>
        </div>

        {/* Right Action Panel */}
        <div className="xl:col-span-4 space-y-6 sm:space-y-8 text-right">
           <section className="bg-white p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[4rem] border border-slate-100 shadow-xl space-y-6 sm:space-y-10 relative overflow-hidden max-w-md mx-auto xl:max-w-none">
              <div className="absolute top-0 right-0 w-24 h-24 bg-litcBlue/5 rounded-full blur-2xl"></div>
              <h3 className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-2 sm:gap-4 relative z-10"><Calculator className="text-litcBlue w-5 h-5 sm:w-6 sm:h-6" /> الفرز والتحقق النهائي</h3>
              <div className="space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[550px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar relative z-10">
                 {claim.invoices.map((inv, idx) => (
                    <div key={inv.id} onClick={() => setActiveInvoiceIndex(idx)} className={`p-3 sm:p-8 rounded-[1.2rem] sm:rounded-[3rem] border-2 transition-all cursor-pointer group shadow-sm ${activeInvoiceIndex === idx ? 'bg-litcBlue border-litcBlue text-white shadow-2xl scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-litcBlue/20'}`}>
                       <div className="flex items-center justify-between mb-3 sm:mb-6">
                          <div className="flex items-center gap-2 sm:gap-4">
                             <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-[1.2rem] flex items-center justify-center font-black text-sm sm:text-lg ${activeInvoiceIndex === idx ? 'bg-white/10 border border-white/20' : 'bg-white text-slate-300 shadow-inner'}`}>{idx + 1}</div>
                             <div className="flex flex-col">
                                 <p className="font-black text-[10px] sm:text-sm group-hover:translate-x-1 transition-transform">{inv.hospitalName}</p>
                                 {inv.ocrData?.dataEntryDecision && (
                                   <span className={`text-[7px] sm:text-[9px] font-black mt-1 px-1.5 py-0.5 rounded-full w-fit ${inv.ocrData.dataEntryDecision === 'VALID' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                                     توصية الإدخال: {inv.ocrData.dataEntryDecision === 'VALID' ? 'سليمة' : 'بها أخطاء'}
                                   </span>
                                 )}
                              </div>
                          </div>
                          <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 sm:border-4 border-white shadow-lg ${inv.status === ClaimStatus.APPROVED ? 'bg-emerald-500 text-white' : inv.status === ClaimStatus.RETURNED_TO_EMPLOYEE ? 'bg-rose-500 text-white' : 'bg-slate-300'}`}>
                             {inv.status === ClaimStatus.APPROVED ? <Check className="w-3 h-3 sm:w-4.5 sm:h-4.5" /> : inv.status === ClaimStatus.RETURNED_TO_EMPLOYEE ? <X className="w-3 h-3 sm:w-4.5 sm:h-4.5" /> : <Clock className="w-3 h-3 sm:w-4.5 sm:h-4.5" />}
                          </div>
                       </div>
                       
                       {((isHead && claim.status === ClaimStatus.PENDING_HEAD && inv.status !== ClaimStatus.PENDING_DATA_ENTRY) || (isDoctor && claim.status === ClaimStatus.PENDING_DR)) && activeInvoiceIndex === idx && (
                         <div className="mt-3 sm:mt-6 flex gap-1.5 sm:gap-3 animate-in slide-in-from-top-4" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleInvoiceDecision(inv.id, 'APPROVE')} className={`flex-1 py-2 sm:py-3.5 rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[11px] transition-all flex items-center justify-center gap-1 sm:gap-2 ${inv.status === ClaimStatus.APPROVED ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white/10 text-white border border-white/20 hover:bg-emerald-500'}`}>
                               <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button onClick={() => handleInvoiceDecision(inv.id, 'REJECT')} className={`flex-1 py-2 sm:py-3.5 rounded-lg sm:rounded-2xl font-black text-[8px] sm:text-[11px] transition-all flex items-center justify-center gap-1 sm:gap-2 ${inv.status === ClaimStatus.RETURNED_TO_EMPLOYEE ? 'bg-rose-500 text-white shadow-xl' : 'bg-white/10 text-white border border-white/20 hover:bg-rose-500'}`}>
                               <ShieldAlert className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            </button>
                         </div>
                       )}
                    </div>
                 ))}
              </div>
           </section>

           <section className="bg-litcDark rounded-[1.5rem] sm:rounded-[4rem] p-4 sm:p-12 text-white shadow-2xl relative overflow-hidden group max-w-md mx-auto xl:max-w-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-base sm:text-xl font-black mb-6 sm:mb-10 flex items-center gap-2 sm:gap-4"><Clock className="text-litcOrange w-4.5 h-4.5 sm:w-6 sm:h-6" /> سجل التحركات</h3>
              <div className="space-y-6 sm:space-y-8 max-h-[180px] sm:max-h-[250px] overflow-y-auto pr-3 sm:pr-4 custom-scrollbar-white">
                 {claim.auditTrail.map((log, i) => (
                    <div key={i} className="relative pr-6 sm:pr-8 border-r-2 border-white/10 pb-6 sm:pb-8 last:pb-0">
                       <div className="absolute -right-[9px] top-1 w-4 h-4 rounded-full bg-litcOrange border-4 border-litcDark shadow-lg"></div>
                       <p className="text-[10px] sm:text-sm font-black text-white leading-tight">{log.action}</p>
                       <p className="text-[8px] sm:text-[10px] text-white/40 font-bold mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 tracking-widest"><UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> {log.userName} • {log.timestamp}</p>
                       {log.comment && <p className="mt-2 sm:mt-3 text-[9px] sm:text-[11px] bg-white/5 p-2 sm:p-4 rounded-lg sm:rounded-2xl border border-white/5 font-bold text-blue-200 leading-relaxed italic">"{log.comment}"</p>}
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      {/* FIXED ACTION FOOTER - COMPLETE WORKFLOW */}
      <div className="fixed bottom-0 inset-x-0 h-auto bg-white/80 backdrop-blur-3xl border-t border-slate-100 z-50 flex flex-col items-center justify-center p-3 sm:p-6 sm:px-10 gap-3 sm:gap-8 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
         <div className="w-full max-w-4xl relative">
            <MessageSquare className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 sm:w-6 sm:h-6" />
            <input 
               value={globalComment} 
               onChange={e => setGlobalComment(e.target.value)} 
               placeholder="أضف الملاحظات الختامية للإقرار النهائي..." 
               className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-[3rem] py-2.5 sm:py-6 pr-10 sm:pr-20 pl-3 sm:pl-10 font-bold text-xs sm:text-xl outline-none focus:bg-white focus:border-litcBlue transition-all shadow-inner" 
            />
         </div>

         <div className="flex flex-wrap justify-center gap-2 sm:gap-8 w-full">
            {isDoctor && claim.status === ClaimStatus.PENDING_DR && (
              <>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.PENDING_HEAD, globalComment || 'تم الاعتماد طبياً وتحويلها لرئيس الوحدة')} 
                   className="bg-litcBlue text-white px-4 sm:px-16 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl shadow-2xl hover:bg-litcDark hover:-translate-y-1 transition-all flex items-center gap-1.5 sm:gap-4 shadow-litcBlue/30 group w-full sm:w-auto justify-center"
                 >
                    <Stethoscope className="w-4.5 h-4.5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" /> اعتماد طبي وتحويل لرئيس الوحدة
                 </button>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.RETURNED_TO_EMPLOYEE, globalComment || 'إرجاع للموظف لنقص البيانات الطبية')} 
                   className="bg-rose-500 text-white px-4 sm:px-16 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl shadow-2xl hover:bg-rose-600 hover:-translate-y-1 transition-all flex items-center gap-1.5 sm:gap-4 shadow-rose-500/30 w-full sm:w-auto justify-center"
                 >
                    <RotateCcw className="w-4.5 h-4.5 sm:w-6 sm:h-6" /> إرجاع للموظف للتصحيح
                 </button>
              </>
            )}

            {isHead && (
               <>
                 {(claim.status === ClaimStatus.PENDING_DATA_ENTRY || claim.invoices.some(i => i.status === ClaimStatus.PENDING_DATA_ENTRY)) ? (
                    <div className="flex flex-col items-center gap-2 sm:gap-4 bg-litcBlue/5 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border border-litcBlue/20 w-full max-w-4xl text-center">
                       <div className="flex items-center gap-2 sm:gap-4 text-litcBlue font-black text-sm sm:text-xl">
                          <Clock className="animate-spin-slow w-4 h-4 sm:w-6 sm:h-6" /> المعاملة حالياً قيد الإدخال الفني
                       </div>
                       <p className="text-slate-500 font-bold text-[10px] sm:text-base">بانتظار انتهاء موظفي الإدخال من مراجعة وتدقيق البيانات المالية للفواتير المسندة إليهم.</p>
                       <div className="flex gap-1.5 mt-1 sm:mt-2">
                          {claim.invoices.map((inv, idx) => (
                             <div key={idx} className={`w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full ${inv.status === ClaimStatus.PENDING_HEAD ? 'bg-emerald-500' : 'bg-slate-200 animate-pulse'}`} title={inv.assignedToName}></div>
                          ))}
                       </div>
                    </div>
                 ) : claim.status === ClaimStatus.PENDING_HEAD ? (
                   claim.invoices.some(i => !i.assignedToId) ? (
                     <div className="flex flex-col items-center gap-3 sm:gap-6 bg-litcDark/5 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] border-2 border-dashed border-litcBlue/20 w-full max-w-4xl">
                        <p className="font-black text-slate-600 text-[10px] sm:text-base flex items-center gap-2 sm:gap-3"><UserPlus className="text-litcBlue w-4 h-4 sm:w-6 sm:h-6" /> إسناد المعاملة لموظف الإدخال الفني:</p>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                           {DATA_ENTRY_STAFF.map(s => (
                             <button 
                                key={s.id} 
                                onClick={() => onInvoiceAssign(claim.id, claim.invoices.filter(i => !i.assignedToId).map(i => i.id), s.id)}
                                className="px-3 py-1.5 sm:px-8 sm:py-4 bg-white hover:bg-litcBlue hover:text-white text-slate-700 rounded-lg sm:rounded-2xl font-black text-[9px] sm:text-sm transition-all border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 flex items-center gap-1.5 sm:gap-3"
                             >
                                <UserIcon className="w-3 h-3 sm:w-4.5 sm:h-4.5" /> {s.name}
                             </button>
                           ))}
                        </div>
                     </div>
                   ) : (
                     <div className="flex flex-wrap justify-center gap-2 sm:gap-8 w-full">
                        <button 
                          onClick={() => onUpdateStatus(ClaimStatus.PENDING_AUDIT, globalComment || 'تم الاعتماد والتحويل لمكتب المراجعة')} 
                          disabled={approvedInvoices.length === 0} 
                          className="bg-emerald-600 text-white px-4 sm:px-14 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl shadow-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-1.5 sm:gap-4 disabled:opacity-30 disabled:grayscale shadow-amber-500/30 w-full sm:w-auto justify-center"
                        >
                           <ShieldCheck className="w-4.5 h-4.5 sm:w-7 sm:h-7" /> ({approvedInvoices.length})
                        </button>
                        <button 
                          onClick={() => onUpdateStatus(ClaimStatus.RETURNED_TO_EMPLOYEE, globalComment || 'إرجاع المعاملة للموظف لوجود أخطاء في الفواتير')} 
                          disabled={rejectedInvoices.length === 0} 
                          className="bg-amber-500 text-white px-4 sm:px-14 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl shadow-2xl hover:bg-amber-600 hover:-translate-y-1 transition-all flex items-center gap-1.5 sm:gap-4 disabled:opacity-30 disabled:grayscale shadow-amber-500/30 w-full sm:w-auto justify-center"
                        >
                           <RotateCcw className="w-4.5 h-4.5 sm:w-7 sm:h-7" /> ({rejectedInvoices.length})
                        </button>
                        <button 
                          onClick={() => onUpdateStatus(ClaimStatus.REJECTED, globalComment || 'رفض المعاملة بالكامل')} 
                          className="bg-slate-900 text-white px-4 sm:px-10 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl hover:bg-rose-600 transition-all flex items-center gap-1.5 sm:gap-4 shadow-2xl w-full sm:w-auto justify-center"
                        >
                           <ShieldAlert className="w-4.5 h-4.5 sm:w-7 sm:h-7" />
                        </button>
                     </div>
                   )
                 ) : null}
               </>
            )}

            {isAuditor && claim.status === ClaimStatus.PENDING_AUDIT && (
              <>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.APPROVED, globalComment || 'تمت المراجعة النهائية والاعتماد للصرف')} 
                   className="bg-emerald-600 text-white px-4 sm:px-16 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl shadow-2xl hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-1.5 sm:gap-4 shadow-emerald-500/30 w-full sm:w-auto justify-center"
                 >
                    <CheckCircle2 className="w-4.5 h-4.5 sm:w-6 sm:h-6 sm:w-7 sm:h-7" />
                 </button>
                 <button 
                   onClick={() => onUpdateStatus(ClaimStatus.RETURNED_TO_EMPLOYEE, globalComment || 'إرجاع للموظف من مكتب المراجعة')} 
                   className="bg-amber-500 text-white px-4 sm:px-16 py-2.5 sm:py-6 rounded-lg sm:rounded-[3rem] font-black text-[10px] sm:text-xl shadow-2xl hover:bg-amber-600 hover:-translate-y-1 transition-all flex items-center gap-1.5 sm:gap-4 shadow-amber-500/30 w-full sm:w-auto justify-center"
                 >
                    <RotateCcw className="w-4.5 h-4.5 sm:w-6 sm:h-6" /> إرجاع للموظف
                 </button>
              </>
            )}

            {/* Fallback status display for all roles when no actions are available */}
            {((isDoctor && claim.status !== ClaimStatus.PENDING_DR) || 
              (isHead && claim.status !== ClaimStatus.PENDING_HEAD && claim.status !== ClaimStatus.PENDING_DATA_ENTRY && !claim.invoices.some(i => i.status === ClaimStatus.PENDING_DATA_ENTRY)) ||
              (isAuditor && claim.status !== ClaimStatus.PENDING_AUDIT) ||
              isEmployee || isAdmin) && (
                <div className="text-slate-400 font-black text-xs sm:text-xl py-3 sm:py-6 flex items-center gap-2 sm:gap-4">
                   <SearchCheck className="w-4.5 h-4.5 sm:w-6 sm:h-6" /> المعاملة في حالة: {STATUS_UI[claim.status].label}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
