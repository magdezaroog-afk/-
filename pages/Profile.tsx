
import React, { useState, useRef } from 'react';
import { User, Claim } from '../types';
import { STATUS_UI } from '../constants';
import ClaimCard from '../components/ClaimCard';
import { 
  analyzeFoodNutrition, 
  getHealthProfileAdvice, 
  explainMedication, 
  analyzeLabReport,
  analyzeWellnessMood // سنستخدمها الآن لتحليل الأعراض الطبية
} from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';
import { 
  Heart, Activity, Sparkles, Utensils, Scale, 
  Pill, Brain, Camera, Loader2, Plus, 
  ShieldCheck, BrainCircuit, 
  ChevronLeft, User as UserIcon, 
  TrendingUp, History, Calendar,
  Zap, Flame, Microscope, AlertTriangle, FileText,
  Dumbbell, Droplets, Wheat, AlertCircle, CheckCircle, HeartPulse, Stethoscope, Search
} from 'lucide-react';

interface ProfileProps {
  user: User;
  claims: Claim[];
  onNavigate: (path: string) => void;
  onSelectClaim: (claim: Claim) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, claims, onNavigate, onSelectClaim }) => {
  const [activeTab, setActiveTab] = useState<'smart-clinic' | 'medical'>('smart-clinic');
  const [loading, setLoading] = useState<string | null>(null);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [goal, setGoal] = useState('المحافظة على الوزن');
  const [foodResult, setFoodResult] = useState<any>(null);
  const [medResult, setMedResult] = useState<any>(null);
  const [labResult, setLabResult] = useState<any>(null);
  const [bodyResult, setBodyResult] = useState<any>(null);
  const [symptomResult, setSymptomResult] = useState<any>(null);
  const [symptomInput, setSymptomInput] = useState('');

  const foodInputRef = useRef<HTMLInputElement>(null);
  const medInputRef = useRef<HTMLInputElement>(null);
  const labInputRef = useRef<HTMLInputElement>(null);
  const smartClinicRef = useRef<HTMLDivElement>(null);

  const scrollToSmartClinic = () => {
    setActiveTab('smart-clinic');
    setTimeout(() => {
      smartClinicRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'food' | 'med' | 'lab') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(type);
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = (reader.result as string).split(',')[1];
      const targetWidth = type === 'lab' ? 1600 : 1024;
      base64 = await optimizeImage(base64, targetWidth, 0.8);
      try {
        if (type === 'food') setFoodResult(await analyzeFoodNutrition(base64));
        else if (type === 'med') setMedResult(await explainMedication(base64));
        else if (type === 'lab') setLabResult(await analyzeLabReport(base64));
      } catch (err) { console.error(err); }
      setLoading(null);
    };
    reader.readAsDataURL(file);
  };

  const calculateBody = async () => {
    setLoading('body');
    try {
      const res = await getHealthProfileAdvice({ height, weight, goal });
      if (res) {
        const heightInMeters = height / 100;
        const bmiVal = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
        let statusLabel = 'وزن طبيعي';
        if (bmiVal < 18.5) statusLabel = 'نقص وزن';
        else if (bmiVal >= 25 && bmiVal < 30) statusLabel = 'زيادة وزن';
        else if (bmiVal >= 30) statusLabel = 'سمنة';
        setBodyResult({ ...res, bmi: bmiVal, status: statusLabel });
      }
    } catch (e) { console.error(e); }
    setLoading(null);
  };

  const analyzeSymptoms = async () => {
    if (!symptomInput.trim()) return;
    setLoading('symptoms');
    try {
      // سنستخدم دالة analyzeWellnessMood لكننا سنطلب منها في الـ Service تحليل أعراض
      const res = await analyzeWellnessMood(`المريض يشعر بـ: ${symptomInput}. قم بتحديد التخصص الطبي المناسب وقدم 3 أسئلة مهمة يطرحها على الطبيب.`);
      setSymptomResult(res);
    } catch (e) { console.error(e); }
    setLoading(null);
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-12 animate-in fade-in duration-700 font-cairo pb-24" dir="rtl">
      
      {/* هويّة الموظف LITC - تم تصحيح المسافات */}
      <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-litcBlue/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative shrink-0">
          <div className="w-40 h-40 rounded-[3rem] bg-litcBlue flex items-center justify-center text-6xl text-white font-black shadow-2xl border-8 border-slate-50">
             {user.name.charAt(0)}
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-litcOrange rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-xl animate-bounce">
             <ShieldCheck size={24} />
          </div>
        </div>
        <div className="text-center md:text-right flex-1 space-y-6">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2">{user.name}</h1>
            <p className="text-litcBlue font-black text-xs uppercase tracking-[0.4em] py-1 px-3 bg-litcBlue/5 rounded-lg w-fit mx-auto md:mr-0">موظف معتمد لدى LITC</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
             <div className="bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs font-bold text-slate-400">الرقم الوظيفي: <span className="text-litcBlue font-black">{user.id}</span></p></div>
             <div className="bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                <p className="text-xs font-black text-emerald-600">التأمين الصحي نشط</p>
             </div>
          </div>
        </div>
      </div>

      {/* إجراء سريع */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={() => onNavigate('submit-claim')} className="bg-litcBlue hover:bg-litcDark p-10 rounded-[3.5rem] flex items-center justify-between shadow-2xl shadow-blue-100 group transition-all active:scale-95 text-right">
          <div className="text-white space-y-2">
            <h3 className="text-3xl font-black">تقديم مطالبة جديدة</h3>
            <p className="text-sm font-bold opacity-60">أرسل فواتيرك الآن لمراجعتها ذكياً</p>
          </div>
          <div className="w-20 h-20 bg-white/10 group-hover:bg-litcOrange rounded-3xl flex items-center justify-center text-white transition-all">
            <Plus size={40} strokeWidth={3} />
          </div>
        </button>
        <button onClick={scrollToSmartClinic} className="bg-white border-2 border-litcOrange/20 p-10 rounded-[3.5rem] flex items-center justify-between group shadow-sm hover:border-litcOrange transition-all text-right">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-litcBlue">مساعدك الصحي</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">اضغط للتحليل الذكي <Sparkles size={14} className="text-litcOrange" /></p>
          </div>
          <div className="w-20 h-20 bg-litcOrange/10 rounded-3xl flex items-center justify-center text-litcOrange group-hover:bg-litcOrange group-hover:text-white transition-all">
            <BrainCircuit size={40} />
          </div>
        </button>
      </div>

      {/* التبويب */}
      <div className="flex justify-center p-3 bg-slate-200/50 w-full max-w-lg mx-auto rounded-[2.5rem] shadow-inner">
        <button onClick={() => setActiveTab('smart-clinic')} className={`flex-1 px-6 py-5 rounded-[2.2rem] font-black text-sm transition-all flex items-center justify-center gap-4 ${activeTab === 'smart-clinic' ? 'bg-white text-litcBlue shadow-2xl' : 'text-slate-500 hover:text-litcBlue'}`}>
          <HeartPulse size={22} className={activeTab === 'smart-clinic' ? 'text-litcOrange' : ''} /> العيادة الذكية
        </button>
        <button onClick={() => setActiveTab('medical')} className={`flex-1 px-6 py-5 rounded-[2.2rem] font-black text-sm transition-all flex items-center justify-center gap-4 ${activeTab === 'medical' ? 'bg-white text-litcBlue shadow-2xl' : 'text-slate-500 hover:text-litcBlue'}`}>
          <History size={22} className={activeTab === 'medical' ? 'text-litcOrange' : ''} /> أرشيفك الطبي
        </button>
      </div>

      <div ref={smartClinicRef} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        {activeTab === 'smart-clinic' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
              {/* BMI Engine */}
              <section className="litc-gradient text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-litcOrange opacity-5 rounded-full blur-[100px]"></div>
                <div className="relative z-10 space-y-10">
                   <h3 className="text-3xl font-black flex items-center gap-4"><Scale className="text-litcOrange" /> محلل الحالة الجسدية والماكروز</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                               <label className="text-[11px] font-black text-blue-200 uppercase tracking-widest px-2">الطول (سم)</label>
                               <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-5 font-black text-2xl outline-none focus:bg-white/20 transition-all text-center" />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[11px] font-black text-blue-200 uppercase tracking-widest px-2">الوزن (كجم)</label>
                               <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-5 font-black text-2xl outline-none focus:bg-white/20 transition-all text-center" />
                            </div>
                         </div>
                         <button onClick={calculateBody} disabled={loading === 'body'} className="w-full bg-litcOrange py-6 rounded-[2.2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 hover:bg-orange-600 transition-all active:scale-95">
                           {loading === 'body' ? <Loader2 size={28} className="animate-spin" /> : <Zap size={24} />} تحليل القياسات والماكروز
                         </button>
                      </div>
                      {bodyResult && (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-10 rounded-[3.5rem] text-center flex flex-col justify-center animate-in zoom-in shadow-inner">
                           <p className="text-sm font-black text-blue-100 uppercase tracking-[0.2em] mb-4">مؤشر كتلة الجسم (BMI)</p>
                           <p className="text-7xl font-black text-litcOrange">{bodyResult.bmi}</p>
                           <div className="mt-6 px-6 py-2 rounded-2xl bg-white text-litcBlue font-black text-sm inline-block shadow-xl mx-auto">
                              {bodyResult.status}
                           </div>
                           <p className="text-xs font-bold text-blue-50/80 leading-relaxed italic mt-6">"{bodyResult.summaryAdvice}"</p>
                        </div>
                      )}
                   </div>
                </div>
              </section>

              {/* Lab Reports */}
              <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                 <div className="flex items-center justify-between mb-10">
                    <div className="text-right">
                       <h3 className="text-3xl font-black text-litcBlue flex items-center gap-4 justify-start"><Microscope size={36} className="text-litcOrange" /> تفسير الفحوصات الطبية</h3>
                       <p className="text-sm font-bold text-slate-400 mt-2">ارفع صورة أي تحليل مخبري وسيقوم النظام بتفصيله باللغة العربية</p>
                    </div>
                    <button onClick={() => labInputRef.current?.click()} className="w-20 h-20 bg-blue-50 text-litcBlue rounded-3xl hover:bg-litcBlue hover:text-white transition-all shadow-lg flex items-center justify-center">
                       {loading === 'lab' ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
                    </button>
                    <input type="file" ref={labInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'lab')} />
                 </div>
                 {labResult ? (
                    <div className="space-y-8 animate-in slide-in-from-top-6">
                       <div className={`p-8 rounded-[3rem] flex items-center gap-6 text-white shadow-xl ${labResult.overallRisk === 'حرج' ? 'bg-rose-500 shadow-rose-200' : 'bg-litcBlue shadow-blue-200'}`}>
                          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><AlertTriangle size={32} /></div>
                          <div className="text-right"><p className="text-xs font-black opacity-60 mb-1 tracking-widest uppercase">التقييم الصحي العام</p><p className="text-2xl font-black">{labResult.overallRisk}</p></div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {labResult.findings?.map((f: any, i: number) => (
                             <div key={i} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 group hover:border-litcBlue transition-all text-right">
                                <div className="flex justify-between items-center mb-4">
                                   <p className="font-black text-litcBlue text-base">{f.testName}</p>
                                   <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${f.status === 'طبيعي' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{f.status}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-900">{f.resultValue} <span className="text-xs text-slate-400">{f.unit}</span></p>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed mt-4 italic border-t border-slate-100 pt-3">"{f.explanation}"</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <div className="py-32 border-4 border-dashed border-slate-50 rounded-[4rem] flex flex-col items-center justify-center text-slate-100">
                       <Microscope size={80} className="mb-6 opacity-5" />
                       <p className="text-lg font-black text-slate-300">ارفع صورة التقرير المخبري للبدء</p>
                    </div>
                 )}
              </section>
            </div>

            <div className="lg:col-span-4 space-y-10">
               {/* محلل الأعراض الطبي (بدلاً من النفسي) */}
               <section className="bg-litcDark text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group text-right">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-litcOrange/10 rounded-full blur-3xl"></div>
                  <h3 className="text-2xl font-black flex items-center gap-4 mb-8"><Stethoscope size={32} className="text-litcOrange" /> محلل الأعراض والتحضير</h3>
                  <p className="text-xs font-bold text-white/50 mb-6 leading-relaxed">صف أعراضك بدقة لنرشدك للتخصص المناسب والأسئلة التي يجب طرحها على الطبيب.</p>
                  <textarea value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} placeholder="مثال: أشعر بألم في الرأس يمتد للعين مع غثيان..." className="w-full p-6 bg-white/5 border border-white/10 rounded-[2.5rem] focus:bg-white/10 outline-none font-bold text-sm min-h-[160px] text-white placeholder:text-white/20 transition-all shadow-inner" />
                  <button onClick={analyzeSymptoms} disabled={loading === 'symptoms' || !symptomInput} className="w-full mt-6 bg-white text-litcBlue py-5 rounded-[2rem] font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-litcOrange hover:text-white">
                     {loading === 'symptoms' ? <Loader2 size={24} className="animate-spin" /> : <Search size={20} />} تحليل الأعراض طبياً
                  </button>
                  {symptomResult && (
                    <div className="mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6 animate-in fade-in">
                       <div className="pb-4 border-b border-white/10">
                          <p className="text-[10px] font-black text-litcOrange uppercase tracking-widest mb-1">التخصص المقترح</p>
                          <p className="text-lg font-black">{symptomResult.moodAnalysis.split('،')[0]}</p>
                       </div>
                       <p className="text-xs font-bold text-blue-50/80 leading-relaxed italic">"{symptomResult.moodAnalysis}"</p>
                    </div>
                  )}
               </section>

               <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm text-right">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-litcBlue flex items-center gap-4"><Utensils size={28} className="text-litcOrange" /> محلل الوجبات</h3>
                    <button onClick={() => foodInputRef.current?.click()} className="w-16 h-16 bg-orange-50 text-litcOrange rounded-[1.8rem] hover:bg-litcOrange hover:text-white transition-all shadow-lg flex items-center justify-center">
                       {loading === 'food' ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                    </button>
                  </div>
                  {foodResult ? (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="bg-slate-900 text-white p-6 rounded-[2.2rem] shadow-xl text-center">
                           <p className="text-xl font-black">{foodResult.mealName}</p>
                           <p className="text-xs text-litcOrange font-black mt-2 tracking-[0.2em] flex items-center justify-center gap-2 uppercase"><Flame size={16} /> {foodResult.calories} Calories</p>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-[2rem] italic border border-slate-100">"{foodResult.healthTip}"</p>
                     </div>
                  ) : (
                    <p className="text-[10px] font-black text-slate-300 text-center py-10 uppercase tracking-widest">صور وجبتك للتحليل الغذائي</p>
                  )}
                  <input type="file" ref={foodInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'food')} />
               </section>

               <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden text-right">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[5rem]"></div>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-litcBlue flex items-center gap-4"><Pill size={28} className="text-litcOrange" /> قارئ الأدوية</h3>
                    <button onClick={() => medInputRef.current?.click()} className="w-16 h-16 bg-blue-50 text-litcBlue rounded-[1.8rem] hover:bg-litcBlue hover:text-white transition-all shadow-lg flex items-center justify-center">
                       {loading === 'med' ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
                    </button>
                  </div>
                  {medResult ? (
                    <div className="space-y-6 animate-in fade-in">
                       <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2.5rem]">
                          <p className="text-base font-black text-litcBlue">{medResult.medName}</p>
                          <p className="text-xs font-bold text-slate-600 mt-3 leading-relaxed">{medResult.usage}</p>
                       </div>
                       <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 shadow-sm">
                          <AlertCircle className="text-rose-600 shrink-0 mt-1" size={18} />
                          <p className="text-[11px] font-black text-rose-800 leading-relaxed">{medResult.warnings}</p>
                       </div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-black text-slate-300 text-center py-10 uppercase tracking-widest">صور علبة الدواء للشرح والتحذيرات</p>
                  )}
                  <input type="file" ref={medInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'med')} />
               </section>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {claims.map(claim => (
              <div key={claim.id} className="relative group">
                <ClaimCard claim={claim} onClick={onSelectClaim} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
