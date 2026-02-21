
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

export const performOCR = async (base64: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "استخراج البيانات الأساسية: المرفق الصحي، الرقم، المبلغ، العملة، التاريخ." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hospitalName: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            currency: { type: Type.STRING }
          },
          required: ["hospitalName", "totalAmount", "currency"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) { return {}; }
};
