import React, { useState } from 'react';
import { User } from '../types';

interface NewStaffLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  onSuccessSubmit?: (loanData: any) => void;
  onSubmit?: (loanData: any) => void;
}

interface HRISRecord {
  staffId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  employmentDate: string;
  monthlySalary: string;
  isConfirmed: boolean;
  monthsOfService: number;
  address: string;
}

const HRIS_MOCK_DATABASE: Record<string, HRISRecord> = {
  'NT-127': {
    staffId: 'NT-127',
    name: 'Alex Morgan',
    email: 'alex.m@nolt.finance',
    department: 'Information Technology',
    role: 'Senior Software Engineer',
    employmentDate: '2024-05-15',
    monthlySalary: '₦480,000',
    isConfirmed: true,
    monthsOfService: 27,
    address: '14 Alexander Avenue, Ikoyi, Lagos State'
  },
  'NT-089': {
    staffId: 'NT-089',
    name: 'Tunde Bakare',
    email: 't.bakare@nolt.finance',
    department: 'Credit Risk',
    role: 'Credit Risk Lead',
    employmentDate: '2023-01-10',
    monthlySalary: '₦650,000',
    isConfirmed: true,
    monthsOfService: 42,
    address: '22 Admiralty Way, Lekki Phase 1, Lagos State'
  },
  'NT-204': {
    staffId: 'NT-204',
    name: 'Chidi Okoro',
    email: 'c.okoro@nolt.finance',
    department: 'Sales & Growth',
    role: 'Senior Sales Executive',
    employmentDate: '2026-03-01',
    monthlySalary: '₦350,000',
    isConfirmed: false,
    monthsOfService: 5,
    address: '8 Broad Street, Victoria Island, Lagos State'
  }
};

