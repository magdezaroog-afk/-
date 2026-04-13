
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, Claim, ClaimStatus } from '../types';
import { STATUS_UI } from '../constants';
import { cn } from '../lib/utils';
import DigitalReceipt from '../components/DigitalReceipt';
import jsPDF from 'jspdf';
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
  AlertTriangle,
  Calculator,
  Check,
  X,
  PlusCircle,
  ImageIcon,
  Maximize2,
  Download,
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
  HelpCircle,
  Pill,
  Activity
} from 'lucide-react';

interface ClaimDetailProps {
  claim: Claim;
  user: User;
  allClaims: Claim[];
  onClose: () => void;
  onUpdateStatus: (newStatus: ClaimStatus, comment?: string, extraData?: any) => void;
  onInvoiceAssign: (claimId: string, invoiceIds: string[], staffId: string) => void;
  onInvoiceStatusUpdate: (claimId: string, invoiceId: string, newStatus: ClaimStatus, comment?: string, extraData?: any) => void;
}

const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحيى قرقاب', team: 'وحدة الصيدليات' },
  { id: 'DE-2', name: 'محمود الدعوكي', team: 'وحدة المستشفيات' },
  { id: 'DE-3', name: 'عباس طنيش', team: 'وحدة العيادات والمختبرات' },
];

