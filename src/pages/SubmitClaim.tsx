
import React, { useState, useRef, useCallback } from 'react';
import { User, Invoice, ClaimStatus } from '../types';
import { 
  Upload, Plus, Trash2, Camera, Loader2, 
  X, Sparkles, CheckCircle, FileStack, AlertCircle, Coins,
  HeartPulse, MapPin, Building2, Briefcase, Paperclip, Printer, 
  QrCode, ChevronLeft, ChevronRight, Info, FileText, Stethoscope, MessageSquare
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { performOCR } from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubmitClaimProps {
  user: User;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CURRENCY_GROUPS = [
  {
    label: 'العملات المحلية والعربية',
    currencies: [
      { code: 'LYD', name: 'دينار ليبي', flag: '🇱🇾' },
      { code: 'TND', name: 'دينار تونسي', flag: '🇹🇳' },
      { code: 'EGP', name: 'جنيه مصري', flag: '🇪🇬' },
      { code: 'SAR', name: 'ريال سعودي', flag: '🇸🇦' },
      { code: 'AED', name: 'درهم إماراتي', flag: '🇦🇪' },
      { code: 'JOD', name: 'دينار أردني', flag: '🇯🇴' },
      { code: 'KWD', name: 'دينار كويتي', flag: '🇰🇼' },
      { code: 'QAR', name: 'ريال قطري', flag: '🇶🇦' },
      { code: 'OMR', name: 'ريال عماني', flag: '🇴🇲' },
      { code: 'BHD', name: 'دينار بحريني', flag: '🇧🇭' },
      { code: 'DZD', name: 'دينار جزائري', flag: '🇩🇿' },
      { code: 'MAD', name: 'درهم مغربي', flag: '🇲🇦' },
    ]
  },
  {
    label: 'العملات العالمية',
    currencies: [
      { code: 'USD', name: 'دولار أمريكي', flag: '🇺🇸' },
      { code: 'EUR', name: 'يورو', flag: '🇪🇺' },
      { code: 'GBP', name: 'جنيه إسترليني', flag: '🇬🇧' },
      { code: 'TRY', name: 'ليرة تركية', flag: '🇹🇷' },
      { code: 'CHF', name: 'فرنك سويسري', flag: '🇨🇭' },
      { code: 'CAD', name: 'دولار كندي', flag: '🇨🇦' },
      { code: 'AUD', name: 'دولار أسترالي', flag: '🇦🇺' },
      { code: 'JPY', name: 'ين ياباني', flag: '🇯🇵' },
      { code: 'CNY', name: 'يوان صيني', flag: '🇨🇳' },
    ]
  }
];

const STEPS = [
  { id: 'submission', label: 'تقديم الطلب', icon: <FileStack /> },
  { id: 'paper', label: 'استلام الورقيات', icon: <FileText /> },
  { id: 'review', label: 'المراجعة الطبية', icon: <Stethoscope /> },
  { id: 'approval', label: 'الاعتماد النهائي', icon: <CheckCircle /> },
];

const SubmitClaim: React.FC<SubmitClaimProps> = ({ user, onSubmit, onCancel }) => {
  const [invoices, setInvoices] = useState<Partial<Invoice & { attachments: File[] }>[]>([]);
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('LYD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<any | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isScanComplete, setIsScanComplete] = useState(false);
  const [comparisonInvoice, setComparisonInvoice] = useState<Partial<Invoice & { attachments: File[] }> | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setUploadProgress(5);
    setIsScanComplete(false);
    
    const processFile = (file: File): Promise<Partial<Invoice & { attachments: File[] }>> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            setUploadProgress(15);
            let base64 = (reader.result as string).split(',')[1];
            base64 = await optimizeImage(base64, 1024, 0.7);
            
            setUploadProgress(30);
            // Simulate some progress while calling OCR
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => {
                if (prev < 75) return prev + 2;
                return prev;
              });
            }, 200);

            const ocr = await performOCR(base64);
            clearInterval(progressInterval);
            setUploadProgress(90);

            const newInvoice: Partial<Invoice & { attachments: File[] }> = {
              id: `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              imageUrl: `data:image/jpeg;base64,${base64}`,
              hospitalName: ocr.hospitalName || '',
              invoiceNumber: ocr.invoiceNumber || '',
              amount: ocr.totalAmount || 0,
              date: ocr.date || new Date().toISOString().split('T')[0],
              currency: (ocr.currency || currency) as any,
              beneficiaryName: user.name,
              relationship: 'الموظف نفسه',
              attachments: [],
            };
            resolve(newInvoice);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const results = await Promise.all(acceptedFiles.map(processFile));
      setInvoices(prev => [...prev, ...results]);
      setUploadProgress(100);
      setIsScanComplete(true);
      
      // Keep the success state visible for a moment
      setTimeout(() => {
        setIsProcessing(false);
        setIsScanComplete(false);
        setUploadProgress(0);
        
        // Automatically open the first uploaded invoice in comparison mode
        if (results.length > 0) {
          setComparisonInvoice(results[0]);
        }
      }, 1500);
    } catch (err) {
      console.error("Error processing files:", err);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, [currency]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const handleUpdateInvoice = (id: string, field: string, value: any) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, [field]: value } : inv));
  };

  const handleRemoveInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const handleAddInvoiceAttachment = (invoiceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, attachments: [...(inv.attachments || []), ...files] } 
        : inv
    ));
  };

  const handleRemoveInvoiceAttachment = (invoiceId: string, attachmentIndex: number) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, attachments: (inv.attachments || []).filter((_, i) => i !== attachmentIndex) } 
        : inv
    ));
  };

  const handleSubmit = async () => {
    if (invoices.length === 0) return;
    
    setIsSubmitting(true);
    const claimId = `CLM-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
    const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    
    const claimData = {
      id: claimId,
      employeeId: user.id,
      employeeName: user.name,
      submissionDate: new Date().toLocaleString('ar-LY'),
      status: ClaimStatus.WAITING_FOR_PAPER,
      invoices: invoices.map(inv => ({ ...inv, status: ClaimStatus.WAITING_FOR_PAPER, archiveBoxId: '' })),
      totalAmount,
      currency,
      description,
      medicalNotes: '',
      isChronic: false,
      referenceNumber: claimId,
      invoiceCount: invoices.length,
      location: user.location,
      department: user.department,
      auditTrail: [{
        id: Math.random().toString(),
        userId: user.id,
        userName: user.name,
        action: 'تقديم مطالبة جديدة عبر النظام الذكي',
        timestamp: new Date().toLocaleString('ar-LY')
      }]
    };

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    
    setSubmittedClaim(claimData);
    onSubmit(claimData);
    setIsSubmitting(false);
  };

  const generatePDF = () => {
    if (!submittedClaim) return;
    
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Simple PDF Generation (Note: jsPDF has limited RTL support without custom fonts, 
    // but we'll structure it clearly)
    doc.setFontSize(22);
    doc.text('LITC Medical Claim Summary', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Claim ID: ${submittedClaim.id}`, 20, 40);
    doc.text(`Employee: ${user.name} (${user.id})`, 20, 50);
    doc.text(`Department: ${user.department || 'N/A'}`, 20, 60);
    doc.text(`Date: ${submittedClaim.submissionDate}`, 20, 70);
    
    doc.line(20, 75, 190, 75);
    
    doc.text('Invoices:', 20, 85);
    let y = 95;
    submittedClaim.invoices.forEach((inv: any, i: number) => {
      doc.text(`${i + 1}. ${inv.hospitalName} - #${inv.invoiceNumber} - ${inv.amount} ${inv.currency}`, 30, y);
      y += 10;
    });
    
    doc.line(20, y, 190, y);
    doc.text(`Total Amount: ${submittedClaim.totalAmount} ${submittedClaim.currency}`, 20, y + 10);
    
    doc.setFontSize(10);
    doc.text('Instructions: Please print this summary, attach it to your physical originals,', 20, y + 30);
    doc.text('and submit them to the Care Unit for processing.', 20, y + 35);
    
    doc.save(`Claim_${submittedClaim.id}.pdf`);
  };

  if (submittedClaim) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto bg-white rounded-[2.5rem] p-8 sm:p-16 shadow-2xl border border-slate-100 text-center space-y-10 font-cairo"
        dir="rtl"
      >
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-litcBlue">تم استلام البيانات بنجاح</h2>
          <p className="text-slate-500 font-bold leading-relaxed">
            تم استلام طلبك إلكترونياً. يرجى تسليم الأصول الورقية لمكتب الرعاية لإتمام الإجراء.
          </p>
        </div>

        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center gap-6">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <QRCodeSVG value={submittedClaim.id} size={150} />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">رقم المطالبة</p>
            <p className="text-2xl font-black text-litcBlue tracking-wider">{submittedClaim.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={generatePDF}
            className="flex items-center justify-center gap-3 p-5 bg-litcBlue text-white rounded-2xl font-black hover:bg-litcBlue/90 transition-all shadow-lg shadow-litcBlue/20"
          >
            <Printer className="w-5 h-5" />
            طباعة الملخص
          </button>
          <button 
            onClick={onCancel}
            className="flex items-center justify-center gap-3 p-5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
          >
            العودة للرئيسية
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-cairo pb-20 px-4" dir="rtl">
      {/* Comparison Modal */}
      <AnimatePresence>
        {comparisonInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl"
            >
              {/* Image View */}
              <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
                <img 
                  src={comparisonInvoice.imageUrl} 
                  alt="Invoice Comparison" 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 right-6 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black text-litcBlue flex items-center gap-2 shadow-sm">
                  <Info className="w-3 h-3" />
                  قارن البيانات مع الصورة الأصلية
                </div>
              </div>

              {/* Edit View */}
              <div className="w-full lg:w-[400px] bg-white p-8 sm:p-12 flex flex-col gap-8 border-r border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-litcBlue">مراجعة البيانات</h3>
                  <button 
                    onClick={() => setComparisonInvoice(null)}
                    className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المرفق الصحي</label>
                    <input 
                      type="text" 
                      value={comparisonInvoice.hospitalName} 
                      onChange={(e) => {
                        handleUpdateInvoice(comparisonInvoice.id!, 'hospitalName', e.target.value);
                        setComparisonInvoice(prev => ({ ...prev!, hospitalName: e.target.value }));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-litcBlue focus:ring-2 focus:ring-litcBlue outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم الفاتورة</label>
                    <input 
                      type="text" 
                      value={comparisonInvoice.invoiceNumber} 
                      onChange={(e) => {
                        handleUpdateInvoice(comparisonInvoice.id!, 'invoiceNumber', e.target.value);
                        setComparisonInvoice(prev => ({ ...prev!, invoiceNumber: e.target.value }));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-600 focus:ring-2 focus:ring-litcBlue outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</label>
                    <input 
                      type="date" 
                      value={comparisonInvoice.date} 
                      onChange={(e) => {
                        handleUpdateInvoice(comparisonInvoice.id!, 'date', e.target.value);
                        setComparisonInvoice(prev => ({ ...prev!, date: e.target.value }));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-600 focus:ring-2 focus:ring-litcBlue outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ ({comparisonInvoice.currency})</label>
                    <input 
                      type="number" 
                      value={comparisonInvoice.amount} 
                      onChange={(e) => {
                        handleUpdateInvoice(comparisonInvoice.id!, 'amount', e.target.value);
                        setComparisonInvoice(prev => ({ ...prev!, amount: Number(e.target.value) }));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-black text-litcOrange focus:ring-2 focus:ring-litcBlue outline-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setComparisonInvoice(null)}
                  className="w-full bg-litcBlue text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-litcBlue/90 transition-all"
                >
                  حفظ وإغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Timeline */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-black text-litcBlue flex items-center justify-center sm:justify-start gap-3">
              <FileStack className="text-litcOrange w-6 h-6 sm:w-8 sm:h-8" /> 
              تقديم مطالبة طبية ذكية
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">نظام LITC المتطور لمعالجة المطالبات آلياً باستخدام الذكاء الاصطناعي.</p>
          </div>
          <button onClick={onCancel} className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-2 overflow-x-auto no-scrollbar">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2 relative z-10 shrink-0">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    idx === 0 ? "bg-litcBlue border-litcBlue text-white shadow-lg shadow-litcBlue/20" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {step.icon}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[8px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap",
                    idx === 0 ? "text-litcBlue" : "text-slate-400"
                  )}>{step.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-100 min-w-[20px] sm:min-w-[40px]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Top Section: Upload & Grid */}
        <div className="space-y-8">
          {/* OCR Upload Zone */}
          <div 
            {...getRootProps()} 
            className={cn(
              "relative group cursor-pointer transition-all duration-500",
              "bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center text-center",
              isDragActive ? "border-litcBlue bg-litcBlue/5 scale-[0.99]" : "border-slate-100 hover:border-litcBlue hover:bg-slate-50"
            )}
          >
            <input {...getInputProps()} />
            <div className={cn(
              "w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mb-4 sm:mb-6 transition-all duration-500 shadow-inner",
              isDragActive ? "bg-litcBlue text-white scale-110" : "bg-slate-50 text-slate-300 group-hover:bg-litcBlue group-hover:text-white"
            )}>
              {isProcessing ? <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" /> : <Upload className="w-8 h-8 sm:w-10 sm:h-10" />}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">اسحب وأفلت الفواتير هنا</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-400 max-w-xs px-4">سيقوم الذكاء الاصطناعي باستخراج البيانات آلياً من صور الفواتير.</p>
            
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
              <div className="relative w-24 h-24 sm:w-40 sm:h-40 mb-6 sm:mb-10">
                <AnimatePresence mode="wait">
                  {!isScanComplete ? (
                    <motion.div 
                      key="scanning"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.div 
                        className="absolute inset-0 border-4 border-litcBlue/20 rounded-[2rem] sm:rounded-[3rem]"
                      />
                      <motion.div 
                        className="absolute inset-0 border-4 border-litcBlue rounded-[2rem] sm:rounded-[3rem]"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div 
                        className="absolute inset-x-0 h-1.5 bg-litcOrange shadow-[0_0_25px_rgba(255,107,0,0.8)] z-10"
                        animate={{ top: ['5%', '95%', '5%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <Sparkles className="w-10 h-10 sm:w-16 sm:h-16 text-litcBlue animate-pulse" />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="complete"
                      initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-emerald-500 rounded-[2rem] sm:rounded-[3rem] shadow-lg shadow-emerald-200"
                    >
                      <CheckCircle className="w-12 h-12 sm:w-20 sm:h-20 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="text-center space-y-4 sm:space-y-6 max-w-sm px-4">
                <motion.h3 
                  className="text-xl sm:text-3xl font-black text-litcBlue"
                  animate={isScanComplete ? { scale: [1, 1.05, 1] } : {}}
                >
                  {isScanComplete ? 'تم التحليل بنجاح!' : 'معالجة ذكية فائقة'}
                </motion.h3>
                <p className="text-xs sm:text-base font-bold text-slate-500 leading-relaxed">
                  {isScanComplete 
                    ? 'تم استخراج كافة البيانات بدقة، جاري عرض النتائج للمراجعة...'
                    : 'يقوم محرك الذكاء الاصطناعي بمسح الفاتورة ضوئياً واستخراج البيانات المالية بدقة متناهية...'}
                </p>
                
                <div className="w-full h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden mt-4 sm:mt-8 relative shadow-inner">
                  <motion.div 
                    className={cn(
                      "h-full transition-colors duration-500",
                      isScanComplete ? "bg-emerald-500" : "bg-gradient-to-r from-litcBlue via-litcOrange to-litcBlue bg-[length:200%_100%]"
                    )}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${uploadProgress}%`,
                      backgroundPosition: ["0% 0%", "100% 0%"]
                    }}
                    transition={{ 
                      width: { duration: 0.5 },
                      backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 sm:mt-3">
                  <span className="text-[8px] sm:text-xs font-black text-slate-400 tracking-widest">
                    {isScanComplete ? 'COMPLETE' : 'AI SCANNING IN PROGRESS'}
                  </span>
                  <span className={cn(
                    "text-sm sm:text-lg font-black",
                    isScanComplete ? "text-emerald-500" : "text-litcBlue"
                  )}>
                    {uploadProgress}%
                  </span>
                </div>
              </div>

              {/* Decorative floating elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-litcBlue/30 rounded-full"
                    initial={{ 
                      x: Math.random() * 100 + "%", 
                      y: "110%" 
                    }}
                    animate={{ 
                      y: "-10%",
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 4, 
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Editable Grid / Cards */}
          <AnimatePresence>
            {invoices.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <h3 className="font-black text-litcBlue flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-litcOrange" />
                    البيانات المستخرجة (قابلة للتعديل)
                  </h3>
                  <span className="text-[10px] font-black bg-litcBlue/10 text-litcBlue px-3 py-1 rounded-full uppercase tracking-wider">
                    {invoices.length} فواتير
                  </span>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden w-full">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="px-8 py-5 text-right min-w-[100px]">المعاينة</th>
                          <th className="px-8 py-5 text-right min-w-[200px]">المرفق الصحي</th>
                          <th className="px-8 py-5 text-right min-w-[150px]">المستفيد</th>
                          <th className="px-8 py-5 text-right min-w-[150px]">رقم الفاتورة</th>
                          <th className="px-8 py-5 text-center min-w-[140px]">التاريخ</th>
                          <th className="px-8 py-5 text-center min-w-[160px]">المبلغ</th>
                          <th className="px-8 py-5 text-center min-w-[120px]">المرفقات</th>
                          <th className="px-8 py-5 text-center min-w-[120px]">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                            <td className="px-8 py-5">
                              <div 
                                onClick={() => setComparisonInvoice(inv)}
                                className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 cursor-zoom-in hover:border-litcBlue hover:scale-105 transition-all relative group/thumb shadow-sm mx-auto md:mx-0"
                              >
                                <img 
                                  src={inv.imageUrl} 
                                  alt="Invoice" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-litcBlue/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                  <Camera className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="space-y-2">
                                <select 
                                  value={inv.relationship}
                                  onChange={(e) => {
                                    handleUpdateInvoice(inv.id!, 'relationship', e.target.value);
                                    if (e.target.value === 'الموظف نفسه') {
                                      handleUpdateInvoice(inv.id!, 'beneficiaryName', user.name);
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 font-bold text-xs text-litcBlue outline-none"
                                >
                                  <option value="الموظف نفسه">الموظف نفسه</option>
                                  <option value="الزوج/الزوجة">الزوج/الزوجة</option>
                                  <option value="الابن/الابنة">الابن/الابنة</option>
                                  <option value="الأب/الأم">الأب/الأم</option>
                                </select>
                                {inv.relationship !== 'الموظف نفسه' && (
                                  <input 
                                    type="text" 
                                    value={inv.beneficiaryName || ''} 
                                    onChange={(e) => handleUpdateInvoice(inv.id!, 'beneficiaryName', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 font-bold text-xs text-slate-600 outline-none"
                                    placeholder="اسم المستفيد..."
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <input 
                                type="text" 
                                value={inv.hospitalName || ''} 
                                onChange={(e) => handleUpdateInvoice(inv.id!, 'hospitalName', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 font-bold text-litcBlue text-sm placeholder:text-slate-300"
                                placeholder="اسم المستشفى..."
                              />
                            </td>
                            <td className="px-8 py-5">
                              <input 
                                type="text" 
                                value={inv.invoiceNumber || ''} 
                                onChange={(e) => handleUpdateInvoice(inv.id!, 'invoiceNumber', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-600 text-sm placeholder:text-slate-300"
                                placeholder="000000"
                              />
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="relative inline-block">
                                <input 
                                  type="date" 
                                  value={inv.date || ''} 
                                  onChange={(e) => handleUpdateInvoice(inv.id!, 'date', e.target.value)}
                                  className="bg-slate-50/50 border border-slate-100 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-litcBlue/20 outline-none font-bold text-slate-500 text-xs text-center transition-all"
                                />
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex items-center justify-center gap-2 bg-slate-50/50 border border-slate-100 rounded-xl px-3 py-1.5 group-hover:border-litcOrange/30 transition-all">
                                <input 
                                  type="number" 
                                  value={inv.amount || 0} 
                                  onChange={(e) => handleUpdateInvoice(inv.id!, 'amount', e.target.value)}
                                  className="w-20 bg-transparent border-none focus:ring-0 font-black text-litcOrange text-sm text-center p-0"
                                />
                                <span className="text-[10px] font-black text-slate-400 border-r border-slate-200 pr-2 mr-1">{inv.currency}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col items-center gap-2">
                                <label className="cursor-pointer p-2 bg-slate-50 rounded-xl text-litcBlue hover:bg-litcBlue hover:text-white transition-all shadow-sm border border-slate-100">
                                  <Plus className="w-4 h-4" />
                                  <input type="file" className="hidden" multiple onChange={(e) => handleAddInvoiceAttachment(inv.id!, e)} />
                                </label>
                                {inv.attachments && inv.attachments.length > 0 && (
                                  <span className="text-[9px] font-black bg-litcOrange/10 text-litcOrange px-2.5 py-1 rounded-full border border-litcOrange/20">
                                    {inv.attachments.length} مرفقات
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center justify-center gap-3">
                                <button 
                                  onClick={() => setComparisonInvoice(inv)}
                                  className="p-2.5 bg-litcBlue/5 text-litcBlue rounded-xl hover:bg-litcBlue hover:text-white transition-all shadow-sm border border-litcBlue/10"
                                  title="مقارنة مع الأصل"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleRemoveInvoice(inv.id!)}
                                  className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-6">
                  {invoices.map((inv) => (
                    <motion.div 
                      key={inv.id}
                      layout
                      className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-6 space-y-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-1 h-full bg-litcBlue"></div>
                      
                      <div className="flex items-start gap-5">
                        <div 
                          onClick={() => setComparisonInvoice(inv)}
                          className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-50 shrink-0 shadow-md cursor-pointer active:scale-95 transition-transform"
                        >
                          <img src={inv.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المستفيد من الفاتورة</label>
                            <select 
                              value={inv.relationship}
                              onChange={(e) => {
                                handleUpdateInvoice(inv.id!, 'relationship', e.target.value);
                                if (e.target.value === 'الموظف نفسه') {
                                  handleUpdateInvoice(inv.id!, 'beneficiaryName', user.name);
                                }
                              }}
                              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-black text-litcBlue text-sm focus:ring-2 focus:ring-litcBlue/10"
                            >
                              <option value="الموظف نفسه">الموظف نفسه</option>
                              <option value="الزوج/الزوجة">الزوج/الزوجة</option>
                              <option value="الابن/الابنة">الابن/الابنة</option>
                              <option value="الأب/الأم">الأب/الأم</option>
                            </select>
                          </div>
                          {inv.relationship !== 'الموظف نفسه' && (
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">اسم المستفيد</label>
                              <input 
                                type="text" 
                                value={inv.beneficiaryName} 
                                onChange={(e) => handleUpdateInvoice(inv.id!, 'beneficiaryName', e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-bold text-slate-600 text-xs focus:ring-2 focus:ring-litcBlue/10"
                                placeholder="أدخل اسم المستفيد..."
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المرفق الصحي</label>
                            <input 
                              type="text" 
                              value={inv.hospitalName} 
                              onChange={(e) => handleUpdateInvoice(inv.id!, 'hospitalName', e.target.value)}
                              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-black text-litcBlue text-sm focus:ring-2 focus:ring-litcBlue/10"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">رقم الفاتورة</label>
                            <input 
                              type="text" 
                              value={inv.invoiceNumber} 
                              onChange={(e) => handleUpdateInvoice(inv.id!, 'invoiceNumber', e.target.value)}
                              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 font-bold text-slate-600 text-xs focus:ring-2 focus:ring-litcBlue/10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">التاريخ</label>
                          <input 
                            type="date" 
                            value={inv.date} 
                            onChange={(e) => handleUpdateInvoice(inv.id!, 'date', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-600 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المبلغ ({inv.currency})</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={inv.amount} 
                              onChange={(e) => handleUpdateInvoice(inv.id!, 'amount', e.target.value)}
                              className="w-full bg-slate-50 border-none rounded-xl p-3 font-black text-litcOrange text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المرفقات الإضافية</label>
                          <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-litcBlue text-white rounded-xl font-black text-[10px] hover:bg-litcBlue/90 transition-all shadow-sm">
                            <Plus className="w-3 h-3" />
                            إضافة مرفق
                            <input type="file" className="hidden" multiple onChange={(e) => handleAddInvoiceAttachment(inv.id!, e)} />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {inv.attachments?.map((file, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{file.name}</span>
                              <button onClick={() => handleRemoveInvoiceAttachment(inv.id!, fIdx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {(!inv.attachments || inv.attachments.length === 0) && (
                            <div className="w-full py-4 border border-dashed border-slate-100 rounded-xl flex items-center justify-center">
                              <p className="text-[10px] font-bold text-slate-300 italic">لا توجد مرفقات إضافية</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button 
                          onClick={() => setComparisonInvoice(inv)}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-litcBlue/5 text-litcBlue rounded-2xl font-black text-sm hover:bg-litcBlue hover:text-white transition-all border border-litcBlue/10"
                        >
                          <Sparkles className="w-4 h-4" />
                          مراجعة ومقارنة
                        </button>
                        <button 
                          onClick={() => handleRemoveInvoice(inv.id!)}
                          className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comments, Notes & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-black text-litcBlue flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-litcOrange" />
                ملاحظات إضافية
              </h3>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أضف أي تفاصيل أخرى ترغب في ذكرها..."
                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-sm focus:ring-2 focus:ring-litcBlue outline-none transition-all"
              />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 text-litcOrange rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-litcBlue">تنبيه هام</p>
                  <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">
                    هذا النظام مخصص لإدخال البيانات الرقمية فقط. لا يتم إجراء أي عمليات تحويل عملة أو خصم نسب في هذه المرحلة.
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">حالة المعالجة</p>
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                  <CheckCircle className="w-4 h-4" />
                  تم التحقق من البيانات آلياً
                </div>
              </div>
            </div>

            <div className="bg-litcBlue text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-litcOrange opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10 space-y-4">
                <h3 className="text-lg font-black flex items-center gap-3">
                  <Sparkles className="text-litcOrange animate-pulse w-5 h-5" /> 
                  ملخص البيانات
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest px-1">العملة</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 font-black text-xs appearance-none focus:bg-white/20 outline-none"
                    >
                      {CURRENCY_GROUPS.map(group => (
                        <optgroup key={group.label} label={group.label} className="bg-white text-slate-900 font-black">
                          {group.currencies.map(c => (
                            <option key={c.code} value={c.code} className="text-slate-900">
                              {c.flag} {c.code} - {c.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">الإجمالي</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black text-white">
                        {invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}
                      </p>
                      <span className="text-xs font-black text-litcOrange">{currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={invoices.length === 0 || isSubmitting}
                className="relative z-10 w-full bg-white text-litcBlue py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-litcOrange hover:text-white transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 mt-6"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <HeartPulse className="w-5 h-5" />
                    تأكيد وإرسال
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitClaim;
