
import React from 'react';
import { Claim } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Users, DollarSign, Building2, Download, Filter, MapPin, Sparkles } from 'lucide-react';

interface AdminDashboardProps {
  claims: Claim[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ claims }) => {
  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const stats = [
    { label: 'الميزانية الطبية السنوية', value: '4.8M ر.س', trend: '+15%', icon: <DollarSign size={24} />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'إجمالي المستفيدين', value: '1,240 موظف', trend: '+8%', icon: <Users size={24} />, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'كفاءة التدقيق الآلي', value: '98.2%', trend: '+4%', icon: <Sparkles size={24} />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'مراكز الخدمة النشطة', value: '45 مركز', trend: '0%', icon: <Building2 size={24} />, color: 'bg-amber-50 text-amber-600' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">التقارير الاستراتيجية</h1>
          <p className="text-slate-500 font-medium mt-1">تحليلات لحظية لمصروفات الرعاية الطبية وكفاءة العمليات.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm">
            <Filter size={18} />
            تخصيص الفلاتر
          </button>
          <button className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            <Download size={18} />
            تصدير تقرير ذكي (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${s.color.split(' ')[1]}`}></div>
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${s.color} transition-transform group-hover:scale-110`}>
                {s.icon}
              </div>
              <span className="text-[11px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl">{s.trend}</span>
            </div>
            <p className="text-sm font-bold text-slate-500 mb-2">{s.label}</p>
            <p className="text-3xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900">منحنى الإنفاق السنوي المجمع</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span className="text-xs font-bold text-slate-400">القيمة الفعلية (2024)</span>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 900}} 
                  />
                  <Area type="monotone" dataKey="cost" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCost)" strokeWidth={6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8">توزيع التخصصات الطبية</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
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
              <div className="grid grid-cols-2 gap-4 mt-8">
                {distributionData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                    <span className="text-[11px] font-black text-slate-600">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                <MapPin size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">المزودين المفضلين</h3>
                <p className="text-slate-400 text-sm font-medium mt-1">أكثر المستشفيات استقبالاً للموظفين</p>
              </div>
              <div className="space-y-5 pt-4">
                {[
                  { n: 'مستشفى المملكة', v: 38, c: 'bg-indigo-600' },
                  { n: 'مركز الحبيب الطبي', v: 29, c: 'bg-cyan-500' },
                  { n: 'المستشفى الألماني', v: 18, c: 'bg-emerald-500' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-black">
                      <span className="text-slate-600">{item.n}</span>
                      <span className="text-slate-900">{item.v}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${item.c} h-full transition-all duration-1000`} style={{width: `${item.v}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl h-full overflow-hidden relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[80px]"></div>
            <h3 className="text-xl font-black text-white mb-8">مطالبات عالية القيمة (High Risk)</h3>
            <div className="space-y-6">
              {claims.filter(c => c.totalAmount > 2000).map((c, idx) => (
                <div key={idx} className="flex gap-5 p-5 bg-white/5 hover:bg-white/10 rounded-3xl transition-all cursor-pointer group border border-white/5">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform shrink-0">
                    <DollarSign size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">{c.employeeName}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{c.submissionDate}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-400">{c.totalAmount.toLocaleString()} ر.س</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-3 py-1 rounded-xl font-black uppercase tracking-wider">High Risk</span>
                    </div>
                  </div>
                </div>
              ))}
              {claims.filter(c => c.totalAmount > 2000).length === 0 && (
                <div className="py-20 text-center text-slate-500 font-bold">لا توجد مطالبات عالية القيمة حالياً.</div>
              )}
            </div>
            <button className="w-full mt-10 text-indigo-400 font-black text-sm hover:text-indigo-300 transition-colors py-4 bg-white/5 rounded-2xl">
              عرض وحدة تدقيق الاحتيال المتقدمة
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