const ClaimDetail: React.FC<ClaimDetailProps> = ({ claim, user, allClaims, onClose, onUpdateStatus, onInvoiceAssign, onInvoiceStatusUpdate }) => {
  const [globalComment, setGlobalComment] = useState('');
  const [activeInvoiceIndex, setActiveInvoiceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [showNoAttachmentsMsg, setShowNoAttachmentsMsg] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [verifiedFields, setVerifiedFields] = useState<string[]>(claim.invoices[activeInvoiceIndex]?.verifiedFields || []);

  const imgRef = useRef<HTMLImageElement>(null);
  const [imageRect, setImageRect] = useState<{width: number, height: number, left: number, top: number} | null>(null);

  const updateImageRect = () => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const parentRect = imgRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setImageRect({
          width: rect.width / zoomLevel,
          height: rect.height / zoomLevel,
          left: (rect.left - parentRect.left) / zoomLevel,
          top: (rect.top - parentRect.top) / zoomLevel
        });
      }
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateImageRect);
    return () => window.removeEventListener('resize', updateImageRect);
  }, [zoomLevel]);

  useEffect(() => {
    // Reset image rect when invoice changes
    setImageRect(null);
    setTimeout(updateImageRect, 100);
  }, [activeInvoiceIndex, claim.id]);

  const isReceptionist = user.role === UserRole.RECEPTIONIST;
  const isDoctor = user.role === UserRole.DOCTOR;
  const isDataEntry = user.role === UserRole.DATA_ENTRY;
  const isHead = user.role === UserRole.HEAD_OF_UNIT;
  const isAuditor = user.role === UserRole.INTERNAL_AUDITOR;
  const isEmployee = user.role === UserRole.EMPLOYEE;
  const isAdmin = user.role === UserRole.ADMIN;
  
  const [archiveBoxId, setArchiveBoxId] = useState(claim.invoices[0]?.archiveBoxId || '');
  const activeInvoice = claim.invoices[activeInvoiceIndex];

  // AI Fraud Detection Gate
  const fraudFlags = useMemo(() => {
    const flags: string[] = [];
    if (!activeInvoice) return flags;

    // Flag 1: Same Provider > 3 times in 7 days
    const providerName = activeInvoice.hospitalName?.toLowerCase().trim();
    if (providerName && allClaims) {
      const userClaims = allClaims.filter(c => c.employeeId === claim.employeeId);
      const recentClaimsFromSameProvider = userClaims.filter(c => {
        const date = new Date(c.submissionDate);
        const diff = (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diff <= 7 && c.invoices.some(inv => inv.hospitalName?.toLowerCase().trim() === providerName);
      });
      if (recentClaimsFromSameProvider.length > 3) {
        flags.push('تكرار غير طبيعي من نفس المزود (> 3 مطالبات في أسبوع)');
      }
    }

    // Flag 2: Receipt Date older than 90 days
    const receiptDate = new Date(activeInvoice.date || claim.submissionDate);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    if (receiptDate < ninetyDaysAgo) {
      flags.push('تاريخ الفاتورة قديم (> 90 يوم)');
    }

    // Flag 3: Amount exceeds historical average for this service
    // (Simplified: if amount > 5000 and not chronic)
    if (activeInvoice.amount > 5000 && !claim.isChronic) {
      flags.push('مبلغ المطالبة مرتفع بشكل غير معتاد');
    }

    return flags;
  }, [claim, activeInvoice, allClaims]);

  // Medical Conflict Alert
  const conflictAlerts = useMemo(() => {
    const alerts: string[] = [];
    if (!isDoctor || !activeInvoice) return alerts;

    const diagnosis = (activeInvoice.medicalNotes || '').toLowerCase();
    const chronicDiseases = user.healthProfile?.chronicDiseases || [];

    chronicDiseases.forEach(disease => {
      if (diagnosis.includes(disease.toLowerCase())) {
        alerts.push(`تنبيه تعارض: التشخيص يطابق حالة مزمنة مسجلة مسبقاً (${disease})`);
      }
    });

    return alerts;
  }, [isDoctor, activeInvoice, user.healthProfile]);

  const downloadSummaryPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add Branded Header
    doc.setFillColor(0, 51, 102); // LITC Navy
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('LITC - OFFICIAL CLAIM SUMMARY', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('AI-VERIFIED HEALTHCARE REIMBURSEMENT SYSTEM', 105, 30, { align: 'center' });

    // Claim Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Claim Details', 20, 55);
    
    doc.setFontSize(12);
    doc.text(`Claim ID: ${claim.id}`, 20, 65);
    doc.text(`Employee Name: ${claim.employeeName}`, 20, 72);
    doc.text(`Submission Date: ${claim.submissionDate}`, 20, 79);
    doc.text(`Total Amount: ${claim.totalAmount.toLocaleString()} LYD`, 20, 86);
    doc.text(`Current Status: ${claim.status}`, 20, 93);

    // Audit History
    doc.setFontSize(16);
    doc.text('Audit Trail & History', 20, 110);
    
    let y = 120;
    claim.history.forEach((h, i) => {
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${h.status} - Performed by ${h.performedByRole} at ${new Date(h.timestamp).toLocaleString()}`, 25, y);
      y += 8;
    });

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('LITC Official Document - Generated for Audit Purposes.', 105, 280, { align: 'center' });

    doc.save(`LITC-Summary-${claim.id}.pdf`);
  };

  const STAGES = [
    { id: 'draft', label: 'مسودة', icon: Send, statuses: [ClaimStatus.DRAFT] },
    { id: 'physical', label: 'الاستلام', icon: Database, statuses: [ClaimStatus.PENDING_PHYSICAL] },
    { id: 'medical', label: 'المراجعة', icon: Stethoscope, statuses: [ClaimStatus.PENDING_MEDICAL] },
    { id: 'financial', label: 'المعالجة', icon: CreditCard, statuses: [ClaimStatus.PENDING_FINANCIAL] },
    { id: 'approval', label: 'الاعتماد', icon: ShieldCheck, statuses: [ClaimStatus.PENDING_APPROVAL] },
    { id: 'audit', label: 'التدقيق', icon: SearchCheck, statuses: [ClaimStatus.PENDING_AUDIT] },
    { id: 'paid', label: 'الصرف', icon: CheckCircle2, statuses: [ClaimStatus.PAID] }
  ];

  const getCurrentStageIndex = () => {
    const index = STAGES.findIndex(s => s.statuses.includes(claim.status));
    if (index === -1) {
      if (claim.status === ClaimStatus.PAID) return 6;
      if (claim.status === ClaimStatus.REJECTED) return 6;
      return 0;
    }
    return index;
  };

  const currentStageIndex = getCurrentStageIndex();

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'active';
    return 'pending';
  };

  // SVG Path and Node Coordinates (1000x200 viewbox) - RTL Flow
  const nodes = [
    { x: 950, y: 100 },
    { x: 800, y: 150 },
    { x: 650, y: 100 },
    { x: 500, y: 50 },
    { x: 350, y: 100 },
    { x: 200, y: 150 },
    { x: 50, y: 100 }
  ];

  const roadmapPath = "M 950,100 C 850,150 750,50 650,100 S 450,150 350,100 S 150,50 50,100";

  // فرز الفواتير لاتخاذ القرار الجماعي النهائي
  const approvedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.PENDING_FINANCIAL);
  const rejectedInvoices = claim.invoices.filter(i => i.status === ClaimStatus.REJECTED);

  const handleInvoiceDecision = (invoiceId: string, decision: 'APPROVE' | 'REJECT') => {
    const status = decision === 'APPROVE' ? ClaimStatus.PENDING_FINANCIAL : ClaimStatus.REJECTED;
    onInvoiceStatusUpdate(claim.id, invoiceId, status, globalComment || 'تمت المراجعة والفرز');
  };

  const handleFieldStatusUpdate = (fieldId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (!activeInvoice) return;
    
    const currentFieldStatuses = activeInvoice.fieldStatuses || {};
    const currentFieldReasons = activeInvoice.fieldRejectionReasons || {};
    
    const newStatuses = { ...currentFieldStatuses, [fieldId]: status };
    const newReasons = { ...currentFieldReasons, [fieldId]: reason || '' };
    
    // Update in Firestore via parent
    onInvoiceStatusUpdate(claim.id, activeInvoice.id, activeInvoice.status as any, undefined, { 
      fieldStatuses: newStatuses,
      fieldRejectionReasons: newReasons
    });
  };

  const handleItemStatusUpdate = (itemId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (!activeInvoice) return;
    
    const updatedLineItems = activeInvoice.lineItems.map(item => 
      item.id === itemId ? { ...item, status, rejectionReason: reason } : item
    );
    
    onInvoiceStatusUpdate(claim.id, activeInvoice.id, activeInvoice.status as any, undefined, { 
      lineItems: updatedLineItems 
    });
  };

  const renderBoundingBox = () => {
    if (!hoveredField || !activeInvoice.boundingBoxes || !imageRect) return null;
    const box = (activeInvoice.boundingBoxes as any)[hoveredField];
    if (!box) return null;

    // box is [ymin, xmin, ymax, xmax] in 0-1000
    const [ymin, xmin, ymax, xmax] = box;
    return (
      <div 
        style={{
          position: 'absolute',
          top: imageRect.top,
          left: imageRect.left,
          width: imageRect.width,
          height: imageRect.height,
          pointerEvents: 'none',
          zIndex: 30
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute border-4 border-[#FF6B00] bg-[#FF6B00]/10 rounded-lg shadow-[0_0_20px_rgba(255,107,0,0.5)]"
          style={{
            top: `${ymin / 10}%`,
            left: `${xmin / 10}%`,
            width: `${(xmax - xmin) / 10}%`,
            height: `${(ymax - ymin) / 10}%`,
          }}
        >
          <div className="absolute -top-8 right-0 bg-[#FF6B00] text-white text-[10px] font-black px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
            AI Verified Area
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto pb-12 animate-in fade-in duration-700 font-cairo px-4 sm:px-0" dir="rtl">
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
        <button 
          onClick={downloadSummaryPDF}
          className="px-4 py-2 sm:px-6 sm:py-4 bg-slate-900 text-white rounded-lg sm:rounded-[2rem] text-[8px] sm:text-[11px] font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md relative z-10"
        >
          <Download className="w-4 h-4" /> تحميل ملخص المعاملة
        </button>
      </div>

      <div className={cn(
        "grid gap-6 sm:gap-8",
        isAuditor ? "grid-cols-1 xl:grid-cols-12" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Invoice Items Section */}
        <section className={cn(
          "bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col h-full relative overflow-hidden group",
          isAuditor ? "xl:col-span-5 order-2 xl:order-2" : ""
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-litcBlue/10 transition-colors"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 relative z-10">
             <div className="text-right">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-litcBlue/10 rounded-xl flex items-center justify-center">
                    <FileSearch className="text-litcBlue w-6 h-6" />
                  </div>
                  {isAuditor ? 'التدقيق المتزامن (Sync Flash)' : 'تدقيق بنود الفاتورة'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mr-13">
                  {isAuditor ? 'Visual AI Synchronization' : 'Invoice Itemization & Audit'}
                </p>
             </div>
             <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
                <span className="text-[10px] font-black text-slate-400">الفاتورة</span>
                <span className="w-6 h-6 bg-litcBlue text-white rounded-lg flex items-center justify-center text-xs font-black shadow-lg shadow-litcBlue/20">{activeInvoiceIndex + 1}</span>
                <span className="text-[10px] font-black text-slate-300">من</span>
                <span className="text-xs font-black text-slate-600">{claim.invoices.length}</span>
             </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 relative z-10">
             {/* Sync Flash Data Fields */}
             <div className="space-y-3">
                {[
                  { id: 'hospitalName', label: 'المرفق الصحي', value: activeInvoice?.hospitalName },
                  { id: 'invoiceNumber', label: 'رقم الفاتورة', value: activeInvoice?.invoiceNumber },
                  { id: 'date', label: 'التاريخ', value: activeInvoice?.date },
                  { id: 'totalAmount', label: 'المبلغ الإجمالي', value: activeInvoice?.amount, isAmount: true },
                  { id: 'currency', label: 'العملة', value: activeInvoice?.currency }
                ].map((field) => (
                  <div 
                    key={field.id}
                    onMouseEnter={() => setHoveredField(field.id)}
                    onMouseLeave={() => setHoveredField(null)}
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group/field",
                      hoveredField === field.id ? "bg-[#FF6B00]/5 border-[#FF6B00]/30 shadow-lg shadow-[#FF6B00]/5" : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.label}</p>
                      <p className={cn(
                        "font-black transition-colors",
                        field.isAmount ? "text-xl text-litcOrange" : "text-slate-900",
                        hoveredField === field.id ? "text-[#FF6B00]" : ""
                      )}>
                        {field.isAmount ? field.value?.toLocaleString() : field.value || '---'}
                        {field.isAmount && <span className="text-xs mr-1">د.ل</span>}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleFieldStatusUpdate(field.id, 'APPROVED')}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          activeInvoice?.fieldStatuses?.[field.id] === 'APPROVED'
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                            : "bg-white text-slate-300 border border-slate-100 hover:border-emerald-500 hover:text-emerald-500"
                        )}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const reason = prompt('سبب الرفض:');
                          if (reason) handleFieldStatusUpdate(field.id, 'REJECTED', reason);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          activeInvoice?.fieldStatuses?.[field.id] === 'REJECTED'
                            ? "bg-red-500 text-white shadow-lg shadow-red-200" 
                            : "bg-white text-slate-300 border border-slate-100 hover:border-red-500 hover:text-red-500"
                        )}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>

             <div className="h-px bg-slate-100 my-6"></div>

             {activeInvoice?.lineItems?.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100/50 hover:border-litcBlue/30 hover:shadow-xl hover:shadow-litcBlue/5 transition-all duration-500 group/item"
                >
                   <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover/item:scale-110 transition-transform">
                            {item.serviceType?.includes('دواء') ? <Pill className="w-6 h-6 text-litcOrange" /> : 
                             item.serviceType?.includes('تحليل') ? <Activity className="w-6 h-6 text-emerald-500" /> :
                             <Stethoscope className="w-6 h-6 text-litcBlue" />}
                         </div>
                         <div>
                            <p className="text-sm sm:text-base font-black text-slate-800 leading-tight">{item.itemName}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="px-2 py-0.5 bg-white rounded-md text-[9px] font-black text-slate-400 border border-slate-100 uppercase tracking-tighter">
                                  {item.serviceType || 'خدمة طبية عامة'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="text-left flex items-center gap-4">
                         <p className="text-lg sm:text-xl font-black text-litcBlue tracking-tighter">
                            {item.price.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 mr-1">د.ل</span>
                         </p>
                         
                         {isAuditor && (
                           <div className="flex items-center gap-2">
                             <button 
                               onClick={() => handleItemStatusUpdate(item.id, 'APPROVED')}
                               className={cn(
                                 "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                 item.status === 'APPROVED' ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border border-slate-100"
                               )}
                             >
                               <Check className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => {
                                 const reason = prompt('سبب الرفض:');
                                 if (reason) handleItemStatusUpdate(item.id, 'REJECTED', reason);
                               }}
                               className={cn(
                                 "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                 item.status === 'REJECTED' ? "bg-red-500 text-white" : "bg-white text-slate-300 border border-slate-100"
                               )}
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                         )}
                      </div>
                   </div>
                </motion.div>
             ))}
          </div>

          {activeInvoice?.ocrData?.auditorComment && (
             <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-[2rem] border border-amber-100/50 flex items-start gap-5 relative overflow-hidden group/comment shadow-sm">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400/50"></div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-amber-100 shrink-0 group-hover/comment:rotate-12 transition-transform">
                   <AlertCircle className="text-amber-500 w-6 h-6" />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">ملاحظة التدقيق الفني</p>
                      <div className="h-px flex-1 bg-amber-200/30"></div>
                   </div>
                   <p className="text-sm sm:text-base font-bold text-slate-700 leading-relaxed italic">
                      "{activeInvoice.ocrData.auditorComment}"
                   </p>
                </div>
             </div>
          )}
        </section>

        {/* Invoice Image Section */}
        <div className={cn(
          "relative group h-full",
          isAuditor ? "xl:col-span-7 order-1 xl:order-1" : ""
        )}>
           <section className="bg-slate-900 rounded-2xl h-[400px] lg:h-full min-h-[600px] relative flex items-center justify-center overflow-hidden border-4 sm:border-8 border-white shadow-xl">
              <div className="w-full h-full flex items-center justify-center transition-transform duration-500 relative" style={{ transform: `scale(${zoomLevel})` }}>
                 <img 
                   ref={imgRef}
                   src={activeInvoice?.imageUrl} 
                   onLoad={updateImageRect}
                   className="max-w-full max-h-full object-contain rounded-xl cursor-zoom-in" 
                   alt="Medical Document" 
                   onClick={() => setIsLightboxOpen(true)}
                 />
                 {isAuditor && renderBoundingBox()}

                 {/* Digital Tamper-proof Seal */}
                 {claim.status === ClaimStatus.PAID && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden">
                     <motion.div 
                       initial={{ scale: 2, opacity: 0, rotate: -45 }}
                       animate={{ scale: 1, opacity: 0.15, rotate: -25 }}
                       className="border-[20px] border-emerald-600 px-20 py-10 rounded-full flex flex-col items-center justify-center"
                     >
                       <span className="text-8xl font-black text-emerald-600 whitespace-nowrap">LITC - FINALIZED</span>
                       <span className="text-4xl font-black text-emerald-600 mt-4">تم الصرف والاعتماد</span>
                       <div className="mt-6 flex items-center gap-4">
                         <ShieldCheck className="w-16 h-16 text-emerald-600" />
                         <span className="text-2xl font-black text-emerald-600">SECURE AI v2.0</span>
                       </div>
                     </motion.div>
                   </div>
                 )}
              </div>
              
              {/* AI Fraud Alert Badge */}
              {isAuditor && (fraudFlags.length > 0 || conflictAlerts.length > 0) && (
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="absolute top-6 left-6 z-40 bg-rose-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">AI Risk Analysis</p>
                    <p className="text-sm font-black">تحذير: مخاطر مكتشفة</p>
                    <div className="mt-2 space-y-1">
                      {fraudFlags.map((flag, i) => (
                        <p key={`fraud-${i}`} className="text-[9px] font-bold text-rose-100 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {flag}
                        </p>
                      ))}
                      {conflictAlerts.map((alert, i) => (
                        <p key={`conflict-${i}`} className="text-[9px] font-bold text-amber-100 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {alert}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
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
                   className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-lg sm:rounded-xl backdrop-blur-xl border border-white/20 transition-all shadow-xl font-black text-[9px] sm:text-xs group ${activeInvoice?.attachmentUrls?.length ? 'ring-2 ring-litcOrange/50 hover:animate-none' : ''}`}
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
      {((isReceptionist && claim.status === ClaimStatus.PENDING_PHYSICAL) ||
        (isDoctor && claim.status === ClaimStatus.PENDING_MEDICAL) ||
        (isDataEntry && claim.status === ClaimStatus.PENDING_FINANCIAL) ||
        (isHead && claim.status === ClaimStatus.PENDING_APPROVAL) ||
        (isAuditor && claim.status === ClaimStatus.PENDING_AUDIT)) && (
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
              {isReceptionist && claim.status === ClaimStatus.PENDING_PHYSICAL && (
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
                    onClick={() => onUpdateStatus(ClaimStatus.PENDING_MEDICAL, `تم استلام الأوراق الورقية ووضعها في الصندوق رقم: ${archiveBoxId}`, { archiveBoxId })} 
                    disabled={!archiveBoxId}
                    className="bg-litcBlue text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-litcDark transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" /> تأكيد استلام الملف الورقي
                  </button>
                  <button 
                    onClick={() => {
                      if (!globalComment.trim()) {
                        alert('يرجى إدخال سبب الرفض في حقل الملاحظات');
                        return;
                      }
                      onUpdateStatus(ClaimStatus.REJECTED, globalComment);
                    }} 
                    className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-rose-600 transition-all flex items-center gap-3"
                  >
                    <XCircle className="w-5 h-5" /> رفض الاستلام
                  </button>
                </div>
              )}

              {isDoctor && claim.status === ClaimStatus.PENDING_MEDICAL && (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-5xl">
                   <button 
                     onClick={() => onUpdateStatus(ClaimStatus.PENDING_FINANCIAL, globalComment || 'تم الاعتماد طبياً')} 
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
                       onUpdateStatus(ClaimStatus.REJECTED, globalComment);
                     }} 
                     className="flex-1 bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3"
                   >
                      <XCircle className="w-5 h-5" /> رفض طبي
                   </button>
                </div>
              )}

              {isDataEntry && claim.status === ClaimStatus.PENDING_FINANCIAL && (
                <button 
                  onClick={() => onUpdateStatus(ClaimStatus.PENDING_APPROVAL, globalComment || 'تمت المعالجة المالية')} 
                  className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
                >
                  <Database className="w-5 h-5" /> إتمام المعالجة المالية
                </button>
              )}

              {isHead && claim.status === ClaimStatus.PENDING_APPROVAL && (
                <button 
                  onClick={() => onUpdateStatus(ClaimStatus.PENDING_AUDIT, globalComment || 'تم الاعتماد النهائي من رئيس الوحدة')} 
                  className="bg-litcBlue text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-litcDark transition-all flex items-center gap-3"
                >
                  <ShieldCheck className="w-5 h-5" /> اعتماد نهائي (رئيس الوحدة)
                </button>
              )}

              {isAuditor && claim.status === ClaimStatus.PENDING_AUDIT && (
                <button 
                  onClick={() => onUpdateStatus(ClaimStatus.PAID, globalComment || 'تم التدقيق الداخلي وتأكيد الصرف')} 
                  className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3"
                >
                  <SearchCheck className="w-5 h-5" /> تأكيد الصرف (التدقيق الداخلي)
                </button>
              )}
           </div>
        </div>
      )}

      {/* Digital Receipt Section for PAID claims */}
      {claim.status === ClaimStatus.PAID && (
        <div className="mt-12">
          <DigitalReceipt claim={claim} user={user} />
        </div>
      )}

      {/* CURVY & FUTURISTIC ROADMAP SECTION (Moved to Bottom) */}
      <div className="mt-12 bg-white/40 backdrop-blur-xl p-6 sm:p-12 rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(8,112,184,0.05)] mb-8 relative overflow-hidden font-cairo">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(0,180,216,0.1)_0%,transparent_70%)]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <SearchCheck className="text-litcBlue w-6 h-6" /> مسار تتبع المعاملة
            </h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">مكتمل</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-litcBlue animate-pulse shadow-[0_0_8px_rgba(0,180,216,0.8)]"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">جاري العمل</span>
               </div>
            </div>
          </div>

          <div className="relative h-[200px] sm:h-[250px] w-full">
            <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00B4D8" />
                  <stop offset="100%" stopColor="#0077B6" />
                </linearGradient>
              </defs>

              {/* Background Path (Pending) */}
              <path 
                d={roadmapPath} 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth="4" 
                strokeDasharray="8,8"
                className="opacity-30"
              />
              
              {/* Completed Path (Green) */}
              <motion.path 
                d={roadmapPath} 
                fill="none" 
                stroke="url(#roadmapGradient)" 
                strokeWidth="6" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: Math.max(0, currentStageIndex / (STAGES.length - 1)) }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              />

              {/* Active Segment Path (Pulsing Blue) */}
              {currentStageIndex < STAGES.length - 1 && (
                <motion.path 
                  d={roadmapPath} 
                  fill="none" 
                  stroke="#00B4D8" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  initial={{ pathLength: 0, pathOffset: 0 }}
                  animate={{ 
                    pathLength: 1 / (STAGES.length - 1),
                    pathOffset: currentStageIndex / (STAGES.length - 1),
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    pathLength: { duration: 1.5, ease: "easeInOut" },
                    pathOffset: { duration: 1.5, ease: "easeInOut" },
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="drop-shadow-[0_0_15px_rgba(0,180,216,0.6)]"
                />
              )}

              {/* Nodes */}
              {STAGES.map((stage, i) => {
                const status = getStageStatus(i);
                const pos = nodes[i];
                const Icon = stage.icon;
                
                return (
                  <g key={stage.id} className="cursor-pointer group">
                    {/* Node Circle */}
                    <motion.circle 
                      cx={pos.x} 
                      cy={pos.y} 
                      r={status === 'active' ? 32 : 24}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className={cn(
                        "transition-all duration-500",
                        status === 'completed' ? "fill-emerald-500 shadow-lg" : 
                        status === 'active' ? "fill-litcBlue shadow-[0_0_30px_rgba(0,180,216,0.6)]" : 
                        "fill-slate-200"
                      )}
                    />

                    {/* Active Pulse Glow */}
                    {status === 'active' && (
                      <motion.circle 
                        cx={pos.x} 
                        cy={pos.y} 
                        r={45}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="fill-litcBlue/20 pointer-events-none"
                      />
                    )}

                    {/* Icon */}
                    <foreignObject x={pos.x - 12} y={pos.y - 12} width="24" height="24" className="pointer-events-none">
                      <div className={cn(
                        "w-full h-full flex items-center justify-center",
                        status === 'pending' ? "text-slate-400" : "text-white"
                      )}>
                        <Icon className={cn(status === 'active' ? "w-6 h-6" : "w-4 h-4")} />
                      </div>
                    </foreignObject>

                    {/* Checkmark for completed */}
                    {status === 'completed' && (
                      <motion.g 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="translate-x-[18px] translate-y-[-18px]"
                      >
                        <circle cx={pos.x} cy={pos.y} r={10} className="fill-white shadow-md" />
                        <motion.path
                          d={`M ${pos.x - 4} ${pos.y} l 3 3 l 5 -5`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.5, duration: 0.4 }}
                        />
                      </motion.g>
                    )}

                    {/* Floating Labels (Above) */}
                    <foreignObject x={pos.x - 60} y={pos.y - 90} width="120" height="40">
                      <div className="flex flex-col items-center justify-center">
                        <div className={cn(
                          "px-3 py-1 rounded-full backdrop-blur-md border text-[10px] font-black whitespace-nowrap transition-all duration-500 shadow-sm",
                          status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                          status === 'active' ? "bg-litcBlue/10 border-litcBlue/20 text-litcBlue scale-110 shadow-lg" :
                          "bg-slate-100/50 border-slate-200 text-slate-400"
                        )}>
                          {stage.label}
                        </div>
                      </div>
                    </foreignObject>

                    {/* Floating Time (Below) */}
                    <foreignObject x={pos.x - 60} y={pos.y + 60} width="120" height="40">
                      <div className="flex flex-col items-center justify-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all duration-500 shadow-sm border",
                          status === 'completed' ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                          status === 'active' ? "text-litcBlue bg-litcBlue/5 border-litcBlue/10" :
                          "text-slate-400 bg-slate-50 border-slate-100"
                        )}>
                          {status === 'completed' ? 'تم الإنجاز' : status === 'active' ? 'جاري العمل' : 'في الانتظار'}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

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
