
import React, { useState } from 'react';
import { Claim, User } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Users, DollarSign, Building2, Download, Filter, MapPin, Sparkles, UserCheck } from 'lucide-react';
import UserManagement from '../components/UserManagement';

interface AdminDashboardProps {
  user: User;
  claims: Claim[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, claims }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const stats = [
    { label: 'الميزانية الطبية السنوية', value: '4.8M ر.س', trend: '+15%', icon: <DollarSign className="w-4.5 h-4.5 sm:w-6 sm:h-6" />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'إجمالي المستفيدين', value: '1,240 موظف', trend: '+8%', icon: <Users className="w-4.5 h-4.5 sm:w-6 sm:h-6" />, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'كفاءة التدقيق الآلي', value: '98.2%', trend: '+4%', icon: <Sparkles className="w-4.5 h-4.5 sm:w-6 sm:h-6" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'مراكز الخدمة النشطة', value: '45 مركز', trend: '0%', icon: <Building2 className="w-4.5 h-4.5 sm:w-6 sm:h-6" />, color: 'bg-amber-50 text-amber-600' },
  ];

  const distributionData = [
    { name: 'باطنية وقلب', value: 40 },
    { name: 'جراحة عظام', value: 20 },
    { name: 'صيدلية', value: 25 },
    { name: 'أسنان', value: 10 },
    { name: 'أخرى', value: 5 },
  ];

  const monthlyTrends = [
    { month: 'يناير', cost: 320000 },
    { month: 'فبراير', cost: 450000 },
    { month: 'مارس', cost: 390000 },
    { month: 'أبريل', cost: 580000 },
    { month: 'مايو', cost: 410000 },
    { month: 'يونيو', cost: 630000 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0 text-center md:text-right">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">لوحة التحكم الإدارية</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">إدارة المستخدمين وتحليل كفاءة العمليات الاستراتيجية.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white text-litcBlue shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <TrendingUp className="w-4 h-4" /> التقارير
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-litcBlue shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users className="w-4 h-4" /> إدارة المستخدمين
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'users' ? (
        <UserManagement />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-0">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all text-right">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-slate-100 transition-all"></div>
            <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
              <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl ${s.color} transition-transform group-hover:scale-110 shadow-sm`}>
                {s.icon}
              </div>
              <span className="text-[9px] sm:text-[11px] font-black px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl border border-emerald-100">{s.trend}</span>
            </div>
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 mb-1 sm:mb-2 relative z-10 uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 relative z-10"><span className="font-black">{s.value}</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 px-4 sm:px-0">
        <div className="lg:col-span-2 space-y-6 sm:space-y-10">
          <section className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/30 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-indigo-50/50 transition-all"></div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-10 text-center sm:text-right relative z-10">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">منحنى الإنفاق السنوي المجمع</h3>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-600"></div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">القيمة الفعلية (2024)</span>
              </div>
            </div>
            <div className="h-[250px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 900, fontSize: '12px'}} 
                  />
                  <Area type="monotone" dataKey="cost" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCost)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <section className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-50/30 rounded-full -ml-16 -mt-16 blur-3xl group-hover:bg-cyan-50/50 transition-all"></div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-6 sm:mb-8 text-center sm:text-right relative z-10">توزيع التخصصات الطبية</h3>
              <div className="h-48 sm:h-64 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                {distributionData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{backgroundColor: COLORS[i]}}></div>
                    <span className="text-[9px] sm:text-[11px] font-black text-slate-600 truncate">{d.name} (<span className="font-black">{d.value}</span>%)</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col justify-center text-center space-y-4 sm:space-y-6 group relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-50/30 rounded-full -mr-16 -mb-16 blur-3xl group-hover:bg-amber-50/50 transition-all"></div>
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-inner group-hover:scale-110 transition-transform relative z-10">
                <MapPin className="w-7 h-7 sm:w-9 sm:h-9" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">المزودين المفضلين</h3>
                <p className="text-slate-400 text-[10px] sm:text-sm font-medium mt-1">أكثر المستشفيات استقبالاً للموظفين</p>
              </div>
              <div className="space-y-4 sm:space-y-5 pt-2 sm:pt-4 relative z-10">
                {[
                  { n: 'مستشفى المملكة', v: 38, c: 'bg-indigo-600' },
                  { n: 'مركز الحبيب الطبي', v: 29, c: 'bg-cyan-500' },
                  { n: 'المستشفى الألماني', v: 18, c: 'bg-emerald-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-[10px] sm:text-sm font-black">
                      <span className="text-slate-600">{item.n}</span>
                      <span className="text-slate-900 font-black">{item.v}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
                      <div className={`${item.c} h-full transition-all duration-1000`} style={{width: `${item.v}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section className="bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-2xl h-full overflow-hidden relative text-right group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[80px] group-hover:bg-indigo-500/20 transition-all"></div>
            <h3 className="text-lg sm:text-xl font-black text-white mb-6 sm:mb-8 relative z-10">مطالبات عالية القيمة (High Risk)</h3>
            <div className="space-y-4 sm:space-y-6 relative z-10">
              {claims.filter(c => c.totalAmount > 2000).map((c, idx) => (
                <div key={idx} className="flex gap-4 sm:gap-5 p-4 sm:p-5 bg-white/5 hover:bg-white/10 rounded-2xl sm:rounded-3xl transition-all cursor-pointer group border border-white/5">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-black text-white truncate">{c.employeeName}</p>
                    <p className="text-[9px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{c.submissionDate}</p>
                    <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3">
                      <span className="text-[10px] sm:text-xs font-black text-indigo-400"><span className="font-black">{c.totalAmount.toLocaleString()}</span> ر.س</span>
                      <span className="text-[8px] sm:text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl font-black uppercase tracking-wider">High Risk</span>
                    </div>
                  </div>
                </div>
              ))}
              {claims.filter(c => c.totalAmount > 2000).length === 0 && (
                <div className="py-10 sm:py-20 text-center text-slate-500 font-bold text-xs sm:text-sm">لا توجد مطالبات عالية القيمة حالياً.</div>
              )}
            </div>
            <button className="w-full mt-6 sm:mt-10 text-indigo-400 font-black text-[10px] sm:text-sm hover:text-indigo-300 transition-colors py-3 sm:py-4 bg-white/5 rounded-xl sm:rounded-2xl">
              عرض وحدة تدقيق الاحتيال المتقدمة
            </button>
          </section>
        </div>
      </div>
    </>
  )}
</div>
  );
};

export default AdminDashboard;
