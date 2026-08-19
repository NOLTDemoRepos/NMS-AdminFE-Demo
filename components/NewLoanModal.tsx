
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReviewRequest, OperationLogEntry } from '../types';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests?: ReviewRequest[];
  onAddRequest?: (newReq: ReviewRequest) => void;
}

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEPS = [
  'BVN Lookup',
  'Customer Card',
  'Loan Details',
  'Documents',
  'References',
  'Summary'
];

const mockExistingCustomer = {
  firstName: "Adewale",
  lastName: "Okafor",
  middleName: "Emeka",
  bvn: "22387654210",
  casaAccountNo: "0087654321",
  balance: 184500.00,
  accountTier: "Tier 2",
  dob: "12/04/1988",
  gender: "Male",
  maritalStatus: "Married",
  loans: [
    {
      id: "LN-2024-00821",
      product: "NOLT IPPIS",
      outstanding: 320000,
      status: "Active"
    },
    {
      id: "LN-2023-00445",
      product: "Working Capital",
      outstanding: 0,
      status: "Closed"
    }
  ]
};

const mockNewCustomer = {
  firstName: "Blessing",
  lastName: "Nwosu",
  middleName: "",
  bvn: "22198765430",
  casaAccountNo: "0094321876",
  balance: 0,
  accountTier: "Tier 1",
  dob: "03/09/1995",
  gender: "Female",
  maritalStatus: "Single",
  loans: []
};

