
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeFoodNutrition = async (base64Image: string, profile?: any, isPersonal?: boolean) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `حلل هذه الوجبة الغذائية${profile ? ` لمستخدم بملف صحي: ${JSON.stringify(profile)}` : ''}. اذكر السعرات الحرارية التقريبية، البروتين، الكربوهيدرات، والدهون. قدم نصيحة صحية قصيرة جداً.` },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          advice: { type: Type.STRING }
        },
        required: ["calories", "protein", "carbs", "fats", "advice"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const explainMedication = async (base64Image: string, profile?: any, isPersonal?: boolean) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `اشرح هذا الدواء${profile ? ` لمستخدم بملف صحي: ${JSON.stringify(profile)}` : ''}. اذكر اسمه، استخدامه الأساسي، وأهم التحذيرات. اجعل الشرح مبسطاً جداً للمريض.` },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          usage: { type: Type.STRING },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          simpleExplanation: { type: Type.STRING }
        },
        required: ["name", "usage", "warnings", "simpleExplanation"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const analyzeLabReport = async (base64Image: string, profile?: any, isPersonal?: boolean) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `حلل تقرير المختبر هذا${profile ? ` لمستخدم بملف صحي: ${JSON.stringify(profile)}` : ''}. استخرج القيم غير الطبيعية (خارج النطاق) واشرح معناها باختصار شديد. لا تقدم تشخيصاً طبياً نهائياً.` },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          abnormalValues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                testName: { type: Type.STRING },
                value: { type: Type.STRING },
                normalRange: { type: Type.STRING },
                meaning: { type: Type.STRING }
              }
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["abnormalValues", "summary"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const analyzeDiseaseInput = async (input: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `بناءً على هذا الوصف للحالة الصحية: "${input}"، ما هي الأمراض المزمنة المحتملة التي يجب مراقبتها؟ قدم قائمة قصيرة جداً بالأسماء العربية الرسمية.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedDiseases: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanation: { type: Type.STRING }
        },
        required: ["suggestedDiseases", "explanation"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const generateDetailedHealthPlan = async (profile: any, goal: string, type: string, duration: number, sportType?: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `أنشئ خطة صحية يومية مفصلة لمستخدم بملف صحي: ${JSON.stringify(profile)} وهدف: ${goal} ونوع الخطة: ${type} ومدتها: ${duration} يوم ورياضة: ${sportType || 'غير محددة'}. اذكر 5 مهام يومية محددة مع أيقوناتها.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aiExplanation: { type: Type.STRING },
          dailyTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                icon: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          },
          nutritionalAdvice: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER }
        },
        required: ["aiExplanation", "dailyTasks", "nutritionalAdvice"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const swapMealPlan = async (profile: any, currentLabel: string, preferences: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `اقترح بديلاً صحياً لهذه الوجبة: "${currentLabel}" بناءً على ملف المستخدم: ${JSON.stringify(profile)} وتفضيله: "${preferences}".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newMealLabel: { type: Type.STRING },
          reason: { type: Type.STRING },
          calories: { type: Type.NUMBER }
        },
        required: ["newMealLabel", "reason"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const performOCR = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "استخرج البيانات التالية من الفاتورة الطبية: اسم المستشفى/العيادة، رقم الفاتورة، المبلغ الإجمالي، التاريخ، والعملة. لكل حقل، قم أيضاً بتوفير إحداثيات صندوق الإحاطة (Bounding Box) بتنسيق [ymin, xmin, ymax, xmax] بقيم تتراوح من 0 إلى 1000." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hospitalName: { type: Type.STRING },
          invoiceNumber: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER },
          date: { type: Type.STRING },
          currency: { type: Type.STRING },
          boundingBoxes: {
            type: Type.OBJECT,
            properties: {
              hospitalName: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              invoiceNumber: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              totalAmount: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              date: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              currency: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            }
          }
        },
        required: ["hospitalName", "totalAmount", "boundingBoxes"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const analyzeInvoiceDetailed = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "استخرج قائمة بنود الفاتورة الطبية بالتفصيل. لكل بند اذكر الاسم، السعر، ونوع الخدمة." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
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
};

export const chatWithAI = async (message: string, history: any[], profile?: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `أنت مساعد طبي ذكي لشركة LITC (شركة ليبيا للاتصالات والتقنية). 
      مهمتك هي الإجابة على استفسارات الموظفين حول "سياسة التأمين الطبي لشركة LITC" والمعلومات الطبية العامة.
      ${profile ? `ملف المستخدم الصحي: ${JSON.stringify(profile)}` : ''}
      كن ودوداً، مهنياً، وقدم إجابات دقيقة ومختصرة باللغة العربية.
      إذا سألك المستخدم عن السقف السنوي، فهو 5000 دينار ليبي.
      إذا سألك عن التغطية، فهي تشمل العيادات والمستشفيات المعتمدة.
      لا تقدم تشخيصات طبية نهائية، بل نصائح عامة وإرشادات.`
    }
  });
  
  return response.text;
};
