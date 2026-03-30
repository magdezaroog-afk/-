import React, { useState, useRef } from 'react';
import { User, HealthProfile } from '../types';
import { 
  analyzeFoodNutrition, 
  explainMedication, 
  analyzeLabReport
} from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';
import { 
  Loader2, Camera, Microscope, AlertTriangle, 
  BrainCircuit, Utensils, Pill, Plus, Activity,
  CheckCircle2, Target, Flame, Info, Scale
} from 'lucide-react';

interface SmartClinicProps {
  user: User;
  onUpdateHealthProfile?: (profile: HealthProfile) => void;
}

const SmartClinic: React.FC<SmartClinicProps> = ({ user, onUpdateHealthProfile }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [labResult, setLabResult] = useState<any>(null);
  const [foodResult, setFoodResult] = useState<any>(null);
  const [medResult, setMedResult] = useState<any>(null);

  const labInputRef = useRef<HTMLInputElement>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const medInputRef = useRef<HTMLInputElement>(null);

  const calculateBMI = (w: number, h: number) => {
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'نقص وزن', color: 'text-amber-500' };
    if (bmi < 25) return { label: 'وزن مثالي', color: 'text-emerald-500' };
    if (bmi < 30) return { label: 'زيادة وزن', color: 'text-orange-500' };
    return { label: 'سمنة', color: 'text-rose-500' };
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'food' | 'med' | 'lab') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(type);
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = (reader.result as string).split(',')[1];
      base64 = await optimizeImage(base64, type === 'lab' ? 1200 : 1024, 0.8);
      try {
        if (type === 'food') setFoodResult(await analyzeFoodNutrition(base64, user.healthProfile, true));
        else if (type === 'med') setMedResult(await explainMedication(base64, user.healthProfile, true));
        else if (type === 'lab') {
          const result = await analyzeLabReport(base64, user.healthProfile, true);
          setLabResult(result);
          if (onUpdateHealthProfile && user.healthProfile) {
            onUpdateHealthProfile({ ...user.healthProfile, lastLabResults: result });
          }
        }
      } catch (err) { console.error(err); }
      setLoading(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 font-cairo" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
            <Activity size={32} className="text-litcOrange" /> العيادة الذكية
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-2">تحليل طبي، غذائي، ودوائي مدعوم بالذكاء الاصطناعي</p>
        </div>
      </div>

      {/* BMI Section */}
      <section className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-litcBlue rounded-2xl flex items-center justify-center shadow-inner">
            <Scale size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">مؤشر كتلة الجسم (BMI)</h3>
            <p className="text-sm font-bold text-slate-400">
              {user.healthProfile?.height && user.healthProfile?.weight 
                ? 'بناءً على بياناتك المسجلة' 
                : 'يرجى تحديث بياناتك في الملف الصحي الذكي'}
            </p>
          </div>
        </div>
        {user.healthProfile?.height && user.healthProfile?.weight && (
          <div className="text-center">
            <p className="text-3xl font-black text-litcBlue">
              {calculateBMI(user.healthProfile.weight, user.healthProfile.height)}
            </p>
            <p className={`text-xs font-black mt-1 ${getBMICategory(parseFloat(calculateBMI(user.healthProfile.weight, user.healthProfile.height))).color}`}>
              {getBMICategory(parseFloat(calculateBMI(user.healthProfile.weight, user.healthProfile.height))).label}
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-right">
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black text-litcBlue flex items-center gap-4"><Microscope size={36} className="text-litcOrange" /> استشاري التحاليل الذكي</h3>
                <button onClick={() => labInputRef.current?.click()} className="w-16 h-16 bg-blue-50 text-litcBlue rounded-2xl hover:bg-litcBlue hover:text-white transition-all shadow-lg flex items-center justify-center">
                   {loading === 'lab' ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                </button>
                <input type="file" ref={labInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'lab')} />
             </div>
             {labResult ? (
               <div className="space-y-10 animate-in slide-in-from-bottom-6">
                  <div className={`p-10 rounded-[3rem] flex items-center gap-8 text-white shadow-2xl ${labResult.overallRisk === 'حرج' ? 'bg-rose-500 shadow-rose-200' : labResult.overallRisk === 'تنبيه' ? 'bg-amber-500 shadow-amber-200' : 'bg-emerald-500 shadow-emerald-200'}`}>
                     <AlertTriangle size={48} />
                     <div>
                        <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">التقييم الصحي العام</p>
                        <p className="text-4xl font-black">{labResult.overallRisk}</p>
                     </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                     <h4 className="font-black text-slate-900 flex items-center gap-3 mb-4"><BrainCircuit size={24} className="text-litcBlue" /> القراءة الطبية المعمقة:</h4>
                     <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-r-4 border-litcOrange pr-6">"{labResult.medicalExplanation}"</p>
                  </div>
                  <div className="overflow-hidden rounded-[3rem] border border-slate-100 bg-white shadow-sm">
                     <table className="w-full text-right">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400">
                           <tr>
                              <th className="px-8 py-5">نوع الفحص</th>
                              <th className="px-8 py-5 text-center">النتيجة</th>
                              <th className="px-8 py-5 text-center">الحالة الفنية</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {labResult.findings.map((f: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-8 py-5">
                                    <p className="font-black text-slate-900 text-sm">{f.testName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{f.clinicalSignificance}</p>
                                 </td>
                                 <td className="px-8 py-5 text-center font-black text-litcBlue">{f.resultValue} {f.unit}</td>
                                 <td className="px-8 py-5 text-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border ${f.status === 'طبيعي' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{f.status}</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
             ) : (
               <div className="py-20 flex flex-col items-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[4rem]">
                  <Microscope size={64} className="opacity-10 mb-6" />
                  <p className="font-black text-slate-400">ارفع صورة التحليل للحصول على شرح طبي فوري</p>
               </div>
             )}
          </section>
        </div>
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-litcOrange/5 rounded-full blur-3xl group-hover:bg-litcOrange/10 transition-all"></div>
             <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-2xl font-black text-litcBlue flex items-center gap-3"><Utensils className="text-litcOrange" /> محلل التغذية</h3>
                <button onClick={() => foodInputRef.current?.click()} className="w-14 h-14 bg-orange-50 text-litcOrange rounded-2xl flex items-center justify-center hover:bg-litcOrange hover:text-white transition-all shadow-md">
                   {loading === 'food' ? <Loader2 className="animate-spin" /> : <Camera size={24} />}
                </button>
                <input type="file" ref={foodInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'food')} />
             </div>
             {foodResult ? (
               <div className="space-y-6 animate-in zoom-in relative z-10">
                  <div className="bg-slate-900 text-white p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-litcOrange/20 to-transparent"></div>
                     <p className="text-2xl font-black mb-3 relative z-10">{foodResult.mealName}</p>
                     <div className="flex justify-center gap-4 mt-6 relative z-10">
                        <div className="bg-white/10 p-4 rounded-3xl text-center flex-1 backdrop-blur-md border border-white/5 shadow-inner">
                           <Flame size={18} className="mx-auto text-litcOrange mb-1" />
                           <p className="text-2xl font-black">{foodResult.calories}</p>
                           <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">سعرة حرارية</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-3xl text-center flex-1 backdrop-blur-md border border-white/5 shadow-inner">
                           <Target size={18} className="mx-auto text-emerald-400 mb-1" />
                           <p className="text-2xl font-black">{foodResult.healthScore}</p>
                           <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">درجة الصحة</p>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 shadow-sm">
                        <p className="text-lg font-black text-litcBlue">{foodResult.protein}g</p>
                        <p className="text-[9px] font-black text-slate-400">بروتين</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 shadow-sm">
                        <p className="text-lg font-black text-litcBlue">{foodResult.carbs}g</p>
                        <p className="text-[9px] font-black text-slate-400">كربوهيدرات</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 shadow-sm">
                        <p className="text-lg font-black text-litcBlue">{foodResult.fats}g</p>
                        <p className="text-[9px] font-black text-slate-400">دهون</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                        <p className="text-[11px] font-black text-emerald-700 mb-3 flex items-center gap-2 uppercase tracking-widest"><CheckCircle2 size={16} /> الفوائد الصحية</p>
                        <ul className="text-xs font-bold text-slate-600 space-y-2">
                           {foodResult.benefits?.map((b: string, i: number) => <li key={i} className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0"></div> {b}</li>)}
                        </ul>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="py-20 flex flex-col items-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem]">
                  <Utensils size={48} className="opacity-10 mb-6" />
                  <p className="text-xs font-black text-slate-400">حلل وجبتك غذائياً واحسب السعرات الآن</p>
               </div>
             )}
          </section>
          <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-litcBlue flex items-center gap-3"><Pill className="text-litcOrange" /> قارئ الأدوية</h3>
                <button onClick={() => medInputRef.current?.click()} className="w-12 h-12 bg-blue-50 text-litcBlue rounded-2xl flex items-center justify-center">
                   {loading === 'med' ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                </button>
                <input type="file" ref={medInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'med')} />
             </div>
             {medResult && (
               <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-in slide-in-from-left-4">
                  <p className="text-lg font-black text-litcBlue mb-2">{medResult.medName}</p>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed mb-4">{medResult.usage}</p>
                  <div className="p-5 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-700 border border-amber-100 shadow-sm">
                     <Info size={14} className="inline ml-2" /> تنبيه: {medResult.warnings}
                  </div>
               </div>
             )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SmartClinic;