import React, { useState, useRef, useEffect } from 'react';
import { User, HealthProfile } from '../types';
import { 
  analyzeFoodNutrition, 
  explainMedication, 
  analyzeLabReport,
  chatWithAI
} from '../services/geminiService';
import { optimizeImage } from '../utils/imageUtils';
import { 
  Loader2, Camera, Microscope, AlertTriangle, 
  BrainCircuit, Utensils, Pill, Plus, Activity,
  CheckCircle2, Target, Flame, Info, Scale, Send, User as UserIcon, Bot, Sparkles, X
} from 'lucide-react';

interface SmartClinicProps {
  user: User;
  onUpdateHealthProfile?: (profile: HealthProfile) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  type?: 'text' | 'analysis';
  data?: any;
}

const SmartClinic: React.FC<SmartClinicProps> = ({ user, onUpdateHealthProfile }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `مرحباً بك يا ${user.name.split(' ')[0]}! أنا مساعدك الطبي الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن سياسة التأمين أو أي استفسار طبي.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);

  const labInputRef = useRef<HTMLInputElement>(null);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const medInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const response = await chatWithAI(userMsg, history, user.healthProfile);
      setMessages(prev => [...prev, { role: 'model', text: response || 'عذراً، لم أتمكن من معالجة طلبك.' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.' }]);
    }
    setIsChatting(false);
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
        let result: any;
        let text = "";
        if (type === 'food') {
          result = await analyzeFoodNutrition(base64, user.healthProfile, true);
          text = `لقد قمت بتحليل وجبتك: ${result.mealName || 'وجبة صحية'}. تحتوي على ${result.calories} سعرة حرارية.`;
        } else if (type === 'med') {
          result = await explainMedication(base64, user.healthProfile, true);
          text = `هذا الدواء هو ${result.name}. استخدامه: ${result.usage}.`;
        } else if (type === 'lab') {
          result = await analyzeLabReport(base64, user.healthProfile, true);
          text = `لقد حللت تقرير المختبر. التقييم العام: ${result.overallRisk || 'طبيعي'}.`;
          if (onUpdateHealthProfile && user.healthProfile) {
            onUpdateHealthProfile({ ...user.healthProfile, lastLabResults: result });
          }
        }
        
        setMessages(prev => [...prev, { 
          role: 'model', 
          text, 
          type: 'analysis', 
          data: { type, ...result } 
        }]);
      } catch (err) { 
        console.error(err);
        setMessages(prev => [...prev, { role: 'model', text: 'عذراً، فشل تحليل الصورة.' }]);
      }
      setLoading(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full font-cairo bg-slate-50/30" dir="rtl">
      {/* Chat Messages Area (Top 70%) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-litcBlue text-white' : 'bg-white text-litcOrange border border-slate-100'}`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`space-y-2`}>
                <div className={`p-5 rounded-[2rem] text-sm font-bold leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-litcBlue to-litcDark text-white rounded-tr-none' 
                    : 'bg-gradient-to-br from-white to-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                
                {msg.type === 'analysis' && msg.data && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md space-y-3 animate-in zoom-in-95">
                    {msg.data.type === 'food' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">تحليل الوجبة</span>
                          <span className="text-litcOrange font-black text-xs">{msg.data.calories} سعرة</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 p-2 rounded-xl text-center">
                            <p className="text-xs font-black text-litcBlue">{msg.data.protein}g</p>
                            <p className="text-[8px] font-bold text-slate-400">بروتين</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl text-center">
                            <p className="text-xs font-black text-litcBlue">{msg.data.carbs}g</p>
                            <p className="text-[8px] font-bold text-slate-400">كربو</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl text-center">
                            <p className="text-xs font-black text-litcBlue">{msg.data.fats}g</p>
                            <p className="text-[8px] font-bold text-slate-400">دهون</p>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 italic">"{msg.data.advice}"</p>
                      </div>
                    )}
                    {msg.data.type === 'med' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-litcBlue font-black text-xs">
                          <Pill className="w-3 h-3" /> {msg.data.name}
                        </div>
                        <p className="text-[10px] font-bold text-slate-600">{msg.data.simpleExplanation}</p>
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-[9px] font-black text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> تحذير: {msg.data.warnings?.[0]}
                          </p>
                        </div>
                      </div>
                    )}
                    {msg.data.type === 'lab' && (
                      <div className="space-y-2">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black text-center ${msg.data.overallRisk === 'حرج' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                          التقييم: {msg.data.overallRisk}
                        </div>
                        <p className="text-[10px] font-bold text-slate-600">{msg.data.summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isChatting && (
          <div className="flex justify-end animate-pulse">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-2 items-center">
              <Loader2 className="w-4 h-4 animate-spin text-litcBlue" />
              <span className="text-[10px] font-black text-slate-400">جاري التفكير...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Actions & Input Area (Bottom 30%) */}
      <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-6 relative">
        {/* Floating Pills for Quick Tasks */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { label: 'تحليل دواء', icon: <Pill className="w-3 h-3" />, action: () => medInputRef.current?.click() },
            { label: 'تقرير مختبر', icon: <Microscope className="w-3 h-3" />, action: () => labInputRef.current?.click() },
            { label: 'استفسار إداري', icon: <Info className="w-3 h-3" />, action: () => setInput('ما هي سياسة تغطية العمليات الجراحية؟') }
          ].map((pill, i) => (
            <button 
              key={i}
              onClick={pill.action}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-600 hover:bg-litcBlue hover:text-white hover:border-litcBlue transition-all whitespace-nowrap shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1"
            >
              {pill.icon}
              {pill.label}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="relative flex items-center gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اسأل المساعد الذكي..."
            className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-4 pr-5 pl-14 font-bold text-xs outline-none focus:border-litcBlue transition-all"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isChatting}
            className="absolute left-2 w-10 h-10 bg-gradient-to-br from-litcBlue to-litcDark text-white rounded-full flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-litcBlue/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <input type="file" ref={labInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'lab')} />
        <input type="file" ref={foodInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'food')} />
        <input type="file" ref={medInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'med')} />
      </div>
    </div>
  );
};

export default SmartClinic;
