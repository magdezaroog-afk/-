
import React from 'react';
import { 
  LayoutDashboard, FileText, UserCircle, Settings, 
  CheckCircle2, XCircle, Clock, RotateCcw,
  Stethoscope, ShieldCheck, Database, BarChart3,
  SearchCheck, PlusCircle, BrainCircuit, Search
} from 'lucide-react';
import { UserRole, ClaimStatus } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.EMPLOYEE]: 'موظف',
  [UserRole.DOCTOR]: 'دكتور مراجع',
  [UserRole.HEAD_OF_UNIT]: 'رئيس وحدة الرعاية',
  [UserRole.DATA_ENTRY]: 'مدخل بيانات فني',
  [UserRole.AUDITOR]: 'مكتب المراجعة',
  [UserRole.ADMIN]: 'الإدارة العليا',
};

export const STATUS_UI: Record<ClaimStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [ClaimStatus.PENDING_DR]: { label: 'بانتظار الدكتور', color: 'text-amber-600 bg-amber-50', icon: <Stethoscope className="w-4 h-4" /> },
  [ClaimStatus.PENDING_HEAD]: { label: 'بانتظار رئيس الوحدة', color: 'text-litcBlue bg-blue-50', icon: <ShieldCheck className="w-4 h-4" /> },
  [ClaimStatus.PENDING_DATA_ENTRY]: { label: 'بانتظار الإدخال الفني', color: 'text-litcBlue bg-blue-50', icon: <Database className="w-4 h-4" /> },
  [ClaimStatus.PENDING_AUDIT]: { label: 'بانتظار المراجعة النهائية', color: 'text-purple-600 bg-purple-50', icon: <SearchCheck className="w-4 h-4" /> },
  [ClaimStatus.RETURNED_TO_DR]: { label: 'معاد للدكتور', color: 'text-orange-600 bg-orange-50', icon: <RotateCcw className="w-4 h-4" /> },
  [ClaimStatus.RETURNED_TO_EMPLOYEE]: { label: 'معاد للموظف', color: 'text-rose-600 bg-rose-50', icon: <RotateCcw className="w-4 h-4" /> },
  [ClaimStatus.APPROVED]: { label: 'تم الاعتماد النهائي', color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4" /> },
  [ClaimStatus.REJECTED]: { label: 'مرفوض', color: 'text-red-600 bg-red-50', icon: <XCircle className="w-4 h-4" /> },
};

export const NAV_ITEMS: Record<UserRole, { label: string; icon: React.ReactNode; path: string }[]> = {
  [UserRole.EMPLOYEE]: [
    { label: 'الرئيسية', icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
    { label: 'الملف الصحي الذكي', icon: <BrainCircuit className="w-5 h-5" />, path: 'profile' },
    { label: 'العيادة الذكية', icon: <Stethoscope className="w-5 h-5" />, path: 'smart-clinic' },
    { label: 'طلب جديد', icon: <PlusCircle className="w-5 h-5" />, path: 'submit-claim' },
    { label: 'الأرشيف والبحث', icon: <Search className="w-5 h-5" />, path: 'archive' },
  ],
  [UserRole.DOCTOR]: [
    { label: 'الرئيسية', icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.HEAD_OF_UNIT]: [
    { label: 'توزيع المهام', icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.DATA_ENTRY]: [
    { label: 'لوحة العمل', icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.AUDITOR]: [
    { label: 'لوحة المراجعة', icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.ADMIN]: [
    { label: 'التقارير الشاملة', icon: <BarChart3 className="w-5 h-5" />, path: 'admin-dashboard' },
  ],
};