const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose, requests = [], onAddRequest }) => {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [lookupType, setLookupType] = useState<'bvn' | 'casa'>('bvn');
  const [bvn, setBvn] = useState('');
  const [casaAccount, setCasaAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulateCASAFound, setSimulateCASAFound] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerCreated, setCustomerCreated] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [selectedIPPISAction, setSelectedIPPISAction] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loanDetailsStep, setLoanDetailsStep] = useState<0 | 1>(0); // 0: Product Select, 1: Form
  const [expandedSection, setExpandedSection] = useState<string | null>('address');

  // Blacklist & 45-day cooling violation states
  const [blacklistViolation, setBlacklistViolation] = useState<{
    isBlocked: boolean;
    reason: string;
    expiryDate: string;
    bvn: string;
    customerName?: string;
  } | null>(null);

  const [coolingWarning, setCoolingWarning] = useState<{
    isCooling: boolean;
    rejectionDate: string;
    expiryDate: string;
    reason: string;
    bvn: string;
    customerName?: string;
  } | null>(null);

  // New customer form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    mobile: '',
    email: '',
    address: '',
    stateOfResidence: '',
    dob: '',
    gender: '',
    maritalStatus: ''
  });

  const LOAN_PRODUCTS = [
    { code: '314', name: 'NOLT IPPIS', rate: '4% per month' },
    { code: '301', name: 'Working Capital Loan', rate: '5% per month' },
    { code: '302', name: 'NOLT Salary Advance', rate: '4% per month' },
    { code: '303', name: 'Annuitant Loan', rate: 'Confirm from CBS' }
  ];

  if (!isOpen) return null;

  const handleSearchCustomer = () => {
    if (lookupType === 'bvn' && bvn.length !== 11) return;
    if (lookupType === 'casa' && casaAccount.length !== 10) return;
    
    setLoading(true);
    setBlacklistViolation(null);
    setCoolingWarning(null);

    setTimeout(() => {
      setLoading(false);

      // Search existing requests for matching BVN or CASA
      const targetBvn = bvn;
      const targetCasa = casaAccount;

      const matchingReq = (requests || []).find(r => {
        const rBvn = r.applicant?.bvn || r.bvnNumber;
        const rCasa = r.casaAccountNo;
        if (lookupType === 'bvn' && targetBvn) {
          if (rBvn && (rBvn === targetBvn || rBvn.replace(/\D/g, '') === targetBvn.replace(/\D/g, ''))) return true;
        }
        if (lookupType === 'casa' && targetCasa) {
          if (rCasa && rCasa === targetCasa) return true;
        }
        return false;
      });

      if (matchingReq) {
        const isBlacklisted = matchingReq.isBlacklisted || matchingReq.fraudFlag || matchingReq.applicant?.fraudFlag || matchingReq.applicant?.isBlacklisted;
        if (isBlacklisted) {
          const expiry = matchingReq.blacklistExpiryDate || matchingReq.applicant?.blacklistExpiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
          const reason = matchingReq.blacklistReason || matchingReq.fraudReason || matchingReq.applicant?.fraudReason || 'Customer is flagged for fraud and barred from loan origination.';
          setBlacklistViolation({
            isBlocked: true,
            reason,
            expiryDate: expiry,
            bvn: targetBvn || matchingReq.applicant?.bvn || '22387654210',
            customerName: matchingReq.applicant?.name
          });
          return;
        }

        // Check 45-day cooling
        const coolingExpiry = matchingReq.rejectionCoolingExpiryDate || matchingReq.applicant?.rejectionCoolingExpiryDate;
        const isDeclined = matchingReq.status === 'Declined';
        const coolingTime = coolingExpiry ? new Date(coolingExpiry).getTime() : 0;
        const isWithinCooling = isDeclined && (coolingTime > Date.now() || !coolingExpiry);

        if (isWithinCooling) {
          const actualCoolingExpiry = coolingExpiry || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
          setCoolingWarning({
            isCooling: true,
            rejectionDate: matchingReq.rejectionDate || matchingReq.applicant?.rejectionDate || new Date().toISOString(),
            expiryDate: actualCoolingExpiry,
            reason: matchingReq.rejectionReason || matchingReq.applicant?.rejectionReason || 'Previous application declined by credit reviewer.',
            bvn: targetBvn || matchingReq.applicant?.bvn || '22387654210',
            customerName: matchingReq.applicant?.name
          });
        }
      }

      // Simulate logic: mockExistingCustomer works for both for now
      if (simulateCASAFound) {
        setCustomerData(mockExistingCustomer);
        setCurrentStep(1);
      } else {
        setShowCreateForm(true);
      }
    }, 1200);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCustomer(true);
    setTimeout(() => {
      setCreatingCustomer(false);
      setCustomerCreated(true);
      setCustomerData({
        ...mockNewCustomer,
        firstName: formData.firstName || mockNewCustomer.firstName,
        lastName: formData.lastName || mockNewCustomer.lastName,
        middleName: formData.middleName,
        phone: formData.mobile,
        email: formData.email,
        address: formData.address,
        dob: formData.dob || mockNewCustomer.dob,
        gender: formData.gender || mockNewCustomer.gender,
        maritalStatus: formData.maritalStatus || mockNewCustomer.maritalStatus
      });
      setTimeout(() => {
        setCurrentStep(1);
      }, 1200);
    }, 1200);
  };

  const resetModal = () => {
    setCurrentStep(0);
    setLookupType('bvn');
    setBvn('');
    setCasaAccount('');
    setLoading(false);
    setShowCreateForm(false);
    setCreatingCustomer(false);
    setCustomerCreated(false);
    setCustomerData(null);
    setSelectedIPPISAction(null);
    setBlacklistViolation(null);
    setCoolingWarning(null);
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      mobile: '',
      email: '',
      address: '',
      dob: '',
      gender: '',
      maritalStatus: ''
    });
  };

  const handleFinalSubmission = () => {
    const isAutoReject = !!coolingWarning;
    const custFirstName = customerData?.firstName || formData.firstName || 'Adewale';
    const custLastName = customerData?.lastName || formData.lastName || 'Okafor';
    const customerFullName = `${custFirstName} ${custLastName}`;
    const targetBvn = bvn || customerData?.bvn || '22387654210';
    const newRef = `LN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newLog: OperationLogEntry = isAutoReject ? {
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      actor: 'System Auto-Underwriting Policy Engine',
      action: 'AUTO-REJECT',
      comment: `AUTOMATIC REJECTION TRIGGERED: Re-application attempted within 45-day cooling window for BVN ${targetBvn}. Active cooling policy in effect until ${new Date(coolingWarning!.expiryDate).toLocaleDateString()}. Original rejection justification: ${coolingWarning!.reason}`
    } : {
      id: Math.random().toString(36).substring(7),
      timestamp: now,
      actor: 'Sales Agent (Direct Origination)',
      action: 'CREATE',
      comment: `New loan application submitted for ${selectedProduct?.name || 'NOLT IPPIS'}. Routed to Sales Verification queue.`
    };

    const newRequest: ReviewRequest = {
      id: Math.random().toString(36).substring(7),
      referenceId: newRef,
      type: 'Loan',
      loanProduct: selectedProduct?.name || 'NOLT IPPIS',
      amount: '₦1,500,000.00',
      applicant: {
        name: customerFullName,
        email: customerData?.email || formData.email || `${custFirstName.toLowerCase()}.${custLastName.toLowerCase()}@example.com`,
        phone: customerData?.phone || formData.mobile || '+234 802 345 6789',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bvn: targetBvn,
        rejectionDate: isAutoReject ? now : undefined,
        rejectionCoolingExpiryDate: isAutoReject ? coolingWarning!.expiryDate : undefined,
        rejectionReason: isAutoReject ? `Auto-rejected: 45-day cooling window active. (${coolingWarning!.reason})` : undefined
      },
      dateSubmitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: isAutoReject ? 'Declined' : 'Docs Verification',
      isAutoRejected: isAutoReject,
      rejectionDate: isAutoReject ? now : undefined,
      rejectionCoolingExpiryDate: isAutoReject ? coolingWarning!.expiryDate : undefined,
      rejectionReason: isAutoReject ? `Auto-rejected: 45-day cooling window active. (${coolingWarning!.reason})` : undefined,
      currentNodeIndex: isAutoReject ? 0 : 2,
      isIndemnitySigned: true,
      approvalComment: isAutoReject ? `System Auto-Rejection: 45-day cooling policy enforced for BVN ${targetBvn}.` : undefined,
      operationLogs: [newLog]
    };

    if (onAddRequest) {
      onAddRequest(newRequest);
    }
    resetModal();
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {STEPS.map((step, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2 relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
            currentStep === idx 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
              : currentStep > idx 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep > idx ? <span className="material-symbols-outlined text-sm">check</span> : idx}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${
            currentStep === idx ? 'text-primary' : 'text-slate-400'
          }`}>{step}</span>
          {idx < STEPS.length - 1 && (
            <div className={`absolute top-4 -right-1/2 w-full h-[2px] -z-10 bg-slate-100`} style={{ left: '50%' }}>
               <div className={`h-full bg-primary transition-all duration-500`} style={{ width: currentStep > idx ? '100%' : '0%' }}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden relative my-auto"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">New Loan Application</h3>
            <button 
              onClick={() => { resetModal(); onClose(); }}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {renderStepIndicator()}

          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <div className="flex flex-col items-center justify-center py-6 min-h-[400px] animate-in fade-in zoom-in duration-500">
                <div className="w-full max-w-lg space-y-6">
                  {/* Blacklist Violation Card - Blocks Flow */}
                  {blacklistViolation ? (
                    <div className="p-6 rounded-[28px] bg-red-50 border-2 border-red-500 shadow-xl space-y-5 animate-in shake duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
                          <span className="material-symbols-outlined text-2xl">gavel</span>
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded bg-red-200 text-red-800 text-[9px] font-black uppercase tracking-widest">CRITICAL RISK • APPLICATION BLOCKED</span>
                          <h4 className="text-lg font-black text-red-700 uppercase tracking-tight">Fraud Flagged & Blacklisted</h4>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-red-200 space-y-2">
                        <p className="text-xs text-red-900 font-bold leading-relaxed">
                          Customer <span className="font-black text-slate-900">{blacklistViolation.customerName || 'on CBS'}</span> with BVN <span className="font-mono font-black">{blacklistViolation.bvn}</span> is currently <strong>BLACKLISTED</strong> from all loan products.
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-bold border-t border-red-100">
                          <div>
                            <span className="text-slate-400 block uppercase">Ban Period:</span>
                            <span className="text-red-700 font-black">6 Months (180 Days)</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase">Expiry Date:</span>
                            <span className="text-slate-900 font-black">{new Date(blacklistViolation.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        {blacklistViolation.reason && (
                          <p className="text-[10px] text-slate-600 pt-1 font-mono">
                            <span className="font-bold text-red-600 uppercase">Reason:</span> {blacklistViolation.reason}
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-red-100/60 rounded-xl text-[10px] font-bold text-red-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">block</span>
                        Loan creation is strictly disabled for blacklisted profiles.
                      </div>

                      <button
                        onClick={() => {
                          setBlacklistViolation(null);
                          setBvn('');
                          setCasaAccount('');
                        }}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">person_search</span>
                        Search Another Customer
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <h4 className="text-lg font-black text-slate-900 uppercase">Customer Identity Lookup</h4>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">
                          Search by BVN or existing CASA account number.
                        </p>
                      </div>

                      {/* 45-Day Cooling Alert Banner if detected */}
                      {coolingWarning && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                          <div className="flex items-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wide">
                            <span className="material-symbols-outlined text-base">warning</span>
                            45-Day Auto-Rejection Cooling Active
                          </div>
                          <p className="text-xs text-amber-900 font-bold leading-relaxed">
                            BVN <span className="font-mono font-black">{coolingWarning.bvn}</span> was rejected on {new Date(coolingWarning.rejectionDate).toLocaleDateString()}. Re-application within 45 days (until <span className="underline font-black">{new Date(coolingWarning.expiryDate).toLocaleDateString()}</span>) will trigger an automatic policy decline.
                          </p>
                        </div>
                      )}

                      {/* Lookup Type Toggle */}
                      <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button 
                          onClick={() => setLookupType('bvn')}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lookupType === 'bvn' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          BVN Lookup
                        </button>
                        <button 
                          onClick={() => setLookupType('casa')}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lookupType === 'casa' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          CASA Search
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          {lookupType === 'bvn' ? (
                            <input 
                              type="text" 
                              maxLength={11}
                              value={bvn}
                              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                              disabled={loading || showCreateForm}
                              placeholder="ENTER 11-DIGIT BVN"
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black tracking-[0.2em] focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 placeholder:text-slate-300 placeholder:text-sm placeholder:tracking-normal"
                            />
                          ) : (
                            <input 
                              type="text" 
                              maxLength={10}
                              value={casaAccount}
                              onChange={(e) => setCasaAccount(e.target.value.replace(/\D/g, ''))}
                              disabled={loading || showCreateForm}
                              placeholder="ENTER 10-DIGIT ACCOUNT"
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black tracking-[0.2em] focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 placeholder:text-slate-300 placeholder:text-sm placeholder:tracking-normal"
                            />
                          )}
                        </div>
                        
                        {loading && (
                          <div className="flex items-center justify-center gap-3 py-2 animate-pulse">
                            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verifying Identity & Bureau Blacklist on CBS...</span>
                          </div>
                        )}

                        {!showCreateForm && !loading && (
                          <button 
                            onClick={handleSearchCustomer}
                            disabled={lookupType === 'bvn' ? bvn.length !== 11 : casaAccount.length !== 10}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                          >
                            Search Customer
                          </button>
                        )}

                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                          {lookupType === 'bvn' 
                            ? 'BVN Verification & Fraud Registry via CBS'
                            : 'Direct Account Inquiry via CBS REST API'}
                        </p>
                      </div>
                    </>
                  )}

                  <AnimatePresence>
                    {showCreateForm && !customerCreated && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6 pt-8 border-t border-slate-100"
                      >
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center gap-2 text-[#B45309]">
                             <span className="material-symbols-outlined text-lg">warning</span>
                             <span className="text-[10px] font-black uppercase">No CASA linked to this BVN</span>
                          </div>
                          <p className="text-[10px] font-bold text-[#B45309]/80 uppercase leading-relaxed">
                            Please complete the details below to create a new customer account.
                          </p>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</p>
                            <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</p>
                            <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</p>
                            <input type="text" value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</p>
                            <input required type="tel" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="08012345678" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</p>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                          <div className="space-y-1 col-span-full">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</p>
                            <textarea required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none min-h-[80px]" />
                          </div>
                          <div className="space-y-1 col-span-full">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">State of Residence</p>
                            <select required value={formData.stateOfResidence} onChange={(e) => setFormData({...formData, stateOfResidence: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none">
                               <option value="">Select State...</option>
                               {["Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Cross River", "Edo", "Enugu"].map(state => (
                                 <option key={state} value={state}>{state}</option>
                               ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</p>
                            <input required type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</p>
                            <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-1 focus:ring-primary outline-none">
                              <option value="">Select...</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marital Status</p>
                            <select required value={formData.maritalStatus} onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-1 focus:ring-primary outline-none">
                              <option value="">Select...</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          </div>
                          <button 
                            type="submit"
                            disabled={creatingCustomer}
                            className="col-span-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            {creatingCustomer && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {creatingCustomer ? 'Creating CASA account on CBS...' : 'Create Customer Account'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {customerCreated && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex flex-col items-center text-center space-y-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-2xl font-black">check</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1">CASA created successfully</p>
                        <p className="text-xl font-black text-emerald-900 tracking-wider">0123456789</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && customerData && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
                {/* Customer Card */}
                <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-inner ${simulateCASAFound ? 'bg-[#0F6E56]' : 'bg-[#B45309]'}`}>
                           {customerData.firstName[0]}{customerData.lastName[0]}
                         </div>
                         <div>
                            <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{customerData.firstName} {customerData.lastName}</h4>
                            <p className="text-xs font-mono font-black text-slate-400 mt-0.5 tracking-wider">{customerData.casaAccountNo}</p>
                         </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${simulateCASAFound ? 'text-[#0F6E56] bg-emerald-50 border-emerald-100' : 'text-[#B45309] bg-amber-50 border-amber-100'}`}>
                        {simulateCASAFound ? 'Existing customer' : 'New customer — CASA just created'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12 pb-8 border-b border-slate-100 italic">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date of birth</p>
                        <p className="text-sm font-black text-slate-900 uppercase">{customerData.dob}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                        <p className="text-sm font-black text-slate-900 uppercase">{customerData.gender}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">BVN</p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">••••••••{customerData.bvn.slice(-3)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Balance</p>
                        <p className="text-sm font-black text-[#0F6E56] uppercase">₦{customerData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Tier</p>
                        <p className="text-sm font-black text-slate-900 uppercase italic">{customerData.accountTier}</p>
                      </div>
                    </div>

                    {simulateCASAFound && customerData.loans && customerData.loans.length > 0 && (
                      <div className="pt-8 space-y-6">
                        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-2 border-primary pl-3">Existing loans on CBS</h5>
                        <div className="space-y-3">
                          {customerData.loans.map((loan: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-200">
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${loan.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                                    <span className="material-symbols-outlined text-[20px]">{loan.status === 'Active' ? 'monetization_on' : 'check_circle'}</span>
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{loan.id} • {loan.product}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">OUTSTANDING: <span className="text-rose-500">₦{loan.outstanding.toLocaleString()}</span></p>
                                  </div>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${loan.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                 {loan.status}
                               </span>
                            </div>
                          ))}
                        </div>

                        {/* IPPIS Action Panel */}
                        {customerData.loans.some((l: any) => l.product.includes('IPPIS')) && (
                          <div className="p-8 bg-[#4C1D95]/5 rounded-[32px] border border-[#4C1D95]/20 border-dashed space-y-6">
                             <div>
                                <h6 className="text-[15px] font-black text-[#4C1D95] uppercase italic tracking-tight">IPPIS loan detected</h6>
                                <p className="text-[10px] font-black text-[#4C1D95]/60 uppercase tracking-wide">An active IPPIS loan exists for this customer. How would you like to proceed?</p>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                  { id: 'topup', label: 'Top-up', sub: 'Add funds to the existing IPPIS loan' },
                                  { id: 're-add', label: 'Re-add', sub: 'Re-open or restructure the existing loan' },
                                  { id: 'buyover', label: 'Buyover', sub: 'Transfer the loan from another lender' }
                                ].map((action) => (
                                  <button
                                    key={action.id}
                                    onClick={() => setSelectedIPPISAction(action.id)}
                                    className={`p-5 rounded-2xl text-left border-2 transition-all group ${
                                      selectedIPPISAction === action.id 
                                        ? 'bg-[#4C1D95] text-white border-[#4C1D95] shadow-xl shadow-indigo-200/50' 
                                        : 'bg-white text-slate-900 border-slate-100 hover:border-[#4C1D95]/30'
                                    }`}
                                  >
                                    <p className="text-[12px] font-black uppercase mb-1 tracking-tight">{action.label}</p>
                                    <p className={`text-[9px] font-bold uppercase leading-relaxed ${selectedIPPISAction === action.id ? 'opacity-80' : 'text-slate-400 group-hover:text-[#4C1D95]'}`}>{action.sub}</p>
                                  </button>
                                ))}
                             </div>


                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => { resetModal(); setCurrentStep(0); }}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_search</span>
                    Wrong customer? Search again
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedIPPISAction && selectedIPPISAction !== 'new') {
                        const ippisProduct = LOAN_PRODUCTS.find(p => p.code === '314');
                        setSelectedProduct(ippisProduct);
                        setLoanDetailsStep(1);
                        setExpandedSection(selectedIPPISAction === 'buyover' ? 'buyover' : 'config');
                        setCurrentStep(2);
                      } else {
                        setCurrentStep(2);
                        setLoanDetailsStep(0);
                      }
                    }}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-3 group"
                  >
                    Confirm & Continue
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {loanDetailsStep === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 min-h-[400px]">
                    {/* ... product selection logic ... */}
                    <div className="w-full max-w-sm space-y-8">
                       <div className="text-center space-y-2">
                          <h4 className="text-lg font-black text-slate-900 uppercase">Select Loan Product</h4>
                          <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase">The product selection drives what fields appear next.</p>
                       </div>
                       
                       <div className="space-y-3">
                          {LOAN_PRODUCTS.map((prod) => (
                            <button
                              key={prod.code}
                              onClick={() => setSelectedProduct(prod)}
                              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                                selectedProduct?.code === prod.code 
                                  ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                                  : 'bg-white border-slate-100 hover:border-primary/30'
                              }`}
                            >
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedProduct?.code === prod.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                     <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                                  </div>
                                  <div>
                                     <p className={`text-[12px] font-black uppercase tracking-tight ${selectedProduct?.code === prod.code ? 'text-white' : 'text-slate-900'}`}>{prod.name}</p>
                                     <p className={`text-[9px] font-bold uppercase ${selectedProduct?.code === prod.code ? 'text-white/70' : 'text-slate-400'}`}>Code: {prod.code}</p>
                                  </div>
                               </div>
                               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${selectedProduct?.code === prod.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {prod.rate}
                               </span>
                            </button>
                          ))}
                       </div>

                       <div className="flex items-center gap-4 pt-4">
                          <button onClick={() => setCurrentStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Back</button>
                          <button 
                            onClick={() => setLoanDetailsStep(1)}
                            disabled={!selectedProduct}
                            className="flex-3 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-20 flex items-center justify-center gap-2 group"
                          >
                             Next Step
                             <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </button>
                       </div>
                    </div>
                  </div>
                ) : (selectedIPPISAction === 'topup' || selectedIPPISAction === 're-add') ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-[24px]">
                       <h5 className="text-[14px] font-black uppercase text-primary mb-1 italic">{selectedIPPISAction === 'topup' ? 'Top-up' : 'Re-add'} IPPIS Loan</h5>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">Updating existing facility for {customerData.firstName} {customerData.lastName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-white border border-slate-200 p-8 rounded-[32px]">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">IPPIS Number</p>
                          <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Top-up Amount (₦)</p>
                          <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenure (Months)</p>
                          <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold">
                             {[3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} Months</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bank</p>
                          <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</p>
                          <input type="text" maxLength={10} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Capture Recent Payslip</p>
                          <div className="w-full px-4 py-2 bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors">
                             <span className="material-symbols-outlined text-slate-400 text-sm">upload</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase">Click to upload</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <button onClick={() => { setLoanDetailsStep(0); setSelectedIPPISAction(null); }} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Back</button>
                       <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group">
                          Next Step: Documents
                          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Address Section */}
                    {/* ... Address collapsible ... */}
                    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden">
                       <button 
                        onClick={() => setExpandedSection(expandedSection === 'address' ? null : 'address')}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 group"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                             </div>
                             <div>
                                <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Residential Address</h5>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Verification & Location Details</p>
                             </div>
                          </div>
                          <span className={`material-symbols-outlined transition-transform duration-300 ${expandedSection === 'address' ? 'rotate-180' : ''}`}>expand_more</span>
                       </button>
                       <AnimatePresence>
                         {expandedSection === 'address' && (
                           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-8 border-t border-slate-100 grid grid-cols-2 gap-6 bg-slate-50/30">
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">State of Origin</p>
                                    <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" placeholder="Select state..." />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">State of Residence</p>
                                    <input type="text" defaultValue={customerData?.stateOfResidence || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Status</p>
                                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold">
                                       <option>Owned</option>
                                       <option>Rented</option>
                                       <option>Family Owned</option>
                                       <option>Leased</option>
                                    </select>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">NIN {selectedProduct?.code === '314' ? '*' : '(Optional)'}</p>
                                    <input type="text" required={selectedProduct?.code === '314'} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" placeholder="Enter NIN..." />
                                 </div>
                                 <div className="space-y-1 col-span-full">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Home Address</p>
                                    <textarea defaultValue={customerData?.address || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold min-h-[80px]" />
                                 </div>
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>

                    {/* Buyover Details Section (When Buyover is selected) */}
                    {selectedIPPISAction === 'buyover' && (
                      <div className="bg-indigo-50/50 border border-indigo-200 rounded-[24px] overflow-hidden">
                        <button 
                          onClick={() => setExpandedSection(expandedSection === 'buyover' ? null : 'buyover')}
                          className="w-full p-6 flex items-center justify-between text-left hover:bg-white/50 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                                </div>
                                <div>
                                  <h5 className="text-[12px] font-black uppercase tracking-widest text-indigo-950">Buyover Details</h5>
                                  <p className="text-[9px] font-bold text-indigo-600/60 uppercase italic">Debt Transfer Configuration</p>
                                </div>
                            </div>
                            <span className={`material-symbols-outlined transition-transform duration-300 ${expandedSection === 'buyover' ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        <AnimatePresence>
                          {expandedSection === 'buyover' && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-8 border-t border-indigo-100 grid grid-cols-2 gap-6 bg-white/40">
                                  <div className="space-y-1">
                                      <p className="text-[9px] font-black text-indigo-950/60 uppercase tracking-widest ml-1">Buyover Company Name</p>
                                      <input type="text" className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-[11px] font-bold" />
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-[9px] font-black text-indigo-950/60 uppercase tracking-widest ml-1">Buyover Amount (₦)</p>
                                      <input type="number" className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-[11px] font-bold" />
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-[9px] font-black text-indigo-950/60 uppercase tracking-widest ml-1">Company Account Number</p>
                                      <input type="text" className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-[11px] font-bold" />
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-[9px] font-black text-indigo-950/60 uppercase tracking-widest ml-1">Company Account Name</p>
                                      <input type="text" className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-[11px] font-bold" />
                                  </div>
                                </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Employment Section */}
                    {/* ... Employment collapsible ... */}
                    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden">
                       <button 
                        onClick={() => setExpandedSection(expandedSection === 'employment' ? null : 'employment')}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 group"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                             </div>
                             <div>
                                <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Employment Details</h5>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Career & Income Information</p>
                             </div>
                          </div>
                          <span className={`material-symbols-outlined transition-transform duration-300 ${expandedSection === 'employment' ? 'rotate-180' : ''}`}>expand_more</span>
                       </button>
                       <AnimatePresence>
                         {expandedSection === 'employment' && (
                           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-8 border-t border-slate-100 grid grid-cols-2 gap-6 bg-slate-50/30">
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">MDA / Tertiary Institution</p>
                                    <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">IPPIS Number</p>
                                    <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID</p>
                                    <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Income (₦)</p>
                                    <input type="number" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                 </div>
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>

                    {/* Loan Config Section */}
                    {/* ... Loan Config collapsible ... */}
                    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-lg shadow-primary/5">
                       <button 
                        onClick={() => setExpandedSection(expandedSection === 'config' ? null : 'config')}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 group"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                             </div>
                             <div>
                                <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900">Loan Configuration</h5>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Amount, Tenure & Disbursement</p>
                             </div>
                          </div>
                          <span className={`material-symbols-outlined transition-transform duration-300 ${expandedSection === 'config' ? 'rotate-180' : ''}`}>expand_more</span>
                       </button>
                       <AnimatePresence>
                         {expandedSection === 'config' && (
                           <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="p-8 border-t border-slate-100 space-y-8 bg-slate-50/30">
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Amount (₦)</p>
                                       <input type="number" className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-lg font-black text-primary focus:border-primary outline-none" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenure (Months)</p>
                                       <select className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-lg font-black text-primary focus:border-primary outline-none">
                                          {[3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} Months</option>)}
                                       </select>
                                    </div>
                                 </div>
                                 
                                 <div className="pt-6 border-t border-slate-100 space-y-6">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                       <span className="material-symbols-outlined text-sm">payments</span>
                                       Disbursement Channel
                                    </p>
                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</p>
                                          <input type="text" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                       </div>
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</p>
                                          <input type="text" maxLength={10} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold" />
                                       </div>
                                       <div className="space-y-1 col-span-full">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name (Auto-verified)</p>
                                          <div className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-black text-emerald-700 flex items-center justify-between">
                                             <span>{customerData?.firstName} {customerData?.lastName}</span>
                                             <span className="material-symbols-outlined text-sm">verified</span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-4 pt-6">
                       <button onClick={() => { if(selectedIPPISAction && selectedIPPISAction !== 'new') { setCurrentStep(1); } else { setLoanDetailsStep(0); } }} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Back</button>
                       <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group">
                          Next Step: Documents
                          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="text-center space-y-2 mb-8">
                    <h4 className="text-lg font-black text-slate-900 uppercase italic">Document Verification</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload clear, scanned copies of supporting documents</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                       { label: 'Government ID', sub: 'Passport, Driver License, etc.' },
                       { label: 'Work ID', sub: 'Valid Company/Org ID' },
                       { label: 'Recent Payslip', sub: 'Must be from last 3 months' },
                       { label: 'Selfie', sub: 'Real-time facial capture' },
                       { label: 'Bank Statement', sub: '6 Months stamped statement' },
                       { label: 'Proof of Residence', sub: 'Utility bill or Rent receipt' }
                    ].map((doc, i) => (
                       <div key={i} className="p-6 bg-white border border-slate-100 rounded-[24px] hover:border-primary/30 transition-all group cursor-pointer border-b-2">
                          <div className="flex items-center justify-between mb-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                             </div>
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest group-hover:text-primary">Click to upload</span>
                          </div>
                          <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{doc.label}</h6>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{doc.sub}</p>
                       </div>
                    ))}
                 </div>

                 <div className="flex items-center gap-4 pt-6">
                    <button onClick={() => setCurrentStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Back</button>
                    <button onClick={() => setCurrentStep(4)} className="flex-2 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group">
                       Continue to References
                       <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                 </div>
              </div>
            )}

            {currentStep === 4 && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2 mb-8">
                     <h4 className="text-lg font-black text-slate-900 uppercase italic">Guarantors & References</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provide at least one verified personal reference</p>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-white border border-slate-200 rounded-[32px] p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Full Name</p>
                              <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase focus:border-primary outline-none" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</p>
                              <input type="tel" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black focus:border-primary outline-none" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</p>
                              <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase focus:border-primary outline-none">
                                 <option>Sibling</option>
                                 <option>Parent</option>
                                 <option>Colleague</option>
                                 <option>Spouse</option>
                              </select>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</p>
                              <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black focus:border-primary outline-none" />
                           </div>
                        </div>
                        <button className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                           <span className="material-symbols-outlined text-sm">add_circle</span>
                           Add Second Reference
                        </button>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Back</button>
                    <button onClick={() => setCurrentStep(5)} className="flex-2 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group">
                       Review Application
                       <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                 </div>
               </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 text-center space-y-4">
                   <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
                      <span className="material-symbols-outlined text-3xl">fact_check</span>
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Review Application</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify all details before final submission to CBS</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
                      <h6 className="text-[11px] font-black text-primary uppercase tracking-widest border-b border-slate-50 pb-2">Customer & Loan</h6>
                      <div className="space-y-2">
                         <p className="text-sm font-black text-slate-900 uppercase italic">{customerData?.firstName} {customerData?.lastName}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">{selectedProduct?.name} ({selectedProduct?.code})</p>
                         <p className="text-base font-black text-emerald-600 mt-2">₦ {formData.middleName || '0.00'}</p> {/* Using dummy logic for summary */}
                      </div>
                   </div>
                   <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
                      <h6 className="text-[11px] font-black text-primary uppercase tracking-widest border-b border-slate-50 pb-2">Status & Verification</h6>
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Documents</span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase">Uploaded</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">References</span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase">Verified</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">CASA Link</span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                         </div>
                      </div>
                   </div>
                </div>

                {coolingWarning && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wide">
                      <span className="material-symbols-outlined text-base">warning</span>
                      45-Day Policy Cooling Notification
                    </div>
                    <p className="text-xs text-amber-900 font-bold leading-relaxed">
                      Submission will be logged as an automatic decline in accordance with credit policy (BVN in 45-day cooling period until {new Date(coolingWarning.expiryDate).toLocaleDateString()}).
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-6">
                   <button onClick={() => setCurrentStep(4)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Back</button>
                   <button onClick={handleFinalSubmission} className="flex-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group">
                      Final Submission
                      <span className="material-symbols-outlined text-[18px] group-hover:scale-125 transition-transform">send</span>
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developer Helper */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-sm">settings</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Developer Simulator</span>
           </div>
           <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                 <input 
                  type="radio" 
                  checked={simulateCASAFound} 
                  onChange={() => setSimulateCASAFound(true)} 
                  className="w-3 h-3 text-primary focus:ring-primary"
                />
                 <span className="text-[9px] font-bold text-slate-400 uppercase group-hover:text-primary">Simulate: CASA found</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                 <input 
                  type="radio" 
                  checked={!simulateCASAFound} 
                  onChange={() => setSimulateCASAFound(false)} 
                  className="w-3 h-3 text-primary focus:ring-primary"
                />
                 <span className="text-[9px] font-bold text-slate-400 uppercase group-hover:text-primary">Simulate: No CASA / new customer</span>
              </label>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewLoanModal;
