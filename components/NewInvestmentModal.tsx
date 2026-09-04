import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReviewRequest, Applicant, UserRole } from '../types';
import { calculateAgentCommission } from '../services/agentCommissionService';

interface NewInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string, role: string, avatar: string };
  onAddRequest?: (newReq: ReviewRequest) => void;
  requests?: ReviewRequest[];
  defaultChannel?: 'Back Office' | 'Mobile App';
}

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  'BVN Lookup',
  'Customer Card',
  'Investment Settings',
  'Documents Upload',
  'Summary'
];

const mockExistingCustomer = {
  firstName: "Olanrewaju",
  lastName: "Alabi",
  middleName: "Segun",
  bvn: "22234567891",
  casaAccountNo: "0098765432",
  balance: 1450000.00,
  accountTier: "Tier 3",
  dob: "1985-08-14",
  gender: "Male",
  maritalStatus: "Married",
  email: "olanrewaju.alabi@example.com",
  phone: "08034567890",
  address: "12, Admiralty Way, Lekki Phase 1, Lagos State",
  investments: [
    { id: 'INV-2024-00821', product: 'NOLT RISE', principal: 1000000, valueDate: '2024-11-12', tenure: '6 Months', status: 'Active' },
    { id: 'INV-2023-00445', product: 'NOLT VAULT', principal: 2500000, valueDate: '2023-05-15', tenure: '12 Months', status: 'Closed' }
  ]
};

const mockNewCustomer = {
  firstName: "Chioma",
  lastName: "Eze",
  middleName: "Ada",
  bvn: "22456789012",
  casaAccountNo: "0081234567",
  balance: 0,
  accountTier: "Tier 1",
  dob: "1994-11-20",
  gender: "Female",
  maritalStatus: "Single",
  email: "chioma.eze@example.com",
  phone: "08021112223",
  address: "45, Garki Road, Area 11, Abuja FCT",
  investments: []
};

