import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Claim, User, ClaimStatus } from '../types';
import { 
  TrendingUp, Activity, PieChart as PieChartIcon, 
  Target, AlertCircle, ShieldCheck, Zap,
  Building2, DollarSign, ArrowUpRight, Clock, AlertTriangle, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { STATUS_UI } from '../constants';

interface ManagerDashboardProps {
  user: User;
  claims: Claim[];
}

const COLORS = ['#003366', '#FF6B00', '#005C84', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, claims }) => {
  
  // 1. Spend Tracker: Monthly health spending vs. Budget
  const spendData = useMemo(() => {
    const monthly: Record<string, number> = {};
    const budget = 500000; // Example monthly budget

    claims.forEach(c => {
      const date = new Date(c.submissionDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + c.totalAmount;
    });

    return Object.keys(monthly).sort().map(key => ({
      name: key,
      spending: monthly[key],
      budget: budget
    }));
  }, [claims]);

  // 2. Department Heatmap
  const deptData = useMemo(() => {
    const depts: Record<string, number> = {};
    claims.forEach(c => {
      const dept = c.department || 'Other';
      depts[dept] = (depts[dept] || 0) + c.totalAmount;
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [claims]);

  // 3. Forecasting: Simple Linear Regression (Trend-based)
  const forecast = useMemo(() => {
    if (spendData.length < 2) return 0;
    
    // Simple linear regression: y = mx + b
    const n = spendData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    spendData.forEach((d, i) => {
      sumX += i;
      sumY += d.spending;
      sumXY += i * d.spending;
      sumX2 += i * i;
    });
    
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    
    // Predict next month (index n)
    return Math.max(0, m * n + b);
  }, [spendData]);

  // 4. Escalated Claims (> 48h)
  const escalatedClaims = useMemo(() => {
    const now = new Date().getTime();
    return claims.filter(c => {
      if (c.status === ClaimStatus.PAID || c.status === ClaimStatus.REJECTED) return false;
      const submissionDate = new Date(c.submissionDate).getTime();
      const diffHours = (now - submissionDate) / (1000 * 3600);
      return diffHours > 48;
    });
  }, [claims]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة القيادة التنفيذية</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">تحليل استراتيجي وتوقعات الميزانية الصحية للمؤسسة.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2 bg-litcBlue/10 text-litcBlue rounded-xl text-xs font-black">
            الوضع التنفيذي نشط
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Escalation Alert - New Section */}
        {escalatedClaims.length > 0 && (
          <section className="lg:col-span-3">
            <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/5 via-transparent to-transparent animate-pulse"></div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 animate-bounce">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-rose-900">تنبيه التصعيد الزمني</h3>
                    <p className="text-xs font-bold text-rose-600">مطالبات تجاوزت 48 ساعة دون معالجة</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-rose-600 text-white rounded-full text-xs font-black">
                  {escalatedClaims.length} مطالبات متأخرة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {escalatedClaims.map(claim => (
                  <motion.div 
                    key={claim.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-sm p-5 rounded-3xl border border-rose-200 shadow-sm flex items-center justify-between group hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 font-black text-xs">
                        {claim.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{claim.employeeName}</p>
                        <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          {Math.floor((new Date().getTime() - new Date(claim.submissionDate).getTime()) / (1000 * 3600))} ساعة متأخرة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-lg text-[8px] font-black ${STATUS_UI[claim.status].color}`}>
                        {STATUS_UI[claim.status].label}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* Spend Tracker - Large Card */}
        <section className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">متتبع الإنفاق الشهري</h3>
              <p className="text-xs font-bold text-slate-400">مقارنة الإنفاق الفعلي مقابل الميزانية المعتمدة</p>
            </div>
            <div className="p-3 bg-litcBlue/10 rounded-2xl text-litcBlue">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendData}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003366" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#003366" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 900}}
                />
                <Legend />
                <Area type="monotone" dataKey="spending" name="الإنفاق الفعلي" stroke="#003366" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={4} />
                <Line type="monotone" dataKey="budget" name="الميزانية" stroke="#FF6B00" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Forecasting & Quick Stats */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[80px]"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">التوقعات الذكية</h3>
            </div>
            <p className="text-slate-400 text-xs font-bold mb-2">الإنفاق المتوقع للشهر القادم</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-4xl font-black text-white">{forecast.toLocaleString()}</h4>
              <span className="text-indigo-400 font-black text-sm">د.ل</span>
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">Linear Regression Model</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold">تم حساب التوقعات بناءً على اتجاهات الإنفاق في الأشهر السابقة.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-litcOrange">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">كفاءة الميزانية</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black">
                <span className="text-slate-500">نسبة الاستهلاك</span>
                <span className="text-slate-900">72%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-litcOrange h-full w-[72%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">الميزانية المتبقية كافية لتغطية المطالبات المتوقعة.</p>
            </div>
          </div>
        </div>

        {/* Department Heatmap */}
        <section className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">خارطة الإنفاق حسب الإدارات</h3>
              <p className="text-xs font-bold text-slate-400">توزيع التكاليف الصحية على قطاعات المؤسسة</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-2xl text-litcOrange">
              <PieChartIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {deptData.map((d, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{d.name}</p>
                    <p className="text-sm font-black text-slate-900">{d.value.toLocaleString()} د.ل</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
