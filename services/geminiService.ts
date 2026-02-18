
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * تحليل التحاليل المخبرية
 */
export const analyzeLabReport = async (imageBase64: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, 
          { text: "أنت خبير مختبرات طبية. حلل صورة التقرير المخبري واستخرج البيانات بدقة بالعربية." }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRisk: { type: Type.STRING, description: "مستوى الخطورة العام (حرج، متوسط، طبيعي)" },
            summaryAdvice: { type: Type.STRING, description: "نصيحة طبية عامة بناء على النتائج" },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  resultValue: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  status: { type: Type.STRING, description: "طبيعي، مرتفع، منخفض" },
                  explanation: { type: Type.STRING }
                },
                required: ["testName", "resultValue", "status"]
              }
            }
          },
          required: ["overallRisk", "findings", "summaryAdvice"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

/**
 * تحليل الوجبات
 */
export const analyzeFoodNutrition = async (imageBase64: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, 
          { text: "حلل الوجبة في الصورة واستخرج القيمة الغذائية بالعربية." }
        ] 
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            healthTip: { type: Type.STRING },
            macros: { type: Type.STRING, description: "توزيع البروتين والكارب والدهون كنص واحد مختصر" }
          },
          required: ["mealName", "calories", "healthTip", "macros"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

/**
 * حساب الـ BMI والماكروز بناء على مدخلات المستخدم
 */
export const getHealthProfileAdvice = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على طول ${data.height} سم ووزن ${data.weight} كجم وهدف "${data.goal}"، احسب الاحتياجات بالعربية.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyProtein: { type: Type.NUMBER },
            dailyCarbs: { type: Type.NUMBER },
            dailyFats: { type: Type.NUMBER },
            summaryAdvice: { type: Type.STRING }
          },
          required: ["dailyProtein", "dailyCarbs", "dailyFats", "summaryAdvice"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

/**
 * شرح الدواء من الصورة
 */
export const explainMedication = async (imageBase64: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [
          { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }, 
          { text: "اشرح هذا الدواء: الاسم، الاستخدام، والتحذيرات بالعربية." }
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

/**
 * تحليل الحالة والأعراض (الصحة النفسية والجسدية)
 */
export const analyzeWellnessMood = async (moodText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `حلل هذه الأعراض أو الحالة النفسية: "${moodText}" وقدم نصائح بالعربية.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            moodAnalysis: { type: Type.STRING, description: "تحليل دقيق للحالة المذكورة" },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "قائمة نصائح عملية"
            }
          },
          required: ["moodAnalysis", "tips"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return null; }
};

/**
 * تفكيك الفاتورة لبنود تفصيلية (يستخدم في صفحة مدخل البيانات)
 */
export const analyzeInvoiceDetailed = async (base64: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "قم بتفكيك الفاتورة إلى بنود تفصيلية بالعربية." }
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
              serviceType: { type: Type.STRING, description: "مثلاً: كشفية، دواء، تحليل، إقامة" },
              invoiceNumber: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["itemName", "price"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) { return []; }
};

/**
 * استخراج البيانات الأساسية للفاتورة والعملة (يستخدم في صفحة تقديم الطلب)
 */
export const performOCR = async (base64: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "استخرج البيانات الأساسية من الفاتورة بالعربية." }
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
            currency: { type: Type.STRING, description: "الرمز الدولي للعملة مثل LYD, USD, TND" }
          },
          required: ["hospitalName", "totalAmount", "currency"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) { return {}; }
};
