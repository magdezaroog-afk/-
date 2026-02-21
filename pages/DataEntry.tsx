
import React, { useState, useMemo } from 'react';
import { Claim, Invoice, InvoiceLineItem, User, ClaimStatus } from '../types';
import { analyzeInvoiceDetailed } from '../services/geminiService';
import { 
  ArrowRight, Sparkles, Loader2, Activity,
  Maximize2, Building2, PlusCircle, 
  Trash2, Hash, Calculator, CheckCircle2, Send,
  X, ShieldCheck, Edit3, Check, Clock, AlertTriangle, MessageSquare
} from 'lucide-react';

interface DataEntryProps {
  claim: Claim;
  user: User;
  onSave: (updatedInvoices: Invoice[]) => void;
  onBack: () => void;
}

const DataEntry: React.FC<DataEntryProps> = ({ claim, user, onSave, onBack }) => {
  const assignedInvoices = useMemo(() => 
    claim.invoices.filter(inv => inv.assignedToId === user.id || !inv.assignedToId), 
    [claim.invoices, user.id]
  );

  const [editingInvoices, setEditingInvoices] = useState<Invoice[]>(assignedInvoices);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  
  // تتبع القرارات الفنية لكل فاتورة
  const [invoiceDecisions, setInvoiceDecisions] = useState<Record<string, { status: 'VALID' | 'ERROR', comment: string }>>({});

  const currentInv = editingInvoices[activeIndex];

  const handleUpdateInvoice = (updates: Partial<Invoice>) => {
    setEditingInvoices(prev => prev.map((inv, idx) => {
      if (idx === activeIndex) {
        return { ...inv, ...updates };
      }
      return inv;
    }));
  };

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
      // نقوم بتضمين قرار المدقق في حالة الفاتورة المؤقتة
      status: invoiceDecisions[inv.id].status === 'VALID' ? ClaimStatus.APPROVED : ClaimStatus.RETURNED_TO_EMPLOYEE,
      ocrData: { ...inv.ocrData, auditorComment: invoiceDecisions[inv.id].comment }
    }));
    onSave(finalInvoices);
  };

  return (
    <div className="max-w-full mx-auto pb-32 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {showFullImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-3xl flex items-center justify-center p-12" onClick={() => setShowFullImage(false)}>
          <img src={currentInv.imageUrl} className="max-w-full max-h-full object-contain rounded-3xl" alt="Full" />
          <button className="absolute top-10 right-10 text-white"><X size={40} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-10 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-slate-50 rounded-2xl hover:bg-litcBlue hover:text-white transition-all shadow-inner"><ArrowRight size={24} /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">المعالجة الفنية للفواتير</h1>
            <p className="text-slate-500 font-bold text-sm">أنت تقوم الآن بتدقيق فواتير الموظف: {claim.employeeName}</p>
          </div>
        </div>
        <div className="flex -space-x-3 space-x-reverse">
          {editingInvoices.map((inv, i) => (
            <button 
              key={inv.id} 
              onClick={() => setActiveIndex(i)}
              className={`w-14 h-14 rounded-2xl font-black transition-all border-4 border-white shadow-lg relative ${activeIndex === i ? 'bg-litcBlue text-white scale-110 z-10' : 'bg-slate-100 text-slate-400'} ${invoiceDecisions[inv.id]?.status === 'VALID' ? 'border-emerald-500' : invoiceDecisions[inv.id]?.status === 'ERROR' ? 'border-rose-500' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
           <div className="bg-slate-900 rounded-[4rem] p-5 h-[750px] sticky top-6 flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden group">
              <img src={currentInv.imageUrl} className="max-w-full max-h-full object-contain rounded-2xl cursor-zoom-in transition-transform group-hover:scale-105" onClick={() => setShowFullImage(true)} />
              <button onClick={() => setShowFullImage(true)} className="absolute bottom-10 left-10 p-5 bg-white/10 hover:bg-litcOrange text-white rounded-[1.8rem] backdrop-blur-xl shadow-2xl transition-all">
                <Maximize2 size={24} />
              </button>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                 <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><Edit3 size={32} className="text-litcBlue" /> تفاصيل البنود والأسعار</h3>
                 <button onClick={handleAutoAnalyze} disabled={isAnalyzing} className="w-full md:w-auto flex items-center justify-center gap-3 bg-litcOrange text-white px-8 py-5 rounded-[2rem] text-sm font-black hover:bg-orange-600 transition-all shadow-xl">
                    {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />} التحليل الآلي للبنود
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">اسم الجهة</label>
                    <div className="relative">
                      <Building2 className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input type="text" value={currentInv.hospitalName} onChange={(e) => handleUpdateInvoice({ hospitalName: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-litcBlue transition-all" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">رقم الفاتورة</label>
                    <div className="relative">
                      <Hash className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input type="text" value={currentInv.invoiceNumber} onChange={(e) => handleUpdateInvoice({ invoiceNumber: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 pr-16 font-black outline-none focus:border-litcBlue transition-all" />
                    </div>
                 </div>
              </div>

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
                                <td className="px-8 py-4"><input type="text" value={item.itemName} onChange={(e) => {
                                   const lines = currentInv.lineItems.map(l => l.id === item.id ? { ...l, itemName: e.target.value } : l);
                                   handleUpdateInvoice({ lineItems: lines });
                                }} className="w-full bg-transparent border-none outline-none font-bold" /></td>
                                <td className="px-8 py-4"><input type="number" value={item.price} onChange={(e) => {
                                   const lines = currentInv.lineItems.map(l => l.id === item.id ? { ...l, price: Number(e.target.value) } : l);
                                   handleUpdateInvoice({ lineItems: lines });
                                }} className="w-full bg-transparent border-none outline-none font-black text-center text-litcBlue" /></td>
                                <td className="px-8 py-4 text-center">
                                   <button onClick={() => handleUpdateInvoice({ lineItems: currentInv.lineItems.filter(l => l.id !== item.id) })} className="text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 <button onClick={() => handleUpdateInvoice({ lineItems: [...(currentInv.lineItems || []), { id: Math.random().toString(), itemName: '', price: 0, serviceType: 'خدمة عامة' }] })} className="text-litcBlue font-black text-xs flex items-center gap-2 px-4 hover:text-litcOrange transition-colors">
                    <PlusCircle size={18} /> إضافة بند يدوي
                 </button>
              </div>

              {/* قرار المدقق الإلزامي للفاتورة */}
              <div className="mt-12 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                 <h4 className="font-black text-slate-900 flex items-center gap-3"><ShieldCheck className="text-litcBlue" /> القرار الفني لهذه الفاتورة</h4>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setDecision(currentInv.id, 'VALID')} 
                      className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${invoiceDecisions[currentInv.id]?.status === 'VALID' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200'}`}
                    >
                       <CheckCircle2 size={32} />
                       <span className="font-black text-sm">سليمة 100%</span>
                    </button>
                    <button 
                      onClick={() => setDecision(currentInv.id, 'ERROR')} 
                      className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${invoiceDecisions[currentInv.id]?.status === 'ERROR' ? 'bg-rose-500 text-white border-rose-500 shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200'}`}
                    >
                       <AlertTriangle size={32} />
                       <span className="font-black text-sm">تحتوي أخطاء</span>
                    </button>
                 </div>
                 
                 <div className="relative">
                    <MessageSquare className="absolute right-6 top-6 text-slate-300" size={20} />
                    <textarea 
                       placeholder="اذكر ملاحظاتك الفنية هنا (إلزامي في حال وجود خطأ)..."
                       value={invoiceDecisions[currentInv.id]?.comment || ''}
                       onChange={(e) => setDecisionComment(currentInv.id, e.target.value)}
                       className="w-full min-h-[120px] bg-white border border-slate-200 rounded-[2rem] p-6 pr-16 font-bold text-sm outline-none focus:border-litcBlue transition-all shadow-inner"
                    />
                 </div>
              </div>
           </section>

           <div className="bg-litcDark rounded-[4rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-200/60 mb-2">إجمالي المطالبة الصافي</p>
                 <p className="text-6xl font-black text-white">{editingInvoices.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()} <span className="text-2xl opacity-50">د.ل</span></p>
              </div>
              <button 
                onClick={handleFinalSubmit} 
                disabled={!isAllDecided}
                className={`w-full md:w-auto px-16 py-7 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 ${!isAllDecided ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-litcOrange text-white hover:bg-orange-600 active:scale-95 shadow-orange-500/30'}`}
              >
                 <Send size={28} /> تحويل النتائج لرئيس الوحدة
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
