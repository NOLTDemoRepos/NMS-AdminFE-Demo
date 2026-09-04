
import React, { useState, useEffect, useMemo } from 'react';
import { ReviewRequest, UserRole, RequestStatus, InvestmentRate } from '../types';
import ExportFieldsModal from './ExportFieldsModal';
import ApprovalStepper from './ApprovalStepper';
import NewInvestmentModal from './NewInvestmentModal';
import { calculateAgentCommission } from '../services/agentCommissionService';

interface InvestmentViewProps {
  requests: ReviewRequest[];
  onBack: () => void;
  selectedId?: string | null;
  onClearSelection?: () => void;
  currentUser: { name: string, role: UserRole, avatar: string };
  onUpdateIndemnity?: (requestId: string, url: string) => void;
  onUpdateRequest?: (updatedReq: ReviewRequest) => void;
  onAddRequest?: (newReq: ReviewRequest) => void;
  subView?: 'dashboard' | 'mobile' | 'backoffice';
}

const INITIAL_RATES: InvestmentRate[] = [
  { id: '1', planName: 'NOLT Vault', minAmount: 100000, maxAmount: 5000000, currency: 'NGN', tenureMonths: 12, interestRate: 14.5, status: 'Active', lastUpdated: '2023-10-20' },
  { id: '2', planName: 'NOLT Vault', minAmount: 5000001, maxAmount: 20000000, currency: 'NGN', tenureMonths: 12, interestRate: 16.0, status: 'Active', lastUpdated: '2023-10-20' },
  { id: '3', planName: 'NOLT Rise', minAmount: 50000, maxAmount: 1000000, currency: 'NGN', tenureMonths: 6, interestRate: 12.0, status: 'Active', lastUpdated: '2023-10-21' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  'NGN': '₦',
  'USD': '$',
  'GBP': '£',
  'EUR': '€'
};

const InvestmentView: React.FC<InvestmentViewProps> = ({ requests, onBack, selectedId, onClearSelection, currentUser, onUpdateIndemnity, onUpdateRequest, onAddRequest, subView }) => {
  const [selectedInvestment, setSelectedInvestment] = useState<ReviewRequest | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'rates'>('applications');
  const [rates, setRates] = useState<InvestmentRate[]>(INITIAL_RATES);
  const [editingRate, setEditingRate] = useState<InvestmentRate | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['IDENTITY BASICS']));
  const [showBvn, setShowBvn] = useState(false);
  const [showNin, setShowNin] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isNewInvestmentModalOpen, setIsNewInvestmentModalOpen] = useState(false);
  const [isEditingFinance, setIsEditingFinance] = useState(false);
  const [financeFields, setFinanceFields] = useState({
    calculatedInterest: '',
    wht: ''
  });
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnStage, setReturnStage] = useState('Pending Review');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'agent' | 'direct'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const isBackOfficeInvestment = (req: ReviewRequest) => {
    return Boolean(
      req.isBackOfficeInvestment || 
      req.bookingChannel === 'Back Office' || 
      (req.referenceId && req.referenceId.startsWith('#BO-')) ||
      (req.id && req.id.startsWith('bo-'))
    );
  };

  const handleApprove = () => {
    if (!selectedInvestment) return;
    let nextStatus: RequestStatus = 'Approved';
    const currentStatus = selectedInvestment.status;

    if (selectedInvestment.type === 'Liquidation') {
      if (currentStatus === 'Pending Review') nextStatus = 'Docs Verification';
      else if (currentStatus === 'Docs Verification') nextStatus = 'Internal Audit';
      else if (currentStatus === 'Internal Audit') nextStatus = 'Pending Disbursement';
      else if (currentStatus === 'Pending Disbursement') nextStatus = 'Approved';
    } else {
      if (currentStatus === 'Pending Review') nextStatus = 'Docs Verification';
      else if (currentStatus === 'Docs Verification') nextStatus = 'Internal Audit';
      else if (currentStatus === 'Internal Audit' || currentStatus === 'Pending Disbursement') nextStatus = 'Approved';
    }

    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: 'APPROVE',
      comment: `Approved request to stage: ${nextStatus}`
    };

    const updated: ReviewRequest = {
      ...selectedInvestment,
      status: nextStatus,
      operationLogs: [newLog, ...(selectedInvestment.operationLogs || [])]
    };

    if (onUpdateRequest) {
      onUpdateRequest(updated);
    }
    setSelectedInvestment(updated);
    setToastMessage({
      text: `Investment #${selectedInvestment.referenceId} approved to ${nextStatus}.`,
      type: 'success'
    });
  };

  const investmentRequests = useMemo(() => {
    return requests.filter(req => {
      if (req.type !== 'Investment' && req.type !== 'Liquidation') return false;
      if (subView === 'backoffice') {
        return isBackOfficeInvestment(req);
      }
      if (subView === 'mobile') {
        return !isBackOfficeInvestment(req);
      }
      return true;
    });
  }, [requests, subView]);

  useEffect(() => {
    if (selectedId) {
      const found = investmentRequests.find(r => r.id === selectedId);
      if (found) {
        setSelectedInvestment(found);
        setFinanceFields({
          calculatedInterest: found.calculatedInterest || '₦10.50',
          wht: found.wht || '₦1.05'
        });
        setActiveTab('applications');
      }
    } else {
      setSelectedInvestment(null);
    }
  }, [selectedId, investmentRequests]);

  const isAgentInvestment = (req: ReviewRequest) => {
    return Boolean(
      req.isAgentReferral || 
      (req.referralCodeUsed && req.referralCodeUsed.toUpperCase().startsWith('AGT-')) || 
      req.agentCode ||
      req.agentId
    );
  };

  const agentCounts = useMemo(() => {
    const total = investmentRequests.length;
    const agent = investmentRequests.filter(isAgentInvestment).length;
    const direct = total - agent;
    return { total, agent, direct };
  }, [investmentRequests]);

  const filteredInvestments = useMemo(() => {
    return investmentRequests.filter(req => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        req.applicant.name.toLowerCase().includes(term) ||
        req.referenceId.toLowerCase().includes(term) ||
        (req.selectedPlan && req.selectedPlan.toLowerCase().includes(term)) ||
        (req.agentName && req.agentName.toLowerCase().includes(term)) ||
        (req.agentCode && req.agentCode.toLowerCase().includes(term)) ||
        (req.referralCodeUsed && req.referralCodeUsed.toLowerCase().includes(term)) ||
        (req.branchOffice && req.branchOffice.toLowerCase().includes(term)) ||
        (req.relationshipManager && req.relationshipManager.toLowerCase().includes(term)) ||
        (req.mandateNumber && req.mandateNumber.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      if (subView === 'backoffice') {
        if (selectedBranch !== 'all') {
          const b = (req.branchOffice || '').toLowerCase();
          if (!b.includes(selectedBranch.toLowerCase())) return false;
        }
        return true;
      }

      const isAgent = isAgentInvestment(req);
      if (sourceFilter === 'agent') return isAgent;
      if (sourceFilter === 'direct') return !isAgent;
      return true;
    });
  }, [investmentRequests, searchTerm, sourceFilter, subView, selectedBranch]);

  const toggleSection = (id: string) => {
    const next = new Set(openSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenSections(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedInvestment && onUpdateIndemnity) {
      // Mock upload - in real app we'd upload to storage and get URL
      const mockUrl = URL.createObjectURL(file);
      onUpdateIndemnity(selectedInvestment.id, mockUrl);
    }
  };

  const Section = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => {
    const isOpen = openSections.has(title);
    return (
      <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-4">
        <button onClick={() => toggleSection(title)} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">{icon}</span>
            <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h5>
          </div>
          <span className={`material-symbols-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {isOpen && <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">{children}</div>}
      </div>
    );
  };

  const Field = ({ label, value }: { label: string, value: any }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">{value || '—'}</p>
    </div>
  );

  const SensitiveField = ({ label, value, show, onToggle, verified, onVerifyClick }: { label: string, value: string, show: boolean, onToggle: () => void, verified?: boolean, onVerifyClick?: () => void }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        {verified && (
          <button 
            onClick={onVerifyClick}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500/20 transition-colors group"
            title="Verification Success - Click for details"
          >
            <span className="material-symbols-outlined text-[14px] font-black">verified</span>
            <span className="text-[8px] font-black uppercase tracking-tighter hidden group-hover:inline">Verified</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide font-mono">
          {show ? value : '●●●●●●●●●●●'}
        </p>
        <button 
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );

  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    
    const isNew = !rates.find(r => r.id === editingRate.id);
    
    if (isNew) {
      setRates(prev => [...prev, { ...editingRate, lastUpdated: new Date().toISOString().split('T')[0] }]);
    } else {
      setRates(prev => prev.map(r => r.id === editingRate.id ? { ...editingRate, lastUpdated: new Date().toISOString().split('T')[0] } : r));
    }
    setEditingRate(null);
  };

  const handleAddNewRate = () => {
    const newRate: InvestmentRate = {
      id: Math.random().toString(36).substr(2, 9),
      planName: 'NOLT Vault',
      minAmount: 0,
      maxAmount: 0,
      currency: 'NGN',
      tenureMonths: 12,
      interestRate: 10,
      status: 'Active',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setEditingRate(newRate);
  };

  const handleDuplicateRate = (rate: InvestmentRate) => {
    const duplicatedRate: InvestmentRate = {
      ...rate,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setRates(prev => [...prev, duplicatedRate]);
  };

  const handleDeleteRate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this rate?')) {
      setRates(prev => prev.filter(r => r.id !== id));
      if (editingRate?.id === id) {
        setEditingRate(null);
      }
    }
  };

  const isFinance = currentUser.role === 'Finance' || currentUser.role === 'Super Admin';

  if (selectedInvestment) {
    const inv = selectedInvestment;
    const app = inv.applicant;
    
    return (
      <div className="max-w-[1600px] mx-auto pb-20 px-4 md:px-8">
        {/* Header Area */}
        <div className="flex items-center gap-6 mb-10">
          <button 
            onClick={() => { setSelectedInvestment(null); onClearSelection?.(); }} 
            className="w-12 h-12 rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{inv.referenceId}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                inv.status === 'Approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
              }`}>
                {inv.status === 'Approved' ? 'ACTIVE' : inv.status.toUpperCase()}
              </span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{app.name}</h2>
          </div>
        </div>

        {/* Stepper Card */}
        <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm py-2 mb-10">
           <ApprovalStepper status={inv.status} type={inv.type} amount={inv.amount} />
        </div>

        {/* Summary Bar */}
        <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-50 dark:border-slate-800 shadow-sm p-10 mb-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">INVESTMENT PLAN</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{inv.selectedPlan || 'NOLT SURGE'}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PRINCIPAL AMOUNT</p>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md hover:bg-emerald-500/20 transition-colors group"
              >
                <span className="material-symbols-outlined text-[12px] font-black">verified</span>
                <span className="text-[8px] font-black uppercase tracking-tighter">Payment Verified</span>
              </button>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{inv.amount}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TENURE</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{inv.tenure || '12 Months'}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">INTEREST RATE</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tight">5.40% P.A</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {isAgentInvestment(inv) && (() => {
              const commissionCalc = calculateAgentCommission(inv.amount, inv.tenure || '30 days');
              const effectiveRate = inv.agentCommissionRate ?? commissionCalc.commissionPercent;
              const effectiveAmount = inv.agentCommissionAmount ?? commissionCalc.commissionAmount;
              const commissionStatus = inv.agentCommissionStatus || 'Pending';

              return (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-amber-900/10 dark:to-transparent border-2 border-amber-500/30 dark:border-amber-500/30 rounded-[28px] p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-3xl font-black">real_estate_agent</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-xs">
                            AGENT REFERRAL LINK
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            commissionStatus === 'Paid' 
                              ? 'bg-emerald-500 text-white' 
                              : commissionStatus === 'Approved' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}>
                            Commission {commissionStatus}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
                          Attributed to Agent: {inv.agentName || 'Tunde Davies'}
                        </h3>
                      </div>
                    </div>

                    {(currentUser.role === 'Super Admin' || currentUser.role === 'Finance') && (
                      <div className="flex items-center gap-2">
                        {commissionStatus !== 'Approved' && commissionStatus !== 'Paid' && (
                          <button
                            onClick={() => {
                              const calc = calculateAgentCommission(inv.amount, inv.tenure || '30 days');
                              const updated: ReviewRequest = {
                                ...inv,
                                agentCommissionStatus: 'Approved',
                                agentCommissionRate: effectiveRate,
                                agentCommissionAmount: effectiveAmount,
                                operationLogs: [
                                  {
                                    id: `log-${Date.now()}`,
                                    timestamp: new Date().toLocaleString(),
                                    actor: currentUser.name,
                                    action: 'COMMISSION APPROVED',
                                    comment: `Commission of ₦${effectiveAmount.toLocaleString()} (${effectiveRate}%) approved for Agent ${inv.agentName || 'Tunde Davies'}.`
                                  },
                                  ...(inv.operationLogs || [])
                                ]
                              };
                              onUpdateRequest?.(updated);
                              setSelectedInvestment(updated);
                              setToastMessage({ text: 'Agent commission approved.', type: 'success' });
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs"
                          >
                            Approve Commission
                          </button>
                        )}
                        {commissionStatus !== 'Paid' && (
                          <button
                            onClick={() => {
                              const updated: ReviewRequest = {
                                ...inv,
                                agentCommissionStatus: 'Paid',
                                agentCommissionRate: effectiveRate,
                                agentCommissionAmount: effectiveAmount,
                                operationLogs: [
                                  {
                                    id: `log-${Date.now()}`,
                                    timestamp: new Date().toLocaleString(),
                                    actor: currentUser.name,
                                    action: 'COMMISSION DISBURSED',
                                    comment: `Commission of ₦${effectiveAmount.toLocaleString()} disbursed to Agent ${inv.agentName || 'Tunde Davies'}.`
                                  },
                                  ...(inv.operationLogs || [])
                                ]
                              };
                              onUpdateRequest?.(updated);
                              setSelectedInvestment(updated);
                              setToastMessage({ text: 'Agent commission marked as Paid.', type: 'success' });
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs"
                          >
                            Disburse / Mark Paid
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-amber-500/20">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agent Code / Ref URL</p>
                      <p className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 mt-1 truncate">
                        {inv.agentCode || inv.referralCodeUsed || 'AGT-702'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {inv.agentReferralUrl || `nolt.finance/invest?ref=${inv.agentCode || 'AGT-TUNDE'}`}
                      </p>
                    </div>

                    <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-amber-500/20">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mapped Tier & Tenure</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                        {inv.tenure || '30 Days'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {commissionCalc.matchedTier?.name || 'Standard Tier'}
                      </p>
                    </div>

                    <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-amber-500/20">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commission Rate</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {effectiveRate.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        of {inv.amount}
                      </p>
                    </div>

                    <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-amber-500/20">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payable Commission</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        ₦{effectiveAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        GL: 501002 - Brokerage Expense
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-amber-500/10 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-base">info</span>
                    <span>
                      <strong>Settings Rule Applied:</strong> {commissionCalc.explanation}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Back Office Origination & Desk Details Card */}
            {(inv.isBackOfficeInvestment || inv.bookingChannel === 'Back Office' || (inv.referenceId && inv.referenceId.startsWith('#BO-'))) && (
              <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 dark:from-indigo-950/20 dark:via-surface-dark dark:to-purple-950/20 rounded-[28px] border border-indigo-200/80 dark:border-indigo-800/40 p-6 space-y-5 shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                      <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          Back Office Origination
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          Branch Desk
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mt-0.5">
                        {inv.branchOffice || 'Head Office (Victoria Island)'}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      Mandate Ref:
                    </span>
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {inv.mandateNumber || 'BO-MND-84910'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-indigo-500/20">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relationship Manager</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                      {inv.relationshipManager || 'Chioma Adebayo (RM-042)'}
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                      Private Wealth & Treasury
                    </p>
                  </div>

                  <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-indigo-500/20">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Booking Channel</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                      Physical Branch / Mandate
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Direct Treasury Booking
                    </p>
                  </div>

                  <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-indigo-500/20">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settlement Route</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-1 truncate">
                      {inv.paymentSource || 'RTGS Settlement'}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                      Settlement Cleared
                    </p>
                  </div>

                  <div className="p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-indigo-500/20">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deposit Certificate</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">Active Cert</span>
                    </div>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                      Series III Fixed Term
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-indigo-900 dark:text-indigo-200 bg-indigo-500/10 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 text-base">domain</span>
                    <span>
                      <strong>Back Office Placement:</strong> Initiated via branch institutional desk with verified client mandate form and signed term sheet.
                    </span>
                  </div>
                  <button 
                    onClick={() => setToastMessage({ text: 'Downloading Term Deposit Certificate (PDF)...', type: 'success' })}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap self-start sm:self-auto shadow-xs"
                  >
                    View Certificate
                  </button>
                </div>
              </div>
            )}

            <Section title="PERSONAL & CONTACT DATA" icon="person">
              <Field label="FULL NAME" value={app.name} />
              <Field label="GENDER" value={app.gender || 'Male'} />
              <Field label="DATE OF BIRTH" value={app.dateOfBirth || '27/01/1992'} />
              <Field label="EMAIL ADDRESS" value={app.email} />
              <Field label="PHONE NUMBER" value={app.phone} />
              <Field label="MOTHER'S MAIDEN NAME" value={app.mothersMaidenName || 'Ada'} />
              <Field label="RELIGION" value={app.religion || 'Prefer not to say'} />
              <Field label="MARITAL STATUS" value={app.maritalStatus || 'Single'} />
              <SensitiveField 
                label="BVN" 
                value={app.bvn || '22233344455'} 
                show={showBvn} 
                onToggle={() => setShowBvn(!showBvn)}
                verified
                onVerifyClick={() => setShowVerificationModal(true)}
              />
              <SensitiveField 
                label="NIN" 
                value={app.nin || '11122233344'} 
                show={showNin} 
                onToggle={() => setShowNin(!showNin)}
              />
            </Section>

            <Section title="ADDRESS DETAILS" icon="location_on">
              <Field label="HOME ADDRESS" value={app.address} />
            </Section>

            <Section title="INDEMNITY FORM" icon="draw">
              <div className="col-span-full">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${inv.isIndemnitySigned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[28px]">{inv.isIndemnitySigned ? 'verified' : 'pending'}</span>
                    </div>
                    <div>
                      <h6 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        {inv.isIndemnitySigned ? 'Indemnity Form Signed' : 'Indemnity Form Pending'}
                      </h6>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        {inv.isIndemnitySigned ? 'Customer has electronically signed the indemnity' : 'Awaiting customer signature on the portal'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.isIndemnitySigned && inv.indemnityFormUrl && (
                      <a 
                        href={inv.indemnityFormUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                      >
                        View Signed Form
                      </a>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      {inv.isIndemnitySigned ? 'Re-upload Form' : 'Upload Signed Form'}
                    </button>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          <div className="space-y-8">
            {/* Application Info Card */}
            <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm p-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                </div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">APPLICATION INFO</h4>
              </div>

              <div className="space-y-6">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Status Tracking</h3>
                
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Submission Date</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">27/03/2026</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Stage</p>
                    <p className="text-sm font-black text-primary uppercase">{inv.status === 'Approved' ? 'ACTIVE' : inv.status.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">27/03/2026</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Maturity Date</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">22/03/2027</p>
                  </div>

                  {/* Calculated Interest & WHT - Editable by Finance */}
                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between group">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Calculated Interest</p>
                      {isFinance && isEditingFinance ? (
                        <input 
                          type="text"
                          value={financeFields.calculatedInterest}
                          onChange={(e) => setFinanceFields(prev => ({ ...prev, calculatedInterest: e.target.value }))}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-right"
                        />
                      ) : (
                        <p className="text-sm font-black text-emerald-500">{financeFields.calculatedInterest}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">WHT (10%)</p>
                      {isFinance && isEditingFinance ? (
                        <input 
                          type="text"
                          value={financeFields.wht}
                          onChange={(e) => setFinanceFields(prev => ({ ...prev, wht: e.target.value }))}
                          className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-right"
                        />
                      ) : (
                        <p className="text-sm font-black text-rose-500">{financeFields.wht}</p>
                      )}
                    </div>

                    {isFinance && (
                      <button 
                        onClick={() => setIsEditingFinance(!isEditingFinance)}
                        className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl border border-dashed border-slate-200 dark:border-slate-700"
                      >
                        {isEditingFinance ? 'CONFIRM CHANGES' : 'MODIFY CALCULATIONS'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm p-10 space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">ACTION REQUIRED</p>
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-tight">
                {inv.type === 'Liquidation' ? (
                  inv.status === 'Pending Review' ? 'CX Team Review' :
                  inv.status === 'Docs Verification' ? 'Compliance Check' :
                  inv.status === 'Internal Audit' ? 'MD Approval' :
                  inv.status === 'Pending Disbursement' ? 'Finance Payout' :
                  inv.status === 'Approved' ? 'Liquidation Completed' : 'Liquidation Review'
                ) : (
                  inv.status === 'Pending Review' ? 'CX Review' : 
                  inv.status === 'Docs Verification' ? 'Compliance Check' :
                  inv.status === 'Internal Audit' || inv.status === 'Pending Disbursement' ? 'Finance Approval' :
                  inv.status === 'Approved' ? 'Investment Active' : 'Verification Check'
                )}
              </h4>
              <button 
                onClick={handleApprove}
                className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95"
              >
                {inv.type === 'Liquidation' ? (
                  inv.status === 'Pending Review' ? 'APPROVE TO COMPLIANCE' :
                  inv.status === 'Docs Verification' ? (
                    Number(inv.amount.replace(/[^0-9.-]+/g, "")) > 1000000 ? 'APPROVE TO MD' : 'APPROVE TO FINANCE'
                  ) :
                  inv.status === 'Internal Audit' ? 'APPROVE TO FINANCE' :
                  inv.status === 'Pending Disbursement' ? 'CONFIRM PAYOUT' :
                  inv.status === 'Approved' ? 'VIEW RECEIPT' : 'APPROVE LIQUIDATION'
                ) : (
                  inv.status === 'Pending Review' ? 'APPROVE TO COMPLIANCE' : 
                  inv.status === 'Docs Verification' ? 'APPROVE TO FINANCE' :
                  inv.status === 'Internal Audit' || inv.status === 'Pending Disbursement' ? 'ISSUE CERTIFICATE' :
                  inv.status === 'Approved' ? 'VIEW CERTIFICATE' : 'APPROVE & ISSUE'
                )}
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setReturnReason('');
                    setIsReturnConfirmOpen(true);
                  }}
                  className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <span className="material-symbols-outlined text-[14px]">undo</span>
                  RETURN
                </button>
                <button 
                  onClick={() => {
                    setRejectReason('');
                    setIsRejectConfirmOpen(true);
                  }}
                  className="w-full py-4 bg-rose-50 dark:bg-rose-900/10 text-rose-500 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/30"
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                  REJECT
                </button>
              </div>
            </div>
          </div>
        </div>

        {showVerificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowVerificationModal(false)}></div>
            <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Verification Evidence</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">NIBSS Verification Result</p>
                  </div>
                </div>
                <button onClick={() => setShowVerificationModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VERIFIED NAME</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{app.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BVN NUMBER</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{app.bvn || '22233344455'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VERIFICATION DATE</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{inv.dateSubmitted}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS</p>
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                      <span className="text-xs font-black uppercase tracking-widest">SUCCESSFUL</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">DOCUMENT EVIDENCE</p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-300 text-3xl">description</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase">NIBSS_Verification_Report.pdf</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">245 KB • PDF Document</p>
                      <button className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Download Report</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl hover:bg-slate-800 transition-all"
                >
                  CLOSE DETAILS
                </button>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
            <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Payment Details</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Verified Transaction Evidence</p>
                  </div>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOURCE OF PAYMENT</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{inv.paymentSource || 'Bank Transfer - GTBank (****1234)'}</p>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">UPLOADED RECEIPT</p>
                  <div className="space-y-4">
                    <div className="aspect-[3/4] w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                      <img 
                        src={inv.transferReceiptUrl || 'https://placehold.co/400x600?text=Transfer+Receipt'} 
                        alt="Payment Receipt" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">View Full Size</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Receipt_#{inv.referenceId.replace('#', '')}.jpg</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Image File • 1.2 MB</p>
                      </div>
                      <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Download</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl hover:bg-slate-800 transition-all"
                >
                  CLOSE DETAILS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Confirmation Modal */}
        {isReturnConfirmOpen && selectedInvestment && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">undo</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Return</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">{selectedInvestment.type} {selectedInvestment.referenceId} • {selectedInvestment.applicant.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">info</span>
                  Rollback Review Workflow
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                  Returning this {selectedInvestment.type.toLowerCase()} request will send it back to the selected stage for amendment, recalculation, or document re-verification.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Return Target Stage <span className="text-primary">*</span>
                  </label>
                  <select 
                    value={returnStage}
                    onChange={(e) => setReturnStage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-black uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Pending Review">Pending Review (CX Review)</option>
                    <option value="Docs Verification">Docs Verification (Compliance Check)</option>
                    <option value="Returned">Returned (Customer / Originator)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Return Reason / Audit Note <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Specify return reason (e.g. proof of payment mismatch, incorrect tenor selected, WHT discrepancy)..."
                    className="w-full h-28 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnConfirmOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetStatus: RequestStatus = returnStage === 'Docs Verification' ? 'Docs Verification' : returnStage === 'Returned' ? 'Returned' : 'Pending Review';
                    const reason = returnReason || `Returned to stage: ${returnStage}`;
                    
                    const newLog = {
                      id: Math.random().toString(36).substring(7),
                      timestamp: new Date().toISOString(),
                      actor: currentUser.name,
                      action: 'RETURN',
                      comment: `Request returned to '${returnStage}'. Note: ${reason}`
                    };

                    const updated: ReviewRequest = {
                      ...selectedInvestment,
                      status: targetStatus,
                      approvalComment: reason,
                      operationLogs: [newLog, ...(selectedInvestment.operationLogs || [])]
                    };

                    if (onUpdateRequest) {
                      onUpdateRequest(updated);
                    }
                    setSelectedInvestment(updated);
                    setIsReturnConfirmOpen(false);
                    setReturnReason('');
                    setToastMessage({
                      text: `Request #${selectedInvestment.referenceId} returned to ${returnStage}.`,
                      type: 'warning'
                    });
                  }}
                  className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">undo</span>
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {isRejectConfirmOpen && selectedInvestment && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">cancel</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Rejection</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">{selectedInvestment.type} {selectedInvestment.referenceId} • {selectedInvestment.applicant.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-black uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Decline Request
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
                  Rejecting this request will mark its status as <span className="font-black text-rose-600 dark:text-rose-400">Declined</span> and log the rejection details permanently in the audit trail.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Rejection Reason / Audit Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State the justification for rejection (e.g. unverified payment funds, fraudulent identification, liquidation terms not met)..."
                  className="w-full h-28 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectConfirmOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reason = rejectReason || 'Request rejected during investment review.';
                    const newLog = {
                      id: Math.random().toString(36).substring(7),
                      timestamp: new Date().toISOString(),
                      actor: currentUser.name,
                      action: 'REJECT',
                      comment: `Request rejected. Reason: ${reason}`
                    };

                    const updated: ReviewRequest = {
                      ...selectedInvestment,
                      status: 'Declined',
                      approvalComment: reason,
                      operationLogs: [newLog, ...(selectedInvestment.operationLogs || [])]
                    };

                    if (onUpdateRequest) {
                      onUpdateRequest(updated);
                    }
                    setSelectedInvestment(updated);
                    setIsRejectConfirmOpen(false);
                    setRejectReason('');
                    setToastMessage({
                      text: `Request #${selectedInvestment.referenceId} has been declined.`,
                      type: 'warning'
                    });
                  }}
                  className="flex-1 py-3.5 bg-rose-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Container */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[200] max-w-md animate-in slide-in-from-bottom-5 duration-200">
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {toastMessage.type === 'error' ? 'error' : toastMessage.type === 'warning' ? 'warning' : 'check_circle'}
              </span>
              <p className="text-xs font-bold leading-tight flex-1">{toastMessage.text}</p>
              <button
                onClick={() => setToastMessage(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {subView === 'dashboard' 
              ? 'Investments Dashboard' 
              : subView === 'mobile' 
              ? 'Mobile App Investments' 
              : subView === 'backoffice'
              ? 'Back Office Investments'
              : 'Investments'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-0.5">
            {subView === 'dashboard'
              ? 'Investment performance overview, active portfolios and rate configurations.'
              : subView === 'mobile'
              ? 'Investment subscriptions originated from NOLT Mobile App.'
              : subView === 'backoffice'
              ? 'Institutional, Corporate Treasury, and HNI investments booked via branch back-office desks and Relationship Managers.'
              : 'Portfolio management and fixed income subscription processing.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isFinance && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'applications' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Applications
              </button>
              <button 
                onClick={() => setActiveTab('rates')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rates' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Rate Guide
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsNewInvestmentModalOpen(true)}
            className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/25 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px] font-black">add_circle</span>
            New Investment
          </button>
        </div>
      </div>

      {subView === 'backoffice' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Booked Volume</span>
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 material-symbols-outlined text-lg">account_balance</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₦{filteredInvestments.reduce((sum, r) => sum + (parseFloat(String(r.amount).replace(/[₦$,\s]/g, '')) || 0), 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Active HNI & Corporate Treasury</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Back Office Portfolios</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 material-symbols-outlined text-lg">folder_shared</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {filteredInvestments.length} Active Records
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>{filteredInvestments.filter(r => r.status === 'Approved').length} Approved · {filteredInvestments.filter(r => r.status !== 'Approved').length} In Clearance</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Origination Desks</span>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 material-symbols-outlined text-lg">corporate_fare</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              4 Regional Hubs
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary truncate">
              <span>VI Head Office, Ikeja, Abuja, PH</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Average Placement</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 material-symbols-outlined text-lg">payments</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {filteredInvestments.length > 0
                ? `₦${Math.round(filteredInvestments.reduce((sum, r) => sum + (parseFloat(String(r.amount).replace(/[₦$,\s]/g, '')) || 0), 0) / filteredInvestments.length).toLocaleString()}`
                : '₦0'}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>Fixed Term Deposit Certs</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applications' ? (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filter Tabs */}
          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {subView === 'backoffice' ? (
                <>
                  <button
                    onClick={() => setSelectedBranch('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                      selectedBranch === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>All Desks</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedBranch === 'all'
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {investmentRequests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedBranch('Head Office')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                      selectedBranch === 'Head Office'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">corporate_fare</span>
                    <span>Head Office VI</span>
                  </button>

                  <button
                    onClick={() => setSelectedBranch('Ikeja')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                      selectedBranch === 'Ikeja'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">apartment</span>
                    <span>Ikeja Commercial</span>
                  </button>

                  <button
                    onClick={() => setSelectedBranch('Abuja')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                      selectedBranch === 'Abuja'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">domain</span>
                    <span>Abuja Central</span>
                  </button>

                  <button
                    onClick={() => setSelectedBranch('Port Harcourt')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                      selectedBranch === 'Port Harcourt'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">location_city</span>
                    <span>Port Harcourt</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSourceFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                      sourceFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>All Investments</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sourceFilter === 'all'
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {agentCounts.total}
                    </span>
                  </button>

                  <button
                    onClick={() => setSourceFilter('agent')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                      sourceFilter === 'agent'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">real_estate_agent</span>
                    <span>Agent Referrals</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sourceFilter === 'agent' ? 'bg-white/25 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}>
                      {agentCounts.agent}
                    </span>
                  </button>

                  <button
                    onClick={() => setSourceFilter('direct')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                      sourceFilter === 'direct'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">public</span>
                    <span>Direct / Organic</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sourceFilter === 'direct' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {agentCounts.direct}
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder={subView === 'backoffice' ? 'Search client, ref, desk, or RM...' : 'Search applicant, ref, or agent...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-5">Applicant</th>
                    <th className="px-6 py-5">Type</th>
                    <th className="px-6 py-5">Plan</th>
                    <th className="px-6 py-5">Origin / Desk</th>
                    <th className="px-6 py-5">Indemnity</th>
                    <th className="px-6 py-5">Principal</th>
                    <th className="px-6 py-5 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvestments.length > 0 ? filteredInvestments.map(req => (
                    <tr key={req.id} onClick={() => setSelectedInvestment(req)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <img src={req.applicant.avatar} className="w-10 h-10 rounded-xl" alt="" />
                          <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wide group-hover:text-primary transition-colors">{req.applicant.name}</p>
                            <p className="text-[10px] font-mono font-bold text-slate-400">{req.referenceId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border ${
                          req.type === 'Liquidation' 
                            ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 border-rose-200' 
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 border-blue-200'
                        }`}>
                          {req.type}
                        </span>
                      </td>
                      <td className="px-6 py-5"><span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-[10px] font-black uppercase rounded-lg border border-purple-200">{req.selectedPlan}</span></td>
                      <td className="px-6 py-5">
                        {isBackOfficeInvestment(req) ? (
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 rounded-lg w-fit">
                              <span className="material-symbols-outlined text-[13px] font-black text-indigo-600">corporate_fare</span>
                              <span className="text-[9px] font-black uppercase tracking-wider">Back Office Desk</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                              <span className="font-black text-slate-900 dark:text-white truncate max-w-[170px]">{req.branchOffice || 'Head Office VI'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <span>RM:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{req.relationshipManager || 'Desk Officer'}</span>
                            </div>
                          </div>
                        ) : isAgentInvestment(req) ? (() => {
                          const calc = calculateAgentCommission(req.amount, req.tenure || '30 days');
                          const rate = req.agentCommissionRate ?? calc.commissionPercent;
                          const commAmt = req.agentCommissionAmount ?? calc.commissionAmount;
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg w-fit">
                                <span className="material-symbols-outlined text-[13px] font-black text-amber-600">real_estate_agent</span>
                                <span className="text-[9px] font-black uppercase tracking-wider">Agent Referral</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                <span className="font-black text-slate-900 dark:text-white">{req.agentName || 'Tunde Davies'}</span>
                                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  {req.agentCode || req.referralCodeUsed || 'AGT-702'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="text-emerald-600 dark:text-emerald-400 font-black">{rate}% comm.</span>
                                <span>•</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₦{commAmt.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-lg w-fit text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-[13px]">devices</span>
                            <span>Mobile App</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {req.isIndemnitySigned ? (
                          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30 w-fit">
                            <span className="material-symbols-outlined text-[14px] font-black">verified</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800 w-fit">
                            <span className="material-symbols-outlined text-[14px]">pending</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 dark:text-white">{req.amount}</td>
                      <td className="px-6 py-5 text-right"><span className="material-symbols-outlined text-slate-300 group-hover:text-primary">chevron_right</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <span className="material-symbols-outlined text-4xl">inventory_2</span>
                          <p className="font-black uppercase text-xs tracking-widest">No investment applications found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : isFinance ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Rates</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Manage investment product yields</p>
                </div>
                <button 
                  onClick={handleAddNewRate}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add New Rate
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Range (₦)</th>
                      <th className="px-6 py-4">Tenure</th>
                      <th className="px-6 py-4">Interest</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rates.map(rate => (
                      <tr key={rate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${rate.planName === 'NOLT Vault' ? 'bg-purple-500' : rate.planName === 'NOLT Rise' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                            <span className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wide">{rate.planName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs">
                          {CURRENCY_SYMBOLS[rate.currency] || ''}{rate.minAmount.toLocaleString()} - {rate.isMaxInfinity ? '∞' : `${CURRENCY_SYMBOLS[rate.currency] || ''}${rate.maxAmount.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs">{rate.tenureMonths} Months</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-200">
                            {rate.interestRate}% p.a
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleDuplicateRate(rate)}
                              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all group-hover:scale-110"
                              title="Duplicate"
                            >
                              <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                            <button 
                              onClick={() => setEditingRate(rate)}
                              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all group-hover:scale-110"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteRate(rate.id)}
                              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all group-hover:scale-110"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-sm text-rose-500">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {editingRate ? (
              <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl p-8 space-y-6 animate-in slide-in-from-right-4 duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {rates.find(r => r.id === editingRate.id) ? 'Edit Rate' : 'Add New Rate'}
                  </h4>
                  <button onClick={() => setEditingRate(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                
                <form onSubmit={handleUpdateRate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PLAN NAME</label>
                      <select 
                        value={editingRate.planName}
                        onChange={e => setEditingRate({...editingRate, planName: e.target.value as any})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="NOLT Rise">NOLT Rise</option>
                        <option value="NOLT Vault">NOLT Vault</option>
                        <option value="NOLT Target">NOLT Target</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CURRENCY</label>
                      <select 
                        value={editingRate.currency}
                        onChange={e => setEditingRate({...editingRate, currency: e.target.value as any})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MIN AMOUNT</label>
                      <input 
                        type="number" 
                        value={editingRate.minAmount}
                        onChange={e => setEditingRate({...editingRate, minAmount: Number(e.target.value)})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MAX AMOUNT</label>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={editingRate.isMaxInfinity}
                            onChange={e => setEditingRate({...editingRate, isMaxInfinity: e.target.checked})}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/20"
                          />
                          <span className="text-[9px] font-black text-slate-400 group-hover:text-primary uppercase transition-colors">Infinity</span>
                        </label>
                      </div>
                      <input 
                        type="number" 
                        value={editingRate.isMaxInfinity ? '' : editingRate.maxAmount}
                        disabled={editingRate.isMaxInfinity}
                        onChange={e => setEditingRate({...editingRate, maxAmount: Number(e.target.value)})}
                        placeholder={editingRate.isMaxInfinity ? '∞' : '0'}
                        className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${editingRate.isMaxInfinity ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TENURE (MONTHS)</label>
                      <input 
                        type="number" 
                        value={editingRate.tenureMonths}
                        onChange={e => setEditingRate({...editingRate, tenureMonths: Number(e.target.value)})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INTEREST RATE (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={editingRate.interestRate}
                        onChange={e => setEditingRate({...editingRate, interestRate: Number(e.target.value)})}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.15em] text-sm rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95 mt-4">
                    SAVE CHANGES
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 space-y-4 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                  <span className="material-symbols-outlined text-3xl">info</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Rate Management</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  Select a rate from the list to modify its parameters. Changes will be reflected immediately on the customer-facing portal.
                </p>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Last Updated</span>
                    <span className="text-slate-900 dark:text-white">Today, 10:42 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Active Plans</span>
                    <span className="text-slate-900 dark:text-white">2 Products</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Access Restricted</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">Only Finance users can manage investment rates.</p>
        </div>
      )}

      <NewInvestmentModal 
        isOpen={isNewInvestmentModalOpen} 
        onClose={() => setIsNewInvestmentModalOpen(false)} 
        currentUser={currentUser}
        onAddRequest={onAddRequest}
        requests={requests}
        defaultChannel={subView === 'backoffice' ? 'Back Office' : 'Mobile App'}
      />

      {/* Return Confirmation Modal */}
      {isReturnConfirmOpen && selectedInvestment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">undo</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Return</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase">{selectedInvestment.type} {selectedInvestment.referenceId} • {selectedInvestment.applicant.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">info</span>
                Rollback Review Workflow
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                Returning this {selectedInvestment.type.toLowerCase()} request will send it back to the selected stage for amendment, recalculation, or document re-verification.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Return Target Stage <span className="text-primary">*</span>
                </label>
                <select 
                  value={returnStage}
                  onChange={(e) => setReturnStage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-xs font-black uppercase focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Pending Review">Pending Review (CX Review)</option>
                  <option value="Docs Verification">Docs Verification (Compliance Check)</option>
                  <option value="Returned">Returned (Customer / Originator)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Return Reason / Audit Note <span className="text-amber-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Specify return reason (e.g. proof of payment mismatch, incorrect tenor selected, WHT discrepancy)..."
                  className="w-full h-28 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReturnConfirmOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetStatus: RequestStatus = returnStage === 'Docs Verification' ? 'Docs Verification' : returnStage === 'Returned' ? 'Returned' : 'Pending Review';
                  const reason = returnReason || `Returned to stage: ${returnStage}`;
                  
                  const newLog = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toISOString(),
                    actor: currentUser.name,
                    action: 'RETURN',
                    comment: `Request returned to '${returnStage}'. Note: ${reason}`
                  };

                  const updated: ReviewRequest = {
                    ...selectedInvestment,
                    status: targetStatus,
                    approvalComment: reason,
                    operationLogs: [newLog, ...(selectedInvestment.operationLogs || [])]
                  };

                  if (onUpdateRequest) {
                    onUpdateRequest(updated);
                  }
                  setSelectedInvestment(updated);
                  setIsReturnConfirmOpen(false);
                  setReturnReason('');
                  setToastMessage({
                    text: `Request #${selectedInvestment.referenceId} returned to ${returnStage}.`,
                    type: 'warning'
                  });
                }}
                className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">undo</span>
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {isRejectConfirmOpen && selectedInvestment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">cancel</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Rejection</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase">{selectedInvestment.type} {selectedInvestment.referenceId} • {selectedInvestment.applicant.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-black uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">warning</span>
                Decline Request
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
                Rejecting this request will mark its status as <span className="font-black text-rose-600 dark:text-rose-400">Declined</span> and log the rejection details permanently in the audit trail.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Rejection Reason / Audit Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State the justification for rejection (e.g. unverified payment funds, fraudulent identification, liquidation terms not met)..."
                className="w-full h-28 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectConfirmOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const reason = rejectReason || 'Request rejected during investment review.';
                  const newLog = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toISOString(),
                    actor: currentUser.name,
                    action: 'REJECT',
                    comment: `Request rejected. Reason: ${reason}`
                  };

                  const updated: ReviewRequest = {
                    ...selectedInvestment,
                    status: 'Declined',
                    approvalComment: reason,
                    operationLogs: [newLog, ...(selectedInvestment.operationLogs || [])]
                  };

                  if (onUpdateRequest) {
                    onUpdateRequest(updated);
                  }
                  setSelectedInvestment(updated);
                  setIsRejectConfirmOpen(false);
                  setRejectReason('');
                  setToastMessage({
                    text: `Request #${selectedInvestment.referenceId} has been declined.`,
                    type: 'warning'
                  });
                }}
                className="flex-1 py-3.5 bg-rose-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : toastMessage.type === 'warning'
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {toastMessage.type === 'error' ? 'error' : toastMessage.type === 'warning' ? 'warning' : 'check_circle'}
            </span>
            <p className="text-xs font-bold leading-tight flex-1">{toastMessage.text}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentView;
