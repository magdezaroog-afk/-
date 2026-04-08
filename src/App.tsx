
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Claim, ClaimStatus, Invoice, ChronicApplication } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SubmitClaim from './pages/SubmitClaim';
import ClaimDetail from './pages/ClaimDetail';
import Profile from './pages/Profile';
import SmartClinic from './pages/SmartClinic';
import DataEntry from './pages/DataEntry';
import AdminDashboard from './pages/AdminDashboard';
import AdminClaims from './pages/AdminClaims';
import ChronicEnrollment from './pages/ChronicEnrollment';
import Archive from './pages/Archive';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Settings, 
  UserCircle, 
  ChevronRight, 
  Chrome, 
  Phone, 
  Mail, 
  Lock, 
  Activity, 
  Sparkles, 
  Loader2, 
  ClipboardList, 
  AlertCircle,
  FileText,
  HeartPulse,
  Stethoscope,
  Shield,
  Pill,
  Heart,
  Database,
  BrainCircuit,
  X
} from 'lucide-react';
import { auth, db, googleProvider, microsoftProvider } from './firebase';
import { NAV_ITEMS } from './constants';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, onSnapshot, orderBy, getDocFromServer } from 'firebase/firestore';

const INITIAL_CLAIMS: Claim[] = [];

export const DATA_ENTRY_STAFF = [
  { id: 'DE-1', name: 'يحيى قرقاب', email: 'yahya@litc.ly', team: 'وحدة الصيدليات' },
  { id: 'DE-2', name: 'محمود الدعوكي', email: 'mahmoud@litc.ly', team: 'وحدة المستشفيات' },
  { id: 'DE-3', name: 'عباس طنيش', email: 'abbas@litc.ly', team: 'وحدة العيادات والمختبرات' },
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const sanitizeForFirestore = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj
      .filter(v => v !== undefined)
      .map(v => sanitizeForFirestore(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeForFirestore(v)])
    );
  }
  return obj;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePath, setActivePath] = useState('dashboard');
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [chronicApplications, setChronicApplications] = useState<ChronicApplication[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [isSmartClinicOpen, setIsSmartClinicOpen] = useState(false);
  const manualLoginRef = useRef(false);
  const [loginStep, setLoginStep] = useState<'initial' | 'official' | 'data-entry-select' | 'email-login' | 'email-signup' | 'email-verification' | 'phone-login'>('initial');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [building, setBuilding] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If a manual login is in progress, let handleLogin handle the state
      if (manualLoginRef.current) {
        console.log("Auth state changed during manual login, skipping observer update.");
        return;
      }

      console.log("Auth state changed:", firebaseUser?.uid);
      
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log("User profile found:", userData.role);
            setUser(userData);
          } else {
            console.log("No user profile found, creating default employee profile.");
            // If profile doesn't exist (e.g. first time Google login), create it
            const newUser: User = sanitizeForFirestore({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'مستخدم جديد',
              role: UserRole.EMPLOYEE, // Default role
              healthProfile: {
                bloodType: '', height: 0, weight: 0, age: 0, chronicDiseases: [], pathway: 'healthy', dailyWaterIntake: 0, systolicBP: 0, diastolicBP: 0, hba1c: 0
              },
              familyMembers: [
                { id: 'fm1', name: 'سارة أحمد', relationship: 'Spouse' },
                { id: 'fm2', name: 'ياسين محمد', relationship: 'Son' },
                { id: 'fm3', name: 'لينا محمد', relationship: 'Daughter' }
              ]
            });
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (err) {
          console.error("Error fetching/creating user profile:", err);
        }
      } else {
        setUser(null);
      }
      
      setIsLoggingIn(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedClaim) {
      setSelectedClaim(null);
    }
  }, [activePath]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'claims'), orderBy('submissionDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const claimsData = snapshot.docs.map(doc => doc.data() as Claim);
      setClaims(claimsData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || (user.role !== UserRole.DOCTOR && user.role !== UserRole.ADMIN)) return;
    
    const q = query(collection(db, 'chronic_applications'), orderBy('submissionDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => doc.data() as ChronicApplication);
      setChronicApplications(apps);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    try {
      await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(updatedUser));
      setUser(updatedUser);
      // Reset active path if it's not available for the new role
      const items = NAV_ITEMS[newRole] || [];
      if (!items.find((i: any) => i.path === activePath)) {
        setActivePath('dashboard');
      }
    } catch (err: any) {
      setError("فشل تغيير الصلاحية: " + err.message);
    }
  };

  const handleUpdateChronicApplication = async (appId: string, status: 'APPROVED' | 'REJECTED', notes: string, expiryDate?: string) => {
    const app = chronicApplications.find(a => a.id === appId);
    if (!app) return;

    const updatedApp = {
      ...app,
      status,
      doctorNotes: notes,
      expiryDate: status === 'APPROVED' ? expiryDate : undefined
    };

    try {
      await setDoc(doc(db, 'chronic_applications', appId), sanitizeForFirestore(updatedApp));
      
      // If approved, update user's health profile or beneficiary status
      // For now, we'll just update the application status
    } catch (err: any) {
      setError("فشل تحديث طلب الأمراض المزمنة: " + err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setActivePath('dashboard');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("تم حظر الدخول مؤقتاً بسبب محاولات فاشلة كثيرة. يرجى المحاولة لاحقاً.");
      } else {
        setError(err.message);
      }
      setIsLoggingIn(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    // For demo purposes, we'll use a fixed code "123456" so you can test it easily.
    // In a real production app, this would be a random code sent via a backend service (like Firebase Functions).
    const code = "123456";
    setGeneratedCode(code);
    setVerificationCode('');
    
    // Simulated success message
    setError(null);
    const successMsg = "تم إرسال كود التحقق بنجاح (لأغراض العرض الكود هو: 123456)";
    console.log(`Verification code for ${email}: ${code}`);
    
    setLoginStep('email-verification');
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    if (verificationCode.trim() !== generatedCode.trim()) {
      setError("كود التحقق غير صحيح");
      setIsLoggingIn(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      await updateProfile(firebaseUser, { displayName: name });
      
      const newUser: User = sanitizeForFirestore({
        id: firebaseUser.uid,
        email: email,
        name: name,
        role: UserRole.EMPLOYEE,
        healthProfile: {
          bloodType: '',
          height: 0,
          weight: 0,
          age: 0,
          chronicDiseases: [],
          pathway: 'healthy',
          dailyWaterIntake: 0,
          systolicBP: 0,
          diastolicBP: 0,
          hba1c: 0
        }
      });
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
      setActivePath('dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من ذلك.");
      } else if (err.code === 'auth/weak-password') {
        setError("كلمة المرور ضعيفة جداً.");
      } else if (err.code === 'auth/invalid-email') {
        setError("البريد الإلكتروني غير صالح.");
      } else {
        setError(err.message);
      }
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setActivePath('dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsLoggingIn(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, microsoftProvider);
      setActivePath('dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsLoggingIn(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    // Note: Phone auth requires RecaptchaVerifier which needs a DOM element.
    // This is a simplified version. In a real app, you'd setup the verifier.
    setError("تسجيل الدخول عبر الهاتف يتطلب إعداد Recaptcha. يرجى استخدام البريد الإلكتروني حالياً.");
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setLoginStep('initial');
  };

  const handleLogin = async (role: UserRole, specificUser?: any) => {
    console.log(`Starting manual login for role: ${role}`);
    manualLoginRef.current = true;
    setIsLoggingIn(true);
    setError(null);
    try {
      let firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.log("No current user, signing in anonymously...");
        // Try to sign in anonymously if not already signed in
        try {
          const cred = await signInAnonymously(auth);
          firebaseUser = cred.user;
        } catch (authErr: any) {
          throw new Error("يجب تفعيل Anonymous Auth في إعدادات Firebase أو تسجيل الدخول أولاً: " + authErr.message);
        }
      }
      
      if (!firebaseUser) throw new Error("فشل الحصول على هوية المستخدم");

      const userProfile: User = sanitizeForFirestore({
        id: specificUser?.id || firebaseUser.uid,
        email: specificUser?.email || firebaseUser.email || `${role.toLowerCase()}@litc.ly`,
        role: role,
        name: specificUser?.name || firebaseUser.displayName || 
              (role === UserRole.DOCTOR ? 'د. أحمد علي' : 
               role === UserRole.RECEPTIONIST ? 'سارة علي' :
               role === UserRole.HEAD_OF_UNIT ? 'أ. عمر' : 'مسؤول النظام'),
        healthProfile: user?.healthProfile || {
          bloodType: '', height: 0, weight: 0, age: 0, chronicDiseases: [], pathway: 'healthy', dailyWaterIntake: 0, systolicBP: 0, diastolicBP: 0, hba1c: 0
        }
      });
      
      console.log("Saving user profile to Firestore:", userProfile.id);
      // Persist the role to Firestore immediately
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      
      console.log("Login successful, updating state.");
      setUser(userProfile);
      setActivePath('dashboard');
    } catch (err: any) {
      console.error("Login error details:", err);
      setError(err.message);
    } finally {
      manualLoginRef.current = false;
      setIsLoggingIn(false);
    }
  };

  const handleUpdateHealthProfile = async (profile: any) => {
    if (!user) return;
    const updatedUser = sanitizeForFirestore({ ...user, healthProfile: profile });
    try {
      await setDoc(doc(db, 'users', user.id), updatedUser);
      setUser(updatedUser);
    } catch (err: any) {
      setError("فشل تحديث الملف الصحي: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const handleUpdatePlans = async (plans: any[]) => {
    if (!user) return;
    const updatedUser = sanitizeForFirestore({ ...user, activePlans: plans });
    try {
      await setDoc(doc(db, 'users', user.id), updatedUser);
      setUser(updatedUser);
    } catch (err: any) {
      setError("فشل تحديث الخطط: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const handleUpdateClaimStatus = async (newStatus: ClaimStatus, comment?: string, extraData?: any) => {
    const claimToUpdate = selectedClaim ? claims.find(c => c.id === selectedClaim.id) || selectedClaim : null;
    if (!claimToUpdate || !user) return;
    
    const updatedClaim = {
      ...claimToUpdate,
      ...extraData,
      status: newStatus,
      auditTrail: [
        ...claimToUpdate.auditTrail,
        {
          id: Math.random().toString(),
          userId: user.id,
          userName: user.name,
          action: `تغيير الحالة إلى: ${newStatus}`,
          timestamp: new Date().toLocaleString('ar-LY'),
          comment: comment || ''
        }
      ]
    };
    
    try {
      await setDoc(doc(db, 'claims', claimToUpdate.id), sanitizeForFirestore(updatedClaim));
      setSelectedClaim(null);
    } catch (err: any) {
      setError("فشل تحديث حالة المعاملة: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `claims/${claimToUpdate.id}`);
    }
  };

  const handleInvoiceAssign = async (claimId: string, invoiceIds: string[], staffId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim || !user) return;

    const staffMember = DATA_ENTRY_STAFF.find(s => s.id === staffId);
    const updatedInvoices = claim.invoices.map(inv => {
      if (invoiceIds.includes(inv.id)) {
        return { 
          ...inv, 
          assignedToId: staffId, 
          assignedToName: staffMember?.name || 'موظف غير معروف',
          status: ClaimStatus.MEDICALLY_APPROVED
        };
      }
      return inv;
    });
    
    const allAssigned = updatedInvoices.every(inv => !!inv.assignedToId);
    
    const updatedClaim = {
      ...claim,
      invoices: updatedInvoices,
      status: allAssigned ? ClaimStatus.MEDICALLY_APPROVED : claim.status,
      auditTrail: [
        ...claim.auditTrail,
        {
          id: Math.random().toString(),
          userId: user.id,
          userName: user.name,
          action: `إسناد ${invoiceIds.length} فاتورة للموظف: ${staffMember?.name}`,
          timestamp: new Date().toLocaleString('ar-LY')
        }
      ]
    };
    
    try {
      await setDoc(doc(db, 'claims', claimId), sanitizeForFirestore(updatedClaim));
    } catch (err: any) {
      setError("فشل إسناد الفواتير: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `claims/${claimId}`);
    }
  };

  const handleInvoiceStatusUpdate = async (claimId: string, invoiceId: string, newStatus: ClaimStatus, comment?: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim || !user) return;

    const updatedClaim = {
      ...claim,
      invoices: claim.invoices.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv),
      auditTrail: [...claim.auditTrail, {
         id: Math.random().toString(),
         userId: user.id,
         userName: user.name,
         action: `تعديل حالة فاتورة فردية إلى ${newStatus}`,
         timestamp: new Date().toLocaleString('ar-LY'),
         comment: comment || ''
      }]
    };
    
    try {
      await setDoc(doc(db, 'claims', claimId), sanitizeForFirestore(updatedClaim));
    } catch (err: any) {
      setError("فشل تحديث حالة الفاتورة: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `claims/${claimId}`);
    }
  };

  const handleSaveDataEntry = async (updatedInvoices: Invoice[]) => {
    const claimToUpdate = selectedClaim ? claims.find(c => c.id === selectedClaim.id) || selectedClaim : null;
    if (!claimToUpdate || !user) return;
    
    const mergedInvoices = claimToUpdate.invoices.map(inv => {
      const updated = updatedInvoices.find(u => u.id === inv.id);
      return updated ? { ...updated, status: ClaimStatus.FINANCIALLY_PROCESSED } : inv;
    });
    
    const allBackToHead = mergedInvoices.every(i => i.status === ClaimStatus.FINANCIALLY_PROCESSED);
    
    const updatedClaim = {
      ...claimToUpdate,
      invoices: mergedInvoices,
      status: allBackToHead ? ClaimStatus.FINANCIALLY_PROCESSED : claimToUpdate.status,
      auditTrail: [...claimToUpdate.auditTrail, {
        id: Math.random().toString(),
        userId: user.id,
        userName: user.name,
        action: `الموظف ${user.name} أكمل إدخال بيانات فواتيره وحولها للرئيس`,
        timestamp: new Date().toLocaleString('ar-LY')
      }]
    };
    
    try {
      await setDoc(doc(db, 'claims', claimToUpdate.id), sanitizeForFirestore(updatedClaim));
      setSelectedClaim(null);
    } catch (err: any) {
      setError("فشل حفظ بيانات الإدخال: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `claims/${claimToUpdate.id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-cairo overflow-hidden relative" dir="rtl">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
           <div className="absolute top-10 left-[10%] rotate-12 text-litcOrange animate-bounce duration-[4s]"><HeartPulse className="text-litcOrange animate-bounce duration-[4s] w-24 h-24 sm:w-30 sm:h-30" /></div>
           <div className="absolute top-[30%] right-[5%] -rotate-12 text-litcOrange"><Stethoscope className="text-litcOrange w-20 h-20 sm:w-24 sm:h-24" /></div>
           <div className="absolute bottom-[20%] left-[15%] rotate-45 text-litcOrange animate-pulse"><Shield className="text-litcOrange animate-pulse w-28 h-28 sm:w-35 sm:h-35" /></div>
           <div className="absolute top-[50%] right-[25%] -rotate-45 text-litcOrange"><Pill className="text-litcOrange w-16 h-16 sm:w-20 sm:h-20" /></div>
           <div className="absolute bottom-10 right-[15%] rotate-12 text-litcOrange"><Activity className="text-litcOrange w-30 h-30 sm:w-36 sm:h-36" /></div>
           <div className="absolute top-20 left-1/2 -translate-x-1/2 text-litcOrange opacity-50"><Heart className="text-litcOrange opacity-50 w-12 h-12 sm:w-15 sm:h-15" /></div>
           <div className="absolute bottom-1/3 left-[8%] -rotate-12 text-litcOrange"><ClipboardList className="text-litcOrange w-18 h-18 sm:w-22 sm:h-22" /></div>
        </div>

        {isLoggingIn ? (
          <div className="text-center space-y-10 animate-in fade-in zoom-in duration-700 relative z-10">
            <div className="relative inline-block">
               <div className="absolute inset-0 bg-litcOrange/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
               <Loader2 className="text-litcBlue relative z-10 animate-spin w-20 h-20 sm:w-24 sm:h-24" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-litcBlue tracking-[0.1em] mb-2">جاري فحص الصلاحيات</h2>
               <p className="text-litcOrange font-bold animate-pulse tracking-widest text-sm uppercase">LITC Smart Security System</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-16 shadow-[0_40px_100px_rgba(0,92,132,0.1)] border border-slate-100 animate-in zoom-in duration-700 relative z-10">
            <div className="flex flex-col items-center gap-6 mb-10 sm:mb-16 text-center">
               <div className="relative group transition-transform duration-700 hover:scale-110">
                  <div className="absolute -inset-6 bg-gradient-to-tr from-litcBlue/20 to-litcOrange/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                  <div className="w-28 h-28 bg-gradient-to-br from-litcBlue to-litcDark rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-[0_20px_50px_rgba(0,92,132,0.4)] relative border-4 border-white">
                     <span className="tracking-tighter">LT</span>
                     <div className="absolute -bottom-3 -right-3 bg-white p-2.5 rounded-[1.2rem] shadow-xl border border-slate-100 ring-4 ring-white">
                        <Activity className="text-litcOrange w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
                     </div>
                  </div>
               </div>
               <div className="space-y-1">
                  <h1 className="text-4xl font-black text-litcBlue tracking-tight">نظام الرعاية الذكي</h1>
                  <p className="text-[10px] font-black text-litcOrange uppercase tracking-[0.6em] opacity-80">LITC Digital Health Hub</p>
               </div>
            </div>

            <div className="space-y-6">
              {loginStep === 'initial' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => setLoginStep('email-login')} className="w-full group p-6 bg-slate-50 hover:bg-litcBlue rounded-[2rem] transition-all duration-500 flex items-center justify-between border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1">
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-litcBlue transition-all group-hover:scale-110">
                           <Mail className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                           <p className="font-black text-lg text-slate-900 group-hover:text-white transition-colors">تسجيل الدخول</p>
                           <p className="text-[9px] font-bold text-slate-400 group-hover:text-white/60 uppercase tracking-widest">Email Login</p>
                        </div>
                      </div>
                      <ChevronRight className="text-litcOrange group-hover:text-white transition-colors group-hover:translate-x-2 w-5 h-5" />
                    </button>

                    <button onClick={() => setLoginStep('email-signup')} className="w-full group p-6 bg-white hover:bg-litcOrange rounded-[2rem] transition-all duration-500 flex items-center justify-between border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1">
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-litcOrange transition-all group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white">
                           <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                           <p className="font-black text-lg text-slate-900 group-hover:text-white transition-colors">إنشاء حساب جديد</p>
                           <p className="text-[9px] font-bold text-slate-400 group-hover:text-white/60 uppercase tracking-widest">Create New Account</p>
                        </div>
                      </div>
                      <ChevronRight className="text-litcBlue group-hover:text-white transition-colors group-hover:translate-x-2 w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black text-slate-400"><span className="bg-white px-4">أو عبر</span></div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={handleGoogleLogin} className="p-5 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all flex items-center justify-center group shadow-sm hover:shadow-md">
                      <Chrome className="text-red-500 group-hover:scale-110 transition-transform w-6 h-6" />
                    </button>
                    <button onClick={handleMicrosoftLogin} className="p-5 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all flex items-center justify-center group shadow-sm hover:shadow-md">
                      <Database className="text-litcBlue group-hover:scale-110 transition-transform w-6 h-6" />
                    </button>
                    <button onClick={() => setLoginStep('phone-login')} className="p-5 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all flex items-center justify-center group shadow-sm hover:shadow-md">
                      <Phone className="text-green-500 group-hover:scale-110 transition-transform w-6 h-6" />
                    </button>
                  </div>

                  <button onClick={() => setLoginStep('official')} className="w-full mt-6 py-4 text-slate-400 font-black text-xs hover:text-litcBlue transition-colors uppercase tracking-[0.4em] border-t border-slate-50">الدخول كمسؤول نظام</button>
                </div>
              )}

              {loginStep === 'email-login' && (
                <form onSubmit={handleEmailLogin} className="space-y-5 animate-in slide-in-from-bottom-10">
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="email" 
                        placeholder="البريد الإلكتروني" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="password" 
                        placeholder="كلمة المرور" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {error}</div>}
                  <button type="submit" className="w-full py-4 bg-litcBlue text-white font-black rounded-2xl shadow-lg shadow-litcBlue/20 hover:-translate-y-1 transition-all">دخول</button>
                  <button type="button" onClick={() => setLoginStep('initial')} className="w-full py-2 text-slate-400 font-black text-xs">رجوع</button>
                </form>
              )}

              {loginStep === 'email-signup' && (
                <form onSubmit={handleEmailSignup} className="space-y-4 animate-in slide-in-from-bottom-10">
                  <div className="space-y-4">
                    <div className="relative">
                      <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="text" 
                        placeholder="الاسم بالكامل" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="email" 
                        placeholder="البريد الإلكتروني" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="password" 
                        placeholder="كلمة المرور" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="password" 
                        placeholder="تأكيد كلمة المرور" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {error}</div>}
                  <button type="submit" className="w-full py-4 bg-litcOrange text-white font-black rounded-2xl shadow-lg shadow-litcOrange/20 hover:-translate-y-1 transition-all">إنشاء الحساب</button>
                  <button type="button" onClick={() => setLoginStep('initial')} className="w-full py-2 text-slate-400 font-black text-xs">رجوع</button>
                </form>
              )}

              {loginStep === 'email-verification' && (
                <form onSubmit={handleEmailVerification} className="space-y-6 animate-in slide-in-from-bottom-10">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-litcOrange/10 text-litcOrange rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-litcBlue">تأكيد البريد الإلكتروني</h3>
                    <p className="text-xs font-bold text-slate-500">تم إرسال كود التحقق إلى {email}</p>
                  </div>

                  <div className="relative">
                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input 
                      type="text" 
                      placeholder="أدخل كود التحقق" 
                      className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-black text-center text-lg tracking-[0.5em]"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>

                  {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {error}</div>}
                  
                  <div className="space-y-3">
                    <button type="submit" className="w-full py-4 bg-litcBlue text-white font-black rounded-2xl shadow-lg shadow-litcBlue/20 hover:-translate-y-1 transition-all">تأكيد وتسجيل الدخول</button>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={handleEmailSignup} className="w-full py-2 text-litcOrange font-black text-xs hover:underline">إعادة إرسال الكود</button>
                      <button type="button" onClick={() => setLoginStep('email-signup')} className="w-full py-2 text-slate-400 font-black text-xs">تغيير البريد الإلكتروني</button>
                    </div>
                  </div>
                </form>
              )}

              {loginStep === 'phone-login' && (
                <form onSubmit={handlePhoneLogin} className="space-y-5 animate-in slide-in-from-bottom-10">
                  <div className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input 
                        type="tel" 
                        placeholder="رقم الهاتف (مثال: +218...)" 
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-litcBlue outline-none font-bold text-sm"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {error}</div>}
                  <button type="submit" className="w-full py-4 bg-green-500 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 hover:-translate-y-1 transition-all">إرسال رمز التحقق</button>
                  <button type="button" onClick={() => setLoginStep('initial')} className="w-full py-2 text-slate-400 font-black text-xs">رجوع</button>
                </form>
              )}

              {loginStep === 'official' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {[
                      { role: UserRole.RECEPTIONIST, label: 'مستقبل بيانات', icon: <FileText className="w-6 h-6"/>, color: 'hover:bg-amber-50 hover:text-amber-600 hover:border-amber-600' },
                      { role: UserRole.DOCTOR, label: 'طبيب مراجع', icon: <Stethoscope className="w-6 h-6"/>, color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600' },
                      { role: UserRole.DATA_ENTRY, label: 'إدخال فني', icon: <Database className="w-6 h-6"/>, color: 'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-600', action: () => setLoginStep('data-entry-select') },
                      { role: UserRole.HEAD_OF_UNIT, label: 'رئيس الوحدة', icon: <ShieldCheck className="w-6 h-6"/>, color: 'hover:bg-litcBlue/5 hover:text-litcBlue hover:border-litcBlue' }
                    ].map(o => (
                        <button 
                          key={o.role} 
                          onClick={o.action || (() => handleLogin(o.role))} 
                          disabled={isLoggingIn}
                          className={`p-6 sm:p-8 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] text-slate-600 transition-all flex flex-row sm:flex-col items-center sm:justify-center gap-4 group shadow-sm hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${o.color}`}
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all shrink-0">{o.icon}</div>
                          <span className="font-black text-sm">{o.label}</span>
                        </button>
                    ))}
                  </div>
                  {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {error}</div>}
                  <button onClick={() => setLoginStep('initial')} className="w-full py-4 text-slate-400 font-black text-xs hover:text-litcBlue transition-colors uppercase tracking-[0.4em]">الرجوع للرئيسية</button>
                </div>
              )}

              {loginStep === 'data-entry-select' && (
                <div className="space-y-4 animate-in slide-in-from-right-10">
                   {DATA_ENTRY_STAFF.map(s => (
                     <button 
                        key={s.id} 
                        onClick={() => handleLogin(UserRole.DATA_ENTRY, s)} 
                        disabled={isLoggingIn}
                        className="w-full p-6 bg-white hover:bg-litcOrange hover:text-white text-slate-700 rounded-[2rem] transition-all flex items-center justify-between group border border-slate-100 shadow-sm hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black group-hover:bg-white/20 group-hover:text-white">{s.name.charAt(0)}</div>
                           <div className="text-right">
                              <p className="font-black">{s.name}</p>
                              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{s.team}</p>
                           </div>
                        </div>
                        <ChevronRight className="w-4.5 h-4.5 group-hover:translate-x-2 transition-transform" />
                     </button>
                   ))}
                   {error && <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5"/> {error}</div>}
                   <button onClick={() => setLoginStep('official')} className="w-full py-4 text-slate-400 font-black text-xs hover:text-litcBlue transition-colors">رجوع</button>
                </div>
              )}
            </div>
            
            <div className="mt-12 text-center">
               <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  <Sparkles className="text-litcOrange w-3 h-3" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">v2.8 Enterprise Health Engine</p>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderContent = () => {
    // نمرر المعاملة المختارة المحدثة دوماً من حالة App
    const currentClaim = selectedClaim ? claims.find(c => c.id === selectedClaim.id) || selectedClaim : null;

    if (currentClaim) {
      if (user.role === UserRole.DATA_ENTRY) {
        return <DataEntry claim={currentClaim} claims={claims} user={user} onSave={handleSaveDataEntry} onBack={() => setSelectedClaim(null)} />;
      }
      return (
        <ClaimDetail 
          claim={currentClaim} 
          user={user} 
          onClose={() => setSelectedClaim(null)}
          onUpdateStatus={handleUpdateClaimStatus}
          onInvoiceAssign={handleInvoiceAssign}
          onInvoiceStatusUpdate={handleInvoiceStatusUpdate}
        />
      );
    }

    switch (activePath) {
      case 'dashboard':
        return <Dashboard 
          user={user} 
          claims={user.role === UserRole.EMPLOYEE ? claims.filter(c => c.employeeId === user.id) : claims} 
          onSelectClaim={setSelectedClaim} 
          onNavigate={setActivePath} 
          onAssign={handleInvoiceAssign} 
          onGrab={(claimId) => {
            const claim = claims.find(c => c.id === claimId);
            if (claim) {
              const status = user.role === UserRole.RECEPTIONIST ? ClaimStatus.WAITING_FOR_PAPER :
                             user.role === UserRole.DOCTOR ? ClaimStatus.PAPER_RECEIVED :
                             user.role === UserRole.DATA_ENTRY ? ClaimStatus.MEDICALLY_APPROVED : claim.status;
              
              handleUpdateClaimStatus(status, 'تم سحب المعاملة من حوض المهام');
            }
          }}
        />;
      case 'profile':
        return <Profile 
          user={user} 
          claims={claims.filter(c => c.employeeId === user.id)} 
          onNavigate={setActivePath} 
          onSelectClaim={setSelectedClaim} 
          onUpdateHealthProfile={handleUpdateHealthProfile}
          onUpdatePlans={handleUpdatePlans}
        />;
      case 'submit-claim':
        return <SubmitClaim user={user} onCancel={() => setActivePath('dashboard')} onSubmit={async (data) => {
          const newClaim: Claim = {
            id: data.id || `MC-${Math.floor(1000 + Math.random() * 9000)}`,
            employeeId: user.id,
            employeeName: user.name,
            submissionDate: new Date().toISOString().split('T')[0],
            status: ClaimStatus.WAITING_FOR_PAPER,
            totalAmount: data.totalAmount || 0,
            referenceNumber: data.id || `REF-${Date.now().toString().slice(-6)}`,
            invoiceCount: data.invoices.length,
            description: data.description || '',
            location: user.location || '',
            department: user.department || '',
            invoices: data.invoices.map((inv: any) => ({ 
              ...inv, 
              status: ClaimStatus.WAITING_FOR_PAPER,
              id: inv.id || `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            })),
            auditTrail: data.auditTrail || [{ id: 'L-0', userId: user.id, userName: user.name, action: 'تم إنشاء المطالبة وإرسالها للمراجعة الطبية', timestamp: new Date().toLocaleString() }]
          };
          
          try {
            await setDoc(doc(db, 'claims', newClaim.id), sanitizeForFirestore(newClaim));
            // We don't call setActivePath('dashboard') here anymore 
            // because SubmitClaim handles its own success state.
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `claims/${newClaim.id}`);
          }
        }} />;
      case 'archive':
        return <Archive user={user} claims={claims} onSelectClaim={setSelectedClaim} />;
      case 'admin-dashboard':
        return <AdminDashboard user={user} claims={claims} />;
      case 'admin-claims':
        return <AdminClaims user={user} claims={claims} onSelectClaim={setSelectedClaim} />;
      case 'chronic-enrollment':
        return <ChronicEnrollment user={user} applications={chronicApplications} onUpdate={handleUpdateChronicApplication} />;
      default:
        return <Dashboard user={user} claims={claims} onSelectClaim={setSelectedClaim} onNavigate={setActivePath} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activePath={activePath} 
      setActivePath={setActivePath}
      onRoleChange={handleRoleChange}
    >
      {renderContent()}
      
      {/* Floating AI Assistant Bubble */}
      {user && (
        <>
          <AnimatePresence>
            {isSmartClinicOpen && (
              <>
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSmartClinicOpen(false)}
                  className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9998]"
                />
                
                {/* Bubble Window */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 40, x: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 40, x: 40 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed bottom-[110px] right-[30px] w-[90vw] sm:w-[420px] h-[600px] max-h-[75vh] bg-white/90 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.2)] z-[9999] flex flex-col border border-white/40 rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300"
                >
                  {/* Header */}
                  <div className="p-6 bg-gradient-to-br from-litcBlue to-litcDark text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black">العيادة الذكية</h2>
                        <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">AI Conversation</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsSmartClinicOpen(false)}
                      className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all duration-500 flex items-center justify-center"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <SmartClinic 
                      user={user} 
                      onUpdateHealthProfile={handleUpdateHealthProfile} 
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Floating Toggle Button */}
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSmartClinicOpen(!isSmartClinicOpen)}
            className="fixed bottom-[30px] right-[30px] w-16 h-16 bg-gradient-to-br from-litcBlue to-litcDark text-white rounded-[2rem] shadow-2xl shadow-litcBlue/40 flex items-center justify-center z-[9999] group transition-all duration-500"
          >
            {isSmartClinicOpen ? <X className="w-8 h-8" /> : <BrainCircuit className="w-8 h-8 group-hover:animate-pulse" />}
            {!isSmartClinicOpen && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-litcOrange text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                1
              </div>
            )}
          </motion.button>
        </>
      )}
    </Layout>
  );
};

export default App;
