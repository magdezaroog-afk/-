
import React, { useState, useRef } from 'react';
import { User, Invoice, ClaimStatus } from '../types';
import { 
  Upload, Plus, Trash2, Camera, Loader2, 
  X, Sparkles, CheckCircle, FileStack, AlertCircle, Coins,
  MapPin, Building, HeartPulse
} from 'lucide-react';
import { performOCR } from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';

interface SubmitClaimProps {
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const LOCATIONS = ["كم4", "مبنى الشط", "مبنى السياحية", "محطة تاجوراء", "محطة درنة", "محطة مصراته", "شارع الزاوية"];
const DEPARTMENTS = [
  "مكتب المدير العام", "مكتب مجلس الادارة", "الادارة التجارية", "الادارة المالية", 
  "ادارة تقنية المعلومات", "ادارة الموارد البشرية", "ادارة المشتريات والخدمات", 
  "مكتب المستشارين", "الادارة الفنية", "مكتب المراجعة الداخلية", 
  "مكتب الامن السيبراني", "مكتب الجودة", "ادارة المخاطر"
];

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
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
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
    if (invoices.length === 0 || !location || !department) {
      alert("يرجى اختيار الموقع والإدارة ورفع فاتورة واحدة على الأقل.");
      return;
    }
    setIsSubmitting(true);
    const totalLYD = invoices.reduce((sum, inv) => sum + (inv.originalAmountInLYD || 0), 0);
    onSubmit({ invoices, totalAmount: totalLYD, description, location, department });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 font-cairo pb-20" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-litcBlue tracking-tight flex items-center gap-4">
             <FileStack className="text-litcOrange" size={40} /> معاملة علاجية جديدة
          </h1>
          <p className="text-slate-500 font-bold mt-2">نظام المعالجة الذكية التابع لشركة LITC | استخراج البيانات آلياً.</p>
        </div>
        <button onClick={onCancel} className="p-5 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
          <X size={28} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-10">
           <section className="bg-white p-16 rounded-[4.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center group hover:border-litcBlue transition-all cursor-pointer relative overflow-hidden shadow-sm" onClick={() => fileInputRef.current?.click()}>
              <div className="absolute inset-0 bg-litcBlue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-300 mb-8 group-hover:bg-litcBlue group-hover:text-white transition-all shadow-inner group-hover:scale-110 duration-500">
                 <Upload size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">اضغط هنا لإدراج فواتيرك</h3>
              <p className="text-sm font-bold text-slate-400 max-w-[280px]">يمكنك اختيار صور متعددة من هاتفك أو جهازك وسيقوم النظام بتفصيلها.</p>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
           </section>

