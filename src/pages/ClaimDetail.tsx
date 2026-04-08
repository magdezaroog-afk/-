
import React, { useState } from 'react';
import { Claim, ClaimStatus, User, UserRole } from '../types';
import { STATUS_UI } from '../constants';
import { 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  SearchCheck, 
  Clock, 
  UserPlus, 
  User as UserIcon,
  CheckCircle,
  XCircle,
  Database,
  Stethoscope,
  ShieldAlert,
  FileSearch,
  MessageSquare,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Calculator,
  Check,
  X,
  ImageIcon,
  Maximize2,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Calculator as CalculatorIcon,
  CheckCircle2 as CheckCircle2Icon,
  FileText,
  Send,
  CreditCard,
  ShieldAlert as ShieldAlertIcon,
  FileSearch as FileSearchIcon,
  CheckCircle as CheckCircleIcon,
  UserPlus as UserPlusIcon,
  SearchCheck as SearchCheckIcon,
  Heart,
  HelpCircle
} from 'lucide-react';

interface ClaimDetailProps {
  claim: Claim;
  user: User;
  onClose: () => void;
  onUpdateStatus: (newStatus: ClaimStatus, comment?: string, extraData?: any) => void;
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [showNoAttachmentsMsg, setShowNoAttachmentsMsg] = useState(false);

  const isReceptionist = user.role === UserRole.RECEPTIONIST;
  const isDoctor = user.role === UserRole.DOCTOR;
  const isDataEntry = user.role === UserRole.DATA_ENTRY;
  const isHead = user.role === UserRole.HEAD_OF_UNIT;
  const isEmployee = user.role === UserRole.EMPLOYEE;
  const isAdmin = user.role === UserRole.ADMIN;
  
  const [archiveBoxId, setArchiveBoxId] = useState(claim.invoices[0]?.archiveBoxId || '');
  const activeInvoice = claim.invoices[activeInvoiceIndex];

  const stages = [
    { id: ClaimStatus.WAITING_FOR_PAPER, label: 'تقديم الطلب', icon: <Send className="w-4 h-4" /> },
    { id: ClaimStatus.PAPER_RECEIVED, label: 'تم الاستلام', icon: <FileText className="w-4 h-4" /> },
    { id: ClaimStatus.MEDICALLY_APPROVED, label: 'المراجعة الطبية', icon: <Stethoscope className="w-4 h-4" /> },
    { id: ClaimStatus.PAID, label: 'الصرف النهائي', icon: <CreditCard className="w-4 h-4" /> },
  ];

  const currentStageIndex = stages.findIndex(s => {
    if (claim.status === ClaimStatus.PAID) return s.id === ClaimStatus.PAID;
    if (claim.status === ClaimStatus.CHIEF_APPROVED) return s.id === ClaimStatus.FINANCIALLY_PROCESSED;
    if (claim.status === ClaimStatus.FINANCIALLY_PROCESSED) return s.id === ClaimStatus.FINANCIALLY_PROCESSED;
    if (claim.status === ClaimStatus.MEDICALLY_APPROVED) return s.id === ClaimStatus.MEDICALLY_APPROVED;
    if (claim.status === ClaimStatus.PAPER_RECEIVED) return s.id === ClaimStatus.PAPER_RECEIVED;
    return s.id === ClaimStatus.WAITING_FOR_PAPER;
  });

