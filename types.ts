
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  DOCTOR = 'DOCTOR',
  HEAD_OF_UNIT = 'HEAD_OF_UNIT',
  DATA_ENTRY = 'DATA_ENTRY',
  AUDITOR = 'AUDITOR', 
  ADMIN = 'ADMIN'
}

export enum ClaimStatus {
  PENDING_DR = 'PENDING_DR',
  PENDING_HEAD = 'PENDING_HEAD',
  PENDING_DATA_ENTRY = 'PENDING_DATA_ENTRY',
  PENDING_AUDIT = 'PENDING_AUDIT',
  RETURNED_TO_DR = 'RETURNED_TO_DR',
  RETURNED_TO_EMPLOYEE = 'RETURNED_TO_EMPLOYEE',
  APPROVED = 'APPROVED',
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
  excessPaidByEmployee?: number;
  companyPortion?: number;
  employeePortion?: number;
  isDuplicate?: boolean;
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
