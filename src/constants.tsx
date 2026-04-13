
import React from 'react';
import { 
  LayoutDashboard, FileText, UserCircle, Settings, 
  CheckCircle2, XCircle, Clock, RotateCcw,
  Stethoscope, ShieldCheck, Database, BarChart3,
  SearchCheck, PlusCircle, BrainCircuit, Search, CreditCard, HeartPulse, AlertCircle,
  Home, User, Plus, History, Activity, Shield, Users
} from 'lucide-react';
import { UserRole, ClaimStatus } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.EMPLOYEE]: 'موظف',
  [UserRole.RECEPTIONIST]: 'موظف استقبال',
  [UserRole.DOCTOR]: 'طبيب مراجع',
  [UserRole.DATA_ENTRY]: 'مدخل بيانات مالي',
  [UserRole.HEAD_OF_UNIT]: 'رئيس الوحدة',
  [UserRole.INTERNAL_AUDITOR]: 'مدقق داخلي',
  [UserRole.MANAGER]: 'مدير تنفيذي',
  [UserRole.ADMIN]: 'مدير النظام',
  [UserRole.SYSTEM_ADMIN]: 'مسؤول النظام (⚙️)',
};

export const STATUS_UI: Record<ClaimStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [ClaimStatus.DRAFT]: { label: 'مسودة', color: 'text-slate-600 bg-slate-50', icon: <FileText className="w-4 h-4" /> },
  [ClaimStatus.PENDING_PHYSICAL]: { label: 'بانتظار استلام الأوراق', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-4 h-4" /> },
  [ClaimStatus.PENDING_MEDICAL]: { label: 'بانتظار المراجعة الطبية', color: 'text-blue-600 bg-blue-50', icon: <Stethoscope className="w-4 h-4" /> },
  [ClaimStatus.PENDING_FINANCIAL]: { label: 'بانتظار المعالجة المالية', color: 'text-indigo-600 bg-indigo-50', icon: <Database className="w-4 h-4" /> },
  [ClaimStatus.PENDING_APPROVAL]: { label: 'بانتظار اعتماد رئيس الوحدة', color: 'text-litcBlue bg-blue-50', icon: <ShieldCheck className="w-4 h-4" /> },
  [ClaimStatus.PENDING_AUDIT]: { label: 'بانتظار التدقيق الداخلي', color: 'text-purple-600 bg-purple-50', icon: <SearchCheck className="w-4 h-4" /> },
  [ClaimStatus.PAID]: { label: 'تم الصرف', color: 'text-emerald-600 bg-emerald-50', icon: <CreditCard className="w-4 h-4" /> },
  [ClaimStatus.REJECTED]: { label: 'مرفوض', color: 'text-red-600 bg-red-50', icon: <XCircle className="w-4 h-4" /> },
  [ClaimStatus.PARTIALLY_REJECTED]: { label: 'مرفوض جزئياً', color: 'text-orange-600 bg-orange-50', icon: <AlertCircle className="w-4 h-4" /> },
};

export const NAV_ITEMS: Record<UserRole, { label: string; icon: React.ReactNode; path: string }[]> = {
  [UserRole.EMPLOYEE]: [
    { label: 'الرئيسية', icon: <Home className="w-5 h-5" />, path: 'dashboard' },
    { label: 'طلباتي', icon: <FileText className="w-5 h-5" />, path: 'dashboard' },
    { label: 'ملفي الصحي', icon: <UserCircle className="w-5 h-5" />, path: 'profile' },
    { label: 'الأرشيف', icon: <History className="w-5 h-5" />, path: 'archive' },
  ],
  [UserRole.RECEPTIONIST]: [
    { label: 'استقبال الأوراق', icon: <FileText className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.DOCTOR]: [
    { label: 'المراجعة الطبية', icon: <Stethoscope className="w-5 h-5" />, path: 'dashboard' },
    { label: 'الأمراض المزمنة', icon: <HeartPulse className="w-5 h-5" />, path: 'chronic-enrollment' },
  ],
  [UserRole.DATA_ENTRY]: [
    { label: 'المعالجة المالية', icon: <Database className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.HEAD_OF_UNIT]: [
    { label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" />, path: 'dashboard' },
    { label: 'توزيع المهام', icon: <Users className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.ADMIN]: [
    { label: 'المستخدمين', icon: <Users className="w-5 h-5" />, path: 'admin-dashboard' },
    { label: 'التقارير', icon: <BarChart3 className="w-5 h-5" />, path: 'admin-dashboard' },
  ],
  [UserRole.SYSTEM_ADMIN]: [
    { label: 'إدارة النظام', icon: <Settings className="w-5 h-5" />, path: 'dashboard' },
    { label: 'سجل العمليات', icon: <History className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.INTERNAL_AUDITOR]: [
    { label: 'التدقيق الداخلي', icon: <SearchCheck className="w-5 h-5" />, path: 'dashboard' },
  ],
  [UserRole.MANAGER]: [
    { label: 'التحليل التنفيذي', icon: <BarChart3 className="w-5 h-5" />, path: 'dashboard' },
  ],
};