           <div className="space-y-6">
              {uploadQueue.filter(q => q.status !== 'done').map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between animate-in slide-in-from-right-4 shadow-sm">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-litcBlue">
                         {item.status === 'processing' ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
                      </div>
                      <div className="flex-1 min-w-[240px]">
                         <p className="text-sm font-black text-litcBlue">محرك الذكاء الاصطناعي يقوم بالتحليل...</p>
                         <div className="w-full h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-litcOrange transition-all duration-700 ease-out" style={{ width: `${item.progress}%` }}></div>
                         </div>
                      </div>
                   </div>
                </div>
              ))}

              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-litcBlue transition-all animate-in zoom-in">
                   <div className="flex items-center gap-8">
                      <div className="relative">
                        <img src={inv.imageUrl} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-slate-50 shadow-md" />
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg"><CheckCircle size={14} /></div>
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-litcBlue">{inv.hospitalName}</h4>
                         <p className="text-xs font-bold text-slate-400 mt-1">المستند رقم: {inv.invoiceNumber}</p>
                         <div className="flex gap-4 mt-4">
                            <span className="text-[11px] bg-slate-100 text-slate-900 px-4 py-1.5 rounded-xl font-black border border-slate-200">{inv.amount} {inv.currency}</span>
                            {inv.currency !== 'LYD' && (
                              <span className="text-[11px] bg-litcOrange/10 text-litcOrange px-4 py-1.5 rounded-xl font-black flex items-center gap-2 border border-litcOrange/20 shadow-sm shadow-orange-100">
                                <Coins size={14} /> {inv.originalAmountInLYD?.toFixed(2)} د.ل
                              </span>
                            )}
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setInvoices(prev => prev.filter(i => i.id !== inv.id))} className="w-16 h-16 rounded-[1.8rem] bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group-hover:shadow-lg active:scale-95">
                      <Trash2 size={24} />
                   </button>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-5 space-y-10">
           <section className="litc-gradient text-white p-12 rounded-[4.5rem] shadow-2xl relative overflow-hidden border border-white/10 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-litcOrange opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Sparkles size={28} className="text-litcOrange animate-pulse" /> ملخص المطالبة</h3>
              
              <div className="space-y-8 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-blue-200 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                       <MapPin size={14} className="text-litcOrange" /> الموقع التنظيمي
                    </label>
                    <select 
                       value={location} 
                       onChange={(e) => setLocation(e.target.value)}
                       className="w-full bg-white/10 border border-white/20 rounded-[2rem] px-8 py-5 font-black text-sm outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                    >
                       <option value="" className="text-litcDark">اختر الفرع...</option>
                       {LOCATIONS.map(loc => <option key={loc} value={loc} className="text-litcDark">{loc}</option>)}
                    </select>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-blue-200 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                       <Building size={14} className="text-litcOrange" /> الإدارة / القسم
                    </label>
                    <select 
                       value={department} 
                       onChange={(e) => setDepartment(e.target.value)}
                       className="w-full bg-white/10 border border-white/20 rounded-[2rem] px-8 py-5 font-black text-sm outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer"
                    >
                       <option value="" className="text-litcDark">اختر الإدارة...</option>
                       {DEPARTMENTS.map(dept => <option key={dept} value={dept} className="text-litcDark">{dept}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="text-[11px] font-black text-blue-200 uppercase tracking-[0.3em] block mb-3 px-2">وصف الحالة</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: كشف طبي عام وصيدلية..." className="w-full bg-white/10 border border-white/20 rounded-[2.5rem] p-8 font-bold text-sm min-h-[140px] focus:outline-none focus:bg-white/20 transition-all shadow-inner" />
                 </div>
                 
                 <div className="pt-8 border-t border-white/10 flex flex-col items-center">
                    <p className="text-[11px] font-black text-blue-200 uppercase tracking-[0.4em] mb-2">إجمالي المطالب به</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-6xl font-black text-white">{invoices.reduce((s, i) => s + (i.originalAmountInLYD || 0), 0).toLocaleString()}</p>
                      <span className="text-lg font-black text-litcOrange uppercase tracking-widest">د.ل</span>
                    </div>
                 </div>

                 <button 
                    onClick={handleSubmit}
                    disabled={invoices.length === 0 || isSubmitting || !location || !department}
                    className="w-full bg-white text-litcBlue py-6 rounded-[2.5rem] font-black text-lg shadow-2xl hover:bg-litcOrange hover:text-white transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 group"
                 >
                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : (
                      <>
                        <HeartPulse size={24} className="group-hover:animate-pulse transition-colors" />
                        تأكيد المعاملة الطبية
                      </>
                    )}
                 </button>
              </div>
           </section>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 flex items-start gap-6 shadow-sm">
              <div className="w-16 h-16 bg-orange-50 text-litcOrange rounded-[1.8rem] flex items-center justify-center shrink-0 border border-orange-100"><AlertCircle size={32} /></div>
              <div>
                 <p className="text-lg font-black text-litcBlue">مراجعة دقيقة</p>
                 <p className="text-sm font-bold text-slate-400 mt-1 leading-relaxed">يرجى مراجعة المبالغ المستخرجة قبل الضغط على تأكيد لضمان دقة المعالجة المالية.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitClaim;