  // فرز الفواتير لاتخاذ القرار الجماعي النهائي
  const approvedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.MEDICALLY_APPROVED);
  const rejectedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.MEDICALLY_REJECTED);

  const handleInvoiceDecision = (invoiceId: string, decision: 'APPROVE' | 'REJECT') => {
    const status = decision === 'APPROVE' ? ClaimStatus.MEDICALLY_APPROVED : ClaimStatus.MEDICALLY_REJECTED;
    onInvoiceStatusUpdate(claim.id, invoiceId, status, globalComment || 'تمت المراجعة والفرز');
  };

  return (
    <div className="max-w-full mx-auto pb-12 animate-in fade-in duration-700 font-cairo px-4 sm:px-0" dir="rtl">
      {/* Status Progress Bar */}
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 right-0 h-0.5 bg-litcBlue -translate-y-1/2 z-0 transition-all duration-1000"
            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
          ></div>
          
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isActive = idx === currentStageIndex;
            
            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-md
                  ${isCompleted ? 'bg-litcBlue text-white' : 'bg-slate-200 text-slate-400'}
                  ${isActive ? 'scale-125 ring-4 ring-litcBlue/20' : ''}
                `}>
                  {isCompleted ? <Check className="w-5 h-5" /> : stage.icon}
                </div>
                <span className={`text-[10px] font-black whitespace-nowrap ${isCompleted ? 'text-litcBlue' : 'text-slate-400'}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Header Container */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 sm:gap-6 bg-white p-4 sm:p-10 rounded-2xl shadow-sm border border-slate-100 mb-6 sm:mb-8 relative overflow-hidden text-center xl:text-right max-w-md mx-auto xl:max-w-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full blur-3xl"></div>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-8 relative z-10">
          <button onClick={onClose} className="p-2.5 sm:p-5 bg-slate-50 hover:bg-litcBlue hover:text-white rounded-xl sm:rounded-[2rem] transition-all shadow-inner border border-slate-100"><ArrowRight className="w-4.5 h-4.5 sm:w-7 sm:h-7" /></button>
          <div>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 leading-tight">{claim.employeeName}</h2>
            <p className="text-[8px] sm:text-[11px] font-black text-slate-400 mt-1 uppercase tracking-widest sm:tracking-[0.3em]">معاملة طبية رقم: #{claim.id} | الإجمالي: <span className="font-black">{claim.totalAmount.toLocaleString()}</span> د.ل</p>
          </div>
        </div>
        <div className={`px-4 py-2 sm:px-8 sm:py-4 rounded-lg sm:rounded-[2rem] text-[8px] sm:text-[11px] font-black flex items-center gap-2 sm:gap-4 ${STATUS_UI[claim.status]?.color || 'bg-slate-50 text-slate-600'} shadow-sm border border-current/10 relative z-10`}>
          {STATUS_UI[claim.status]?.icon || <Clock className="w-4 h-4" />} {STATUS_UI[claim.status]?.label || claim.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Invoice Items Section */}
        <section className="bg-white p-4 sm:p-10 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-8 text-center sm:text-right">
             <h3 className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-2 sm:gap-4"><FileSearch className="text-litcBlue shrink-0 w-5 h-5 sm:w-6 sm:h-6" /> تدقيق بنود الفاتورة</h3>
             <span className="bg-slate-50 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black text-slate-400 border border-slate-100 shadow-inner shrink-0">الفاتورة <span className="font-black">{activeInvoiceIndex + 1}</span> من <span className="font-black">{claim.invoices.length}</span></span>
          </div>
          <div className="overflow-x-auto rounded-xl sm:rounded-[2rem] border border-slate-50 shadow-inner custom-scrollbar flex-1">
             <table className="w-full text-right min-w-[350px] sm:min-w-[450px]">
                <thead className="bg-slate-50 sticky top-0 z-10">
                   <tr>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">اسم البند / الخدمة</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">القيمة (د.ل)</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">النوع الفني</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                   {activeInvoice?.lineItems?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-4 py-3 sm:px-6 sm:py-4 font-bold text-[10px] sm:text-sm text-slate-700">{item.itemName}</td>
                         <td className="px-4 py-3 sm:px-6 sm:py-4 font-black text-litcBlue text-[10px] sm:text-sm"><span className="font-black">{item.price.toLocaleString()}</span></td>
                         <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-100 rounded-md sm:rounded-lg text-[7px] sm:text-[9px] font-black text-slate-500 border border-slate-200">{item.serviceType || 'خدمة عامة'}</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {activeInvoice?.ocrData?.auditorComment && (
             <div className="mt-6 p-4 sm:p-6 bg-amber-50 rounded-[1.2rem] sm:rounded-2xl border border-amber-100 flex items-start gap-3 sm:gap-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5 w-4.5 h-4.5 sm:w-6 sm:h-6" />
                <div>
                   <p className="text-[8px] sm:text-[10px] font-black text-amber-600 mb-1 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">ملاحظة المدقق الفني <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /></p>
                   <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed italic">"{activeInvoice.ocrData.auditorComment}"</p>
                </div>
             </div>
          )}
        </section>

        {/* Invoice Image Section */}
        <div className="relative group h-full">
           <section className="bg-slate-900 rounded-2xl h-[400px] lg:h-full min-h-[500px] relative flex items-center justify-center overflow-hidden border-4 sm:border-8 border-white shadow-xl">
              <div className="w-full h-full flex items-center justify-center transition-transform duration-500" style={{ transform: `scale(${zoomLevel})` }}>
                 <img 
                   src={activeInvoice?.imageUrl} 
                   className="max-w-full max-h-full object-contain rounded-xl cursor-zoom-in" 
                   alt="Medical Document" 
                   onClick={() => setIsLightboxOpen(true)}
                 />
              </div>
              
              {/* Navigation Controls */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
                 <button 
                   onClick={() => {
                     if (activeInvoice?.attachmentUrls && activeInvoice.attachmentUrls.length > 0) {
                       setIsAttachmentsModalOpen(true);
                     } else {
                       setShowNoAttachmentsMsg(true);
                       setTimeout(() => setShowNoAttachmentsMsg(false), 3000);
                     }
                   }}
                   className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg sm:rounded-xl backdrop-blur-xl border border-white/20 transition-all shadow-xl font-black text-[9px] sm:text-xs group ${activeInvoice?.attachmentUrls?.length ? 'ring-2 ring-litcOrange/50 animate-pulse hover:animate-none' : ''}`}
                 >
                   <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                   عرض المرفقات
                   {activeInvoice?.attachmentUrls?.length ? (
                     <span className="bg-litcOrange text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[10px]">
                       {activeInvoice.attachmentUrls.length}
                     </span>
                   ) : null}
                 </button>
                 
                 {showNoAttachmentsMsg && (
                   <div className="absolute top-full mt-2 right-0 w-48 sm:w-64 bg-rose-500 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl border border-rose-400 animate-in fade-in slide-in-from-top-2 duration-300 z-30">
                     <p className="text-[10px] sm:text-xs font-black flex items-center gap-2">
                       <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                       عذراً، هذه الفاتورة لا تتضمن مرفقات إضافية.
                     </p>
                   </div>
                 )}
              </div>

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
      </div>

      {/* ACTION SECTION - ONLY SHOWN IF ACTIONS ARE AVAILABLE */}
      {((isReceptionist && claim.status === ClaimStatus.WAITING_FOR_PAPER) ||
        (isDoctor && claim.status === ClaimStatus.PAPER_RECEIVED) ||
        (isDataEntry && claim.status === ClaimStatus.MEDICALLY_APPROVED) ||
        (isHead && claim.status === ClaimStatus.FINANCIALLY_PROCESSED)) && (
        <div className="mt-12 bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-6 sm:gap-10">
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
              {isReceptionist && claim.status === ClaimStatus.WAITING_FOR_PAPER && (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-4xl">
                  <div className="flex-1 relative w-full">
                    <Database className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      value={archiveBoxId}
                      onChange={(e) => setArchiveBoxId(e.target.value)}
                      placeholder="رقم صندوق الأرشيف - Archive Box ID"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-12 pl-6 font-bold text-sm outline-none focus:border-litcBlue transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => onUpdateStatus(ClaimStatus.PAPER_RECEIVED, `تم استلام الأوراق الورقية ووضعها في الصندوق رقم: ${archiveBoxId}`, { archiveBoxId })} 
                    disabled={!archiveBoxId}
                    className="bg-litcBlue text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-litcDark transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" /> تأكيد استلام الملف الورقي
                  </button>
                </div>
              )}

              {isDoctor && claim.status === ClaimStatus.PAPER_RECEIVED && (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-5xl">
                   <button 
                     onClick={() => onUpdateStatus(ClaimStatus.MEDICALLY_APPROVED, globalComment || 'تم الاعتماد طبياً')} 
                     className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                   >
                      <CheckCircle className="w-5 h-5" /> اعتماد طبي
                   </button>
                   <button 
                     onClick={() => {
                       if (!globalComment.trim()) {
                         alert('يرجى إدخال سبب الرفض في حقل الملاحظات');
                         return;
                       }
                       onUpdateStatus(ClaimStatus.MEDICALLY_REJECTED, globalComment);
                     }} 
                     className="flex-1 bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3"
                   >
                      <XCircle className="w-5 h-5" /> رفض طبي
                   </button>
                   <button 
                     onClick={() => onUpdateStatus(ClaimStatus.PENDING_CLARIFICATION, globalComment || 'مطلوب توضيح إضافي')} 
                     className="flex-1 bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
                   >
                      <HelpCircle className="w-5 h-5" /> طلب توضيح
                   </button>
                </div>
              )}

              {isDataEntry && claim.status === ClaimStatus.MEDICALLY_APPROVED && (
                <button 
                  onClick={() => onUpdateStatus(ClaimStatus.FINANCIALLY_PROCESSED, globalComment || 'تمت المعالجة المالية')} 
                  className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
                >
                  <Database className="w-5 h-5" /> إتمام المعالجة المالية
                </button>
              )}

              {isHead && claim.status === ClaimStatus.FINANCIALLY_PROCESSED && (
                <button 
                  onClick={() => onUpdateStatus(ClaimStatus.CHIEF_APPROVED, globalComment || 'تم الاعتماد النهائي من رئيس الوحدة')} 
                  className="bg-litcBlue text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-litcDark transition-all flex items-center gap-3"
                >
                  <ShieldCheck className="w-5 h-5" /> اعتماد نهائي (رئيس الوحدة)
                </button>
              )}
           </div>
        </div>
      )}

      {/* Horizontal Roadmap Audit Trail Section */}
      <section className="mt-12 bg-litcDark rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/10 rounded-full blur-[120px]"></div>
         <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
            <h3 className="text-base sm:text-xl font-black flex items-center gap-3"><Clock className="text-litcOrange w-5 h-5 sm:w-6 sm:h-6" /> مسار المعاملة الزمني</h3>
            <div className="flex gap-1.5">
               <div className="w-2 h-2 rounded-full bg-litcOrange animate-pulse"></div>
               <div className="w-2 h-2 rounded-full bg-litcBlue"></div>
            </div>
         </div>
         
         <div className="relative">
            {/* Roadmap Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 hidden sm:block"></div>
            
            <div className="flex gap-4 sm:gap-0 overflow-x-auto pb-4 custom-scrollbar-white snap-x relative z-10 sm:justify-between">
               {claim.auditTrail.map((log, i) => (
                  <div key={i} className="min-w-[220px] sm:min-w-0 sm:flex-1 flex flex-col items-center text-center snap-center group/node">
                     {/* Node */}
                     <div className="relative mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center group-hover/node:border-litcOrange group-hover/node:scale-110 transition-all duration-500 z-20 relative shadow-xl">
                           <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-litcBlue group-hover/node:text-litcOrange transition-colors" />
                        </div>
                        {/* Connecting line for mobile */}
                        {i < claim.auditTrail.length - 1 && (
                           <div className="absolute top-1/2 left-full w-4 h-0.5 bg-white/10 -translate-y-1/2 sm:hidden"></div>
                        )}
                     </div>

                     {/* Info */}
                     <div className="px-2">
                        <p className="text-[8px] sm:text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{log.timestamp}</p>
                        <p className="text-[10px] sm:text-xs font-black text-white mb-1 truncate max-w-[150px] mx-auto">{log.userName}</p>
                        <p className="text-[9px] sm:text-[11px] font-bold text-blue-100 leading-tight mb-2">{log.action}</p>
                        
                        {log.comment && (
                           <div className="bg-black/30 p-2 rounded-xl border border-white/5 opacity-0 group-hover/node:opacity-100 transition-opacity duration-300 absolute top-full left-1/2 -translate-x-1/2 w-48 mt-2 pointer-events-none z-30 shadow-2xl">
                              <p className="text-[8px] sm:text-[10px] font-bold text-white/70 italic">"{log.comment}"</p>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>
      {/* Attachments Modal */}
      {isAttachmentsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-[110] flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300" dir="rtl">
          <button 
            onClick={() => setIsAttachmentsModalOpen(false)}
            className="absolute top-6 left-6 p-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="w-full max-w-6xl h-full flex flex-col gap-6">
            <div className="flex items-center justify-between text-white">
              <h3 className="text-xl sm:text-3xl font-black flex items-center gap-4">
                <ImageIcon className="w-8 h-8 text-litcOrange" />
                المرفقات الإضافية للفاتورة
              </h3>
              <p className="text-white/50 font-bold">إجمالي المرفقات: <span className="font-black">{activeInvoice?.attachmentUrls?.length || 0}</span></p>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar-white p-4">
              {activeInvoice?.attachmentUrls?.map((url, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border-4 border-white/10 hover:border-white/30 transition-all shadow-2xl bg-black/20">
                  <img 
                    src={url} 
                    className="w-full h-auto object-contain" 
                    alt={`Attachment ${idx + 1}`} 
                  />
                  <div className="absolute top-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-white font-black text-xs">
                    مرفق رقم {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 left-6 p-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={activeInvoice?.imageUrl} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-xl" 
              alt="Full Detail" 
            />
          </div>
          
          <div className="absolute bottom-10 flex gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
            <div className="text-white text-center px-6 border-l border-white/10">
              <p className="text-[10px] font-black text-white/50 uppercase">المرفق الصحي</p>
              <p className="text-lg font-black">{activeInvoice?.hospitalName}</p>
            </div>
            <div className="text-white text-center px-6">
              <p className="text-[10px] font-black text-white/50 uppercase">القيمة</p>
              <p className="text-lg font-black"><span className="font-black">{activeInvoice?.amount.toLocaleString()}</span> د.ل</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimDetail;
