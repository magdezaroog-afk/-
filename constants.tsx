
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
  [UserRole.AUDITOR]: 'مكتب المراجعة والتدقيق',
  [UserRole.ADMIN]: 'الإدارة العليا',
};

export const STATUS_UI: Record<ClaimStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [ClaimStatus.PENDING_DR]: { label: 'بانتظار الدكتور', color: 'text-amber-600 bg-amber-50', icon: <Stethoscope size={16} /> },
  [ClaimStatus.PENDING_HEAD]: { label: 'بانتظار رئيس الوحدة', color: 'text-litcBlue bg-blue-50', icon: <ShieldCheck size={16} /> },
  [ClaimStatus.PENDING_DATA_ENTRY]: { label: 'بانتظار الإدخال الفني', color: 'text-litcBlue bg-blue-50', icon: <Database size={16} /> },
  [ClaimStatus.PENDING_AUDIT]: { label: 'بانتظار المراجعة النهائية', color: 'text-purple-600 bg-purple-50', icon: <SearchCheck size={16} /> },
  [ClaimStatus.RETURNED_TO_DR]: { label: 'معاد للدكتور', color: 'text-orange-600 bg-orange-50', icon: <RotateCcw size={16} /> },
  [ClaimStatus.RETURNED_TO_EMPLOYEE]: { label: 'معاد للموظف', color: 'text-rose-600 bg-rose-50', icon: <RotateCcw size={16} /> },
  [ClaimStatus.APPROVED]: { label: 'تم الاعتماد النهائي', color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle2 size={16} /> },
  [ClaimStatus.REJECTED]: { label: 'مرفوض', color: 'text-red-600 bg-red-50', icon: <XCircle size={16} /> },
};

export const NAV_ITEMS: Record<UserRole, { label: string; icon: React.ReactNode; path: string }[]> = {
  [UserRole.EMPLOYEE]: [
    { label: 'العيادة الذكية', icon: <BrainCircuit size={20} />, path: 'dashboard' },
    { label: 'الأرشيف والبحث', icon: <Search size={20} />, path: 'archive' },
    { label: 'طلب جديد', icon: <PlusCircle size={20} />, path: 'submit-claim' },
  ],
  [UserRole.DOCTOR]: [
    { label: 'الرئيسية', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  ],
  [UserRole.HEAD_OF_UNIT]: [
    { label: 'توزيع المهام', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  ],
  [UserRole.DATA_ENTRY]: [
    { label: 'لوحة العمل', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  ],
  [UserRole.AUDITOR]: [
    { label: 'لوحة المراجعة', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  ],
  [UserRole.ADMIN]: [
    { label: 'التقارير الشاملة', icon: <BarChart3 size={20} />, path: 'admin-dashboard' },
  ],
};
