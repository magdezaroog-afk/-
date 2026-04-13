
import { HealthProfile, HealthPlan, User, FamilyMember } from '../types';

export const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const determineHealthTrack = (profile: HealthProfile): string => {
  const bmi = calculateBMI(profile.weight, profile.height);
  const hasDiabetes = profile.chronicDiseases.some(d => d.includes('Diabetes') || d.includes('سكري'));
  
  let track = '';
  
  if (bmi > 25) track = 'Weight Loss';
  else if (bmi < 18.5) track = 'Weight Gain';
  else track = 'Healthy Maintenance';

  if (hasDiabetes) {
    track = `${track} (Diabetic-Friendly)`;
  }

  return track;
};

export const generateDailyTasks = (track: string) => {
  const tasks = [
    { id: 'meal-1', label: 'وجبة غداء صحية', icon: 'Utensils', completed: false, category: 'Meal' },
    { id: 'exercise-1', label: 'نشاط رياضي (30 دقيقة)', icon: 'Dumbbell', completed: false, category: 'Exercise' },
    { id: 'measure-1', label: 'قياس المؤشرات الحيوية', icon: 'Activity', completed: false, category: 'Measurement' }
  ];

  if (track.includes('Diabetic')) {
    tasks[0].label = 'غداء منخفض الكربوهيدرات';
    tasks[2].label = 'قياس مستوى السكر';
  } else if (track.includes('Weight Loss')) {
    tasks[1].label = 'تمارين كارديو مكثفة';
  } else if (track.includes('Weight Gain')) {
    tasks[0].label = 'وجبة غنية بالبروتين';
    tasks[1].label = 'تمارين مقاومة';
  }

  return tasks;
};

export const createHealthPlan = (profile: HealthProfile, isPersonal: boolean): HealthPlan => {
  const track = determineHealthTrack(profile);
  const tasks = generateDailyTasks(track);
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    isPersonal,
    type: profile.pathway,
    goal: track.includes('Weight Loss') ? 'weight_loss' : track.includes('Weight Gain') ? 'weight_gain' : 'maintenance',
    startDate: new Date().toISOString(),
    chronicDiseases: profile.chronicDiseases,
    status: 'active',
    duration: 30,
    dailyTasks: tasks,
    currentDay: 1,
    aiExplanation: `تم تصميم هذه الخطة بناءً على مؤشر كتلة الجسم (${calculateBMI(profile.weight, profile.height)}) ووجود ${profile.chronicDiseases.length > 0 ? 'أمراض مزمنة' : 'حالة صحية مستقرة'}.`
  };
};
