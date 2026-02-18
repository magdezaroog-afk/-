
import React, { useState, useMemo, useEffect } from 'react';
import { Claim, Invoice, InvoiceLineItem, User, ClaimStatus } from '../types';
import { analyzeInvoiceDetailed } from '../services/geminiService';
import { 
  ArrowRight, Sparkles, Loader2, Activity,
  Maximize2, Building2, CreditCard, PlusCircle, 
  Trash2, UserCircle, Calendar, Hash, FileText, CheckCircle2, Send,
  X, Coins, Calculator, AlertCircle, Save, Plus, Edit3
} from 'lucide-react';

interface DataEntryProps {
  claim: Claim;
  user: User;
  onSave: (updatedInvoices: Invoice[]) => void;
  onBack: () => void;
}

const RECIPIENT_TYPES = ["الموظف نفسه", "الزوجة", "الأب", "الأم", "ابن/ابنة"];
const CURRENCIES = ["LYD", "USD", "EUR", "TND"];

const DataEntry: React.FC<DataEntryProps> = ({ claim, user, onSave, onBack }) => {
  const assignedInvoices = useMemo(() => 
    claim.invoices.filter(inv => inv.assignedToId === user.id || !inv.assignedToId), 
    [claim.invoices, user.id]
  );

  const [editingInvoices, setEditingInvoices] = useState<Invoice[]>(assignedInvoices);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const currentInv = editingInvoices[activeIndex];

  const handleUpdateInvoice = (updates: Partial<Invoice>) => {
    setEditingInvoices(prev => prev.map((inv, idx) => {
      if (idx === activeIndex) {
        const newInv = { ...inv, ...updates };
        if (updates.amount !== undefined || updates.exchangeRate !== undefined || updates.currency !== undefined) {
           const rate = newInv.exchangeRate || 1.0;
           newInv.originalAmountInLYD = (newInv.amount || 0) * rate;
           newInv.netAmountLYD = newInv.originalAmountInLYD * 0.9;
        }
        return newInv;
      }
      return inv;
    }));
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Math.random().toString(36).substr(2, 9),
      itemName: '',
      price: 0,
      serviceType: 'خدمات عامة'
    };
    handleUpdateInvoice({ lineItems: [...(currentInv.lineItems || []), newItem] });
  };

  const handleLineItemUpdate = (lineId: string, updates: Partial<InvoiceLineItem>) => {
    const updatedLines = currentInv.lineItems.map(item => 
      item.id === lineId ? { ...item, ...updates } : item
    );
    handleUpdateInvoice({ lineItems: updatedLines });
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
      handleUpdateInvoice({ 
        lineItems,
        hospitalName: items[0]?.hospitalName || currentInv.hospitalName,
        amount: items.reduce((sum: number, i: any) => sum + (i.price || 0), 0) || currentInv.amount
      });
    } catch (err) { console.error(err); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="max-w-full mx-auto pb-32 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {showFullImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-3xl flex items-center justify-center p-12" onClick={() => setShowFullImage(false)}>
          <img src={currentInv.imageUrl} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" alt="Full" />
          <button className="absolute top-10 right-10 text-white"><X size={40} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-10 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all"><ArrowRight size={24} /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">استوديو التدقيق والتحويل الفني</h1>
            <p className="text-slate-500 font-bold text-sm">الموظف: {claim.employeeName} | معاملة: #{claim.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex gap-2">
            {editingInvoices.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveIndex(i)} 
                className={`w-12 h-12 rounded-xl font-black transition-all ${activeIndex === i ? 'bg-litcBlue text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Invoice Visualizer */}
        <div className="lg:col-span-4">
           <div className="bg-slate-900 rounded-[3rem] p-4 h-[700px] sticky top-6 flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden group">
              <img src={currentInv.imageUrl} className="max-w-full max-h-full object-contain rounded-2xl cursor-zoom-in transition-transform duration-500 group-hover:scale-105" onClick={() => setShowFullImage(true)} />
              <button onClick={() => setShowFullImage(true)} className="absolute bottom-10 left-10 p-5 bg-white/10 hover:bg-litcOrange text-white rounded-2xl backdrop-blur-xl shadow-2xl transition-all">
                <Maximize2 size={24} />
              </button>
              <div className="absolute top-10 right-10 bg-litcBlue/90 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">
                فاتورة {activeIndex + 1} من {editingInvoices.length}
              </div>
           </div>
        </div>

        {/* Right: Editable Data Area */}
        <div className="lg:col-span-8 space-y-8">
           <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full blur-3xl"></div>
              
              <div className="flex items-center justify-between mb-10 relative z-10">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Edit3 size={28} className="text-litcBlue" /> تدقيق البيانات الأساسية</h3>
                 <button onClick={handleAutoAnalyze} disabled={isAnalyzing} className="flex items-center gap-3 bg-litcOrange text-white px-8 py-4 rounded-[1.5rem] text-sm font-black hover:bg-orange-600 transition-all shadow-xl orange-glow">
                    {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} تحليل ذكي للبيانات
                 </button>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">اسم الجهة الطبية (المصحة)</label>
                    <div className="relative">
                      <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={currentInv.hospitalName} 
                        onChange={(e) => handleUpdateInvoice({ hospitalName: e.target.value })} 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 pr-14 font-black text-sm outline-none focus:bg-white focus:border-litcBlue/40 transition-all"
                      />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">رقم الفاتورة المرجعي</label>
                    <div className="relative">
                      <Hash className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        value={currentInv.invoiceNumber} 
                        onChange={(e) => handleUpdateInvoice({ invoiceNumber: e.target.value })} 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 pr-14 font-black text-sm outline-none focus:bg-white focus:border-litcBlue/40 transition-all"
                      />
                    </div>
                 </div>
              </div>

              {/* Currency Engine - FULLY EDITABLE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative z-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المبلغ (بالعملة الأصلية)</label>
                    <input type="number" value={currentInv.amount} onChange={(e) => handleUpdateInvoice({ amount: Number(e.target.value) })} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 font-black text-lg focus:border-litcBlue outline-none shadow-sm" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العملة</label>
                    <select value={currentInv.currency} onChange={(e) => handleUpdateInvoice({ currency: e.target.value as any })} className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 font-black text-sm appearance-none outline-none focus:border-litcBlue shadow-sm">
                       {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-litcBlue uppercase tracking-widest px-1">سعر الصرف المعتمد</label>
                    <input type="number" step="0.01" value={currentInv.exchangeRate} onChange={(e) => handleUpdateInvoice({ exchangeRate: Number(e.target.value) })} className="w-full bg-white border-2 border-litcBlue/20 rounded-2xl px-5 py-4 font-black text-lg text-litcBlue outline-none shadow-sm" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1">المعادل (100% د.ل)</label>
                    <div className="w-full h-[60px] bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-5 flex items-center font-black text-xl text-emerald-600">
                       {currentInv.originalAmountInLYD?.toLocaleString()} <span className="text-xs mr-2 opacity-60">د.ل</span>
                    </div>
                 </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Calculator size={16} /> تفصيل بنود الفاتورة
                    </h4>
                    <button onClick={addLineItem} className="text-litcBlue hover:text-litcOrange font-black text-xs flex items-center gap-2 transition-colors">
                       <PlusCircle size={18} /> إضافة بند جديد
                    </button>
                 </div>
                 
                 <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <table className="w-full text-right border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">اسم الصنف/الخدمة</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">السعر (د.ل)</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase w-20"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {currentInv.lineItems && currentInv.lineItems.map((item) => (
                             <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-4">
                                   <input 
                                     type="text" 
                                     value={item.itemName} 
                                     placeholder="أدخل اسم الخدمة..."
                                     onChange={(e) => handleLineItemUpdate(item.id, { itemName: e.target.value })}
                                     className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-700 placeholder:text-slate-200"
                                   />
                                </td>
                                <td className="px-8 py-4">
                                   <input 
                                     type="number" 
                                     value={item.price} 
                                     onChange={(e) => handleLineItemUpdate(item.id, { price: Number(e.target.value) })}
                                     className="w-full bg-transparent border-none outline-none font-black text-sm text-litcBlue"
                                   />
                                </td>
                                <td className="px-8 py-4">
                                   <button onClick={() => handleUpdateInvoice({ lineItems: currentInv.lineItems.filter(l => l.id !== item.id) })} className="text-slate-200 hover:text-rose-500 transition-colors">
                                      <Trash2 size={16} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    {(!currentInv.lineItems || currentInv.lineItems.length === 0) && (
                      <div className="py-20 text-center space-y-4">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><Calculator size={32} /></div>
                         <p className="text-xs font-bold text-slate-300">لا توجد بنود حالياً. يرجى البدء في إدخال تفاصيل الفاتورة.</p>
                      </div>
                    )}
                 </div>
              </div>
           </section>

           {/* Final Summary Card & Bottom Action */}
           <div className="bg-litcDark rounded-[4rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-litcBlue/20 rounded-full blur-[80px]"></div>
              <div className="flex items-center gap-8 relative z-10">
                 <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-200/60 mb-1">المبلغ الصافي للمطالبة (90%)</p>
                    <p className="text-6xl font-black text-white">{currentInv.netAmountLYD?.toLocaleString()} <span className="text-xl font-medium opacity-50">د.ل</span></p>
                 </div>
              </div>
              <button 
                onClick={() => onSave(editingInvoices)} 
                className="w-full md:w-auto bg-litcOrange text-white px-12 py-6 rounded-[2.2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 hover:bg-orange-600 hover:-translate-y-1 active:scale-95 transition-all orange-glow"
              >
                 <Send size={24} /> إنهاء وتحويل للرئيس
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
