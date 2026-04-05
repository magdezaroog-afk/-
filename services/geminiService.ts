
import { GoogleGenAI, Type } from "@google/genai";
import { HealthProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getCoachInstruction = (profile?: HealthProfile, isPersonal: boolean = true) => {
  if (!isPersonal || !profile) return "أنت مساعد طبي ذكي، قدم تحليلاً دقيقاً ومحترفاً.";

  const diseases = profile.chronicDiseases.join("، ");
  const goal = profile.pathway === 'therapeutic' ? 'خطة علاجية' : profile.pathway === 'healthy' ? 'خطة صحية' : 'خطة مشتركة';
  
  return `أنت "المدرب الصحي الذكي" لشركة LITC. 
  بيانات الموظف: العمر ${profile.age}، الطول ${profile.height}، الوزن ${profile.weight}، الأمراض: ${diseases}، الهدف: ${goal}.
  
  قواعد التعامل:
  1. إذا كانت النتيجة (وجبة أو تحليل) تخالف حالته الصحية (مثلاً مريض سكري يأكل سكريات)، كن حازماً جداً ووبخه بلهجة طبية تنبيهية (مثلاً: "هذا استهتار بصحتك!").
  2. إذا كانت النتيجة تدعم هدفه، شجعه بحماس كبير.
  3. قارن النتائج الحالية بأي نتائج سابقة إذا توفرت في السياق.
  4. استخدم لهجة ليبية مهذبة ممزوجة بمصطلحات طبية دقيقة.`;
};

export const analyzeLabReport = async (imageBase64: string, profile?: HealthProfile, isPersonal: boolean = true) => {
  try {
    const coachPrompt = getCoachInstruction(profile, isPersonal);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, 
          { text: `${coachPrompt}
          تحليل استشاري مختبرات: 
          1. استخرج القيم والوحدات.
          2. حدد الحالة (طبيعي/مرتفع/منخفض).
          3. شرح طبي عميق للعلاقة بين النتائج.
          4. نصائح نمط حياة وأسئلة للطبيب.
          5. إذا كان هناك نتائج سابقة (${JSON.stringify(profile?.lastLabResults || {})})، قارن بينهما واذكر الفرق بدقة.` }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRisk: { type: Type.STRING },
            medicalExplanation: { type: Type.STRING },
            correlations: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  resultValue: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  status: { type: Type.STRING },
                  clinicalSignificance: { type: Type.STRING }
                },
                required: ["testName", "resultValue", "status"]
              }
            },
            doctorQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            lifestyleAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overallRisk", "medicalExplanation", "findings"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

export const analyzeFoodNutrition = async (imageBase64: string, profile?: HealthProfile, isPersonal: boolean = true) => {
  try {
    const coachPrompt = getCoachInstruction(profile, isPersonal);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, 
          { text: `${coachPrompt}
          تحليل تغذية احترافي: استخرج السعرات، درجة الصحة (1-100)، الجرامات الدقيقة للبروتين والكربوهيدرات والدهون، الفوائد الصحية، والمخاطر المحتملة.
          قيم الوجبة بناءً على حالة الموظف الصحية وأهدافه.` }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            healthScore: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailedAnalysis: { type: Type.STRING }
          },
          required: ["mealName", "calories", "healthScore", "protein", "carbs", "fats"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

export const explainMedication = async (imageBase64: string, profile?: HealthProfile, isPersonal: boolean = true) => {
  try {
    const coachPrompt = getCoachInstruction(profile, isPersonal);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, 
          { text: `${coachPrompt}
          شرح الدواء بالعربية: الاسم، الاستخدام، والتحذيرات.
          وضح مدى ملاءمة هذا الدواء لحالة الموظف الصحية المعروفة.` }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            medName: { type: Type.STRING },
            usage: { type: Type.STRING },
            warnings: { type: Type.STRING }
          },
          required: ["medName", "usage", "warnings"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

export const analyzeInvoiceDetailed = async (base64: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "تفكيك الفاتورة إلى بنود تفصيلية بالعربية مع تحديد نوع الخدمة." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              price: { type: Type.NUMBER },
              serviceType: { type: Type.STRING }
            },
            required: ["itemName", "price"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) { return []; }
};

export const analyzeDiseaseInput = async (userInput: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `المستخدم أدخل هذا النص كمرض مزمن يعاني منه: "${userInput}".
      المطلوب: استخراج اسم المرض المزمن بشكل طبي مختصر وواضح باللغة العربية.
      إذا لم يكن مرضاً واضحاً، أعد صياغته ليكون مصطلحاً طبياً مفهوماً.
      أرجع اسم المرض فقط بدون أي إضافات.`,
    });
    return response.text?.trim() || userInput;
  } catch (error) {
    return userInput;
  }
};

