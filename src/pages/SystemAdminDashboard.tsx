
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Settings, 
  Users, 
  Shield, 
  Activity, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock,
  History,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SystemAdminDashboardProps {
  user: User;
  users: User[];
  onUpdateUser: (updatedUser: User) => Promise<void>;
  onLogAction: (action: string, details: string) => void;
}

const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({ 
  user, 
  users, 
  onUpdateUser,
  onLogAction 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempRoles, setTempRoles] = useState<UserRole[]>([]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManageRoles = (u: User) => {
    setSelectedUser(u);
    setTempRoles(u.roles || [u.role]);
    setIsModalOpen(true);
  };

  const toggleRole = (role: UserRole) => {
    setTempRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    
    const updatedUser = {
      ...selectedUser,
      roles: tempRoles,
      // Ensure primary role is one of the selected roles, or fallback to first
      role: tempRoles.includes(selectedUser.role) ? selectedUser.role : tempRoles[0] || UserRole.EMPLOYEE
    };

    await onUpdateUser(updatedUser);
    onLogAction('تغيير الصلاحيات', `تم تحديث أدوار المستخدم ${selectedUser.name} إلى: ${tempRoles.join(', ')}`);
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = async (u: User) => {
    const updatedUser = {
      ...u,
      isActive: u.isActive === false ? true : false
    };
    await onUpdateUser(updatedUser);
    onLogAction(
      updatedUser.isActive ? 'تنشيط حساب' : 'تعطيل حساب', 
      `تم ${updatedUser.isActive ? 'تنشيط' : 'تعطيل'} حساب المستخدم ${u.name}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-cairo" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-litcBlue/20 rounded-xl flex items-center justify-center border border-litcBlue/30 shadow-[0_0_20px_rgba(0,92,132,0.2)]">
              <Settings className="w-6 h-6 text-litcBlue" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">لوحة تحكم مسؤول النظام</h1>
          </div>
          <p className="text-sm text-slate-400 font-medium">إدارة المستخدمين، الصلاحيات، ومراقبة سجلات النظام.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي المستخدمين</p>
              <p className="text-xl font-black text-white">{users.length}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-litcBlue/10 rounded-xl flex items-center justify-center text-litcBlue">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نشط حالياً</p>
              <p className="text-xl font-black text-white">{users.filter(u => u.isActive !== false).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Management Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Users className="text-litcBlue w-6 h-6" /> إدارة المستخدمين
            </h2>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-litcBlue outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-800/30 border-b border-slate-800">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">الموظف</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">الأدوار الحالية</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">الحالة</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-700">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{u.name}</p>
                            <p className="text-[10px] font-bold text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {(u.roles || [u.role]).map((r, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[9px] font-black border border-slate-700">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {u.isActive !== false ? (
                          <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black">نشط</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-500">
                            <XCircle className="w-4 h-4" />
                            <span className="text-[10px] font-black">معطل</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleManageRoles(u)}
                            className="px-3 py-2 bg-litcBlue/10 text-litcBlue rounded-xl text-[10px] font-black hover:bg-litcBlue hover:text-white transition-all border border-litcBlue/20"
                          >
                            إدارة الأدوار
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(u)}
                            className={`p-2 rounded-xl transition-all border ${
                              u.isActive !== false 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                            }`}
                            title={u.isActive !== false ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                          >
                            {u.isActive !== false ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

        {/* System Logs */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <History className="text-amber-500 w-6 h-6" /> سجل النظام
          </h2>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 space-y-4 max-h-[700px] overflow-y-auto scrollbar-hide">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-1 bg-litcBlue/10 text-litcBlue rounded-lg text-[9px] font-black border border-litcBlue/20">
                    تغيير صلاحيات
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">منذ 10 دقائق</span>
                </div>
                <p className="text-[11px] font-bold text-slate-300">تم تحديث أدوار المستخدم أحمد علي إلى: موظف، مستقبل بيانات</p>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                  <Activity className="w-3 h-3" />
                  <span>بواسطة: مسؤول النظام</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Management Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-white">إدارة أدوار المستخدم</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">{selectedUser.name}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-8 space-y-4">
                {[
                  { id: UserRole.EMPLOYEE, label: 'الموظف (Personal View)', desc: 'الوصول الافتراضي لجميع الموظفين' },
                  { id: UserRole.RECEPTIONIST, label: 'مستقبل البيانات (Receiver)', desc: 'استلام الأصول الورقية ومطابقتها' },
                  { id: UserRole.DATA_ENTRY, label: 'مدخل البيانات (Data Entry)', desc: 'الفهرسة المالية ومعالجة الفواتير' },
                  { id: UserRole.DOCTOR, label: 'الطبيب المراجع (Medical Auditor)', desc: 'المراجعة الطبية والتدقيق الفني' },
                  { id: UserRole.HEAD_OF_UNIT, label: 'رئيس الوحدة (Unit Head)', desc: 'الاعتماد النهائي وإدارة الوحدة' },
                  { id: UserRole.SYSTEM_ADMIN, label: 'مسؤول النظام (System Admin)', desc: 'إدارة الصلاحيات وإعدادات النظام' },
                ].map((role) => (
                  <label 
                    key={role.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      tempRoles.includes(role.id) 
                        ? 'bg-litcBlue/10 border-litcBlue/30' 
                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      tempRoles.includes(role.id) 
                        ? 'bg-litcBlue border-litcBlue' 
                        : 'border-slate-700'
                    }`}>
                      {tempRoles.includes(role.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={tempRoles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    <div>
                      <p className="text-xs font-black text-white">{role.label}</p>
                      <p className="text-[10px] font-bold text-slate-500">{role.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="p-8 bg-slate-800/30 flex gap-4">
                <button 
                  onClick={saveRoles}
                  className="flex-1 py-4 bg-litcBlue text-white rounded-2xl font-black text-sm shadow-lg shadow-litcBlue/20 hover:bg-litcDark transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> حفظ التغييرات
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-700 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
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
      `}} />
    </div>
  );
};

export default SystemAdminDashboard;
