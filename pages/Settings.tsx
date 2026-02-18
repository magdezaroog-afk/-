
import React from 'react';
import { User, UserRole } from '../types';
import { Settings, Bell, Shield, Smartphone, Globe, Info, Save, Sparkles } from 'lucide-react';

interface SettingsProps {
  user: User;
}

const SettingsPage: React.FC<SettingsProps> = ({ user }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">الإعدادات والتنبيهات</h1>
          <p className="text-slate-500 font-medium mt-1">إدارة خصائص النظام والتنبيهات الطبية الذكية.</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
          <Save size={20} />
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <nav className="space-y-2">
            {[
              { label: 'الملف الشخصي', icon: <Smartphone size={18} />, active: true },
              { label: 'تنبيهات النظام', icon: <Bell size={18} />, active: false },
              { label: 'الأمان والخصوصية', icon: <Shield size={18} />, active: false },
              { label: 'اللغة والمنطقة', icon: <Globe size={18} />, active: false },
            ].map((item, idx) => (
              <button key={idx} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${item.active ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-white/50'}`}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
            <Sparkles className="absolute -top-4 -right-4 text-white/10" size={100} />
            <h4 className="text-lg font-black mb-2 relative z-10">المساعد الذكي</h4>
            <p className="text-xs font-bold text-indigo-100 leading-relaxed relative z-10">Gemini AI مفعل تلقائياً لمراجعة الفواتير وتقديم النصائح الطبية.</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Bell className="text-indigo-600" size={24} />
              التنبيهات الذكية
            </h3>
            <div className="space-y-6">
              {[
                { title: 'إشعارات حالة المطالبات', desc: 'استلام تنبيه فوري عند اعتماد أو إرجاع المطالبة.', checked: true },
                { title: 'تنبيهات الأدوية والأمراض', desc: 'تحليل الفواتير وتقديم نصائح صحية حسب التاريخ الطبي.', checked: true },
                { title: 'تقارير الإدارة الأسبوعية', desc: 'إرسال ملخص بالبريد الإلكتروني للإدارة العليا.', checked: user.role === UserRole.ADMIN },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-1.5rem] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Shield className="text-indigo-600" size={24} />
              إدارة الصلاحيات
            </h3>
            <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
              <Info className="text-indigo-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-black text-indigo-900">صلاحيات الدور: {user.role}</p>
                <p className="text-xs font-bold text-indigo-700/70 mt-1 leading-relaxed">أنت الآن تعمل بصلاحيات {user.role}. لا يمكن تعديل صلاحيات النظام إلا من قبل الإدارة العليا أو قسم التقنية.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
