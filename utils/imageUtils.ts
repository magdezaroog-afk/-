
/**
 * تصغير وضغط الصورة بصيغة base64 لتقليل حجم البيانات المرسلة للـ API
 * تم ضبط العرض الأقصى بـ 768 بكسل لضمان عدم تجاوز حدود الـ Tokens
 */
export const optimizeImage = async (base64: string, maxWidth: number = 768, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // استخدام jpeg لتقليل الحجم أكثر مقارنة بـ png
        const optimizedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
        resolve(optimizedBase64);
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
  });
};
