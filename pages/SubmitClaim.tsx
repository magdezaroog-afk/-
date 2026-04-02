
import React, { useState, useRef } from 'react';
import { User, Invoice, ClaimStatus } from '../types';
import { 
  Upload, Plus, Trash2, Camera, Loader2, 
  X, Sparkles, CheckCircle, FileStack, AlertCircle, Coins,
  HeartPulse
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
  const [location, setLocation] = useState('طرابلس');
  const [department, setDepartment] = useState('الإدارة العامة');
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

        const newInvoice: Partial<Invoice> = {
          id: `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          imageUrl: reader.result as string,
          hospitalName: ocr.hospitalName || 'مصحة غير محددة',
          invoiceNumber: ocr.invoiceNumber || '',
          amount: amountInForeign,
          currency: currency as any,
          exchangeRate: rate,
          originalAmountInLYD: totalInLYD,
          netAmountLYD: totalInLYD * 0.9,
          date: ocr.date || new Date().toISOString().split('T')[0],
          lineItems: [],
          status: ClaimStatus.PENDING_DR
        };

        setInvoices(prev => [...prev, newInvoice]);
        setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'done', progress: 100 } : item));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadQueue(prev => prev.map(item => item.id === queueId ? { ...item, status: 'error' } : item));
    }
  };

  const handleSubmit = () => {
    if (invoices.length === 0) {
      alert("يرجى رفع فاتورة واحدة على الأقل.");
      return;
    }
    setIsSubmitting(true);
    const totalLYD = invoices.reduce((sum, inv) => sum + (inv.originalAmountInLYD || 0), 0);
    onSubmit({ invoices, totalAmount: totalLYD, description, location, department });
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
                <div key={inv.id} className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 group hover:border-litcBlue transition-all animate-in zoom-in text-center sm:text-right max-w-md mx-auto sm:max-w-none">
                   <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                      <div className="relative">
                        <img src={inv.imageUrl} className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] object-cover border-4 border-slate-50 shadow-md" />
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-emerald-500 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 sm:border-4 border-white shadow-lg"><CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /></div>
                      </div>
                      <div>
                         <h4 className="text-lg sm:text-xl font-black text-litcBlue">{inv.hospitalName}</h4>
                         <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">المستند رقم: {inv.invoiceNumber}</p>
                         <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mt-3 sm:mt-4">
                            <span className="text-[9px] sm:text-[11px] bg-slate-100 text-slate-900 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl font-black border border-slate-200">{inv.amount} {inv.currency}</span>
                            {inv.currency !== 'LYD' && (
                              <span className="text-[9px] sm:text-[11px] bg-litcOrange/10 text-litcOrange px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl font-black flex items-center gap-1 sm:gap-2 border border-litcOrange/20 shadow-sm shadow-orange-100">
                                <Coins className="w-3 h-3 sm:w-4 sm:h-4" /> {inv.originalAmountInLYD?.toFixed(2)} د.ل
                              </span>
                            )}
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.8rem] bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group-hover:shadow-lg active:scale-95 shrink-0">
                      <Trash2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
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
                    <div>
                      <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1.5 sm:mb-2 px-2">الموقع</label>
                      <select 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-[10px] sm:text-xs focus:outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                      >
                        {['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'سبها', 'الخمس', 'زليتن'].map(loc => (
                          <option key={loc} value={loc} className="text-slate-900">{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1.5 sm:mb-2 px-2">الإدارة</label>
                      <select 
                        value={department} 
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-[10px] sm:text-xs focus:outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                      >
                        {['الإدارة العامة', 'إدارة العمليات', 'إدارة الموارد البشرية', 'إدارة المالية', 'إدارة المبيعات', 'إدارة التقنية'].map(dept => (
                          <option key={dept} value={dept} className="text-slate-900">{dept}</option>
                        ))}
                      </select>
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
