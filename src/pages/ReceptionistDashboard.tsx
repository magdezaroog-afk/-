
import React, { useState, useEffect } from 'react';
import { Claim, User, ClaimStatus } from '../types';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search, 
  Eye, 
  PackageCheck,
  ClipboardCheck,
  AlertCircle,
  QrCode,
  Printer,
  ChevronRight,
  Circle
} from 'lucide-react';
import { STATUS_UI } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface ReceptionistDashboardProps {
  user: User;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onGrab: (claimId: string) => void;
  onUpdateStatus: (status: ClaimStatus, comment?: string, extraData?: any) => Promise<void>;
}

const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({ 
  user, 
  claims, 
  onSelectClaim, 
  onGrab,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Pool of claims waiting for paper receipt
  const poolClaims = claims.filter(c => !c.assignedToId && c.status === ClaimStatus.PENDING_PHYSICAL);
  // Claims assigned to this receptionist
  const myTasks = claims.filter(c => c.assignedToId === user.id && c.status === ClaimStatus.PENDING_PHYSICAL);
  // Completed today
  const completedToday = claims.filter(c => 
    c.assignedToId === user.id && 
    c.status !== ClaimStatus.PENDING_PHYSICAL &&
    c.auditTrail.some(a => a.action.includes(ClaimStatus.PENDING_MEDICAL) && a.timestamp.includes(new Date().toLocaleDateString('ar-LY')))
  ).length;

  const filteredPool = poolClaims.filter(c => 
    c.employeeName.includes(searchTerm) || 
    c.referenceNumber.includes(searchTerm) ||
    c.id.includes(searchTerm)
  );

  const handleReceive = async (claim: Claim) => {
    onSelectClaim(claim);
    
    const timestamp = new Date().toISOString();
    await onUpdateStatus(
      ClaimStatus.PENDING_MEDICAL, 
      'تم استلام الأصول الورقية ومطابقتها بنجاح',
      { paperReceivedAt: timestamp }
    );

    setShowSuccess(claim.id);
    
    // Auto-select next claim
    const nextClaim = myTasks.find(c => c.id !== claim.id);
    if (nextClaim) {
      setTimeout(() => {
        onSelectClaim(nextClaim);
      }, 500);
    }

    setTimeout(() => setShowSuccess(null), 5000);
  };

  return (
    <div className="relative min-h-screen pb-20 font-cairo" dir="rtl">
      {/* Floating QR Scanner Button */}
      <button 
        onClick={() => setIsScanning(true)}
        className="fixed bottom-8 left-8 z-50 flex items-center gap-3 px-6 py-4 bg-litcBlue text-white rounded-2xl shadow-[0_20px_50px_rgba(0,92,132,0.3)] hover:scale-105 hover:bg-litcDark transition-all duration-500 group"
      >
        <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="font-black text-sm">مسح رمز QR</span>
      </button>

      {/* Minimalist Glowing Stats Header */}
      <div className="flex justify-center mb-12">
        <div className="bg-white/40 backdrop-blur-md border border-white/60 px-8 py-3 rounded-full flex items-center gap-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-litcBlue animate-pulse shadow-[0_0_8px_rgba(0,92,132,0.8)]"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اليوم</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-500">تم الاستلام:</span>
            <span className="text-sm font-black text-litcBlue">{completedToday || 24}</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-500">قيد الانتظار:</span>
            <span className="text-sm font-black text-litcOrange">{poolClaims.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: My Tasks (Focused List) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-litcOrange" /> مهامي الحالية
            </h2>
            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">
              {myTasks.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {myTasks.map((claim) => (
              <motion.div 
                layout
                key={claim.id}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">#{claim.id.slice(-6)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{claim.employeeName}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                    <PackageCheck className="w-3 h-3" />
                    <span>{claim.invoiceCount} فواتير</span>
                  </div>
                  <button 
                    onClick={() => handleReceive(claim)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-litcBlue transition-all"
                  >
                    تأكيد الاستلام
                  </button>
                </div>
              </motion.div>
            ))}
            {myTasks.length === 0 && (
              <div className="p-10 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-400">لا توجد مهام مسحوبة حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Global Pool (Incoming Queue) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <ClipboardCheck className="text-litcBlue w-6 h-6" /> الطابور العام
            </h2>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث سريع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-litcBlue outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,92,132,0.05)] overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعاملة</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPool.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">#{claim.referenceNumber}</span>
                          <span className="text-[9px] font-bold text-slate-400">{claim.submissionDate}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                            {claim.employeeName.charAt(0)}
                          </div>
                          <p className="text-xs font-black text-slate-900">{claim.employeeName}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Circle className="w-2 h-2 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-bold text-slate-400">بانتظار الورق</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => onGrab(claim.id)}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-litcBlue hover:text-white transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast with Print Action */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 left-8 sm:left-auto sm:w-96 z-[60] bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black">تم الاستلام بنجاح!</p>
                <p className="text-[10px] text-slate-400 font-bold">المعاملة جاهزة الآن للمرحلة التالية.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> طباعة ملصق التتبع
              </button>
              <button 
                onClick={() => setShowSuccess(null)}
                className="px-4 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Overlay Mock */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="relative w-72 h-72 border-2 border-litcBlue/50 rounded-[3rem] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-litcBlue/20 to-transparent animate-scan"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-white/20" />
              </div>
            </div>
            <h3 className="text-xl font-black text-white mt-12">جاري مسح الرمز...</h3>
            <p className="text-sm text-slate-400 font-medium mt-2">ضع رمز QR الخاص بالمعاملة داخل الإطار</p>
            <button 
              onClick={() => setIsScanning(false)}
              className="mt-12 px-8 py-3 bg-white/10 text-white rounded-2xl font-black text-xs hover:bg-white/20 transition-all"
            >
              إلغاء المسح
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}} />
    </div>
  );
};

export default ReceptionistDashboard;
