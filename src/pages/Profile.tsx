
import React, { useState, useRef } from 'react';
import { User, Claim, HealthProfile, HealthPlan } from '../types';
import ClaimCard from '../components/ClaimCard';
import { 
  analyzeFoodNutrition, 
  explainMedication, 
  analyzeLabReport,
  analyzeDiseaseInput,
  generateDetailedHealthPlan,
  swapMealPlan
} from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';
import { 
  Loader2, Camera, Microscope, AlertTriangle, CheckCircle, 
  HeartPulse, Droplet, Shield, Activity,
  BrainCircuit, Zap, Stethoscope, Utensils, Pill, Plus, History,
  CheckCircle2, Target, Flame, Scale, Info, Sparkles, ArrowUpRight, X, AlertCircle,
  User as UserIcon, UserPlus, ChevronRight, ChevronLeft, Calendar, Timer, ListChecks,
  MapPin, Building2, Briefcase
} from 'lucide-react';

interface ProfileProps {
  user: User;
  claims: Claim[];
  onNavigate: (path: string) => void;
  onSelectClaim: (claim: Claim) => void;
  onUpdateHealthProfile?: (profile: HealthProfile) => void;
  onUpdatePlans?: (plans: HealthPlan[]) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, claims, onNavigate, onSelectClaim, onUpdateHealthProfile, onUpdatePlans }) => {
  const [activeTab, setActiveTab] = useState<'health-plans' | 'smart-clinic' | 'medical-id' | 'medical-claims'>('health-plans');
  const [isPersonal, setIsPersonal] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(!user.healthProfile);
  const [loading, setLoading] = useState<string | null>(null);
  const [labResult, setLabResult] = useState<any>(null);
  const [foodResult, setFoodResult] = useState<any>(null);
  const [medResult, setMedResult] = useState<any>(null);
  const [showOtherDiseaseInput, setShowOtherDiseaseInput] = useState(false);
  const [otherDiseaseText, setOtherDiseaseText] = useState('');
  const [isAnalyzingDisease, setIsAnalyzingDisease] = useState(false);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [swappingTaskId, setSwappingTaskId] = useState<string | null>(null);
  const [swapPreferences, setSwapPreferences] = useState<{ [key: string]: string }>({});

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newPlan, setNewPlan] = useState<Partial<HealthPlan>>({
    isPersonal: true,
    type: 'healthy',
    goal: 'maintenance',
    chronicDiseases: [],
    duration: 30,
    sportType: 'مشي',
    gymAttendance: false
  });
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardNewDiseases, setWizardNewDiseases] = useState<string[]>([]);

  const labInputRef = useRef<HTMLInputElement>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const medInputRef = useRef<HTMLInputElement>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user.name.split(' ')[0];
    if (hour < 12) return `صباح الخير يا بطل، ${name}!`;
    if (hour < 18) return `طاب يومك يا ${name}، كيف حال صحتك اليوم؟`;
    return `مساء الصحة والعافية يا ${name}!`;
  };

  const getDailyGoal = () => {
    if (!user.healthProfile) return "ابدأ بتحديد أهدافك الصحية اليوم.";
    if (user.healthProfile.pathway === 'healthy') return "هدفنا اليوم هو تقليل الكربوهيدرات بنسبة 10% وزيادة النشاط.";
    if (user.healthProfile.pathway === 'therapeutic') return "الالتزام بمواعيد الدواء وشرب الماء هو مفتاح استقرارك اليوم.";
    return "توازن بين الغذاء الصحي والنشاط البدني المعتدل.";
  };

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
        if (type === 'food') setFoodResult(await analyzeFoodNutrition(base64, user.healthProfile, isPersonal));
        else if (type === 'med') setMedResult(await explainMedication(base64, user.healthProfile, isPersonal));
        else if (type === 'lab') {
          const result = await analyzeLabReport(base64, user.healthProfile, isPersonal);
          setLabResult(result);
          if (isPersonal && onUpdateHealthProfile && user.healthProfile) {
            onUpdateHealthProfile({ ...user.healthProfile, lastLabResults: result });
          }
        }
      } catch (err) { console.error(err); }
      setLoading(null);
    };
    reader.readAsDataURL(file);
  };

  const [editProfile, setEditProfile] = useState<HealthProfile>(user.healthProfile || {
    bloodType: '',
    height: 0,
    weight: 0,
    age: 0,
    chronicDiseases: [],
    pathway: 'healthy',
    dailyWaterIntake: 0,
    systolicBP: 0,
    diastolicBP: 0,
    hba1c: 0
  });

  const calculateCompletion = () => {
    const profile = isEditingProfile ? editProfile : user.healthProfile;
    if (!profile) return 0;
    const fields = ['height', 'weight', 'age', 'bloodType'];
    let filled = fields.filter(f => !!(profile as any)[f]).length;
    if (profile.chronicDiseases.length > 0) filled += 1;
    return Math.round((filled / 5) * 100);
  };

  const CHRONIC_DISEASES = [
    'سكري نوع 1', 'سكري نوع 2', 'ضغط الدم', 'أمراض القلب', 'الربو', 
    'حساسية القمح/الجلوتين', 'الكوليسترول', 'الغدة الدرقية', 'أمراض الكلى', 'اليوريك أسيد',
    'لا شيء', 'أخرى'
  ];

  const handleSaveProfile = () => {
    if (onUpdateHealthProfile) {
      onUpdateHealthProfile(editProfile);
      setIsEditingProfile(false);
    }
  };

  const startNewPlan = () => {
    setNewPlan({
      isPersonal: true,
      type: 'healthy',
      goal: 'maintenance',
      chronicDiseases: user.healthProfile?.chronicDiseases || []
    });
    setWizardNewDiseases([]);
    
    // Check if height or weight is missing for personal plan
    if (!user.healthProfile?.height || !user.healthProfile?.weight) {
      setWizardStep(0); // Step 0 is for missing profile data
    } else {
      setWizardStep(1);
    }
    
    setShowWizard(true);
  };

  const checkGoalConflicts = (goal: string) => {
    if (!user.activePlans) return null;
    
    const activeGoals = user.activePlans.filter(p => p.status === 'active').map(p => p.goal);
    
    if (goal === 'weight_loss' && activeGoals.includes('weight_gain')) {
      return "لا يمكن البدء بخطة إنقاص وزن بينما لديك خطة نشطة لزيادة الوزن. يرجى إكمال أو إلغاء الخطة السابقة أولاً.";
    }
    if (goal === 'weight_gain' && activeGoals.includes('weight_loss')) {
      return "لا يمكن البدء بخطة زيادة وزن بينما لديك خطة نشطة لإنقاص الوزن.";
    }
    if (goal === 'muscle_building' && activeGoals.includes('weight_loss')) {
      // Not a strict conflict but maybe a warning
      return null;
    }
    return null;
  };

  const handleWizardNext = async () => {
    if (wizardStep === 0) {
      if (!user.healthProfile?.height || !user.healthProfile?.weight) {
        setWizardError("يرجى إدخال الطول والوزن للمتابعة");
        return;
      }
      setWizardStep(1);
      return;
    }

    if (wizardStep === 1) {
      if (newPlan.isPersonal && (!user.healthProfile?.height || !user.healthProfile?.weight)) {
        setWizardStep(0);
        return;
      }
    }

    if (wizardStep === 6) {
      const conflict = checkGoalConflicts(newPlan.goal!);
      if (conflict) {
        setWizardError(conflict);
        return;
      }

      // Auto-sync diseases to profile if personal
      if (newPlan.isPersonal && onUpdateHealthProfile && user.healthProfile) {
        const mergedDiseases = Array.from(new Set([...user.healthProfile.chronicDiseases, ...wizardNewDiseases]));
        if (mergedDiseases.length > user.healthProfile.chronicDiseases.length) {
          onUpdateHealthProfile({ ...user.healthProfile, chronicDiseases: mergedDiseases });
        }
      }
      
      setIsGeneratingPlan(true);

      const targetProfile = newPlan.isPersonal && user.healthProfile ? user.healthProfile : {
        ...user.healthProfile,
        chronicDiseases: newPlan.chronicDiseases || []
      } as HealthProfile;

      const aiPlan = await generateDetailedHealthPlan(
        targetProfile,
        newPlan.goal!,
        newPlan.type!,
        newPlan.duration || 30,
        newPlan.sportType
      );

      setIsGeneratingPlan(false);

      let dailyTasks = aiPlan?.dailyTasks || [];
      let aiExplanation = aiPlan?.aiExplanation || getAIPlanExplanation(newPlan.goal!, newPlan.isPersonal ? (user.healthProfile?.chronicDiseases || []) : (newPlan.chronicDiseases || []));

      if (dailyTasks.length === 0) {
        if (newPlan.type === 'healthy') {
          dailyTasks.push({ id: 't1', label: "فطور: بيض مسلوق + خضار", icon: 'utensils', completed: false, category: 'nutrition' });
          dailyTasks.push({ id: 't2', label: "غداء: صدر دجاج + سلطة خضراء", icon: 'utensils', completed: false, category: 'nutrition' });
          dailyTasks.push({ id: 't3', label: `ممارسة رياضة ${newPlan.sportType || 'المشي'} لمدة 30 دقيقة`, icon: 'activity', completed: false, category: 'sport' });
          dailyTasks.push({ id: 't4', label: `النوم لمدة ${newPlan.duration === 30 ? 8 : 7} ساعات`, icon: 'moon', completed: false, category: 'sleep' });
          dailyTasks.push({ id: 't5', label: "شرب 2 لتر ماء", icon: 'droplet', completed: false, category: 'hydration' });
        } else {
          dailyTasks.push({ id: 't1', label: "تناول الدواء الصباحي", icon: 'pill', completed: false, category: 'medication' });
          dailyTasks.push({ id: 't2', label: "قياس العلامات الحيوية", icon: 'activity', completed: false, category: 'monitoring' });
          dailyTasks.push({ id: 't3', label: "وجبة خفيفة صحية", icon: 'utensils', completed: false, category: 'nutrition' });
        }
      }

      const plan: HealthPlan = {
        id: `PLAN-${Math.floor(1000 + Math.random() * 9000)}`,
        isPersonal: newPlan.isPersonal!,
        type: newPlan.type!,
        goal: newPlan.goal!,
        startDate: new Date().toISOString().split('T')[0],
        chronicDiseases: newPlan.isPersonal ? (user.healthProfile?.chronicDiseases || []) : (newPlan.chronicDiseases || []),
        status: 'active',
        aiExplanation,
        duration: newPlan.duration || 30,
        dailyTasks,
        currentDay: 1,
        sportType: newPlan.sportType,
        gymAttendance: newPlan.gymAttendance,
        requestedLabs: getRequestedLabs({ goal: newPlan.goal, type: newPlan.type } as any),
        calories: aiPlan?.calories,
        protein: aiPlan?.protein,
        carbs: aiPlan?.carbs,
        fats: aiPlan?.fats
      };

      if (onUpdatePlans) {
        onUpdatePlans([...(user.activePlans || []), plan]);
      }
      setShowWizard(false);
      setActiveTab('health-plans');
    } else {
      setWizardStep(wizardStep + 1);
    }
  };

  const toggleTask = (planId: string, taskId: string) => {
    if (!user.activePlans || !onUpdatePlans) return;
    const updatedPlans = user.activePlans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          dailyTasks: p.dailyTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return p;
    });
    onUpdatePlans(updatedPlans);
  };

  const handleSwapMeal = async (planId: string, taskId: string, currentLabel: string) => {
    if (!user.activePlans || !onUpdatePlans || !user.healthProfile) return;
    
    const prefs = swapPreferences[taskId] || 'أي وجبة صحية بديلة';
    setSwappingTaskId(taskId);
    
    const newMealData = await swapMealPlan(user.healthProfile, currentLabel, prefs);
    
    if (newMealData && newMealData.newMealLabel) {
      const updatedPlans = user.activePlans.map(p => {
        if (p.id === planId) {
          return {
            ...p,
            dailyTasks: p.dailyTasks.map(t => 
              t.id === taskId 
                ? { ...t, label: newMealData.newMealLabel, calories: newMealData.calories || t.calories } 
                : t
            )
          };
        }
        return p;
      });
      onUpdatePlans(updatedPlans);
      setSwapPreferences(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
    
    setSwappingTaskId(null);
  };

  const getRequestedLabs = (plan: HealthPlan) => {
    if (plan.goal === 'weight_loss') return ['تحليل الغدة الدرقية (TSH)', 'فحص فيتامين D'];
    if (plan.goal === 'regulate_indicators') return ['السكر التراكمي (HbA1c)', 'دهون الدم الثلاثية'];
    if (plan.type === 'therapeutic') return ['وظائف الكلى', 'وظائف الكبد'];
    return ['صورة دم كاملة (CBC)'];
  };

  const getAIPlanExplanation = (goal: string, diseases: string[]) => {
    let explanation = "";
    if (goal === 'weight_loss') {
      explanation = "تم تصميم خطة إنقاص الوزن هذه مع مراعاة احتياجاتك الغذائية.";
      if (diseases.includes('سكري نوع 2') || diseases.includes('سكري نوع 1')) {
        explanation = "تم تعديل خطة إنقاص الوزن لتناسب حالتك مع مرض السكري لضمان استقرار مستويات السكر في الدم وتجنب الهبوط المفاجئ.";
      }
    } else if (goal === 'muscle_building') {
      explanation = "تركز هذه الخطة على زيادة البروتين والتمارين المقاومة.";
      if (diseases.includes('أمراض الكلى')) {
        explanation = "تم تعديل خطة بناء العضلات لتقليل الضغط على الكلى من خلال موازنة كميات البروتين المستهلكة.";
      }
    } else if (goal === 'regulate_indicators') {
      explanation = "تهدف هذه الخطة بشكل أساسي إلى تحسين المؤشرات الحيوية مثل ضغط الدم والكوليسترول.";
    }
    return explanation || "خطة مخصصة بناءً على أهدافك الصحية الحالية.";
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 space-y-8 sm:space-y-12 animate-in fade-in duration-700 font-cairo pb-24" dir="rtl">
      
      {/* Permanent Medical Profile Section */}
      <section className="bg-white rounded-[2.5rem] sm:rounded-[4rem] p-5 sm:p-10 border border-slate-100 shadow-xl relative overflow-hidden group max-w-md mx-auto lg:max-w-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-litcBlue/5 rounded-full -mr-40 -mt-40 blur-3xl"></div>
        <div className="relative z-10 space-y-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-litcBlue to-litcDark flex items-center justify-center text-3xl text-white font-black shadow-2xl border-4 border-white">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{user.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                   <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {user.location || 'الموقع غير محدد'}
                   </span>
                   <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black border border-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> {user.building || 'المبنى غير محدد'}
                   </span>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md w-full space-y-3">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-litcBlue">اكتمال الملف الطبي</span>
                <span className="text-slate-400">{calculateCompletion()}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-litcBlue to-emerald-400 transition-all duration-1000 shadow-lg"
                  style={{ width: `${calculateCompletion()}%` }}
                ></div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {isEditingProfile ? (
                <>
                  <button 
                    onClick={handleSaveProfile} 
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-emerald-500 text-white rounded-2xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 hover:scale-105"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> حفظ التعديلات
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditProfile(user.healthProfile || editProfile);
                    }} 
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-2 hover:bg-slate-200"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> إلغاء
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditingProfile(true)} 
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-slate-100 hover:bg-litcBlue hover:text-white rounded-2xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> تعديل البيانات
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('smart-clinic');
                      labInputRef.current?.click();
                    }}
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-litcOrange text-white rounded-2xl text-[10px] sm:text-xs font-black transition-all shadow-lg shadow-litcOrange/20 flex items-center gap-2 hover:scale-105"
                  >
                    <Microscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> رفع تحاليل طبية
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { 
                label: 'الطول', 
                val: user.healthProfile?.height ? `${user.healthProfile.height} سم` : 'فارغ', 
                icon: <ArrowUpRight className="text-emerald-500 w-5 h-5" />, 
                color: 'bg-emerald-50',
                field: 'height',
                type: 'number',
                suffix: 'سم'
              },
              { 
                label: 'الوزن', 
                val: user.healthProfile?.weight ? `${user.healthProfile.weight} كجم` : 'فارغ', 
                icon: <Scale className="text-amber-500 w-5 h-5" />, 
                color: 'bg-amber-50',
                field: 'weight',
                type: 'number',
                suffix: 'كجم'
              },
              { 
                label: 'العمر', 
                val: user.healthProfile?.age ? `${user.healthProfile.age} سنة` : 'فارغ', 
                icon: <Activity className="text-blue-500 w-5 h-5" />, 
                color: 'bg-blue-50',
                field: 'age',
                type: 'number',
                suffix: 'سنة'
              },
              { 
                label: 'BMI', 
                val: user.healthProfile?.height && user.healthProfile?.weight ? calculateBMI(user.healthProfile.weight, user.healthProfile.height) : '--', 
                icon: <Target className="text-litcBlue w-5 h-5" />, 
                color: 'bg-indigo-50',
                field: 'bmi',
                readonly: true
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm text-center group hover:shadow-md hover:-translate-y-1 transition-all">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{item.label}</p>
                
                {isEditingProfile && !item.readonly ? (
                  <div className="flex items-center justify-center gap-1">
                    <input 
                      type="number"
                      value={(editProfile as any)[item.field!] || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                        setEditProfile({...editProfile, [item.field!]: isNaN(val) ? 0 : val});
                      }}
                      className="w-12 sm:w-16 bg-slate-50 border-none rounded-xl text-xs sm:text-sm font-black text-center focus:ring-2 focus:ring-litcBlue p-1"
                    />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">{item.suffix}</span>
                  </div>
                ) : (
                  <p className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {item.field === 'bmi' && isEditingProfile 
                      ? (editProfile.height && editProfile.weight ? calculateBMI(editProfile.weight, editProfile.height) : '--')
                      : item.val}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Health Tags Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4" /> المؤشرات الصحية الأساسية
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Blood Type Tag */}
              <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center gap-3">
                <Droplet className="text-rose-500 w-4 h-4" />
                <div>
                  <p className="text-[8px] font-black text-rose-400 uppercase">فصيلة الدم</p>
                  {isEditingProfile ? (
                    <select 
                      value={editProfile.bloodType} 
                      onChange={(e) => setEditProfile({...editProfile, bloodType: e.target.value})}
                      className="bg-transparent border-none p-0 text-xs font-black text-rose-700 focus:ring-0"
                    >
                      <option value="">اختر...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <p className="text-xs font-black text-rose-700">{user.healthProfile?.bloodType || 'غير محدد'}</p>
                  )}
                </div>
              </div>

              {/* Allergies Tag */}
              <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-3">
                <AlertCircle className="text-amber-500 w-4 h-4" />
                <div>
                  <p className="text-[8px] font-black text-amber-400 uppercase">الحساسية</p>
                  {isEditingProfile ? (
                    <input 
                      type="text"
                      placeholder="أضف حساسية..."
                      value={editProfile.allergies?.join(', ') || ''}
                      onChange={(e) => setEditProfile({...editProfile, allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                      className="bg-transparent border-none p-0 text-xs font-black text-amber-700 focus:ring-0 placeholder:text-amber-300"
                    />
                  ) : (
                    <p className="text-xs font-black text-amber-700">
                      {user.healthProfile?.allergies?.length ? user.healthProfile.allergies.join('، ') : 'لا توجد حساسية'}
                    </p>
                  )}
                </div>
              </div>

              {/* Chronic Conditions Tag */}
              <div className="bg-litcBlue/5 border border-litcBlue/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <HeartPulse className="text-litcBlue w-4 h-4" />
                <div>
                  <p className="text-[8px] font-black text-litcBlue/50 uppercase">الأمراض المزمنة</p>
                  <p className="text-xs font-black text-litcBlue">
                    {user.healthProfile?.chronicDiseases.length && !user.healthProfile.chronicDiseases.includes('لا شيء') 
                      ? user.healthProfile.chronicDiseases.join('، ') 
                      : 'لا توجد'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chronic Diseases Summary */}
          <div className="p-5 sm:p-8 bg-slate-50/50 rounded-[2.5rem] sm:rounded-[3rem] border border-white shadow-inner flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Shield className="text-litcBlue w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">الأمراض المزمنة المسجلة</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                      {isEditingProfile 
                        ? (editProfile.chronicDiseases.length ? editProfile.chronicDiseases.join('، ') : 'لم يتم الاختيار')
                        : (user.healthProfile?.chronicDiseases.length ? user.healthProfile.chronicDiseases.join('، ') : 'لا توجد أمراض مسجلة حالياً')}
                    </p>
                  </div>
                </div>
                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setActiveTab('smart-clinic');
                      labInputRef.current?.click();
                    }}
                    className="text-[8px] font-black text-litcOrange hover:underline"
                  >
                    (تحديث بالتحاليل)
                  </button>
                )}
              </div>

              {isEditingProfile && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set([...CHRONIC_DISEASES, ...editProfile.chronicDiseases])).map(d => (
                      <button 
                        key={d} 
                        onClick={() => {
                          if (d === 'أخرى') {
                            setShowOtherDiseaseInput(!showOtherDiseaseInput);
                            return;
                          }
                          if (d === 'لا شيء') {
                            setEditProfile({ ...editProfile, chronicDiseases: ['لا شيء'] });
                            setShowOtherDiseaseInput(false);
                            return;
                          }
                          const exists = editProfile.chronicDiseases.includes(d);
                          let updated = exists 
                            ? editProfile.chronicDiseases.filter((item: string) => item !== d) 
                            : [...editProfile.chronicDiseases, d];
                          updated = updated.filter(item => item !== 'لا شيء');
                          setEditProfile({ ...editProfile, chronicDiseases: updated });
                        }} 
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all ${editProfile.chronicDiseases.includes(d) ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-500 border-slate-200 hover:border-litcBlue'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  
                  {showOtherDiseaseInput && (
                    <div className="w-full flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        placeholder="اكتب اسم المرض المزمن..." 
                        value={otherDiseaseText}
                        onChange={(e) => setOtherDiseaseText(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-litcBlue outline-none"
                      />
                      <button 
                        onClick={async () => {
                          if (!otherDiseaseText.trim()) return;
                          setIsAnalyzingDisease(true);
                          const analyzedDisease = await analyzeDiseaseInput(otherDiseaseText);
                          setIsAnalyzingDisease(false);
                          
                          let updated = [...editProfile.chronicDiseases, analyzedDisease];
                          updated = updated.filter(item => item !== 'لا شيء');
                          
                          setEditProfile({ ...editProfile, chronicDiseases: Array.from(new Set(updated)) });
                          setOtherDiseaseText('');
                          setShowOtherDiseaseInput(false);
                        }}
                        disabled={isAnalyzingDisease}
                        className="bg-litcBlue text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzingDisease ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        إضافة
                      </button>
                    </div>
                  )}

                  {editProfile.chronicDiseases.length > 0 && !editProfile.chronicDiseases.includes('لا شيء') && (
                    <div className="mt-4 p-6 bg-gradient-to-br from-litcBlue to-litcDark rounded-[2rem] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                          <Microscope className="text-litcOrange w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black mb-1">خطوة مهمة لمتابعة صحتك!</h4>
                          <p className="text-xs font-bold opacity-80 leading-relaxed">
                            لأننا نهتم بصحتك، يرجى رفع آخر تحاليل طبية قمت بها ليتمكن النظام من تحليل حالتك بدقة وإنشاء إرشادات مخصصة للحفاظ على استقرارك الصحي.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('smart-clinic')}
                        className="px-6 py-3 bg-litcOrange text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-litcOrange/20 flex items-center gap-2 hover:scale-105 shrink-0"
                      >
                        <ArrowUpRight className="w-4 h-4" /> رفع التحاليل الآن
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {(isEditingProfile ? editProfile.chronicDiseases : user.healthProfile?.chronicDiseases)?.some(d => d.includes('سكري')) && (
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">السكر التراكمي</p>
                  {isEditingProfile ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        step="0.1"
                        value={editProfile.hba1c || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setEditProfile({...editProfile, hba1c: isNaN(val) ? 0 : val});
                        }}
                        className="w-14 bg-slate-50 border-none rounded-lg text-sm font-black text-center focus:ring-2 focus:ring-litcBlue"
                      />
                      <span className="text-xs font-black text-litcBlue">%</span>
                    </div>
                  ) : (
                    <p className="text-xl font-black text-litcBlue">{user.healthProfile?.hba1c}%</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-litcBlue">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>

          {/* Family Members Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <UserPlus className="text-litcBlue w-6 h-6" /> أفراد العائلة المسجلين
              </h3>
              <button className="text-[10px] font-black text-litcBlue bg-litcBlue/5 px-4 py-2 rounded-xl hover:bg-litcBlue hover:text-white transition-all">
                إضافة فرد جديد
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.familyMembers?.map((member) => (
                <div key={member.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-slate-100 group-hover:bg-litcBlue transition-colors"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-litcBlue/10 group-hover:text-litcBlue transition-all">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{member.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {member.relationship === 'Spouse' ? 'الزوج/الزوجة' : 
                         member.relationship === 'Son' ? 'الابن' : 
                         member.relationship === 'Daughter' ? 'الابنة' : member.relationship}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.isChronic ? (
                      <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded-lg text-[8px] font-black border border-rose-100 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> حالة مزمنة
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[8px] font-black border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> حالة سليمة
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(!user.familyMembers || user.familyMembers.length === 0) && (
                <div className="col-span-full py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <UserPlus className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs font-bold">لم يتم تسجيل أفراد عائلة بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex justify-center p-2.5 bg-slate-200/50 w-full rounded-[2.5rem] shadow-inner overflow-x-auto">
        {[
          { id: 'health-plans', label: 'الخطط والجدول اليومي', icon: <Target className="w-5 h-5" /> },
          { id: 'medical-claims', label: 'المطالبات المالية', icon: <History className="w-5 h-5" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 min-w-[140px] px-6 py-4 rounded-[2.2rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${activeTab === tab.id ? 'bg-white text-litcBlue shadow-2xl' : 'text-slate-500'}`}
          >
            <Target className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'health-plans' ? (
        <div className="space-y-10">
          <section className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 sm:gap-4">
                <Target className="text-litcOrange w-7 h-7 sm:w-8 sm:h-8" /> أهدافي النشطة
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400">متابعة حية لتقدمك الصحي</p>
            </div>

            {/* BMI Proactive Suggestion */}
            {user.healthProfile && parseFloat(calculateBMI(user.healthProfile.weight, user.healthProfile.height)) < 18.5 && !user.activePlans?.some(p => p.goal === 'weight_gain') && (
              <div className="p-6 sm:p-8 bg-amber-50 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-10 max-w-md mx-auto lg:max-w-none">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-black text-amber-900">اقتراح ذكي: خطة زيادة وزن</h4>
                    <p className="text-xs sm:text-sm font-bold text-amber-700">مؤشر كتلة جسمك يشير إلى نحافة، هل ترغب في بدء مسار صحي لزيادة الوزن؟</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setNewPlan({...newPlan, goal: 'weight_gain'});
                    setShowWizard(true);
                    setWizardStep(1);
                  }}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-amber-600 text-white rounded-[1.5rem] sm:rounded-3xl font-black shadow-lg hover:bg-amber-700 transition-all text-sm"
                >
                  ابدأ الآن
                </button>
              </div>
            )}

            {user.activePlans && user.activePlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {user.activePlans.map(plan => (
                  <div key={plan.id} className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 border border-slate-100 shadow-xl relative overflow-hidden group max-w-md mx-auto lg:max-w-none w-full">
                    <div className={`absolute top-0 left-0 w-full h-3 ${plan.type === 'healthy' ? 'bg-emerald-500' : plan.type === 'therapeutic' ? 'bg-litcBlue' : 'bg-litcOrange'}`}></div>
                    <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {plan.isPersonal ? 'خطة شخصية' : 'خطة استشارية'}
                        </p>
                        <h3 className="text-2xl font-black text-slate-900">
                          {plan.goal === 'weight_loss' ? 'إنقاص الوزن' : 
                           plan.goal === 'muscle_building' ? 'بناء العضلات' : 
                           plan.goal === 'weight_gain' ? 'زيادة الوزن' : 
                           plan.goal === 'regulate_indicators' ? 'تنظيم المؤشرات' : 'المحافظة على الوزن'}
                        </h3>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.type === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-litcBlue'}`}>
                        {plan.type === 'healthy' ? <Zap className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                          <BrainCircuit className="inline ml-2 text-litcBlue w-4 h-4" />
                          {plan.aiExplanation}
                        </p>
                      </div>

                      {/* Macros & Calories */}
                      {plan.calories && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-orange-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center border border-orange-100 shadow-sm col-span-2 sm:col-span-1 flex flex-col justify-center">
                            <Flame className="mx-auto text-litcOrange mb-1 w-4.5 h-4.5 sm:w-5 sm:h-5" />
                            <p className="text-lg sm:text-xl font-black text-litcOrange">{plan.calories}</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-orange-400 uppercase">سعرة حرارية</p>
                          </div>
                          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center border border-slate-100 shadow-sm">
                            <p className="text-base sm:text-lg font-black text-litcBlue">{plan.protein}g</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400">بروتين</p>
                          </div>
                          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center border border-slate-100 shadow-sm">
                            <p className="text-base sm:text-lg font-black text-litcBlue">{plan.carbs}g</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400">كربوهيدرات</p>
                          </div>
                          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center border border-slate-100 shadow-sm">
                            <p className="text-base sm:text-lg font-black text-litcBlue">{plan.fats}g</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-400">دهون</p>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar & Day Counter */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-black">
                          <span className="text-litcBlue">اليوم {plan.currentDay || 1} من {plan.duration || 30}</span>
                          <span className="text-slate-400">{Math.round(((plan.currentDay || 1) / (plan.duration || 30)) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-litcBlue to-litcOrange transition-all duration-1000"
                            style={{ width: `${Math.min(100, Math.max(0, ((plan.currentDay || 1) / (plan.duration || 30)) * 100)) || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-black">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>بدأت في: {plan.startDate}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-4">جدول المهام اليومي المخصص:</p>
                        <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50/30">
                          <table className="w-full text-right text-[10px] sm:text-xs min-w-[300px]">
                            <thead className="bg-slate-100/50 text-slate-400 font-black">
                              <tr>
                                <th className="px-3 sm:px-4 py-3">الفئة</th>
                                <th className="px-3 sm:px-4 py-3">المهمة</th>
                                <th className="px-3 sm:px-4 py-3 text-center">إجراء</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {plan.dailyTasks?.map((task) => (
                                <tr key={task.id} className={`group hover:bg-white transition-colors ${task.completed ? 'opacity-50' : ''}`}>
                                  <td className="px-3 sm:px-4 py-3 sm:py-4 font-black text-litcBlue flex items-center gap-2">
                                    {task.icon === 'camera' ? <Camera className="w-3 h-3" /> : 
                                     task.icon === 'droplet' ? <Droplet className="w-3 h-3" /> : 
                                     task.icon === 'pill' ? <Pill className="w-3 h-3" /> : 
                                     task.icon === 'utensils' ? <Utensils className="w-3 h-3" /> :
                                     task.icon === 'moon' ? <History className="w-3 h-3" /> :
                                     <Activity className="w-3 h-3" />}
                                    <span className="hidden sm:inline">{task.category === 'nutrition' ? 'تغذية' : task.category === 'sport' ? 'رياضة' : task.category === 'sleep' ? 'نوم' : 'صحة'}</span>
                                  </td>
                                  <td className={`px-3 sm:px-4 py-3 sm:py-4 font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    <div className="flex flex-col gap-1">
                                      <span className="leading-tight">{task.label}</span>
                                      {task.calories && <span className="text-[8px] sm:text-[9px] text-litcOrange font-black">{task.calories} سعرة</span>}
                                      
                                      {task.category === 'nutrition' && !task.completed && (
                                        <div className="mt-2 flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                          <input 
                                            type="text" 
                                            placeholder="بديل؟" 
                                            value={swapPreferences[task.id] || ''}
                                            onChange={(e) => setSwapPreferences({...swapPreferences, [task.id]: e.target.value})}
                                            className="text-[9px] px-2 py-1 rounded-lg border border-slate-200 focus:ring-1 focus:ring-litcBlue outline-none w-20 sm:w-32"
                                          />
                                          <button 
                                            onClick={() => handleSwapMeal(plan.id, task.id, task.label)}
                                            disabled={swappingTaskId === task.id}
                                            className="text-[8px] sm:text-[9px] bg-slate-100 hover:bg-litcBlue hover:text-white text-slate-500 px-2 py-1 rounded-lg font-black transition-colors disabled:opacity-50 flex items-center gap-1"
                                          >
                                            {swappingTaskId === task.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'استبدال'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-center align-top">
                                    <button 
                                      onClick={() => toggleTask(plan.id, task.id)}
                                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all mx-auto mt-1 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-litcBlue'}`}
                                    >
                                      {task.completed && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Requested Labs for this plan */}
                      <div className="pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase">التحاليل المطلوبة (اختيارية):</p>
                          <span className="text-[9px] font-bold text-litcOrange bg-orange-50 px-2 py-0.5 rounded-full">تحديث تلقائي للخطة</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {plan.requestedLabs?.map((lab: string, i: number) => (
                            <div key={i} className="px-4 py-2 bg-blue-50 text-litcBlue rounded-xl text-[10px] font-black border border-blue-100 flex items-center gap-2">
                              <Microscope className="w-3 h-3" /> {lab}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                <Target className="mx-auto text-slate-200 mb-6 w-16 h-16" />
                <p className="text-xl font-black text-slate-400 mb-8">لا توجد خطط نشطة حالياً</p>
                <button onClick={startNewPlan} className="px-10 py-4 bg-litcBlue text-white rounded-3xl font-black shadow-xl shadow-litcBlue/20 hover:scale-105 transition-all">
                  ابدأ خطتك الأولى الآن
                </button>
              </div>
            )}
          </section>

          {showWizard && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="bg-litcBlue p-6 sm:p-10 text-white flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black">معالج الخطة الذكية</h2>
                    <p className="text-xs font-bold opacity-70 mt-1">خطوات بسيطة لحياة صحية أفضل</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <div key={s} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${wizardStep >= s ? 'bg-white' : 'bg-white/30'}`}></div>
                    ))}
                  </div>
                </div>
                <div className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                  {wizardError && (
                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 animate-in shake duration-500">
                      <AlertTriangle className="text-rose-500 shrink-0 w-6 h-6" />
                      <p className="text-sm font-black text-rose-700 leading-relaxed">{wizardError}</p>
                    </div>
                  )}
                  {wizardStep === 0 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">بيانات أساسية ناقصة</h3>
                        <p className="text-sm font-bold text-slate-400">نحتاج لمعرفة طولك ووزنك لإنشاء خطة دقيقة لك</p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">الطول (سم)</label>
                          <input 
                            type="number" 
                            value={user.healthProfile?.height || ''} 
                            onChange={(e) => {
                              if (onUpdateHealthProfile && user.healthProfile) {
                                onUpdateHealthProfile({...user.healthProfile, height: parseInt(e.target.value) || 0});
                              }
                            }}
                            className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-black text-slate-700 focus:ring-2 focus:ring-litcBlue outline-none"
                            placeholder="مثال: 175"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">الوزن (كجم)</label>
                          <input 
                            type="number" 
                            value={user.healthProfile?.weight || ''} 
                            onChange={(e) => {
                              if (onUpdateHealthProfile && user.healthProfile) {
                                onUpdateHealthProfile({...user.healthProfile, weight: parseInt(e.target.value) || 0});
                              }
                            }}
                            className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-black text-slate-700 focus:ring-2 focus:ring-litcBlue outline-none"
                            placeholder="مثال: 70"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {wizardStep === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">لمن هذه الخطة؟</h3>
                        <p className="text-sm font-bold text-slate-400">حدد المستفيد لربط البيانات الطبية</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <button 
                          onClick={() => setNewPlan({...newPlan, isPersonal: true})}
                          className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border-2 transition-all flex flex-col items-center gap-3 sm:gap-4 ${newPlan.isPersonal ? 'border-litcBlue bg-blue-50 text-litcBlue shadow-lg' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          <UserIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                          <span className="font-black text-sm sm:text-base">لي شخصياً</span>
                        </button>
                        <button 
                          onClick={() => setNewPlan({...newPlan, isPersonal: false})}
                          className={`p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border-2 transition-all flex flex-col items-center gap-3 sm:gap-4 ${!newPlan.isPersonal ? 'border-litcOrange bg-orange-50 text-litcOrange shadow-lg' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          <UserPlus className="w-10 h-10 sm:w-12 sm:h-12" />
                          <span className="font-black text-sm sm:text-base">لشخص آخر</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {wizardStep === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">ما هو نوع الخطة؟</h3>
                        <p className="text-sm font-bold text-slate-400">اختر المسار الذي يناسب احتياجك</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {[
                          { id: 'healthy', label: 'صحية', icon: <Zap className="w-5 h-5" /> },
                          { id: 'therapeutic', label: 'علاجية', icon: <Stethoscope className="w-5 h-5" /> },
                          { id: 'joint', label: 'مشتركة', icon: <Activity className="w-5 h-5" /> }
                        ].map(t => (
                          <button 
                            key={t.id}
                            onClick={() => setNewPlan({...newPlan, type: t.id as any})}
                            className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-2 sm:gap-3 ${newPlan.type === t.id ? 'border-litcBlue bg-blue-50 text-litcBlue shadow-md' : 'border-slate-100 text-slate-400'}`}
                          >
                            {t.icon}
                            <span className="font-black text-xs sm:text-sm">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {wizardStep === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">ما هو هدفك الرئيسي؟</h3>
                        <p className="text-sm font-bold text-slate-400">سنقوم بتخصيص الخطة بناءً على هذا الهدف</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {newPlan.type === 'healthy' ? (
                          [
                            { id: 'weight_loss', label: 'إنقاص وزن' },
                            { id: 'muscle_building', label: 'بناء عضلات' },
                            { id: 'weight_gain', label: 'زيادة وزن' },
                            { id: 'maintenance', label: 'محافظة' }
                          ].map(g => (
                            <button 
                              key={g.id}
                              onClick={() => setNewPlan({...newPlan, goal: g.id as any})}
                              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all text-right flex items-center justify-between ${newPlan.goal === g.id ? 'border-litcBlue bg-blue-50 text-litcBlue' : 'border-slate-100 text-slate-500'}`}
                            >
                              <span className="font-black text-xs sm:text-sm">{g.label}</span>
                              {newPlan.goal === g.id && <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                            </button>
                          ))
                        ) : (
                          [
                            { id: 'regulate_indicators', label: 'تنظيم مؤشرات طبية' },
                            { id: 'maintenance', label: 'محافظة واستقرار' }
                          ].map(g => (
                            <button 
                              key={g.id}
                              onClick={() => setNewPlan({...newPlan, goal: g.id as any})}
                              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 transition-all text-right flex items-center justify-between ${newPlan.goal === g.id ? 'border-litcBlue bg-blue-50 text-litcBlue' : 'border-slate-100 text-slate-500'}`}
                            >
                              <span className="font-black text-xs sm:text-sm">{g.label}</span>
                              {newPlan.goal === g.id && <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {wizardStep === 4 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">نمط الحياة (النوم والأكل)</h3>
                        <p className="text-sm font-bold text-slate-400">ساعدنا في تخصيص جدولك اليومي</p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">ساعات النوم المستهدفة</label>
                          <select 
                            value={newPlan.duration === 30 ? '8' : '7'} 
                            onChange={(e) => setNewPlan({...newPlan, duration: parseInt(e.target.value) === 8 ? 30 : 15})}
                            className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-black text-slate-700"
                          >
                            <option value="7">7 ساعات</option>
                            <option value="8">8 ساعات</option>
                            <option value="9">9 ساعات</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">تفضيلات الوجبات</label>
                          <div className="grid grid-cols-2 gap-4">
                            {['نباتي', 'عالي البروتين', 'قليل الكربوهيدرات', 'متوازن'].map(pref => (
                              <button 
                                key={pref}
                                onClick={() => setNewPlan({...newPlan, sportType: pref})}
                                className={`p-4 rounded-2xl border-2 transition-all font-black text-sm ${newPlan.sportType === pref ? 'border-litcBlue bg-blue-50 text-litcBlue' : 'border-slate-100 text-slate-500'}`}
                              >
                                {pref}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 5 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">تفاصيل النشاط والمدة</h3>
                        <p className="text-sm font-bold text-slate-400">حدد جدولك الزمني ونوع الرياضة</p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">مدة الخطة (أيام)</label>
                          <input 
                            type="number" 
                            value={newPlan.duration || ''} 
                            onChange={(e) => setNewPlan({...newPlan, duration: parseInt(e.target.value) || 0})}
                            className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-black text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">نوع الرياضة المفضلة</label>
                          <select 
                            value={newPlan.sportType} 
                            onChange={(e) => setNewPlan({...newPlan, sportType: e.target.value})}
                            className="w-full p-5 bg-slate-50 rounded-[2rem] border border-slate-200 font-black text-slate-700"
                          >
                            {['مشي', 'جري', 'سباحة', 'تمارين منزلية', 'كرة قدم', 'تنس'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <div className="flex items-center gap-4">
                            <Zap className="text-litcOrange" />
                            <span className="font-black text-sm text-slate-700">هل تذهب للجيم بانتظام؟</span>
                          </div>
                          <button 
                            onClick={() => setNewPlan({...newPlan, gymAttendance: !newPlan.gymAttendance})}
                            className={`w-14 h-8 rounded-full transition-all relative ${newPlan.gymAttendance ? 'bg-litcBlue' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${newPlan.gymAttendance ? 'right-7' : 'right-1'}`}></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 6 && (
                    <div className="space-y-8 animate-in slide-in-from-left-10">
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">التدقيق الطبي (Smart Check)</h3>
                        <p className="text-sm font-bold text-slate-400">التأكد من سلامة الخطة وتوافقها مع حالتك</p>
                      </div>
                      
                      {newPlan.isPersonal ? (
                        <div className="space-y-6">
                          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">
                              لقد قرأت أنك تعاني من <span className="text-litcBlue font-black">({user.healthProfile?.chronicDiseases.join('، ') || 'لا يوجد أمراض مسجلة'})</span>، هل هناك أمراض مزمنة أخرى تريد إضافتها لضمان سلامة الخطة؟
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {CHRONIC_DISEASES.map(d => (
                                <button 
                                  key={d}
                                  onClick={() => {
                                    const isExisting = user.healthProfile?.chronicDiseases.includes(d);
                                    if (isExisting) return;
                                    
                                    setWizardNewDiseases(prev => 
                                      prev.includes(d) ? prev.filter(item => item !== d) : [...prev, d]
                                    );
                                  }}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                                    user.healthProfile?.chronicDiseases.includes(d) || wizardNewDiseases.includes(d)
                                      ? 'bg-litcBlue text-white border-litcBlue' 
                                      : 'bg-white text-slate-500 border-slate-200 hover:border-litcBlue'
                                  } ${user.healthProfile?.chronicDiseases.includes(d) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                          {wizardNewDiseases.length > 0 && (
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                              <Sparkles className="text-emerald-600 w-4.5 h-4.5" />
                              <p className="text-[10px] font-black text-emerald-700">سيتم تحديث ملفك الطبي الأصلي تلقائياً بالأمراض الجديدة المضافة.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">الأمراض المزمنة للمستفيد:</p>
                          <div className="flex flex-wrap gap-2">
                            {CHRONIC_DISEASES.map(d => (
                              <button 
                                key={d}
                                onClick={() => {
                                  setNewPlan({
                                    ...newPlan,
                                    chronicDiseases: newPlan.chronicDiseases?.includes(d)
                                      ? newPlan.chronicDiseases.filter(item => item !== d)
                                      : [...(newPlan.chronicDiseases || []), d]
                                  });
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                                  newPlan.chronicDiseases?.includes(d)
                                    ? 'bg-litcOrange text-white border-litcOrange' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between pt-6 gap-4">
                    <button 
                      onClick={() => {
                        setWizardError(null);
                        if (wizardStep === 1 || wizardStep === 0) setShowWizard(false);
                        else setWizardStep(wizardStep - 1);
                      }}
                      disabled={isGeneratingPlan}
                      className="flex-1 sm:flex-none px-6 py-3 sm:px-8 sm:py-4 bg-slate-100 text-slate-500 rounded-[1.5rem] sm:rounded-3xl font-black flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      <ChevronRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> {(wizardStep === 1 || wizardStep === 0) ? 'إلغاء' : 'السابق'}
                    </button>
                    <button 
                      onClick={() => {
                        setWizardError(null);
                        handleWizardNext();
                      }}
                      disabled={isGeneratingPlan}
                      className="flex-2 sm:flex-none px-8 py-3 sm:px-12 sm:py-4 bg-litcBlue text-white rounded-[1.5rem] sm:rounded-3xl font-black shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {isGeneratingPlan ? <Loader2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 animate-spin" /> : (wizardStep === 6 ? 'تأكيد وبدء' : 'التالي')} 
                      {!isGeneratingPlan && <ChevronLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {claims.map(claim => (
            <ClaimCard key={claim.id} claim={claim} onClick={onSelectClaim} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