const NewStaffLoanModal: React.FC<NewStaffLoanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessSubmit,
  onSubmit
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // HRIS State
  const [staffIdInput, setStaffIdInput] = useState('NT-127');
  const [isFetchingHRIS, setIsFetchingHRIS] = useState(false);
  const [hrisRecord, setHrisRecord] = useState<HRISRecord | null>(HRIS_MOCK_DATABASE['NT-127']);

  // CASA vs BVN Account Opening State
  const [accountOption, setAccountOption] = useState<'casa' | 'bvn'>('casa');
  const [casaNumber, setCasaNumber] = useState('0123984561');
  const [isVerifyingCASA, setIsVerifyingCASA] = useState(false);
  const [casaVerified, setCasaVerified] = useState(true);

  const [bvnNumber, setBvnNumber] = useState('22233445566');
  const [isVerifyingBVN, setIsVerifyingBVN] = useState(false);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [bvnNameMatch, setBvnNameMatch] = useState<boolean | null>(null);
  const [bvnErrorMessage, setBvnErrorMessage] = useState('');

  // Step 2: Details
  const [phoneInput, setPhoneInput] = useState('+234 803 123 4567');
  const [addressInput, setAddressInput] = useState(HRIS_MOCK_DATABASE['NT-127'].address);

  // Step 3: Loan Config
  const [amount, setAmount] = useState('1,500,000');
  const [tenureMonths, setTenureMonths] = useState(12);
  const [purpose, setPurpose] = useState('Personal Emergency & Home Improvement');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFetchHRIS = () => {
    setIsFetchingHRIS(true);
    setTimeout(() => {
      const key = staffIdInput.trim().toUpperCase();
      const record = HRIS_MOCK_DATABASE[key] || {
        staffId: key,
        name: currentUser?.name || 'Alex Morgan',
        email: currentUser?.email || 'alex.m@nolt.finance',
        department: 'Operations',
        role: currentUser?.role || 'Staff Officer',
        employmentDate: '2024-05-15',
        monthlySalary: '₦480,000',
        isConfirmed: true,
        monthsOfService: 27,
        address: '14 Alexander Avenue, Ikoyi, Lagos State'
      };
      setHrisRecord(record);
      setAddressInput(record.address);
      setIsFetchingHRIS(false);
    }, 600);
  };

  const handleVerifyCASA = () => {
    if (!casaNumber || casaNumber.length < 8) return;
    setIsVerifyingCASA(true);
    setTimeout(() => {
      setIsVerifyingCASA(false);
      setCasaVerified(true);
    }, 600);
  };

  const handleVerifyBVNAndOpenAccount = () => {
    if (!bvnNumber || bvnNumber.length !== 11) {
      setBvnErrorMessage('Please enter a valid 11-digit BVN.');
      setBvnNameMatch(false);
      return;
    }

    setIsVerifyingBVN(true);
    setBvnErrorMessage('');

    setTimeout(() => {
      setIsVerifyingBVN(false);
      
      // Simulate BVN verification against HRIS Name
      if (bvnNumber === '11111111111') {
        setBvnNameMatch(false);
        setBvnVerified(false);
        setBvnErrorMessage(`BVN Name mismatch! BVN registered name does not match staff HRIS name (${hrisRecord?.name || 'Alex Morgan'}).`);
      } else {
        setBvnNameMatch(true);
        setBvnVerified(true);
      }
    }, 800);
  };

  const calculateMonthlyDeduction = () => {
    const numericAmount = Number(amount.replace(/[^0-9.-]+/g, '')) || 0;
    const annualInterestRate = 0.035; // 3.5% staff rate
    const totalInterest = numericAmount * (annualInterestRate * (tenureMonths / 12));
    const totalRepay = numericAmount + totalInterest;
    return Math.round(totalRepay / tenureMonths);
  };

  const handleSubmitStaffLoan = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const numericAmount = Number(amount.replace(/[^0-9.-]+/g, '')) || 1500000;
      const userName = currentUser?.name || hrisRecord?.name || 'Alex Morgan';
      const userRole = currentUser?.role || hrisRecord?.role || 'Super Admin';
      const isMD = userRole === 'MD' || userName.toLowerCase().includes('md');
      
      // Generate CASA account ONLY upon application submission if accountOption === 'bvn'
      let finalCASA = casaNumber;
      if (accountOption === 'bvn') {
        finalCASA = '019' + Math.floor(1000000 + Math.random() * 9000000);
      }

      const newStaffLoan = {
        id: `req_${Date.now()}`,
        referenceId: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
        applicant: {
          name: hrisRecord?.name || userName,
          email: hrisRecord?.email || currentUser?.email || 'alex.m@nolt.finance',
          avatar: currentUser?.avatar || 'https://picsum.photos/seed/staff/100/100',
          department: hrisRecord?.department || 'Information Technology',
          staffId: hrisRecord?.staffId || 'NT-127',
          phone: phoneInput,
          address: addressInput
        },
        type: 'Loan' as const,
        isStaffLoan: true,
        loanProduct: 'Staff Loan',
        loanCategory: 'Staff Loan',
        casaAccountNo: finalCASA,
        bvnNumber: accountOption === 'bvn' ? bvnNumber : undefined,
        employerName: 'NOLT Finance',
        amount: `₦${numericAmount.toLocaleString()}`,
        dateSubmitted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Pending Review' as const,
        currentNodeIndex: 1, // Stage 1: HR OFFICER
        tenure: `${tenureMonths} months`,
        monthlyIncome: hrisRecord?.monthlySalary || '₦480,000',
        hrisStaffId: hrisRecord?.staffId || 'NT-127',
        hrisSalary: hrisRecord?.monthlySalary || '₦480,000',
        hrisEmploymentDate: hrisRecord?.employmentDate || '2024-05-15',
        hrisIsConfirmed: hrisRecord?.isConfirmed ?? true,
        initiatedByMD: isMD,
        operationLogs: [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            actor: userName,
            action: 'Staff Loan Application Submitted',
            comment: accountOption === 'bvn'
              ? `Staff ID ${hrisRecord?.staffId || 'NT-127'} verified via HRIS & BVN. Auto-generated new NOLT Savings CASA Account (${finalCASA}) upon application submission. Submitted to HR Officer queue.`
              : `Staff ID ${hrisRecord?.staffId || 'NT-127'} verified via HRIS. Linked existing CASA Account (${finalCASA}). Submitted to HR Officer queue.`
          }
        ]
      };

      if (onSuccessSubmit) {
        onSuccessSubmit(newStaffLoan);
      } else if (onSubmit) {
        onSubmit(newStaffLoan);
      }

      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  const isStep1Valid = () => {
    if (!hrisRecord) return false;
    if (accountOption === 'casa') return casaVerified && casaNumber.length >= 8;
    if (accountOption === 'bvn') return bvnVerified && bvnNameMatch === true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-blue-800/40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/10 shadow-inner">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[9px] font-black uppercase tracking-widest border border-blue-400/30">
                HRIS-VERIFIED STAFF PORTAL
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">Apply for Staff Loan</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* Stepper Header */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-black">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>1</span>
              <span>1. HRIS & CASA / BVN</span>
            </div>
            <div className="w-6 h-[2px] bg-slate-200 dark:bg-slate-800"></div>
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>2</span>
              <span>2. Details</span>
            </div>
            <div className="w-6 h-[2px] bg-slate-200 dark:bg-slate-800"></div>
            <div className={`flex items-center gap-2 ${step === 3 ? 'text-primary' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === 3 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>3</span>
              <span>3. Loan Terms</span>
            </div>
          </div>

          {/* STEP 1: HRIS Staff ID Verification & Account Lookup / Opening */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* HRIS Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>HRIS Staff ID / Employee Number</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">Verified against NOLT HRIS</span>
                </label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={staffIdInput}
                    onChange={(e) => setStaffIdInput(e.target.value)}
                    placeholder="Enter Staff ID e.g. NT-127"
                    className="flex-1 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-black uppercase tracking-wider focus:ring-2 focus:ring-primary"
                  />
                  <button 
                    onClick={handleFetchHRIS}
                    disabled={isFetchingHRIS}
                    className="px-6 py-3.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-lg">sync</span>
                    {isFetchingHRIS ? 'Querying...' : 'Verify HRIS'}
                  </button>
                </div>
              </div>

              {/* HRIS Verified Card */}
              {hrisRecord && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/30 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/50 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                        <span className="material-symbols-outlined text-xl">badge</span>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">{hrisRecord.name}</h4>
                        <p className="text-xs font-bold text-slate-500">{hrisRecord.email} • {hrisRecord.role} ({hrisRecord.department})</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      hrisRecord.isConfirmed 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {hrisRecord.isConfirmed ? 'Confirmed Staff' : 'On Probation'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    <div className="bg-white dark:bg-surface-dark p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Service Duration</span>
                      <span className="text-slate-900 dark:text-white font-black mt-0.5 block">{hrisRecord.monthsOfService} Months</span>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Net Monthly Salary</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black mt-0.5 block">{hrisRecord.monthlySalary}</span>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">HRIS Address</span>
                      <span className="text-slate-900 dark:text-white font-black mt-0.5 block truncate">{hrisRecord.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CASA vs BVN Account Requirement */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
                    <span>NOLT CASA Account Verification</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Required for Disbursement</span>
                </div>

                {/* Option Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOption('casa');
                      setBvnErrorMessage('');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      accountOption === 'casa'
                        ? 'bg-primary/10 border-primary text-primary font-black shadow-sm'
                        : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">credit_card</span>
                    <div>
                      <span className="text-xs block font-black">I Have a CASA Account</span>
                      <span className="text-[9px] text-slate-400 block font-normal">Provide 10-digit account no.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountOption('bvn');
                      setBvnErrorMessage('');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      accountOption === 'bvn'
                        ? 'bg-primary/10 border-primary text-primary font-black shadow-sm'
                        : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">fingerprint</span>
                    <div>
                      <span className="text-xs block font-black">Open Account via BVN</span>
                      <span className="text-[9px] text-slate-400 block font-normal">Instant account opening</span>
                    </div>
                  </button>
                </div>

                {/* CASA Flow */}
                {accountOption === 'casa' && (
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">
                      NOLT CASA Account Number
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        maxLength={10}
                        value={casaNumber}
                        onChange={(e) => {
                          setCasaNumber(e.target.value);
                          setCasaVerified(false);
                        }}
                        placeholder="e.g. 0123984561"
                        className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono font-black focus:ring-2 focus:ring-primary"
                      />
                      <button 
                        type="button"
                        onClick={handleVerifyCASA}
                        disabled={isVerifyingCASA || !casaNumber}
                        className="px-5 py-3 bg-primary hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all"
                      >
                        {isVerifyingCASA ? 'Verifying...' : 'Verify CASA'}
                      </button>
                    </div>

                    {casaVerified && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>CASA Account Verified: {casaNumber} • Name: {hrisRecord?.name || 'Alex Morgan'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* BVN Flow */}
                {accountOption === 'bvn' && (
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">
                      Bank Verification Number (BVN)
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        maxLength={11}
                        value={bvnNumber}
                        onChange={(e) => {
                          setBvnNumber(e.target.value);
                          setBvnVerified(false);
                          setBvnNameMatch(null);
                          setBvnErrorMessage('');
                        }}
                        placeholder="Enter 11-digit BVN"
                        className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono font-black focus:ring-2 focus:ring-primary"
                      />
                      <button 
                        type="button"
                        onClick={handleVerifyBVNAndOpenAccount}
                        disabled={isVerifyingBVN || !bvnNumber}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">person_search</span>
                        {isVerifyingBVN ? 'Verifying BVN...' : 'Verify BVN'}
                      </button>
                    </div>

                    {bvnNameMatch === true && bvnVerified && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black">
                          <span className="material-symbols-outlined text-base">verified</span>
                          <span>BVN Match Success: BVN Name matches HRIS Staff Record ({hrisRecord?.name}).</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">info</span>
                          <span>A new NOLT Savings CASA Account will be automatically created upon final staff loan application submission.</span>
                        </div>
                      </div>
                    )}

                    {bvnNameMatch === false && (
                      <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{bvnErrorMessage || 'BVN Name mismatch. Must match HRIS staff name.'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Selected - Locked to STAFF LOAN */}
              <div className="p-4 rounded-2xl bg-indigo-950 text-white border border-indigo-800/60 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">SELECTED LOAN PRODUCT</span>
                    <h5 className="text-sm font-black text-white uppercase tracking-wide">STAFF LOAN (Code: 310)</h5>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                  LOCKED FOR STAFF
                </span>
              </div>

            </div>
          )}

          {/* STEP 2: Personal & Employment Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="material-symbols-outlined text-primary text-base">person</span>
                  <span>Personal Details (Fetched from HRIS)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      disabled
                      value={hrisRecord?.name || 'Alex Morgan'}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="text" 
                      disabled
                      value={hrisRecord?.email || 'alex.m@nolt.finance'}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input 
                      type="text" 
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address (HRIS Pre-filled)</label>
                    <input 
                      type="text" 
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details - Locked to NOLT Finance */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">work</span>
                    <span>Employment Details (Locked to Employer)</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    NOLT FINANCE INTERNAL
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employer Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled
                        value="NOLT Finance"
                        className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white cursor-not-allowed"
                      />
                      <span className="material-symbols-outlined text-slate-400 text-sm absolute right-4 top-3.5">lock</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HRIS Staff ID</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled
                        value={hrisRecord?.staffId || 'NT-127'}
                        className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white cursor-not-allowed"
                      />
                      <span className="material-symbols-outlined text-slate-400 text-sm absolute right-4 top-3.5">lock</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Designation</label>
                    <input 
                      type="text" 
                      disabled
                      value={hrisRecord?.role || 'Senior Software Engineer'}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                    <input 
                      type="text" 
                      disabled
                      value={hrisRecord?.department || 'Information Technology'}
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Loan Configuration (No docs/guarantors needed) */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Requested Amount (₦)
                  </label>
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-base font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    placeholder="1,500,000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Repayment Tenure (Months)
                  </label>
                  <select 
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months (2 Years)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Purpose of Loan
                </label>
                <input 
                  type="text" 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Home Renovation, Vehicle Maintenance, Personal Expense"
                />
              </div>

              {/* No Documents or References Required Notice */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl shrink-0 mt-0.5">verified_user</span>
                <div className="text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-black block uppercase tracking-wider">No Documents or References Required</span>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    Because this is an internal NOLT Finance staff loan verified via HRIS, standard loan attachments, utility bills, and third-party references are automatically waived.
                  </p>
                </div>
              </div>

              {/* Staff Rate Calculation Banner */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl border border-indigo-700/50">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-widest border border-emerald-400/30">
                    STAFF LOAN RATE (3.5% P.A.)
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-200">Auto Payroll Deduction</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-indigo-200 uppercase tracking-wider block font-bold">Estimated Monthly Payroll Deduction</span>
                    <span className="text-2xl font-black text-white mt-1 block">₦{calculateMonthlyDeduction().toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-200 uppercase tracking-wider block font-bold">8-Node Approval Workflow</span>
                    <span className="text-[11px] font-black text-emerald-400 mt-2 block leading-relaxed">
                      SUBMISSION → HR OFFICER → HR MANAGER → MD → CREDIT I → CREDIT II → AUDIT → FINANCE → DISBURSED
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-background-dark/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          {step === 1 && (
            <>
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!isStep1Valid()}
                className="px-8 py-3.5 bg-primary hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Personal Details</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Back</span>
              </button>
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3.5 bg-primary hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
              >
                <span>Proceed to Loan Terms</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Back</span>
              </button>
              <button 
                type="button"
                onClick={handleSubmitStaffLoan}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {isSubmitting ? 'Submitting Application...' : 'Submit Staff Loan Application'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default NewStaffLoanModal;
