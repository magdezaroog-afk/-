
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Edit2,
  Trash2,
  Mail,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { ROLE_LABELS } from '../constants';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<UserRole | 'ALL'>('ALL');
  const [showAddUser, setShowAddUser] = useState(false);

  // Mock users for UI
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'أحمد علي', email: 'ahmed@litc.ly', role: UserRole.ADMIN, department: 'تقنية المعلومات', jobTitle: 'مدير النظام' },
    { id: '2', name: 'سارة محمد', email: 'sara@litc.ly', role: UserRole.DOCTOR, department: 'المراجعة الطبية', jobTitle: 'طبيب مراجع' },
    { id: '3', name: 'يحيى قرقاب', email: 'yahya@litc.ly', role: UserRole.DATA_ENTRY, department: 'وحدة الصيدليات', jobTitle: 'مدخل بيانات مالي' },
    { id: '4', name: 'محمود الدعوكي', email: 'mahmoud@litc.ly', role: UserRole.DATA_ENTRY, department: 'وحدة المستشفيات', jobTitle: 'مدخل بيانات مالي' },
    { id: '5', name: 'عباس طنيش', email: 'abbas@litc.ly', role: UserRole.DATA_ENTRY, department: 'وحدة العيادات والمختبرات', jobTitle: 'مدخل بيانات مالي' },
    { id: '6', name: 'محمد خالد', email: 'khaled@litc.ly', role: UserRole.RECEPTIONIST, department: 'الاستقبال', jobTitle: 'مستقبل بيانات' },
  ]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.includes(searchTerm) || u.email.includes(searchTerm);
    const matchesFilter = activeFilter === 'ALL' || u.role === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <ShieldCheck className="w-4 h-4 text-litcBlue" />;
      case UserRole.DOCTOR: return <Shield className="w-4 h-4 text-emerald-600" />;
      case UserRole.HEAD_OF_UNIT: return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default: return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 sm:px-0">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="البحث عن مستخدم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pr-12 pl-6 font-bold text-sm outline-none focus:border-litcBlue shadow-sm transition-all"
            />
          </div>
          <button className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-litcBlue shadow-sm transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="w-full sm:w-auto bg-litcBlue text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-litcDark transition-all flex items-center justify-center gap-3"
        >
          <UserPlus className="w-5 h-5" /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-4 sm:px-0">
        <button 
          onClick={() => setActiveFilter('ALL')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all border ${activeFilter === 'ALL' ? 'bg-litcBlue text-white border-litcBlue shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
        >
          الكل
        </button>
        {Object.values(UserRole).map(role => (
          <button 
            key={role}
            onClick={() => setActiveFilter(role)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all border ${activeFilter === role ? 'bg-litcBlue text-white border-litcBlue shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الدور</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">القسم</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:scale-110 transition-transform">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{u.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(u.role)}
                      <span className="text-xs font-black text-slate-600">{ROLE_LABELS[u.role]}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-bold">{u.department}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black">نشط</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-litcBlue hover:bg-white rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
