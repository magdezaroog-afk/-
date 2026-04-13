
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCTOR = 'DOCTOR',
  DATA_ENTRY = 'DATA_ENTRY',
  HEAD_OF_UNIT = 'HEAD_OF_UNIT',
  INTERNAL_AUDITOR = 'INTERNAL_AUDITOR',
  ADMIN = 'ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN'
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  PENDING_PHYSICAL = 'PENDING_PHYSICAL',
  PENDING_MEDICAL = 'PENDING_MEDICAL',
  PENDING_FINANCIAL = 'PENDING_FINANCIAL',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING_AUDIT = 'PENDING_AUDIT',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
  PARTIALLY_REJECTED = 'PARTIALLY_REJECTED'
}

export interface HealthProfile {
  bloodType: string;
  height: number;
  weight: number;
  age: number;
  chronicDiseases: string[];
  allergies?: string[];
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
  isChronic?: boolean;
  height?: number;
  weight?: number;
  chronicDiseases?: string[];
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
  dependents?: FamilyMember[];
  roles?: UserRole[];
  isActive?: boolean;
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
  status?: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
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
  attachmentUrls?: string[];
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
  imageHash?: string;
  medicalNotes?: string;
  archiveBoxId?: string;
  verifiedFields?: string[];
  fieldStatuses?: {
    [key: string]: 'APPROVED' | 'REJECTED' | undefined;
    hospitalName?: 'APPROVED' | 'REJECTED';
    invoiceNumber?: 'APPROVED' | 'REJECTED';
    totalAmount?: 'APPROVED' | 'REJECTED';
    date?: 'APPROVED' | 'REJECTED';
    currency?: 'APPROVED' | 'REJECTED';
    serviceType?: 'APPROVED' | 'REJECTED';
  };
  fieldRejectionReasons?: {
    [key: string]: string | undefined;
    hospitalName?: string;
    invoiceNumber?: string;
    totalAmount?: string;
    date?: string;
    currency?: string;
    serviceType?: string;
  };
  boundingBoxes?: {
    hospitalName?: number[];
    invoiceNumber?: number[];
    totalAmount?: number[];
    date?: number[];
    currency?: number[];
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  comment?: string;
}

export interface ClaimHistory {
  status: ClaimStatus;
  timestamp: string;
  performedByRole: UserRole;
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
  history: ClaimHistory[];
  description?: string;
  referenceNumber: string;
  invoiceCount: number;
  location?: string;
  department?: string;
  assignedToId?: string;
  submittedAt?: string; // ISO string for 24h rule
  isPool?: boolean;
  lastActionAt?: string; // ISO string for 48h escalation
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'STATUS_CHANGE' | 'REJECTION' | 'HEALTH_GOAL' | 'SYSTEM';
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: any;
}