const NewInvestmentModal: React.FC<NewInvestmentModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onAddRequest, 
  requests = [],
  defaultChannel
}) => {
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

  // Topup vs New Choice State
  const [selectedInvestmentAction, setSelectedInvestmentAction] = useState<'topup' | 'fresh' | null>(null);
  const [targetedInvestmentId, setTargetedInvestmentId] = useState<string>('');

  // Investment settings state
  const [selectedPlan, setSelectedPlan] = useState<'NOLT Rise' | 'NOLT Vault' | 'NOLT Target'>('NOLT Rise');
  const [amount, setAmount] = useState('500000');
  const [tenure, setTenure] = useState('6'); // in months
  const [interestRate, setInterestRate] = useState(12.0); // % per annum
  const [rolloverOption, setRolloverOption] = useState<'Principal & Interest' | 'Principal Only' | 'Payout'>('Principal & Interest');
  const [paymentSource, setPaymentSource] = useState('CASA - Not Linked');
  const [bookingChannel, setBookingChannel] = useState<'Back Office' | 'Mobile App' | 'Direct'>(
    defaultChannel || 'Back Office'
  );
  const [branchOffice, setBranchOffice] = useState<string>('Head Office (Victoria Island)');
  const [relationshipManager, setRelationshipManager] = useState<string>('Chioma Adebayo (RM-042)');
  const [isAgentReferral, setIsAgentReferral] = useState(false);
  const [selectedAgentCode, setSelectedAgentCode] = useState('AGT-702');

  React.useEffect(() => {
    if (customerData?.casaAccountNo) {
      setPaymentSource(`CASA - ${customerData.casaAccountNo}`);
    } else {
      setPaymentSource('CASA - Not Linked');
    }
  }, [customerData]);

  React.useEffect(() => {
    if (customerData) {
      const staticInvestments = customerData.investments || [];
      const dynamicInvestments = requests
        ? requests.filter(
            (r) =>
              r.type === 'Investment' &&
              (r.applicant?.bvn === customerData.bvn ||
                r.applicant?.name?.toLowerCase() === `${customerData.firstName} ${customerData.lastName}`.toLowerCase())
          )
        : [];
      if (staticInvestments.length === 0 && dynamicInvestments.length === 0) {
        setSelectedInvestmentAction('fresh');
      } else {
        setSelectedInvestmentAction(null);
      }
    } else {
      setSelectedInvestmentAction(null);
    }
  }, [customerData, requests]);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');

  // New customer onboarding state
  const [formData, setFormData] = useState({
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

  if (!isOpen) return null;

  const handleSearchCustomer = () => {
    if (lookupType === 'bvn' && bvn.length !== 11) return;
    if (lookupType === 'casa' && casaAccount.length !== 10) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (simulateCASAFound) {
        setCustomerData(mockExistingCustomer);
        setCurrentStep(1);
      } else {
        setShowCreateForm(true);
      }
    }, 1500);
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
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
        phone: formData.mobile || mockNewCustomer.phone,
        email: formData.email || mockNewCustomer.email,
        address: formData.address || mockNewCustomer.address,
        dob: formData.dob || mockNewCustomer.dob,
        gender: formData.gender || mockNewCustomer.gender,
        maritalStatus: formData.maritalStatus || mockNewCustomer.maritalStatus
      });
      setTimeout(() => {
        setCurrentStep(1);
      }, 1500);
    }, 1500);
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
    setSelectedInvestmentAction(null);
    setTargetedInvestmentId('');
    setSelectedPlan('NOLT Rise');
    setAmount('500000');
    setTenure('6');
    setInterestRate(12.0);
    setRolloverOption('Principal & Interest');
    setPaymentSource('CASA - Not Linked');
    setDocumentFile(null);
    setDocumentName('');
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

  const getCustomerInvestments = () => {
    if (!customerData) return [];
    const staticInvestments = customerData.investments || [];
    const dynamicInvestments = requests
      ? requests
          .filter(
            (r) =>
              r.type === 'Investment' &&
              (r.applicant?.bvn === customerData.bvn ||
                r.applicant?.name?.toLowerCase() === `${customerData.firstName} ${customerData.lastName}`.toLowerCase())
          )
          .map((r) => ({
            id: r.referenceId.replace('#', ''),
            product: r.selectedPlan ? r.selectedPlan.toUpperCase() : 'NOLT RISE',
            principal: parseFloat((r.amount || '').replace(/[^0-9.]/g, '')) || 0,
            valueDate: r.dateSubmitted,
            tenure: r.tenure || '6 Months',
            status: r.status === 'Approved' ? 'Active' : 'Pending'
          }))
      : [];

    const all = [...staticInvestments];
    dynamicInvestments.forEach(dyn => {
      if (!all.some(item => item.id === dyn.id)) {
        all.push(dyn);
      }
    });

    return all;
  };

  const calculateInterest = () => {
    const amt = parseFloat(amount) || 0;
    const t = parseFloat(tenure) || 0;
    const r = interestRate / 100;
    return (amt * r * t) / 12;
  };

  const calculateWht = () => {
    // 10% withholding tax on interest in Nigeria
    return calculateInterest() * 0.10;
  };

  const handleFinalSubmission = () => {
    if (!customerData) return;

    const principalAmount = parseFloat(amount) || 0;
    const computedInt = calculateInterest();
    const computedWht = calculateWht();
    
    const isBackOffice = bookingChannel === 'Back Office';
    const mandateNo = isBackOffice ? `BO-MND-${Math.floor(10000 + Math.random() * 90000)}` : undefined;
    const randomReqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomRefId = isBackOffice 
      ? `BO-INV-${Math.floor(5000 + Math.random() * 4999)}`
      : `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const applicantObj: Applicant = {
      name: `${customerData.firstName} ${customerData.middleName ? customerData.middleName + ' ' : ''}${customerData.lastName}`,
      email: customerData.email,
      avatar: `https://picsum.photos/seed/${customerData.firstName}${customerData.lastName}/100/100`,
      gender: customerData.gender,
      dateOfBirth: customerData.dob,
      maritalStatus: customerData.maritalStatus,
      phone: customerData.phone,
      bvn: customerData.bvn,
      stateOfResidence: 'Lagos',
      address: customerData.address,
      isPep: false
    };

    const isTopUp = selectedInvestmentAction === 'topup' && targetedInvestmentId;

    const agentDays = parseInt(tenure, 10) * 30;
    const commCalc = (!isBackOffice && isAgentReferral) ? calculateAgentCommission(principalAmount, agentDays) : null;
    const agentName = selectedAgentCode === 'AGT-702' ? 'Tunde Davies' : 'Blessing Okon';
    const agentId = selectedAgentCode === 'AGT-702' ? 'u_agt1' : 'u_agt2';
    const refCode = selectedAgentCode === 'AGT-702' ? 'AGT-TUNDE' : 'AGT-BLESSING';

    const newRequest: ReviewRequest = {
      id: randomReqId,
      referenceId: randomRefId,
      applicant: applicantObj,
      type: 'Investment',
      amount: `₦${principalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
      calculatedInterest: `₦${computedInt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      wht: `₦${computedWht.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      selectedPlan: selectedPlan,
      tenure: `${tenure} Months`,
      rolloverOption: rolloverOption,
      paymentSource: isBackOffice ? 'Direct Wire / RTGS Settlement' : paymentSource,
      isBackOfficeInvestment: isBackOffice,
      bookingChannel: bookingChannel,
      branchOffice: isBackOffice ? branchOffice : undefined,
      relationshipManager: isBackOffice ? relationshipManager : undefined,
      mandateNumber: mandateNo,
      isAgentReferral: !isBackOffice && isAgentReferral,
      agentId: (!isBackOffice && isAgentReferral) ? agentId : undefined,
      agentName: (!isBackOffice && isAgentReferral) ? agentName : undefined,
      agentCode: (!isBackOffice && isAgentReferral) ? selectedAgentCode : undefined,
      referralCodeUsed: (!isBackOffice && isAgentReferral) ? refCode : undefined,
      agentReferralUrl: (!isBackOffice && isAgentReferral) ? `https://nolt.finance/invest?ref=${refCode}` : undefined,
      agentCommissionRate: (!isBackOffice && isAgentReferral) ? commCalc?.commissionPercent : undefined,
      agentCommissionAmount: (!isBackOffice && isAgentReferral) ? commCalc?.commissionAmount : undefined,
      agentCommissionStatus: (!isBackOffice && isAgentReferral) ? 'Pending' : undefined,
      currentNodeIndex: 1,
      operationLogs: [
        {
          id: `op-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: currentUser.name,
          action: isTopUp ? 'TOP_UP' : isBackOffice ? 'BACK_OFFICE_ORIGINATION' : isAgentReferral ? 'AGENT_INVESTMENT_SUBMISSION' : 'SUBMISSION',
          comment: isTopUp 
            ? `Top-Up of active investment ${targetedInvestmentId} with amount ₦${principalAmount.toLocaleString()}. Plan: ${selectedPlan}, Option: ${rolloverOption}`
            : isBackOffice
            ? `Back Office investment booked by RM ${relationshipManager} at ${branchOffice}. Mandate: ${mandateNo}. Plan: ${selectedPlan}`
            : isAgentReferral
            ? `New Investment created via Agent referral (${agentName} · ${selectedAgentCode}). Matched commission: ${commCalc?.commissionPercent}% (₦${commCalc?.commissionAmount.toLocaleString()})`
            : `New Investment application initiated via Admin portal. Plan: ${selectedPlan}, Option: ${rolloverOption}`
        }
      ]
    };

    if (onAddRequest) {
      onAddRequest(newRequest);
    }
    
    alert(`Successfully generated Investment Certificate Application ${randomRefId} under "Pending Review"!`);
    resetModal();
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {STEPS.map((step, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2 relative flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
            currentStep === idx 
              ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110' 
              : currentStep > idx 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          }`}>
            {currentStep > idx ? <span className="material-symbols-outlined text-sm">check</span> : idx + 1}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest text-center hidden md:block ${
            currentStep === idx ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
          }`}>{step}</span>
          {idx < STEPS.length - 1 && (
            <div className={`absolute top-4 left-[64%] w-[70%] h-[2.5px] -z-10 bg-slate-100 dark:bg-slate-850`} style={{ right: '50%' }}>
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
        className="bg-white dark:bg-surface-dark rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden relative my-auto border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
            New Investment Application
          </h3>
          <button 
            onClick={() => { resetModal(); onClose(); }}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-450 hover:text-rose-500 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6">
          {renderStepIndicator()}

          <div className="min-h-[350px]">
            {currentStep === 0 && (
              <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-500">
                <div className="w-full max-w-sm space-y-6">
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase">Customer Identity Verification</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase">
                      Enter BVN or existing CASA account number to proceed.
                    </p>
                  </div>

                  {/* Lookup Type Toggle */}
                  <div className="flex p-1 bg-slate-100 dark:bg-background-dark rounded-2xl">
                    <button 
                      onClick={() => setLookupType('bvn')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lookupType === 'bvn' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      BVN Lookup
                    </button>
                    <button 
                      onClick={() => setLookupType('casa')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lookupType === 'casa' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
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
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xl font-black tracking-[0.2em] focus:ring-2 focus:ring-primary focus:outline-none transition-all disabled:opacity-50 placeholder:text-slate-300 dark:placeholder:text-slate-700 placeholder:text-sm placeholder:tracking-normal text-slate-800 dark:text-white"
                        />
                      ) : (
                        <input 
                          type="text" 
                          maxLength={10}
                          value={casaAccount}
                          onChange={(e) => setCasaAccount(e.target.value.replace(/\D/g, ''))}
                          disabled={loading || showCreateForm}
                          placeholder="ENTER 10-DIGIT ACCOUNT"
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xl font-black tracking-[0.2em] focus:ring-2 focus:ring-primary focus:outline-none transition-all disabled:opacity-50 placeholder:text-slate-300 dark:placeholder:text-slate-700 placeholder:text-sm placeholder:tracking-normal text-slate-800 dark:text-white"
                        />
                      )}
                    </div>
                    
                    {loading && (
                      <div className="flex items-center justify-center gap-3 py-2 animate-pulse">
                        <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Inquiring Identity on Core Banking...</span>
                      </div>
                    )}

                    {!showCreateForm && !loading && (
                      <button 
                        onClick={handleSearchCustomer}
                        disabled={lookupType === 'bvn' ? bvn.length !== 11 : casaAccount.length !== 10}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
                      >
                        Search Customer Reference
                      </button>
                    )}

                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                      {lookupType === 'bvn' 
                        ? 'BVN Verification via CBS AccountDetailsViewViaBVN'
                        : 'Core Account Audit Link'}
                    </p>
                  </div>

                  <AnimatePresence>
                    {showCreateForm && !customerCreated && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6 pt-6 border-t border-slate-150 dark:border-slate-800"
                      >
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center gap-2 text-amber-600">
                             <span className="material-symbols-outlined text-lg">warning</span>
                             <span className="text-[10px] font-black uppercase">No active CASA found under BVN</span>
                          </div>
                          <p className="text-[10px] font-bold text-amber-600/95 uppercase leading-relaxed">
                            Proceed to register basic information to generate a security CASA identifier.
                          </p>
                        </div>

                        <form onSubmit={handleCreateCustomerSubmit} className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</p>
                            <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</p>
                            <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</p>
                            <input type="text" value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</p>
                            <input required type="tel" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="080XXXXXXXX" className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1 col-span-full">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</p>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1 col-span-full">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</p>
                            <textarea required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none min-h-[60px] text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</p>
                            <input required type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</p>
                            <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase focus:ring-1 focus:ring-primary outline-none text-slate-705 dark:text-slate-200">
                              <option value="">Select...</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <button 
                            type="submit"
                            disabled={creatingCustomer}
                            className="col-span-full py-4 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            {creatingCustomer && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {creatingCustomer ? 'Requesting account creation...' : 'Onboard & Generate Customer Profile'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {customerCreated && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-6 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-inner"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-2xl font-black">check</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Generated identifier check complete</p>
                        <p className="text-xl font-black text-emerald-800 dark:text-white tracking-wider">CASA Account: {customerData?.casaAccountNo || '0081234567'}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && customerData && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-background-dark/30 border border-slate-150 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-xl shadow-inner">
                        {customerData.firstName[0]}{customerData.lastName[0]}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{customerData.firstName} {customerData.lastName}</h4>
                        <p className="text-xs font-mono font-bold text-slate-400 tracking-wider">CBS ID: {customerData.casaAccountNo}</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/25">
                      Verified Account
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 leading-loose">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date of Birth</p>
                      <p className="font-bold text-slate-900 dark:text-white">{customerData.dob}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gender & Marital</p>
                      <p className="font-bold text-slate-900 dark:text-white uppercase">{customerData.gender} • {customerData.maritalStatus}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Linked BVN</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white tracking-widest">••••••••{customerData.bvn.slice(-3)}</p>
                    </div>
                    <div className="col-span-full border-t border-slate-100 dark:border-slate-800 pt-4">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verified Work details / Address</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{customerData.address}</p>
                    </div>
                  </div>
                </div>

                {/* Existing Investments List on CBS */}
                {getCustomerInvestments().length > 0 && (
                  <div className="pt-2 space-y-4">
                    <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest border-l-2 border-primary pl-3">Existing Investments on CBS</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getCustomerInvestments().map((inv: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${inv.status === 'Active' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'bg-slate-200 dark:bg-slate-705 text-slate-500'}`}>
                              <span className="material-symbols-outlined text-[18px]">{inv.status === 'Active' ? 'monetization_on' : 'check_circle'}</span>
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{inv.id} • {inv.product}</p>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">PRINCIPAL: <span className="text-[#0F6E56] dark:text-emerald-400">₦{inv.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
                            </div>
                          </div>
                          {inv.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvestmentAction('topup');
                                setTargetedInvestmentId(inv.id);
                                const prodNorm = inv.product.replace('NOLT ', '').trim();
                                if (prodNorm.includes('RISE')) {
                                  setSelectedPlan('NOLT Rise');
                                  setTenure('6');
                                  setInterestRate(12.0);
                                } else if (prodNorm.includes('VAULT')) {
                                  setSelectedPlan('NOLT Vault');
                                  setTenure('12');
                                  setInterestRate(14.5);
                                } else if (prodNorm.includes('TARGET')) {
                                  setSelectedPlan('NOLT Target');
                                  setTenure('3');
                                  setInterestRate(11.0);
                                }
                                setCurrentStep(2);
                              }}
                              className="px-3 py-1.5 bg-primary hover:bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[12px] font-black">add_circle</span>
                              TOPUP
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest border bg-slate-150 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700">
                              {inv.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    onClick={() => { resetModal(); setCurrentStep(0); }}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Lookup New ID
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedInvestmentAction('fresh');
                      setTargetedInvestmentId('');
                      setCurrentStep(2);
                    }}
                    className="flex-2 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    Proceed with New Application
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left settings */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="investment-plan" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Investment Plan</label>
                      <select 
                        id="investment-plan"
                        value={selectedPlan}
                        onChange={(e) => {
                          const plan = e.target.value as 'NOLT Rise' | 'NOLT Vault' | 'NOLT Target';
                          setSelectedPlan(plan);
                          if (plan === 'NOLT Rise') {
                            setTenure('6');
                            setInterestRate(12.0);
                          } else if (plan === 'NOLT Vault') {
                            setTenure('12');
                            setInterestRate(14.5);
                          } else {
                            setTenure('3');
                            setInterestRate(11.0);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-slate-950 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white h-[42px]"
                      >
                        <option value="NOLT Rise">NOLT Rise (12.0% p.a.)</option>
                        <option value="NOLT Vault">NOLT Vault (14.5% p.a.)</option>
                        <option value="NOLT Target">NOLT Target (11.0% p.a.)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="investment-amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Principal Amount (₦)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₦</span>
                        <input 
                          id="investment-amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="e.g. 500000"
                          className="w-full bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="investment-tenure" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tenure (Months)</label>
                        <select 
                          id="investment-tenure"
                          value={tenure}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTenure(val);
                            // Adjust interest rate as custom simulation rates
                            if (selectedPlan === 'NOLT Vault') {
                              setInterestRate(val === '12' ? 14.5 : val === '24' ? 16.0 : 13.5);
                            } else if (selectedPlan === 'NOLT Rise') {
                              setInterestRate(val === '6' ? 12.0 : 10.5);
                            } else {
                              setInterestRate(val === '3' ? 11.0 : val === '6' ? 11.5 : 12.0);
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="3">3 Months</option>
                          <option value="6">6 Months</option>
                          <option value="12">12 Months</option>
                          <option value="24">24 Months</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="interest-rate-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Yield Rate (% p.a.)</label>
                        <input 
                          id="interest-rate-input"
                          type="number"
                          step="0.1"
                          value={interestRate}
                          onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculator Summary box */}
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <h5 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2 mb-3">Live Yield Estimator</h5>
                      <div className="space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Rate Applied:</span>
                          <span className="text-slate-900 dark:text-white">{interestRate}% Per Annum</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Gross Return:</span>
                          <span className="text-[#0F6E56]">₦{calculateInterest().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Withholding Tax (WHT 10%):</span>
                          <span className="text-rose-500">- ₦{calculateWht().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-primary/10 pt-4 text-center mt-auto">
                      <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider">NET EXPECTED PAYOUT (YIELD)</p>
                      <p className="text-2xl font-black text-primary mt-1">
                        ₦{(calculateInterest() - calculateWht()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="rollover-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rollover Instruction</label>
                    <select 
                      id="rollover-select"
                      value={rolloverOption}
                      onChange={(e) => setRolloverOption(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Principal & Interest">Rollover Principal & Interest</option>
                      <option value="Principal Only">Rollover Principal Only (Payout Interest)</option>
                      <option value="Payout">Payout Principal & Cumulative Interest (No Rollover)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Funding Source (CBA CASA)</label>
                    <div className="w-full bg-slate-50 dark:bg-background-dark/30 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-[#0F6E56] dark:text-emerald-450 flex items-center gap-2 select-none h-[42px]">
                      <span className="material-symbols-outlined text-[16px] font-black text-emerald-500">check_circle</span>
                      <span className="uppercase tracking-wider">CASA - {customerData?.casaAccountNo || '0098765432'} ({customerData?.firstName || 'Olanrewaju'} {customerData?.lastName || 'Alabi'})</span>
                    </div>
                  </div>
                </div>

                {/* Booking Channel & Back Office Desk Selector */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Origination / Booking Channel
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {bookingChannel === 'Back Office' ? 'Branch Desk Booking' : 'Mobile / Digital Booking'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingChannel('Back Office');
                        setIsAgentReferral(false);
                      }}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                        bookingChannel === 'Back Office'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-indigo-500">corporate_fare</span>
                      <div>
                        <p className="text-xs font-black uppercase">Back Office Desk</p>
                        <p className="text-[10px] text-slate-400">Branch & RM Placement</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingChannel('Mobile App')}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                        bookingChannel !== 'Back Office'
                          ? 'bg-primary/10 border-primary text-primary shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-primary">devices</span>
                      <div>
                        <p className="text-xs font-black uppercase">Digital / Mobile App</p>
                        <p className="text-[10px] text-slate-400">Self-Service Portal</p>
                      </div>
                    </button>
                  </div>

                  {bookingChannel === 'Back Office' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Branch Office</label>
                        <select
                          value={branchOffice}
                          onChange={(e) => setBranchOffice(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Head Office (Victoria Island)">Head Office (Victoria Island)</option>
                          <option value="Ikeja Commercial Branch">Ikeja Commercial Branch</option>
                          <option value="Abuja Central Business District">Abuja Central Business District</option>
                          <option value="Port Harcourt Trans-Amadi Desk">Port Harcourt Trans-Amadi Desk</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Relationship Manager</label>
                        <input
                          type="text"
                          value={relationshipManager}
                          onChange={(e) => setRelationshipManager(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="RM Name and Staff ID"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Referral Attribution Settings */}
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:to-transparent border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="agent-ref-toggle"
                        checked={isAgentReferral}
                        onChange={(e) => setIsAgentReferral(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-500 text-base">real_estate_agent</span>
                        Attributed to Agent Referral Link
                      </span>
                    </label>
                    {isAgentReferral && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-xs">
                        Agent Commission Active
                      </span>
                    )}
                  </div>

                  {isAgentReferral && (() => {
                    const days = parseInt(tenure, 10) * 30;
                    const commCalc = calculateAgentCommission(parseFloat(amount) || 0, days);
                    return (
                      <div className="pt-3 space-y-3 border-t border-amber-500/20 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Select Attributed Agent</label>
                            <select
                              value={selectedAgentCode}
                              onChange={(e) => setSelectedAgentCode(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-amber-500/30 dark:border-amber-500/30 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            >
                              <option value="AGT-702">Tunde Davies (AGT-702 · AGT-TUNDE)</option>
                              <option value="AGT-884">Blessing Okon (AGT-884 · AGT-BLESSING)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Agent Referral URL</label>
                            <div className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-amber-500/20 rounded-xl text-[10px] font-mono text-amber-700 dark:text-amber-300 truncate">
                              https://nolt.finance/invest?ref={selectedAgentCode === 'AGT-702' ? 'AGT-TUNDE' : 'AGT-BLESSING'}
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs gap-3">
                          <div>
                            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                              Commission Tier Rule Applied ({days} Days Duration)
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 text-[11px] font-medium mt-0.5">
                              {commCalc.explanation}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {commCalc.commissionPercent.toFixed(1)}% Commission
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                              ₦{commCalc.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setCurrentStep(3)}
                    disabled={parseFloat(amount) <= 0 || !amount}
                    className="flex-2 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Set Funding Receipt
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 dark:bg-background-dark/30 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-[24px] p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase">Upload Client Funding proof</h5>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed uppercase">
                      Drag & drop the payment transfer slip/bank statement, or browse to select the audit receipt file. Maximum size is 5MB.
                    </p>
                  </div>

                  <div>
                    <label className="px-6 py-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:border-primary/50 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm transition-all cursor-pointer inline-block">
                      CHOOSE RECEIPT FILE
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDocumentFile(file);
                            setDocumentName(file.name);
                          }
                        }}
                      />
                    </label>
                    {documentName && (
                      <p className="mt-3 text-xs font-mono font-black text-[#0F6E56] dark:text-emerald-400 truncate max-w-[280px]">
                        📎 {documentName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      if (!documentFile) {
                        alert('A verified payment receipt or transfer slip upload is required to file the investment application.');
                        return;
                      }
                      setCurrentStep(4);
                    }}
                    className="flex-2 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    Proceed with review
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-[24px] p-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-3xl">fact_check</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Review Application Summary</h4>
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Verify and authorize creation of investment principal certificate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-background-dark/30 border border-slate-200/55 dark:border-slate-800/80 rounded-2xl p-5 space-y-3">
                    <h6 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Onboarded Investor</h6>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Applicant Name</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{customerData?.firstName} {customerData?.lastName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Linked ID & Account No</p>
                      <p className="text-sm font-mono font-black text-slate-800 dark:text-slate-300 uppercase">CASA Account: {customerData?.casaAccountNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Target Mobile & Contact</p>
                      <p className="text-sm font-black text-slate-850 dark:text-slate-200">{customerData?.phone} • {customerData?.email}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-background-dark/30 border border-slate-200/55 dark:border-slate-800/80 rounded-2xl p-5 space-y-3">
                    <h6 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Portfolio Definition</h6>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400 uppercase font-bold">Yield Plan:</span>
                      <span className="text-slate-900 dark:text-white uppercase">{selectedPlan}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400 uppercase font-bold">Principal:</span>
                      <span className="text-[#0F6E56]">₦{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400 uppercase font-bold">Tenure Length:</span>
                      <span className="text-slate-900 dark:text-white uppercase">{tenure} Months</span>
                    </div>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400 uppercase font-bold">Rollover Mode:</span>
                      <span className="text-slate-900 dark:text-white uppercase">{rolloverOption}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400 uppercase font-bold">CASA Funding:</span>
                      <span className="text-slate-950 dark:text-slate-300 truncate max-w-[170px] font-mono">{paymentSource}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button onClick={() => setCurrentStep(3)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Back</button>
                  <button onClick={handleFinalSubmission} className="flex-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group">
                    Final Submission
                    <span className="material-symbols-outlined text-[18px] group-hover:scale-125 transition-transform">send</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developer Helper */}
        <div className="bg-slate-50 dark:bg-background-dark/50 border-t border-slate-100 dark:border-slate-800 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">settings</span>
            <span className="text-[9px] font-black text-slate-550 dark:text-slate-450 uppercase tracking-widest">Developer CBS Simulator</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                checked={simulateCASAFound} 
                onChange={() => setSimulateCASAFound(true)} 
                className="w-3 h-3 text-primary focus:ring-primary"
              />
              <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase group-hover:text-primary">Simulate: CASA found</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                checked={!simulateCASAFound} 
                onChange={() => setSimulateCASAFound(false)} 
                className="w-3 h-3 text-primary focus:ring-primary"
              />
              <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase group-hover:text-primary">Simulate: No CASA (onboard)</span>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewInvestmentModal;
