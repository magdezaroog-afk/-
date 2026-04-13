import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { Claim, ClaimStatus } from '../types';
import { 
  TrendingUp, AlertTriangle, PieChart as PieChartIcon, 
  ArrowUpRight, ArrowDownRight, Activity, ShieldAlert,
  Calendar, Building2, DollarSign
} from 'lucide-react';

interface AdminAnalyticsProps {
  claims: Claim[];
}

const COLORS = ['#003366', '#FF6B00', '#005C84', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ claims }) => {
  
  // 1. Spending Forecast Logic
  const forecastData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    
    claims.forEach(claim => {
      const date = new Date(claim.submissionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + claim.totalAmount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const last3Months = sortedMonths.slice(-3);
    
    if (last3Months.length === 0) return { chartData: [], forecast: 0 };

    const average = last3Months.reduce((sum, month) => sum + monthlyData[month], 0) / last3Months.length;
    
    const chartData = sortedMonths.map(month => ({
      name: month,
      amount: monthlyData[month],
      type: 'actual'
    }));

    // Add forecast for next month
    const lastMonth = new Date(sortedMonths[sortedMonths.length - 1] + "-01");
    const nextMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() + 1));
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    
    chartData.push({
      name: nextMonthKey,
      amount: average,
      type: 'forecast'
    });

    return { chartData, forecast: average };
  }, [claims]);

  // 2. Departmental Breakdown Logic
  const deptData = useMemo(() => {
    const depts: Record<string, number> = {};
    claims.forEach(claim => {
      const dept = claim.department || 'غير محدد';
      depts[dept] = (depts[dept] || 0) + claim.totalAmount;
    });

    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [claims]);

  // 3. Fraud Alert Logic
  const fraudAlerts = useMemo(() => {
    const alerts: { userId: string; userName: string; provider: string; count: number; dates: string[] }[] = [];
    const userProviderMap: Record<string, Record<string, string[]>> = {};

    claims.forEach(claim => {
      if (!userProviderMap[claim.employeeId]) userProviderMap[claim.employeeId] = {};
      
      // Assuming hospitalName is the provider
      const provider = claim.invoices[0]?.hospitalName || 'Unknown';
      if (!userProviderMap[claim.employeeId][provider]) userProviderMap[claim.employeeId][provider] = [];
      
      userProviderMap[claim.employeeId][provider].push(claim.submissionDate);
    });

    Object.entries(userProviderMap).forEach(([userId, providers]) => {
      Object.entries(providers).forEach(([provider, dates]) => {
        const sortedDates = dates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
        
        for (let i = 0; i < sortedDates.length; i++) {
          let count = 0;
          const weekInMs = 7 * 24 * 60 * 60 * 1000;
          const windowDates: string[] = [];
          
          for (let j = i; j < sortedDates.length; j++) {
            if (sortedDates[j] - sortedDates[i] <= weekInMs) {
              count++;
              windowDates.push(new Date(sortedDates[j]).toLocaleDateString('ar-LY'));
            } else {
              break;
            }
          }

          if (count > 3) {
            const userName = claims.find(c => c.employeeId === userId)?.employeeName || 'Unknown';
            alerts.push({ userId, userName, provider, count, dates: windowDates });
            break; // Move to next provider for this user
          }
        }
      });
    });

    return alerts;
  }, [claims]);

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-litcBlue">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">توقعات الشهر القادم</p>
            <h3 className="text-xl font-black text-slate-900">{forecastData.forecast.toLocaleString()} <span className="text-xs">د.ل</span></h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>بناءً على متوسط 3 أشهر</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-litcOrange">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تنبيهات الاحتيال</p>
            <h3 className="text-xl font-black text-slate-900">{fraudAlerts.length} <span className="text-xs">حالة مشتبهة</span></h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">تكرار غير طبيعي عند نفس المزود</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أكثر الأقسام استهلاكاً</p>
            <h3 className="text-xl font-black text-slate-900">{deptData.sort((a,b) => b.value - a.value)[0]?.name || '---'}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">بناءً على إجمالي المطالبات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Forecast Chart */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900">توقعات الإنفاق (Spending Forecast)</h3>
              <p className="text-xs font-bold text-slate-400">تحليل الاتجاهات والتنبؤ بالميزانية المستقبلية</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <Activity className="w-5 h-5 text-litcBlue" />
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData.chartData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003366" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#003366" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 900}}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#003366" 
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#003366]"></div>
              <span className="text-[10px] font-black text-slate-500">بيانات فعلية</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF6B00]"></div>
              <span className="text-[10px] font-black text-slate-500">توقعات ذكية</span>
            </div>
          </div>
        </section>

        {/* Departmental Breakdown Chart */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900">توزيع الإنفاق حسب الأقسام</h3>
              <p className="text-xs font-bold text-slate-400">تحليل استهلاك السقف الصحي لكل إدارة</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <PieChartIcon className="w-5 h-5 text-litcOrange" />
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Fraud Alerts Section */}
      <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="text-xl font-black text-white">نظام كشف الاحتيال الذكي (Fraud Detection)</h3>
            <p className="text-xs font-bold text-slate-400">تنبيهات تلقائية بناءً على أنماط التكرار المشبوهة</p>
          </div>
          <div className="px-4 py-2 bg-red-500/20 rounded-xl border border-red-500/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">High Alert Mode</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {fraudAlerts.length > 0 ? fraudAlerts.map((alert, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-lg">تنبيه حرج</span>
              </div>
              <h4 className="text-sm font-black text-white mb-1">{alert.userName}</h4>
              <p className="text-[10px] font-bold text-slate-400 mb-4">{alert.provider}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-slate-500">عدد المطالبات (أسبوع):</span>
                  <span className="text-red-400">{alert.count} مطالبات</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {alert.dates.map((date, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/5 rounded-md text-[8px] font-bold text-slate-500 border border-white/5">
                      {date}
                    </span>
                  ))}
                </div>
              </div>
              
              <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black transition-all">
                فتح تحقيق فوري
              </button>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <ShieldAlert className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-500 font-bold text-sm">لا توجد أنماط مشبوهة حالياً.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
