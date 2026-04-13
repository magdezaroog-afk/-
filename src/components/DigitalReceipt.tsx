import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Claim, User } from '../types';
import { motion } from 'motion/react';
import { Download, Printer, ShieldCheck, CheckCircle2, FileText, User as UserIcon, Calendar, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';

interface DigitalReceiptProps {
  claim: Claim;
  user: User;
}

const DigitalReceipt: React.FC<DigitalReceiptProps> = ({ claim, user }) => {
  const qrData = JSON.stringify({
    id: claim.id,
    amount: claim.totalAmount,
    date: claim.submissionDate,
    employeeId: claim.employeeId
  });

  const downloadPDF = () => {
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
    doc.text('LITC - OFFICIAL MEDICAL RECEIPT', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('AI-VERIFIED HEALTHCARE REIMBURSEMENT SYSTEM', 105, 30, { align: 'center' });

    // Claim Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Claim Summary', 20, 55);
    
    doc.setFontSize(12);
    doc.text(`Claim ID: ${claim.id}`, 20, 65);
    doc.text(`Employee Name: ${claim.employeeName}`, 20, 72);
    doc.text(`Submission Date: ${claim.submissionDate}`, 20, 79);
    doc.text(`Total Amount: ${claim.totalAmount.toLocaleString()} LYD`, 20, 86);
    doc.text(`Status: ${claim.status}`, 20, 93);

    // Audit History
    doc.setFontSize(16);
    doc.text('Audit History', 20, 110);
    
    let y = 120;
    claim.history.forEach((h, i) => {
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${h.status} - Performed by ${h.performedByRole} at ${new Date(h.timestamp).toLocaleString()}`, 25, y);
      y += 8;
    });

    // Footer with Verification Note
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a digitally generated receipt. Verified by LITC AI Audit Engine.', 105, 280, { align: 'center' });
    doc.text(`Verification Hash: ${btoa(qrData).substring(0, 32)}`, 105, 285, { align: 'center' });

    doc.save(`LITC-Receipt-${claim.id}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-xl relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 text-right">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">إيصال صرف رقمي معتمد</h3>
              <p className="text-sm font-bold text-slate-400">Digital Official Receipt</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رقم المعاملة</p>
              <p className="font-black text-slate-900">#{claim.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ المصروف</p>
              <p className="font-black text-emerald-600 text-xl">{claim.totalAmount.toLocaleString()} د.ل</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اسم الموظف</p>
              <p className="font-black text-slate-900">{claim.employeeName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ الصرف</p>
              <p className="font-black text-slate-900">{new Date().toLocaleDateString('ar-LY')}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <button 
              onClick={downloadPDF}
              className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" /> تحميل التقرير الرسمي (PDF)
            </button>
            <button 
              className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
              onClick={() => window.print()}
            >
              <Printer className="w-5 h-5" /> طباعة
            </button>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100">
            <QRCodeSVG value={qrData} size={256} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={true} />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">رمز التحقق السريع</p>
            <p className="text-[9px] font-bold text-slate-400 max-w-[180px]">امسح الرمز للتحقق من صحة الإيصال عبر نظام LITC</p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] font-black">تم التحقق بواسطة محرك الذكاء الاصطناعي LITC</span>
        </div>
        <span className="text-[10px] font-bold text-slate-300">SECURITY_HASH: {btoa(claim.id).substring(0, 12)}</span>
      </div>
    </motion.div>
  );
};

export default DigitalReceipt;
