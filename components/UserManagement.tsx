
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ROLE_LABELS } from '../constants';
import { 
  UserPlus, Search, Shield, Mail, Key, Trash2, 
  CheckCircle, AlertCircle, Loader2, X, Edit2
} from 'lucide-react';
import { collection, onSnapshot, query, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.EMPLOYEE,
    department: '',
    jobTitle: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userId = editingUser?.id || `USER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const userData: User = {
        ...formData,
        id: userId,
        healthProfile: editingUser?.healthProfile || {
          bloodType: '', height: 0, weight: 0, age: 0, chronicDiseases: [], pathway: 'healthy', dailyWaterIntake: 0
        }
      };

      await setDoc(doc(db, 'users', userId), userData);
      setModalOpen(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: UserRole.EMPLOYEE, department: '', jobTitle: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      jobTitle: user.jobTitle || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-litcBlue transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="البحث عن مستخدم..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pr-14 pl-6 font-bold text-sm outline-none focus:border-litcBlue focus:ring-4 focus:ring-litcBlue/5 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', role: UserRole.EMPLOYEE, department: '', jobTitle: '' });
            setModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-litcBlue text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-litcDark transition-all shadow-xl shadow-litcBlue/20"
        >
          <UserPlus className="w-5 h-5" /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الدور الوظيفي</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">القسم</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-litcBlue to-litcDark flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{u.name}</p>
                        <p className="text-xs font-bold text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-litcBlue/5 text-litcBlue rounded-full text-[10px] font-black border border-litcBlue/10 flex items-center gap-2 w-fit">
                      <Shield className="w-3 h-3" /> {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-600">{u.department || '—'}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{u.jobTitle || '—'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-3 bg-slate-50 text-slate-400 hover:bg-litcBlue hover:text-white rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-litcBlue/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <h3 className="text-2xl font-black text-litcBlue">
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم بالكامل</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-600 focus:ring-2 focus:ring-litcBlue outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-600 focus:ring-2 focus:ring-litcBlue outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الدور الوظيفي</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-600 focus:ring-2 focus:ring-litcBlue outline-none appearance-none"
                  >
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">القسم</label>
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-600 focus:ring-2 focus:ring-litcBlue outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl text-xs font-black flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-litcBlue text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-litcDark transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
