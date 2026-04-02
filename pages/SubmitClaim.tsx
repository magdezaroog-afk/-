
import React, { useState, useRef } from 'react';
import { User, Invoice, ClaimStatus } from '../types';
import { 
  Upload, Plus, Trash2, Camera, Loader2, 
  X, Sparkles, CheckCircle, FileStack, AlertCircle, Coins,
  HeartPulse, MapPin, Building2, Briefcase, Calendar, Hash, Edit3
} from 'lucide-react';
import { performOCR } from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';

interface SubmitClaimProps {
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const EXCHANGE_RATES: Record<string, number> = {
  'LYD': 1.0,
  'USD': 4.82,
  'EUR': 5.21,
  'TND': 1.54,
};

const SubmitClaim: React.FC<SubmitClaimProps> = ({ user, onSubmit, onCancel }) => {
  const [invoices, setInvoices] = useState<Partial<Invoice>[]>([]);
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
    newItems.forEach(item => processFile(item.file as File, item.id));
  };

  const processFile = async (file: File, queueId: string) => {
    setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'processing', progress: 20 } : item));
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let base64 = (reader.result as string).split(',')[1];
        base64 = await optimizeImage(base64, 1024, 0.7);
        
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, progress: 50 } : item));
        const ocr = await performOCR(base64);
        const currency = (ocr.currency || 'LYD').toUpperCase();
        const rate = EXCHANGE_RATES[currency] || 1.0;
        const amountInForeign = ocr.totalAmount || 0;
        const totalInLYD = amountInForeign * rate;
        const invoiceDate = ocr.date || new Date().toISOString().split('T')[0];

        // Fiscal Year Lock Logic
        const today = new Date();
        const invDate = new Date(invoiceDate);
        const currentYear = today.getFullYear();
        const invYear = invDate.getFullYear();
        
        let isRejected = false;
        let rejectReason = '';

        if (invYear < currentYear) {
          const march31 = new Date(currentYear, 2, 31); // Month is 0-indexed
          if (today > march31) {
            isRejected = true;
            rejectReason = 'تجاوز الموعد النهائي (31 مارس) لفواتير العام السابق.';
          }
        }

        const newInvoice: Partial<Invoice> = {
          id: `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          imageUrl: `data:image/jpeg;base64,${base64}`,
          hospitalName: ocr.hospitalName || 'مصحة غير محددة',
          invoiceNumber: ocr.invoiceNumber || '',
          amount: amountInForeign,
          currency: currency as any,
          exchangeRate: rate,
          originalAmountInLYD: totalInLYD,
          companyPortion: totalInLYD * 0.9,
          employeePortion: totalInLYD * 0.1,
          netAmountLYD: totalInLYD * 0.9,
          date: invoiceDate,
          lineItems: [],
          status: isRejected ? ClaimStatus.REJECTED : ClaimStatus.PENDING_DR,
          ocrData: isRejected ? { rejectReason } : {}
        };

        setInvoices(prev => [...prev, newInvoice]);
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'done', progress: 100 } : item));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'error' } : item));
    }
  };

  const updateInvoiceField = (id: string, field: keyof Invoice, value: any) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const updatedInv = { ...inv, [field]: value };
        
        // Re-evaluate fiscal year lock if date is changed
        if (field === 'date') {
          const today = new Date();
          const invDate = new Date(value);
          const currentYear = today.getFullYear();
          const invYear = invDate.getFullYear();
          
          let isRejected = false;
          let rejectReason = '';

          if (invYear < currentYear) {
            const march31 = new Date(currentYear, 2, 31);
            if (today > march31) {
              isRejected = true;
              rejectReason = 'تجاوز الموعد النهائي (31 مارس) لفواتير العام السابق.';
            }
          }

          updatedInv.status = isRejected ? ClaimStatus.REJECTED : ClaimStatus.PENDING_DR;
          updatedInv.ocrData = isRejected 
            ? { ...updatedInv.ocrData, rejectReason } 
            : { ...updatedInv.ocrData, rejectReason: undefined };
        }

        // Recalculate if amount or currency changes
        if (field === 'amount' || field === 'currency') {
          const rate = EXCHANGE_RATES[updatedInv.currency as string] || 1.0;
          updatedInv.exchangeRate = rate;
          updatedInv.originalAmountInLYD = (updatedInv.amount || 0) * rate;
          updatedInv.companyPortion = updatedInv.originalAmountInLYD * 0.9;
          updatedInv.employeePortion = updatedInv.originalAmountInLYD * 0.1;
          updatedInv.netAmountLYD = updatedInv.companyPortion;
        }
        
        return updatedInv;
      }
      return inv;
    }));
  };

  const handleSubmit = () => {
    if (invoices.length === 0) {
      alert("يرجى رفع فاتورة واحدة على الأقل.");
      return;
    }
    
    const hasRejected = invoices.some(inv => inv.status === ClaimStatus.REJECTED);
    if (hasRejected) {
      if (!window.confirm("تحتوي المطالبة على فواتير مرفوضة آلياً. هل تريد الاستمرار؟ سيتم استبعاد الفواتير المرفوضة من الحساب النهائي.")) {
        return;
      }
    }

    setIsSubmitting(true);
    const validInvoices = invoices.filter(inv => inv.status !== ClaimStatus.REJECTED);
    const totalLYD = validInvoices.reduce((sum, inv) => sum + (inv.originalAmountInLYD || 0), 0);
    const companyTotal = validInvoices.reduce((sum, inv) => sum + (inv.companyPortion || 0), 0);
    
    onSubmit({ 
      invoices: validInvoices, 
      totalAmount: totalLYD, 
      companyTotal,
      description,
      submittedAt: new Date().toISOString(),
      isPool: true
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 font-cairo pb-20 px-4 sm:px-0" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
        <div className="text-center md:text-right">
          <h1 className="text-xl sm:text-4xl font-black text-litcBlue tracking-tight flex items-center justify-center md:justify-start gap-2 sm:gap-4">
             <FileStack className="text-litcOrange w-8 h-8 sm:w-10 sm:h-10" /> معاملة علاجية جديدة
          </h1>
          <p className="text-[9px] sm:text-sm font-bold text-slate-500 mt-1 sm:mt-2">نظام المعالجة الذكية التابع لشركة LITC | استخراج البيانات آلياً.</p>
        </div>
        <button onClick={onCancel} className="p-2 sm:p-5 bg-white rounded-lg sm:rounded-2xl border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
          <X className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        <div className="lg:col-span-7 space-y-8 sm:space-y-10">
           <section className="bg-white p-6 sm:p-16 rounded-[2rem] sm:rounded-[4.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center group hover:border-litcBlue transition-all cursor-pointer relative overflow-hidden shadow-sm max-w-md mx-auto sm:max-w-none" onClick={() => fileInputRef.current?.click()}>
              <div className="absolute inset-0 bg-litcBlue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center text-slate-300 mb-6 sm:mb-8 group-hover:bg-litcBlue group-hover:text-white transition-all shadow-inner group-hover:scale-110 duration-500">
                 <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 mb-2">اضغط هنا لإدراج فواتيرك</h3>
              <p className="text-[10px] sm:text-sm font-bold text-slate-400 max-w-[240px] sm:max-w-[280px]">يمكنك اختيار صور متعددة من هاتفك أو جهازك وسيقوم النظام بتفصيلها.</p>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
           </section>

           <div className="space-y-4 sm:space-y-6">
              {uploadQueue.filter(q => q.status !== 'done').map(item => (
                <div key={item.id} className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 flex items-center justify-between animate-in slide-in-from-right-4 shadow-sm max-w-md mx-auto sm:max-w-none">
                   <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-litcBlue">
                         {item.status === 'processing' ? <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" /> : <Camera className="w-6 h-6 sm:w-7 sm:h-7" />}
                      </div>
                      <div className="flex-1 min-w-[180px] sm:min-w-[240px]">
                         <p className="text-[10px] sm:text-sm font-black text-litcBlue">محرك الذكاء الاصطناعي يقوم بالتحليل...</p>
                         <div className="w-full h-2 bg-slate-100 rounded-full mt-2 sm:mt-3 overflow-hidden">
                            <div className="h-full bg-litcOrange transition-all duration-700 ease-out" style={{ width: `${item.progress}%` }}></div>
                         </div>
                      </div>
                   </div>
                </div>
              ))}

              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-xl flex flex-col gap-6 group hover:border-litcBlue transition-all animate-in zoom-in text-right max-w-md mx-auto sm:max-w-none relative">
                   {inv.status === ClaimStatus.REJECTED && (
                     <div className="absolute top-6 left-6 bg-rose-500 text-white px-4 py-6 rounded-3xl text-[10px] font-black z-20 shadow-xl animate-in zoom-in max-w-[200px] text-center border-4 border-white">
                       <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                       <p className="mb-2">مرفوضة آلياً: {inv.ocrData?.rejectReason}</p>
                       <p className="text-[8px] opacity-80 bg-black/10 p-2 rounded-lg leading-relaxed">إذا كان التاريخ المقروء خاطئاً، يرجى تصحيحه يدوياً أدناه.</p>
                     </div>
                   )}
                   
                   <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
                      <div className="relative shrink-0 mx-auto sm:mx-0">
                        <img src={inv.imageUrl} className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] sm:rounded-[3rem] object-cover border-4 border-slate-50 shadow-md" />
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                      </div>
                      
                      <div className="flex-1 space-y-6 w-full">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> اسم المصحة</label>
                               <input 
                                 type="text" 
                                 value={inv.hospitalName} 
                                 onChange={(e) => updateInvoiceField(inv.id!, 'hospitalName', e.target.value)}
                                 className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-litcBlue"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Hash className="w-3 h-3" /> رقم الفاتورة</label>
                               <input 
                                 type="text" 
                                 value={inv.invoiceNumber} 
                                 onChange={(e) => updateInvoiceField(inv.id!, 'invoiceNumber', e.target.value)}
                                 className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-litcBlue"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> التاريخ</label>
                               <input 
                                 type="date" 
                                 value={inv.date} 
                                 onChange={(e) => updateInvoiceField(inv.id!, 'date', e.target.value)}
                                 className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-litcBlue"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 flex items-center gap-1"><Coins className="w-3 h-3" /> القيمة والعملة</label>
                               <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    value={inv.amount} 
                                    onChange={(e) => updateInvoiceField(inv.id!, 'amount', Number(e.target.value))}
                                    className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-black focus:ring-2 focus:ring-litcBlue"
                                  />
                                  <select 
                                    value={inv.currency}
                                    onChange={(e) => updateInvoiceField(inv.id!, 'currency', e.target.value)}
                                    className="bg-slate-50 border-none rounded-xl p-3 text-[10px] font-black focus:ring-2 focus:ring-litcBlue"
                                  >
                                    {Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                               </div>
                            </div>
                         </div>

                         <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
                            <div className="bg-litcBlue/5 px-4 py-2 rounded-xl border border-litcBlue/10">
                               <p className="text-[8px] font-black text-slate-400 uppercase">القيمة بالدينار</p>
                               <p className="text-sm font-black text-litcBlue">{inv.originalAmountInLYD?.toFixed(2)} د.ل</p>
                            </div>
                            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                               <p className="text-[8px] font-black text-emerald-600 uppercase">حصة الشركة (90%)</p>
                               <p className="text-sm font-black text-emerald-700">{inv.companyPortion?.toFixed(2)} د.ل</p>
                            </div>
                            <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                               <p className="text-[8px] font-black text-amber-600 uppercase">حصة الموظف (10%)</p>
                               <p className="text-sm font-black text-amber-700">{inv.employeePortion?.toFixed(2)} د.ل</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <button onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))} className="absolute bottom-6 left-6 w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95">
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-5 space-y-6 sm:space-y-10">
           <section className="litc-gradient text-white p-6 sm:p-12 rounded-[1.5rem] sm:rounded-[4.5rem] shadow-2xl relative overflow-hidden border border-white/10 group max-w-md mx-auto lg:max-w-none">
              <div className="absolute top-0 right-0 w-48 h-48 bg-litcOrange opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-lg sm:text-2xl font-black mb-6 sm:mb-10 flex items-center gap-3 sm:gap-4"><Sparkles className="text-litcOrange animate-pulse w-5 h-5 sm:w-6 sm:h-6" /> ملخص المطالبة</h3>
              
              <div className="space-y-4 sm:space-y-8 relative z-10">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1 px-2 flex items-center gap-1"><MapPin className="w-2 h-2" /> الموقع</label>
                      <p className="font-bold text-xs sm:text-sm text-white">{user.location || 'غير محدد'}</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1 px-2 flex items-center gap-1"><Briefcase className="w-2 h-2" /> الإدارة</label>
                      <p className="font-bold text-xs sm:text-sm text-white">{user.department || 'غير محدد'}</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 sm:col-span-2">
                      <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1 px-2 flex items-center gap-1"><Building2 className="w-2 h-2" /> المبنى والوظيفة</label>
                      <p className="font-bold text-xs sm:text-sm text-white">{user.building || '-'} | {user.jobTitle || '-'}</p>
                    </div>
                 </div>

                 <div>
                    <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1.5 sm:mb-2 px-2">وصف الحالة</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: كشف طبي عام وصيدلية..." className="w-full bg-white/10 border border-white/20 rounded-[1.2rem] sm:rounded-[2.5rem] p-4 sm:p-8 font-bold text-[10px] sm:text-sm min-h-[80px] sm:min-h-[140px] focus:outline-none focus:bg-white/20 transition-all shadow-inner" />
                 </div>
                 
                 <div className="pt-4 sm:pt-8 border-t border-white/10 flex flex-col items-center">
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1 sm:mb-2">إجمالي المطالب به</p>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <p className="text-3xl sm:text-6xl font-black text-white">{invoices.reduce((s, i) => s + (i.originalAmountInLYD || 0), 0).toLocaleString()}</p>
                      <span className="text-xs sm:text-lg font-black text-litcOrange uppercase tracking-widest">د.ل</span>
                    </div>
                 </div>

                 <button 
                    onClick={handleSubmit}
                    disabled={invoices.length === 0 || isSubmitting}
                    className="w-full bg-white text-litcBlue py-4 sm:py-6 rounded-[1.2rem] sm:rounded-[2.5rem] font-black text-xs sm:text-lg shadow-2xl hover:bg-litcOrange hover:text-white transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2 sm:gap-4 group"
                 >
                    {isSubmitting ? <Loader2 className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 animate-spin" /> : (
                      <>
                        <HeartPulse className="group-hover:animate-pulse transition-colors w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
                        تأكيد المعاملة الطبية
                      </>
                    )}
                 </button>
              </div>
           </section>

           <div className="bg-white p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[3.5rem] border border-slate-100 flex items-start gap-3 sm:gap-6 shadow-sm max-w-md mx-auto lg:max-w-none">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-orange-50 text-litcOrange rounded-xl sm:rounded-[1.8rem] flex items-center justify-center shrink-0 border border-orange-100"><AlertCircle className="w-5 h-5 sm:w-7 sm:h-7" /></div>
              <div>
                 <p className="text-sm sm:text-lg font-black text-litcBlue">مراجعة دقيقة</p>
                 <p className="text-[9px] sm:text-sm font-bold text-slate-400 mt-0.5 sm:mt-1 leading-relaxed">يرجى مراجعة المبالغ المستخرجة قبل الضغط على تأكيد لضمان دقة المعالجة المالية.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitClaim;
