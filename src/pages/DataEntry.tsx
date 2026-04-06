
import React, { useState, useMemo } from 'react';
import { Claim, Invoice, InvoiceLineItem, User, ClaimStatus, UserRole } from '../types';
import { analyzeInvoiceDetailed } from '../services/geminiService';
import { 
  ArrowRight, Sparkles, Loader2, Activity,
  Maximize2, Building2, PlusCircle, 
  Trash2, Hash, Calculator, CheckCircle2, Send,
  X, ShieldCheck, Edit3, Check, Clock, AlertTriangle, MessageSquare,
  Stethoscope, Monitor, Glasses, Coins, Calendar
} from 'lucide-react';

interface DataEntryProps {
  claim: Claim;
  claims: Claim[];
  user: User;
  onSave: (updatedInvoices: Invoice[]) => void;
  onBack: () => void;
}

const DataEntry: React.FC<DataEntryProps> = ({ claim, claims, user, onSave, onBack }) => {
  const isReadOnly = claim.status === ClaimStatus.FINANCIALLY_PROCESSED || claim.status === ClaimStatus.CHIEF_APPROVED || claim.status === ClaimStatus.PAID;
  const isUnitHead = user.role === UserRole.HEAD_OF_UNIT;

  const assignedInvoices = useMemo(() => 
    claim.invoices.filter(inv => inv.assignedToId === user.id || !inv.assignedToId || isUnitHead), 
    [claim.invoices, user.id, isUnitHead]
  );

  const [editingInvoices, setEditingInvoices] = useState<Invoice[]>(assignedInvoices);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  // تتبع القرارات الفنية لكل فاتورة
  const [invoiceDecisions, setInvoiceDecisions] = useState<Record<string, { status: 'VALID' | 'ERROR', comment: string }>>(() => {
    const initial: Record<string, { status: 'VALID' | 'ERROR', comment: string }> = {};
    assignedInvoices.forEach(inv => {
      if (inv.ocrData?.dataEntryDecision) {
        initial[inv.id] = { 
          status: inv.ocrData.dataEntryDecision, 
          comment: inv.ocrData.auditorComment || '' 
        };
      }
    });
    return initial;
  });

  const currentInv = editingInvoices[activeIndex];

  const handleUpdateInvoice = (updates: Partial<Invoice>) => {
    if (isReadOnly && !isUnitHead) return;
    setEditingInvoices(prev => prev.map((inv, idx) => {
      if (idx === activeIndex) {
        const updatedInv = { ...inv, ...updates };
        
        // Financial Logic for Coverage
        let coverage = 0.9; // Default 90%
        if (updatedInv.isMajorSurgery || updatedInv.isMedicalDevice) {
          coverage = 1.0;
        }
        
        const amountLYD = (updatedInv.amount || 0) * (updatedInv.exchangeRate || 1.0);
        updatedInv.originalAmountInLYD = amountLYD;
        
        if (updatedInv.isGlasses) {
          const cap = 1500;
          updatedInv.companyPortion = Math.min(amountLYD, cap);
          updatedInv.employeePortion = Math.max(0, amountLYD - cap);
          updatedInv.excessPaidByEmployee = updatedInv.employeePortion;
        } else {
          updatedInv.companyPortion = amountLYD * coverage;
          updatedInv.employeePortion = amountLYD * (1 - coverage);
        }
        
        updatedInv.netAmountLYD = updatedInv.companyPortion;
        updatedInv.coveragePercentage = coverage * 100;

        return updatedInv;
      }
      return inv;
    }));
  };

  // Global Duplicate Detection across all claims
  const isGlobalDuplicate = useMemo(() => {
    if (!currentInv) return false;
    return claims.some(c => 
      c.invoices.some(inv => 
        inv.id !== currentInv.id && 
        inv.invoiceNumber === currentInv.invoiceNumber && 
        inv.date === currentInv.date && 
        inv.amount === currentInv.amount
      )
    );
  }, [currentInv, claims]);

  // Check for glasses limit (1 per year)
  const hasPreviousGlassesThisYear = useMemo(() => {
    if (!currentInv || !currentInv.isGlasses) return false;
    const currentYear = new Date().getFullYear().toString();
    return claims.some(c => 
      c.employeeId === claim.employeeId && 
      c.invoices.some(inv => 
        inv.id !== currentInv.id && 
        inv.isGlasses && 
        inv.date.startsWith(currentYear) &&
        (inv.status === ClaimStatus.PAID || inv.status === ClaimStatus.CHIEF_APPROVED)
      )
    );
  }, [currentInv, claims, claim.employeeId]);

  const isDuplicate = useMemo(() => {
    if (!currentInv) return false;
    // Local duplicate in current claim
    const isLocalDuplicate = editingInvoices.some((inv, idx) => 
      idx !== activeIndex && 
      inv.invoiceNumber === currentInv.invoiceNumber && 
      inv.date === currentInv.date && 
      inv.amount === currentInv.amount
    );
    return isLocalDuplicate || isGlobalDuplicate;
  }, [currentInv, editingInvoices, activeIndex, isGlobalDuplicate]);

  const setDecision = (id: string, status: 'VALID' | 'ERROR') => {
    setInvoiceDecisions(prev => ({
      ...prev,
      [id]: { ...prev[id], status }
    }));
  };

  const setDecisionComment = (id: string, comment: string) => {
    setInvoiceDecisions(prev => ({
      ...prev,
      [id]: { ...prev[id], comment }
    }));
  };

  const handleAutoAnalyze = async () => {
    if (!currentInv) return;
    setIsAnalyzing(true);
    try {
      const base64 = currentInv.imageUrl.split(',')[1];
      const items = await analyzeInvoiceDetailed(base64);
      const lineItems: InvoiceLineItem[] = items.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        itemName: item.itemName || 'صنف غير معروف',
        price: item.price || 0,
        serviceType: item.serviceType || 'خدمات عامة'
      }));
      handleUpdateInvoice({ lineItems });
    } catch (err) { console.error(err); }
    finally { setIsAnalyzing(false); }
  };

  const isAllDecided = editingInvoices.every(inv => invoiceDecisions[inv.id]?.status);

  const handleFinalSubmit = () => {
    const finalInvoices = editingInvoices.map(inv => ({
      ...inv,
      status: ClaimStatus.FINANCIALLY_PROCESSED,
      ocrData: { ...inv.ocrData, auditorComment: invoiceDecisions[inv.id]?.comment || '', dataEntryDecision: invoiceDecisions[inv.id]?.status }
    }));
    onSave(finalInvoices);
  };

  const handleUnitHeadApprove = () => {
    const finalInvoices = editingInvoices.map(inv => ({
      ...inv,
      status: ClaimStatus.CHIEF_APPROVED
    }));
    onSave(finalInvoices);
  };

  const handleUnitHeadReturn = () => {
    const finalInvoices = editingInvoices.map(inv => ({
      ...inv,
      status: ClaimStatus.MEDICALLY_APPROVED // Return to Data Entry status
    }));
    onSave(finalInvoices);
  };

  const totalCompany = editingInvoices.reduce((s, i) => s + (i.companyPortion || 0), 0);
  const totalEmployee = editingInvoices.reduce((s, i) => s + (i.employeePortion || 0), 0);
  const totalOriginal = editingInvoices.reduce((s, i) => s + (i.originalAmountInLYD || 0), 0);

  return (
    <div className="max-w-full mx-auto pb-32 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {showFullImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-3xl flex items-center justify-center p-12" onClick={() => setShowFullImage(false)}>
          <img src={currentInv.imageUrl} className="max-w-full max-h-full object-contain rounded-3xl" alt="Full" />
          <button className="absolute top-10 right-10 text-white"><X className="w-10 h-10" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-10 bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 text-center xl:text-right max-w-md mx-auto xl:max-w-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-litcBlue/10 transition-all"></div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
          <button onClick={onBack} className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl hover:bg-litcBlue hover:text-white transition-all shadow-inner group-hover:scale-110"><ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">المعالجة الفنية للفواتير</h1>
            <p className="text-slate-500 font-bold text-[10px] sm:text-sm">أنت تقوم الآن بتدقيق فواتير الموظف: {claim.employeeName}</p>
          </div>
        </div>
        <div className="flex -space-x-2 sm:-space-x-3 space-x-reverse relative z-10">
          {editingInvoices.map((inv, i) => (
            <button 
              key={inv.id} 
              onClick={() => setActiveIndex(i)}
              className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl font-black transition-all border-2 sm:border-4 border-white shadow-lg relative text-xs sm:text-base ${activeIndex === i ? 'bg-litcBlue text-white scale-110 z-10' : 'bg-slate-100 text-slate-400'} ${invoiceDecisions[inv.id]?.status === 'VALID' ? 'border-emerald-500' : invoiceDecisions[inv.id]?.status === 'ERROR' ? 'border-rose-500' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[4rem] p-3 sm:p-5 h-[350px] sm:h-[750px] sticky top-6 flex items-center justify-center border-4 sm:border-8 border-white shadow-2xl overflow-hidden group max-w-md mx-auto lg:max-w-none">
              <img src={currentInv.imageUrl} className="max-w-full max-h-full object-contain rounded-2xl cursor-zoom-in transition-transform group-hover:scale-105" onClick={() => setShowFullImage(true)} />
              <button onClick={() => setShowFullImage(true)} className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 p-3 sm:p-5 bg-white/10 hover:bg-litcOrange text-white rounded-xl sm:rounded-[1.8rem] backdrop-blur-xl shadow-2xl transition-all">
                <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <section className={`bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] max-w-md mx-auto lg:max-w-none group relative overflow-hidden ${isReadOnly && !isUnitHead ? 'opacity-80' : ''}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-litcBlue/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-litcBlue/10 transition-all"></div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 text-center md:text-right relative z-10">
                 <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3 sm:gap-4"><Edit3 className="text-litcBlue w-6 h-6 sm:w-8 sm:h-8" /> تفاصيل البنود والأسعار</h3>
                 {!isReadOnly && (
                   <button onClick={handleAutoAnalyze} disabled={isAnalyzing} className="w-full md:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-litcOrange text-white px-6 py-4 sm:px-8 sm:py-5 rounded-xl sm:rounded-[2rem] text-xs sm:text-sm font-black hover:bg-orange-600 transition-all shadow-xl group-hover:scale-105">
                      {isAnalyzing ? <Loader2 className="w-4.5 h-4.5 sm:w-6 sm:h-6 animate-spin" /> : <Sparkles className="w-4.5 h-4.5 sm:w-6 sm:h-6" />} التحليل الآلي للبنود
                   </button>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">اسم الجهة</label>
                     <div className="relative">
                       <Building2 className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                       <input type="text" readOnly={isReadOnly && !isUnitHead} value={currentInv.hospitalName} onChange={(e) => handleUpdateInvoice({ hospitalName: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-litcBlue transition-all" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">رقم الفاتورة</label>
                     <div className="relative">
                       <Hash className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                       <input type="text" readOnly={isReadOnly && !isUnitHead} value={currentInv.invoiceNumber} onChange={(e) => handleUpdateInvoice({ invoiceNumber: e.target.value })} className={`w-full bg-slate-50 border-2 ${isDuplicate ? 'border-rose-500 bg-rose-50' : 'border-slate-100'} rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-litcBlue transition-all`} />
                       {isDuplicate && <div className="absolute -bottom-6 right-6 text-rose-500 text-[10px] font-black flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> تنبيه: فاتورة مكررة (نفس الرقم والتاريخ والقيمة)</div>}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">تاريخ الفاتورة</label>
                     <div className="relative">
                       <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                       <input type="date" readOnly={isReadOnly && !isUnitHead} value={currentInv.date} onChange={(e) => handleUpdateInvoice({ date: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-litcBlue transition-all" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">القيمة والعملة</label>
                     <div className="flex gap-4">
                       <div className="relative flex-1">
                         <Coins className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                         <input type="number" readOnly={isReadOnly && !isUnitHead} value={currentInv.amount} onChange={(e) => handleUpdateInvoice({ amount: Number(e.target.value) })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-litcBlue transition-all" />
                       </div>
                       <select 
                         disabled={isReadOnly && !isUnitHead}
                         value={currentInv.currency} 
                         onChange={(e) => handleUpdateInvoice({ currency: e.target.value as any, exchangeRate: e.target.value === 'LYD' ? 1.0 : currentInv.exchangeRate })}
                         className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 font-black outline-none focus:border-litcBlue transition-all"
                       >
                         <option value="LYD">LYD</option>
                         <option value="USD">USD</option>
                         <option value="EUR">EUR</option>
                         <option value="TND">TND</option>
                       </select>
                     </div>
                  </div>
                  {currentInv.currency !== 'LYD' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                       <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest px-2">سعر الصرف (مقابل الدينار)</label>
                       <div className="relative">
                         <Calculator className="absolute right-6 top-1/2 -translate-y-1/2 text-rose-300 w-5 h-5" />
                         <input 
                           type="number" 
                           step="0.01"
                           value={currentInv.exchangeRate} 
                           onChange={(e) => handleUpdateInvoice({ exchangeRate: Number(e.target.value) })} 
                           className="w-full bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-rose-500 transition-all text-rose-600" 
                         />
                       </div>
                    </div>
                  )}
               </div>

               {/* Financial Summary Box for Unit Head */}
               {(isUnitHead || isReadOnly) && (
                 <div className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in zoom-in duration-500">
                    <div className="bg-litcBlue/5 p-6 rounded-[2rem] border border-litcBlue/10">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2">إجمالي الفاتورة</p>
                       <p className="text-2xl font-black text-litcBlue">{currentInv.originalAmountInLYD?.toLocaleString()} <span className="text-xs opacity-60">د.ل</span></p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                       <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">حصة الشركة (90%)</p>
                       <p className="text-2xl font-black text-emerald-700">{currentInv.companyPortion?.toLocaleString()} <span className="text-xs opacity-60">د.ل</span></p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                       <p className="text-[10px] font-black text-amber-600 uppercase mb-2">حصة الموظف (10%)</p>
                       <p className="text-2xl font-black text-amber-700">{currentInv.employeePortion?.toLocaleString()} <span className="text-xs opacity-60">د.ل</span></p>
                    </div>
                 </div>
               )}

               {/* Financial Toggles */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                  <button 
                    disabled={isReadOnly && !isUnitHead}
                    onClick={() => handleUpdateInvoice({ isMajorSurgery: !currentInv.isMajorSurgery, isMedicalDevice: false, isGlasses: false })}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${currentInv.isMajorSurgery ? 'bg-litcBlue text-white border-litcBlue shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-litcBlue/20'}`}
                  >
                    <Stethoscope className="w-6 h-6" />
                    <span className="text-[10px] font-black">عملية كبرى (100%)</span>
                  </button>
                  <button 
                    disabled={isReadOnly && !isUnitHead}
                    onClick={() => handleUpdateInvoice({ isMedicalDevice: !currentInv.isMedicalDevice, isMajorSurgery: false, isGlasses: false })}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${currentInv.isMedicalDevice ? 'bg-litcBlue text-white border-litcBlue shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-litcBlue/20'}`}
                  >
                    <Monitor className="w-6 h-6" />
                    <span className="text-[10px] font-black">جهاز طبي (100%)</span>
                  </button>
                  <button 
                    disabled={isReadOnly && !isUnitHead}
                    onClick={() => handleUpdateInvoice({ isGlasses: !currentInv.isGlasses, isMajorSurgery: false, isMedicalDevice: false })}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 relative ${currentInv.isGlasses ? 'bg-litcBlue text-white border-litcBlue shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-litcBlue/20'}`}
                  >
                    <Glasses className="w-6 h-6" />
                    <span className="text-[10px] font-black">نظارات (1500 د.ل)</span>
                    {hasPreviousGlassesThisYear && (
                      <div className="absolute -top-3 -right-3 bg-rose-500 text-white p-1.5 rounded-full shadow-lg animate-bounce">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                  </button>
               </div>

               {hasPreviousGlassesThisYear && currentInv.isGlasses && (
                 <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                       <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="font-black text-sm">تنبيه: تم تجاوز الحد السنوي للنظارات</p>
                       <p className="text-[10px] font-bold opacity-80">الموظف (أو أحد أفراد عائلته) حصل بالفعل على نظارة طبية خلال هذا العام. سيتم رفض هذا البند آلياً.</p>
                    </div>
                 </div>
               )}

              <div className="space-y-6">
                 <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">تفكيك الأصناف</h4>
                 <div className="overflow-hidden rounded-[3rem] border border-slate-100">
                    <table className="w-full text-right">
                       <thead className="bg-slate-50">
                          <tr>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">الصنف / الخدمة</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">السعر (د.ل)</th>
                             <th className="px-8 py-5 w-20"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {currentInv.lineItems?.map((item) => (
                             <tr key={item.id}>
                                <td className="px-8 py-4"><input type="text" readOnly={isReadOnly && !isUnitHead} value={item.itemName} onChange={(e) => {
                                   const lines = currentInv.lineItems.map(l => l.id === item.id ? { ...l, itemName: e.target.value } : l);
                                   handleUpdateInvoice({ lineItems: lines });
                                }} className="w-full bg-transparent border-none outline-none font-bold" /></td>
                                <td className="px-8 py-4"><input type="number" readOnly={isReadOnly && !isUnitHead} value={item.price} onChange={(e) => {
                                   const lines = currentInv.lineItems.map(l => l.id === item.id ? { ...l, price: Number(e.target.value) } : l);
                                   handleUpdateInvoice({ lineItems: lines });
                                }} className="w-full bg-transparent border-none outline-none font-black text-center text-litcBlue" /></td>
                                <td className="px-8 py-4 text-center">
                                   {!isReadOnly && (
                                      <button onClick={() => handleUpdateInvoice({ lineItems: currentInv.lineItems.filter(l => l.id !== item.id) })} className="text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 {!isReadOnly && (
                    <button onClick={() => handleUpdateInvoice({ lineItems: [...(currentInv.lineItems || []), { id: Math.random().toString(), itemName: '', price: 0, serviceType: 'خدمة عامة' }] })} className="text-litcBlue font-black text-xs flex items-center gap-2 px-4 hover:text-litcOrange transition-colors">
                       <PlusCircle className="w-4.5 h-4.5" /> إضافة بند يدوي
                    </button>
                  )}
              </div>

              {/* قرار المدقق الإلزامي للفاتورة */}
              <div className="mt-12 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                 <h4 className="font-black text-slate-900 flex items-center gap-3"><ShieldCheck className="text-litcBlue w-5 h-5" /> القرار الفني لهذه الفاتورة</h4>
                 <div className="flex gap-4">
                    <button 
                      disabled={isReadOnly && !isUnitHead}
                       onClick={() => setDecision(currentInv.id, 'VALID')} 
                      className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${invoiceDecisions[currentInv.id]?.status === 'VALID' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200'}`}
                    >
                       <CheckCircle2 className="w-8 h-8" />
                       <span className="font-black text-sm">سليمة 100%</span>
                    </button>
                    <button 
                      disabled={isReadOnly && !isUnitHead}
                       onClick={() => setDecision(currentInv.id, 'ERROR')} 
                      className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${invoiceDecisions[currentInv.id]?.status === 'ERROR' ? 'bg-rose-500 text-white border-rose-500 shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200'}`}
                    >
                       <AlertTriangle className="w-8 h-8" />
                       <span className="font-black text-sm">تحتوي أخطاء</span>
                    </button>
                 </div>
                 
                 <div className="relative">
                    <MessageSquare className="absolute right-6 top-6 text-slate-300 w-5 h-5" />
                    <textarea 
                       readOnly={isReadOnly && !isUnitHead}
                        placeholder="اذكر ملاحظاتك الفنية هنا (إلزامي في حال وجود خطأ)..."
                       value={invoiceDecisions[currentInv.id]?.comment || ''}
                       onChange={(e) => setDecisionComment(currentInv.id, e.target.value)}
                       className="w-full min-h-[120px] bg-white border border-slate-200 rounded-[2rem] p-6 pr-16 font-bold text-sm outline-none focus:border-litcBlue transition-all shadow-inner"
                    />
                 </div>
              </div>
           </section>

            {/* Summary & Actions Bar */}
            <div className="bg-litcDark rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-12 text-white shadow-2xl relative overflow-hidden group max-w-md mx-auto lg:max-w-none">
               <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 text-right">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-200/60 mb-1">إجمالي الفواتير</p>
                      <p className="text-2xl sm:text-3xl font-black">{totalOriginal.toLocaleString()} <span className="text-xs opacity-50">د.ل</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60 mb-1">حصة الشركة</p>
                      <p className="text-2xl sm:text-3xl font-black text-emerald-400">{totalCompany.toLocaleString()} <span className="text-xs opacity-50">د.ل</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/60 mb-1">حصة الموظف</p>
                      <p className="text-2xl sm:text-3xl font-black text-amber-400">{totalEmployee.toLocaleString()} <span className="text-xs opacity-50">د.ل</span></p>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                   {isUnitHead ? (
                     <>
                       <button 
                         onClick={handleUnitHeadReturn}
                         className="px-8 py-4 rounded-2xl bg-rose-500 text-white font-black text-sm hover:bg-rose-600 transition-all flex items-center gap-2 justify-center"
                       >
                         <AlertTriangle className="w-5 h-5" /> إعادة للتصحيح
                       </button>
                       <button 
                         onClick={handleUnitHeadApprove}
                         className="px-12 py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 justify-center shadow-lg shadow-emerald-500/20"
                       >
                         <CheckCircle2 className="w-5 h-5" /> اعتماد نهائي وإغلاق
                       </button>
                     </>
                   ) : (
                     !isReadOnly && (
                       <button 
                         onClick={handleFinalSubmit} 
                         disabled={!isAllDecided}
                         className={`px-12 py-5 rounded-[2rem] font-black text-sm sm:text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${!isAllDecided ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-litcOrange text-white hover:bg-orange-600 active:scale-95 shadow-orange-500/30'}`}
                       >
                          <Send className="w-5 h-5 sm:w-6 sm:h-6" /> تحويل النتائج لرئيس الوحدة
                       </button>
                     )
                   )}
                 </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