export const generateDetailedHealthPlan = async (profile: HealthProfile, goal: string, type: string, duration: number, sportType?: string): Promise<any> => {
  try {
    const diseases = profile.chronicDiseases.join("، ");
    const prompt = `أنت خبير تغذية ومدرب رياضي محترف. قم بإنشاء خطة يومية مفصلة جداً ومخصصة للموظف.
    بيانات الموظف: العمر ${profile.age}، الطول ${profile.height} سم، الوزن ${profile.weight} كجم، الأمراض: ${diseases || 'لا يوجد'}.
    الهدف من الخطة: ${goal === 'weight_loss' ? 'إنقاص الوزن' : goal === 'muscle_building' ? 'بناء العضلات' : goal === 'weight_gain' ? 'زيادة الوزن' : goal === 'regulate_indicators' ? 'تنظيم المؤشرات الحيوية' : 'المحافظة على الوزن'}.
    نوع الخطة: ${type === 'healthy' ? 'صحية' : 'علاجية'}.
    الرياضة المفضلة: ${sportType || 'غير محدد'}.
    
    المطلوب:
    1. حساب السعرات الحرارية اليومية المطلوبة (calories) وتوزيع الماكروز بالجرام: بروتين (protein)، كربوهيدرات (carbs)، دهون (fats).
    2. شرح مبسط للخطة (aiExplanation).
    3. قائمة مهام يومية مفصلة جداً (dailyTasks). يجب أن تكون الوجبات محددة بالكميات (مثال: 2 بيضة مسلوقة، 150 جرام دجاج، 50 جرام شوفان) مع ذكر السعرات الحرارية التقريبية لكل وجبة في حقل calories.
    4. تحديد التمارين الرياضية بدقة (مثال: المشي لمدة 45 دقيقة بسرعة متوسطة، أو 3 جولات ضغط 12 عدة).
    5. تحديد كمية الماء المطلوبة باللتر.
    6. تحديد ساعات النوم المطلوبة.
    
    يجب أن تكون المهام مصنفة (nutrition, sport, sleep, hydration, medication, monitoring) ولها أيقونات مناسبة (utensils, activity, moon, droplet, pill).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiExplanation: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER },
            dailyTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  category: { type: Type.STRING },
                  calories: { type: Type.NUMBER }
                },
                required: ["id", "label", "icon", "category"]
              }
            }
          },
          required: ["aiExplanation", "calories", "protein", "carbs", "fats", "dailyTasks"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return null;
  }
};

export const swapMealPlan = async (profile: HealthProfile, currentMeal: string, preferences: string): Promise<any> => {
  try {
    const diseases = profile.chronicDiseases.join("، ");
    const prompt = `أنت خبير تغذية محترف. المستخدم يريد استبدال وجبة من خطته الغذائية.
    بيانات الموظف: العمر ${profile.age}، الطول ${profile.height} سم، الوزن ${profile.weight} كجم، الأمراض: ${diseases || 'لا يوجد'}.
    الوجبة الحالية: "${currentMeal}".
    ما يفضله المستخدم كبديل: "${preferences}".
    
    المطلوب:
    اقتراح وجبة بديلة صحية ومناسبة لحالته الصحية وتفضيلاته، بحيث تكون قريبة في السعرات الحرارية والقيمة الغذائية للوجبة الأصلية.
    أرجع اسم الوجبة البديلة مع الكميات المحددة (مثال: 150 جرام سمك مشوي + 100 جرام أرز أسمر + سلطة خضراء).
    وأرجع السعرات الحرارية التقريبية للوجبة البديلة.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newMealLabel: { type: Type.STRING },
            calories: { type: Type.NUMBER }
          },
          required: ["newMealLabel", "calories"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return null;
  }
};

export const performOCR = async (base64: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "Extract the following medical invoice details in Arabic if possible: [Provider Name, Invoice Number, Date, and Amount]. If the currency is mentioned, extract it too." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hospitalName: { type: Type.STRING, description: "Provider Name / Medical Facility" },
            invoiceNumber: { type: Type.STRING, description: "Unique Invoice Number" },
            totalAmount: { type: Type.NUMBER, description: "Total amount on the invoice" },
            date: { type: Type.STRING, description: "Date of the invoice (YYYY-MM-DD)" },
            currency: { type: Type.STRING, description: "Currency code (e.g., LYD, USD, EUR)" }
          },
          required: ["hospitalName", "totalAmount"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) { 
    console.error("OCR Error:", error);
    return {}; 
  }
};
