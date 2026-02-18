
import React, { useState, useEffect } from 'react';
import { Claim, ClaimStatus, User, UserRole, Invoice } from '../types';
import { STATUS_UI } from '../constants';
// Added CheckCircle2 to lucide-react imports to fix missing component error
import { 
  ArrowRight, Check, X, ImageIcon, 
  Clock, Maximize2, ShieldCheck, Database, RotateCcw,
  Building2, CreditCard, ChevronDown, MessageSquare, UserPlus,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move, Download, Plus,
  Layers, Expand, FileText, MapPin, Building, Info, AlertCircle, Sparkles, Send,
  Calculator, UserCheck, HeartPulse, CheckCircle2
} from 'lucide-react';

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحي قرقاب', team: 'وحدة الصيدليات' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات' },
];

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showError, setShowError] = useState(false);
  
  const isHead = user.role === UserRole.HEAD_OF_UNIT;
  const isDoctor = user.role === UserRole.DOCTOR;
  
  const activeInvoice = claim.invoices && claim.invoices.length > 0 ? claim.invoices[activeInvoiceIndex] : null;

  useEffect(() => {
    setZoomLevel(1);
    setShowError(false);
    // تصفير المختار بعد كل عملية إسناد ناجحة (تحدث عند تغير فواتير المعاملة)
    setSelectedInvoiceIds([]);
  }, [activeInvoiceIndex, claim.invoices.map(i => i.assignedToId).join(',')]);

  const toggleInvoiceSelection = (e: React.MouseEvent, id: string, isAssigned: boolean) => {
    e.stopPropagation();
    if (isAssigned) return; // لا يمكن اختيار فاتورة مُسندة مسبقاً
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setShowError(false);
  };

  const handleConfirmAssign = () => {
    if (!selectedStaffId || selectedInvoiceIds.length === 0) {
      setShowError(true);
      return;
    }
    onInvoiceAssign(claim.id, selectedInvoiceIds, selectedStaffId);
  };

  const nextInvoice = () => {
    if (claim.invoices.length > 1) {
      setActiveInvoiceIndex(prev => (prev + 1) % claim.invoices.length);
    }
  };

  const prevInvoice = () => {
    if (claim.invoices.length > 1) {
      setActiveInvoiceIndex(prev => (prev - 1 + claim.invoices.length) % claim.invoices.length);
    }
  };

  const adjustZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 3));
  };

  const getApprovalStatus = () => {
    if (isDoctor) return ClaimStatus.PENDING_HEAD;
    if (isHead) return ClaimStatus.APPROVED;
    return ClaimStatus.APPROVED;
  };

  const getApprovalLabel = () => {
    if (isDoctor) return "اعتماد وتحويل للرئيس";
    if (isHead) return "اعتماد نهائي (على الضمانة)";
    return "اعتماد";
  };

  return (
    <div className="max-w-full mx-auto pb-20 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Full Preview" />
          <button className="absolute top-10 right-10 text-white bg-white/10 p-4 rounded-full"><X size={32} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-4">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div className="flex items-center gap-6">
               <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-all shadow-inner"><ArrowRight size={24} /></button>
               <div>
                 <h2 className="text-xl font-black text-slate-900 leading-tight">{claim.employeeName}</h2>
                 <div className="flex gap-4 mt-1">
                    <span className="text-[10px] font-black text-litcBlue bg-litcBlue/5 px-3 py-1 rounded-lg flex items-center gap-1"><MapPin size={10} /> {claim.location || 'غير محدد'}</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1"><Building size={10} /> {claim.department || 'غير محدد'}</span>
                 </div>
               </div>
             </div>
             <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black flex items-center gap-2 ${STATUS_UI[claim.status].color}`}>
               {STATUS_UI[claim.status].icon} {STATUS_UI[claim.status].label}
             </div>
           </div>

           <div className="relative group">
              <section className="bg-slate-900 rounded-[3.5rem] h-[650px] md:h-[800px] relative flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl transition-all duration-500">
                 <div 
                   className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out origin-center p-4"
                   style={{ transform: `scale(${zoomLevel})` }}
                 >
                    {activeInvoice && activeInvoice.imageUrl ? (
                      <img src={activeInvoice.imageUrl} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" alt="Invoice Content" />
                    ) : (
                      <div className="text-white flex flex-col items-center gap-6 opacity-40">
                        <ImageIcon size={80} strokeWidth={1} />
                        <p className="font-black text-lg">لا توجد صورة لهذه الفاتورة</p>
                      </div>
                    )}
                 </div>

                 <div className="absolute bottom-10 inset-x-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="flex gap-2 bg-black/50 backdrop-blur-xl p-3 rounded-[2.5rem] pointer-events-auto border border-white/10 shadow-2xl">
                      <button onClick={() => adjustZoom(0.3)} className="w-14 h-14 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all flex items-center justify-center"><ZoomIn size={24} /></button>
                      <button onClick={() => adjustZoom(-0.3)} className="w-14 h-14 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all flex items-center justify-center"><ZoomOut size={24} /></button>
                      <button onClick={() => activeInvoice && setPreviewImage(activeInvoice.imageUrl)} className="w-14 h-14 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all flex items-center justify-center"><Maximize2 size={24} /></button>
                    </div>
                 </div>

                 {claim.invoices.length > 1 && (
                   <div className="absolute inset-y-0 left-6 right-6 flex items-center justify-between pointer-events-none">
                      <button onClick={prevInvoice} className="w-16 h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-full backdrop-blur-md transition-all flex items-center justify-center shadow-2xl pointer-events-auto border border-white/10"><ChevronRight size={40} /></button>
                      <button onClick={nextInvoice} className="w-16 h-16 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-full backdrop-blur-md transition-all flex items-center justify-center shadow-2xl pointer-events-auto border border-white/10"><ChevronLeft size={40} /></button>
                   </div>
                 )}

                 <div className="absolute top-10 right-10 bg-litcBlue text-white px-6 py-2.5 rounded-[1.5rem] font-black text-[11px] tracking-[0.2em] shadow-xl uppercase border border-white/10 backdrop-blur-md">
                   الفاتورة {activeInvoiceIndex + 1} من {claim.invoices.length}
                 </div>
              </section>
           </div>
           
           {activeInvoice && activeInvoice.lineItems && activeInvoice.lineItems.length > 0 && (
             <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-litcBlue/5 text-litcBlue rounded-2xl flex items-center justify-center shadow-inner"><Calculator size={24} /></div>
                  <h3 className="text-xl font-black text-slate-900">بيانات الإدخال الفني (مراجعة)</h3>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-50">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">اسم البند</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">القيمة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeInvoice.lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 font-bold text-sm text-slate-700">{item.itemName}</td>
                          <td className="px-8 py-4 font-black text-sm text-litcBlue">{item.price.toLocaleString()} د.ل</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </section>
           )}
        </div>

        <div className="xl:col-span-4 space-y-8">
           <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="font-black text-slate-900 flex items-center gap-3"><CreditCard className="text-litcBlue" /> ملخص المعاملة</h3>

              <div className="grid grid-cols-1 gap-4">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الفواتير</p>
                    <p className="text-4xl font-black text-slate-900">{claim.totalAmount.toLocaleString()} <span className="text-sm">د.ل</span></p>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">اختيار الفواتير للإسناد</p>
                    {isHead && selectedInvoiceIds.length > 0 && (
                      <span className="text-[10px] font-black text-litcOrange bg-orange-50 px-4 py-1.5 rounded-full animate-pulse">محدد: {selectedInvoiceIds.length}</span>
                    )}
                 </div>
                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {claim.invoices && claim.invoices.map((inv, idx) => (
                        <div 
                          key={inv.id} 
                          onClick={() => setActiveInvoiceIndex(idx)} 
                          className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer flex items-center justify-between group ${activeInvoiceIndex === idx ? 'bg-litcBlue border-litcBlue text-white shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}
                        >
                          <div className="flex items-center gap-5">
                              {isHead && (
                                <div 
                                  onClick={(e) => toggleInvoiceSelection(e, inv.id, !!inv.assignedToId)}
                                  className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${inv.assignedToId ? 'bg-emerald-500 border-white text-white cursor-default' : selectedInvoiceIds.includes(inv.id) ? 'bg-litcOrange border-white text-white scale-110 shadow-lg shadow-orange-200' : 'bg-slate-50 border-slate-200'}`}
                                >
                                  {inv.assignedToId ? <CheckCircle2 size={18} strokeWidth={3} /> : selectedInvoiceIds.includes(inv.id) && <Check size={18} strokeWidth={4} />}
                                </div>
                              )}
                              <div className="text-right">
                                <p className={`text-base font-black ${activeInvoiceIndex === idx ? 'text-white' : 'text-slate-900'}`}>{inv.hospitalName}</p>
                                <p className={`text-[11px] font-bold ${activeInvoiceIndex === idx ? 'text-blue-100' : 'text-slate-400'}`}>
                                   {inv.assignedToId ? `مُسندة لـ: ${inv.assignedToName}` : `${inv.amount.toLocaleString()} ${inv.currency}`}
                                </p>
                              </div>
                          </div>
                          {inv.assignedToId && <Database size={16} className={activeInvoiceIndex === idx ? 'text-white/40' : 'text-emerald-500'} />}
                        </div>
                    ))}
                 </div>
              </div>

              {isHead && selectedInvoiceIds.length > 0 && (
                 <div className="pt-8 border-t border-slate-100 space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="space-y-3 text-right">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">تحويل ({selectedInvoiceIds.length}) فاتورة إلى:</label>
                       <div className="relative">
                          <select 
                            value={selectedStaffId} 
                            onChange={(e) => { setSelectedStaffId(e.target.value); setShowError(false); }} 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] p-5 pr-14 font-black text-sm outline-none appearance-none focus:bg-white transition-all shadow-sm"
                          >
                              <option value="">اختر الموظف...</option>
                              {DATA_ENTRY_STAFF.map(s => <option key={s.id} value={s.id}>{s.name} ({s.team})</option>)}
                          </select>
                          <UserPlus className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                       </div>
                    </div>

                    <button 
                      onClick={handleConfirmAssign} 
                      className={`w-full py-6 rounded-[2rem] font-black text-base shadow-2xl transition-all flex items-center justify-center gap-4 ${!selectedStaffId ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-litcOrange text-white hover:bg-orange-600 active:scale-95 orange-glow'}`}
                    >
                       <Send size={22} /> تحويل الفواتير المختارة
                    </button>
                 </div>
              )}
           </section>

           <section className="bg-litcDark rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <h3 className="text-lg font-black mb-8 flex items-center gap-3 relative z-10"><Clock size={20} className="text-litcOrange" /> السجل الزمني</h3>
              <div className="space-y-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar relative z-10 text-right">
                 {claim.auditTrail.map((log, idx) => (
                    <div key={idx} className="relative pr-6 border-r border-white/10 pb-6 last:pb-0">
                       <div className="absolute -right-[5px] top-1 w-2.5 h-2.5 rounded-full bg-litcOrange"></div>
                       <p className="text-xs font-black text-white">{log.action}</p>
                       <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">{log.userName} • {log.timestamp}</p>
                    </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 h-28 bg-white/80 backdrop-blur-3xl border-t border-slate-100 z-40 flex items-center justify-center px-10 gap-6 shadow-2xl shadow-black/10">
         <div className="flex-1 max-w-3xl relative">
            <MessageSquare className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input value={globalComment} onChange={(e) => setGlobalComment(e.target.value)} placeholder="أضف ملاحظاتك النهائية هنا..." className="w-full bg-slate-50 border border-slate-200 rounded-[1.8rem] py-5 pr-14 pl-8 font-bold text-sm outline-none focus:bg-white focus:border-litcBlue transition-all shadow-inner" />
         </div>
         
         <div className="flex gap-4">
           <button onClick={() => onUpdateStatus(getApprovalStatus(), globalComment)} className="bg-emerald-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-3">
              {isHead ? <UserCheck size={20} /> : <Send size={20} />}
              {getApprovalLabel()}
           </button>
           <button onClick={() => onUpdateStatus(ClaimStatus.RETURNED_TO_EMPLOYEE, globalComment)} className="bg-amber-500 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm shadow-xl hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-3"><RotateCcw size={20} /> إرجاع للموظف</button>
           <button onClick={() => onUpdateStatus(ClaimStatus.REJECTED, globalComment)} className="bg-rose-500 text-white px-10 py-5 rounded-[1.8rem] font-black text-sm shadow-xl hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-3"><X size={20} /> رفض</button>
         </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
