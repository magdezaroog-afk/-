
import React, { useState } from 'react';
import { User, ChronicApplication } from '../types';
import { 
  HeartPulse, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar, 
  User as UserIcon,
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChronicEnrollmentProps {
  user: User;
  applications: ChronicApplication[];
  onUpdate: (appId: string, status: 'APPROVED' | 'REJECTED', notes: string, expiryDate?: string) => void;
}

const ChronicEnrollment: React.FC<ChronicEnrollmentProps> = ({ user, applications, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<ChronicApplication | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDecision = () => {
    if (!selectedApp || !decisionType) return;
    if (decisionType === 'REJECTED' && !decisionNotes.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }
    if (decisionType === 'APPROVED' && !expiryDate) {
      alert('يرجى تحديد تاريخ انتهاء الصلاحية');
      return;
    }

    onUpdate(selectedApp.id, decisionType, decisionNotes, expiryDate);
    setShowDecisionModal(false);
    setSelectedApp(null);
    setDecisionNotes('');
    setExpiryDate('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 font-cairo" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <HeartPulse className="text-rose-500 w-8 h-8 sm:w-10 sm:h-10" /> طلبات الأمراض المزمنة
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-2">مراجعة واعتماد طلبات التسجيل في منظومة الأمراض المزمنة.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors w-5 h-5" />
            <input 
              type="text" 
              placeholder="بحث باسم الموظف أو المستفيد..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-2xl py-3 pr-12 pl-6 font-bold text-sm focus:outline-none focus:border-rose-500 transition-all shadow-sm w-full sm:w-64"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4.5 h-4.5" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-2xl py-3 pr-12 pl-6 font-bold text-sm focus:outline-none appearance-none cursor-pointer shadow-sm w-full"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="PENDING">قيد المراجعة</option>
              <option value="APPROVED">تم الاعتماد</option>
              <option value="REJECTED">مرفوض</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:px-0">
        {filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <motion.div 
              layout
              key={app.id}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group"
            >
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                  app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                  app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <UserIcon className="w-8 h-8" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-slate-900 truncate">{app.beneficiaryName}</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {app.relationship === 'SELF' ? 'الموظف نفسه' : app.relationship}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mb-2">الموظف: {app.employeeName} • #{app.id.slice(-6)}</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> {app.submissionDate}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                      <AlertCircle className="w-3.5 h-3.5" /> {app.diagnosis}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 ${
                    app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                    app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {app.status === 'APPROVED' ? <CheckCircle className="w-3.5 h-3.5" /> :
                     app.status === 'REJECTED' ? <XCircle className="w-3.5 h-3.5" /> :
                     <Clock className="w-3.5 h-3.5" />}
                    {app.status === 'APPROVED' ? 'معتمد' :
                     app.status === 'REJECTED' ? 'مرفوض' : 'قيد الانتظار'}
                  </span>
                  {app.expiryDate && (
                    <p className="text-[9px] font-bold text-slate-400 mt-1">ينتهي في: {app.expiryDate}</p>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedApp(app)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-inner"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-slate-300">
            <Search className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-black text-slate-400">لا توجد طلبات مطابقة</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 sm:p-10 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">تفاصيل طلب التسجيل</h2>
                  <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <XCircle className="text-slate-400 w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المستفيد</p>
                      <p className="text-sm font-black text-slate-900">{selectedApp.beneficiaryName}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الموظف</p>
                      <p className="text-sm font-black text-slate-900">{selectedApp.employeeName}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">التشخيص</p>
                      <p className="text-sm font-black text-rose-500">{selectedApp.diagnosis}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ التقديم</p>
                      <p className="text-sm font-black text-slate-900">{selectedApp.submissionDate}</p>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-500" /> المرفقات الطبية
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedApp.attachments.map((url, idx) => (
                        <a 
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square bg-slate-100 rounded-2xl border-2 border-slate-200 flex items-center justify-center hover:border-rose-500 transition-all group overflow-hidden"
                        >
                          <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Decision Section */}
                  {selectedApp.status === 'PENDING' && (
                    <div className="pt-6 border-t border-slate-100 space-y-6">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => { setDecisionType('APPROVED'); setShowDecisionModal(true); }}
                          className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" /> اعتماد الطلب
                        </button>
                        <button 
                          onClick={() => { setDecisionType('REJECTED'); setShowDecisionModal(true); }}
                          className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" /> رفض الطلب
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedApp.doctorNotes && (
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                      <h4 className="text-xs font-black text-amber-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> ملاحظات اللجنة الطبية
                      </h4>
                      <p className="text-sm font-bold text-amber-900 leading-relaxed">{selectedApp.doctorNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decision Input Modal */}
      <AnimatePresence>
        {showDecisionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDecisionModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative z-10"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">
                {decisionType === 'APPROVED' ? 'تأكيد الاعتماد' : 'تأكيد الرفض'}
              </h3>
              
              <div className="space-y-6">
                {decisionType === 'APPROVED' && (
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">تاريخ انتهاء الصلاحية</label>
                    <input 
                      type="date" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ملاحظات إضافية</label>
                  <textarea 
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder={decisionType === 'REJECTED' ? 'يرجى توضيح سبب الرفض بالتفصيل...' : 'ملاحظات اختيارية...'}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-sm focus:outline-none focus:border-rose-500 transition-all h-32 resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleDecision}
                    className={`flex-1 py-4 rounded-2xl font-black text-sm text-white ${
                      decisionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'
                    } transition-all`}
                  >
                    تأكيد القرار
                  </button>
                  <button 
                    onClick={() => setShowDecisionModal(false)}
                    className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChronicEnrollment;
