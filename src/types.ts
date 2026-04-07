
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCTOR = 'DOCTOR',
  DATA_ENTRY = 'DATA_ENTRY',
  HEAD_OF_UNIT = 'HEAD_OF_UNIT',
  ADMIN = 'ADMIN'
}

export enum ClaimStatus {
  WAITING_FOR_PAPER = 'WAITING_FOR_PAPER',
  PAPER_RECEIVED = 'PAPER_RECEIVED',
  MEDICALLY_APPROVED = 'MEDICALLY_APPROVED',
  MEDICALLY_REJECTED = 'MEDICALLY_REJECTED',
  FINANCIALLY_PROCESSED = 'FINANCIALLY_PROCESSED',
  CHIEF_APPROVED = 'CHIEF_APPROVED',
  PENDING_CLARIFICATION = 'PENDING_CLARIFICATION',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

export interface HealthProfile {
  bloodType: string;
  height: number;
  weight: number;
  age: number;
  chronicDiseases: string[];
  pathway: 'therapeutic' | 'healthy' | 'joint';
  systolicBP?: number;
  diastolicBP?: number;
  hba1c?: number; // Cumulative sugar
  dailyWaterIntake: number; // in liters
  lastLabResults?: any;
}

export interface HealthPlan {
  id: string;
  isPersonal: boolean;
  type: 'therapeutic' | 'healthy' | 'joint';
  goal: 'weight_gain' | 'muscle_building' | 'weight_loss' | 'maintenance' | 'regulate_indicators';
  startDate: string;
  chronicDiseases: string[];
  aiExplanation?: string;
  status: 'active' | 'completed' | 'cancelled';
  duration: number; // in days
  dailyTasks: { id: string; label: string; icon: string; completed: boolean; category?: string; calories?: number }[];
  currentDay: number;
  sportType?: string;
  gymAttendance?: boolean;
  requestedLabs?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface ChronicApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  beneficiaryName: string;
  relationship: string;
  diagnosis: string;
  attachments: string[];
  submissionDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expiryDate?: string;
  doctorNotes?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  healthProfile?: HealthProfile;
  activePlans?: HealthPlan[];
  location?: string;
  building?: string;
  department?: string;
  jobTitle?: string;
  annualCeilingUsed?: number; // Total 90% portion used from 100,000 LYD
  familyMembers?: FamilyMember[];
}

export interface InvoiceLineItem {
  id: string;
  itemName: string;
  price: number;
  serviceType: string;
  recipientName?: string;
  date?: string;
  invoiceNumber?: string;
  facilityName?: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number; 
  currency: 'LYD' | 'USD' | 'TND' | 'EUR'; 
  exchangeRate: number; 
  originalAmountInLYD: number; 
  netAmountLYD: number; 
  imageUrl: string;
  hospitalName: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  recipientType?: string;
  status?: ClaimStatus; 
  assignedToId?: string;
  assignedToName?: string;
  serviceType?: string;
  ocrData?: any;
  coveragePercentage?: number; // 90 or 100
  isMajorSurgery?: boolean;
  isMedicalDevice?: boolean;
  isGlasses?: boolean;
  beneficiaryName?: string;
  relationship?: string;
  isChronic?: boolean;
  excessPaidByEmployee?: number;
  companyPortion?: number;
  employeePortion?: number;
  isDuplicate?: boolean;
  medicalNotes?: string;
  archiveBoxId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  comment?: string;
}

export interface Claim {
  id: string;
  employeeId: string;
  employeeName: string;
  submissionDate: string;
  status: ClaimStatus;
  invoices: Invoice[];
  totalAmount: number; 
  finalApprovedAmount?: number; 
  auditTrail: AuditLog[];
  description?: string;
  referenceNumber: string;
  invoiceCount: number;
  location?: string;
  department?: string;
  assignedToId?: string;
  submittedAt?: string; // ISO string for 24h rule
  isPool?: boolean;
}
