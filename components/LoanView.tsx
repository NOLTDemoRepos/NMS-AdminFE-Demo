
import React, { useState, useEffect, useMemo } from 'react';
import { ReviewRequest, UserRole, RequestStatus, OperationLogEntry, User } from '../types';
import ExportFieldsModal from './ExportFieldsModal';
import NewLoanModal from './NewLoanModal';
import NewStaffLoanModal from './NewStaffLoanModal';
import ApprovalStepper from './ApprovalStepper';
import HRStaffLoanAccessModal from './HRStaffLoanAccessModal';
import LoanDashboardView from './LoanDashboardView';
import { flattenLoan, downloadAsCSV } from '../utils/exportUtils';
import { INITIAL_USERS } from '../usersData';

interface LoanViewProps {
  requests: ReviewRequest[];
  onBack: () => void;
  selectedId?: string | null;
  onClearSelection?: () => void;
  currentUser: { name: string, role: UserRole, avatar: string, id?: string, email?: string };
  onBulkStatusUpdate?: (ids: string[], nextStatus: RequestStatus, logMessage: string, extraFields?: Partial<ReviewRequest>) => void;
  onUpdateIndemnity?: (requestId: string, url: string) => void;
  onUpdateRequest?: (updatedReq: ReviewRequest) => void;
  onAddRequest?: (newReq: ReviewRequest) => void;
  subView?: 'dashboard' | 'business' | 'mobile' | 'staff';
  users?: User[];
  onUpdateUsers?: (users: User[]) => void;
}

const STAFF_LOAN_STAGES = [
  { id: 'submission', label: 'SUBMISSION', icon: 'send' },
  { id: 'hr_officer', label: 'HR OFFICER', icon: 'badge' },
  { id: 'hr_manager', label: 'HR MANAGER', icon: 'verified' },
  { id: 'md', label: 'MD', icon: 'military_tech' },
  { id: 'credit1', label: 'CREDIT I', icon: 'analytics' },
  { id: 'credit2', label: 'CREDIT II', icon: 'analytics' },
  { id: 'audit', label: 'AUDIT', icon: 'verified_user' },
  { id: 'finance', label: 'FINANCE', icon: 'payments' },
  { id: 'disbursed', label: 'DISBURSED', icon: 'done_all' },
];

const SALES_OFFICERS = ['Chidi Okoro', 'Funke Akindele', 'Emeka Okafor', 'Blessing Udoh', 'Alex Morgan', 'Sarah Jenkins', 'Michael Scott'];

const LOAN_EXPORT_CATEGORIES = [
  { title: 'Identity & Financial', fields: [{ id: 'Reference ID', label: 'Reference ID' }, { id: 'Full Name', label: 'Full Name' }, { id: 'Email', label: 'Email' }, { id: 'Monthly Income', label: 'Monthly Income' }, { id: 'Has Active Loans', label: 'Has Active Loans' }, { id: 'BVN', label: 'BVN' }, { id: 'NIN', label: 'NIN' }] },
  { title: 'Loan Specification', fields: [{ id: 'Category', label: 'Category' }, { id: 'Product', label: 'Product' }, { id: 'Amount', label: 'Principal Amount' }, { id: 'Repayment Period', label: 'Repayment Period' }, { id: 'Status', label: 'Application Status' }, { id: 'Promo Code', label: 'Applied Promo' }] },
  { title: 'Personal & Residence', fields: [{ id: 'Gender', label: 'Gender' }, { id: 'DOB', label: 'Date of Birth' }, { id: 'Residential Status', label: 'Residential Status' }, { id: 'Home Address', label: 'Home Address' }, { id: 'Dependents', label: 'Dependents' }] }
];

const getDefaultNodeIndex = (status: RequestStatus) => {
  switch (status) {
    case 'Returned': return 0;
    case 'Pending Review': return 2;
    case 'Docs Verification': return 2;
    case 'Credit Review': return 3;
    case 'Internal Audit': return 5;
    case 'Pending Disbursement': return 6;
    case 'Approved': return 7;
    default: return 2;
  }
};

const getStatusForNodeIndex = (index: number): RequestStatus => {
  switch (index) {
    case 0: return 'Returned';
    case 1: return 'Pending Review';
    case 2: return 'Docs Verification';
    case 3: return 'Credit Review';
    case 4: return 'Internal Audit';
    case 5: return 'Internal Audit';
    case 6: return 'Pending Disbursement';
    case 7: return 'Approved';
    default: return 'Pending Review';
  }
};

const getApprovalNode = (status: RequestStatus) => {
  switch (status) {
    case 'Returned': return { label: 'Returned', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/10 border-rose-100' };
    case 'Pending Review': return { label: 'Submission', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 border-amber-100' };
    case 'Docs Verification': return { label: 'Customer Validation', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 border-amber-100' };
    case 'Credit Review':
    case 'Internal Audit': return { label: 'Credit Check', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100' };
    case 'Pending Disbursement': return { label: 'Request For Payment', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100' };
    case 'Approved': return { label: 'Disbursed', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100' };
    case 'Declined': return { label: 'Rejected', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/10 border-rose-100' };
    default: return { label: 'Processing', color: 'text-slate-600 bg-slate-50 dark:bg-slate-900/10 border-slate-100' };
  }
};

const parseAmountToNumber = (amtVal: any): number => {
  if (typeof amtVal === 'number') return amtVal;
  if (!amtVal) return 0;
  const cleaned = String(amtVal).replace(/[₦$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const LoanView: React.FC<LoanViewProps> = ({ requests, onBack, selectedId, onClearSelection, currentUser, onBulkStatusUpdate, onUpdateIndemnity, onUpdateRequest, onAddRequest, subView, users: propUsers, onUpdateUsers }) => {
  const [internalUsers, setInternalUsers] = useState<User[]>(INITIAL_USERS);
  const users = propUsers || internalUsers;

  const setUsers = (newUsersOrUpdater: User[] | ((prev: User[]) => User[])) => {
    let updated: User[];
    if (typeof newUsersOrUpdater === 'function') {
      updated = newUsersOrUpdater(users);
    } else {
      updated = newUsersOrUpdater;
    }
    setInternalUsers(updated);
    if (onUpdateUsers) {
      onUpdateUsers(updated);
    }
  };

  const isHRRole = currentUser.role === 'HR Officer' || currentUser.role === 'HR Manager' || currentUser.role === 'Super Admin';
  const currentUserRecord = users.find(u => u.name.toLowerCase() === currentUser.name.toLowerCase() || (currentUser.id && u.id === currentUser.id));
  const hasStaffLoanAccess = currentUserRecord ? currentUserRecord.hasStaffLoanAccess !== false : true;

  const [selectedLoan, setSelectedLoan] = useState<ReviewRequest | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [nodeFilter, setNodeFilter] = useState('All Nodes');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isHRAccessModalOpen, setIsHRAccessModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isBlacklistConfirmOpen, setIsBlacklistConfirmOpen] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineComment, setDeclineComment] = useState('');
  const [declineMode, setDeclineMode] = useState<'Decline' | 'Return'>('Decline');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [localEligibleAmount, setLocalEligibleAmount] = useState('');
  const [localOwnerName, setLocalOwnerName] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['PERSONAL INFORMATION']));

  // Added state for fees to handle UI updates before global state sync (simulated)
  const [mgmFee, setMgmFee] = useState(false);
  const [insFee, setInsFee] = useState(false);
  const [localTier, setLocalTier] = useState<'Tier 1' | 'Tier 2' | 'Tier 3'>('Tier 1');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedBankGL, setSelectedBankGL] = useState('');
  const [glError, setGlError] = useState('');
  const [selectedBulkGL, setSelectedBulkGL] = useState('');
  const [bulkGLError, setBulkGLError] = useState('');
  const [returnStage, setReturnStage] = useState('Submission');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isStartDateExpanded, setIsStartDateExpanded] = useState(false);

  // Direct Debit Mandate state variables
  const [isActivatingMandate, setIsActivatingMandate] = useState(false);
  const [mndId, setMndId] = useState('');
  const [mndActivationDate, setMndActivationDate] = useState('');
  const [mndRequestId, setMndRequestId] = useState('');
  const [mndStartDate, setMndStartDate] = useState('');
  const [mndEndDate, setMndEndDate] = useState('');
  const [mndAmount, setMndAmount] = useState('');

  const [isSendingDebit, setIsSendingDebit] = useState(false);
  const [debAmount, setDebAmount] = useState('');
  const [checkingInstructionId, setCheckingInstructionId] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const loanRequests = useMemo(() => requests.filter(req => req.type === 'Loan'), [requests]);

  useEffect(() => {
    if (selectedId) {
      const found = loanRequests.find(r => r.id === selectedId);
      if (found) {
        setSelectedLoan(found);
        setLocalOwnerName(found.ownerName || 'UNASSIGNED');
        setLocalEligibleAmount(found.eligibleAmount || '');
        setMgmFee(found.managementFeeApplied || false);
        setInsFee(found.insuranceFeeApplied || false);
        setSelectedBankGL(found.selectedBankGL || '');
        setCommentText(found.approvalComment || '');
        setStartDate(found.startDate || new Date().toISOString().split('T')[0]);
        setLocalTier((found.applicant?.accountTier as 'Tier 1' | 'Tier 2' | 'Tier 3') || 'Tier 1');
      }
    } else {
      setSelectedLoan(null);
    }
  }, [selectedId, loanRequests]);

  const filteredLoans = useMemo(() => 
    loanRequests.filter(req => {
      if (subView === 'staff') {
        const isStaff = req.isStaffLoan || req.loanProduct === 'Staff Loan';
        if (!isStaff) return false;

        // RBAC Check:
        // ONLY HR officer and HR Manager have full visibility into the staff loan trail from start to finish.
        // Each node above HR Manager (MD, Credit, Audit, Finance) can ONLY see applications that need their approval.
        if (!isHRRole) {
          const nodeIndex = req.currentNodeIndex ?? 1;
          const isApplicant = req.applicant.name === currentUser.name || req.applicant.email === currentUser.email;

          if (currentUser.role === 'MD') {
            if (nodeIndex !== 3 && !req.initiatedByMD && !isApplicant) return false;
          } else if (currentUser.role === 'Credit Officer' || currentUser.role === 'Credit Manager') {
            if (nodeIndex !== 4 && !isApplicant) return false;
          } else if (currentUser.role === 'Internal Control' || currentUser.role === 'Audit') {
            if (nodeIndex !== 5 && !isApplicant) return false;
          } else if (currentUser.role === 'Finance') {
            if (nodeIndex !== 6 && nodeIndex !== 7 && !isApplicant) return false;
          } else if (!isApplicant) {
            return false;
          }
        }
      } else if (subView === 'mobile') {
        if (!req.isMobileLoan && req.loanProduct !== 'Mobile App Loan') return false;
      } else if (subView === 'business') {
        if (req.isStaffLoan || req.loanProduct === 'Staff Loan' || req.isMobileLoan || req.loanProduct === 'Mobile App Loan') return false;
      }

      const matchesSearch = req.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            req.referenceId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || req.status === statusFilter;
      const node = req.isStaffLoan ? (STAFF_LOAN_STAGES[req.currentNodeIndex ?? 1] || { label: 'PENDING' }) : getApprovalNode(req.status);
      return matchesSearch && matchesStatus && (nodeFilter === 'All Nodes' || node.label === nodeFilter);
    }), [loanRequests, subView, currentUser, isHRRole, searchTerm, statusFilter, nodeFilter]
  );

  // Derived user staff loans for Staff Loan Hub
  const userStaffLoans = useMemo(() => {
    return filteredLoans.filter(req => 
      req.isStaffLoan || 
      req.loanProduct === 'Staff Loan' || 
      req.loanCategory === 'Staff Loan'
    );
  }, [filteredLoans]);

  const toggleSection = (id: string) => {
    const next = new Set(openSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenSections(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedLoan && onUpdateIndemnity) {
      // Mock upload - in real app we'd upload to storage and get URL
      const mockUrl = URL.createObjectURL(file);
      onUpdateIndemnity(selectedLoan.id, mockUrl);
    }
  };

  const handleActivateMandate = () => {
    if (!selectedLoan) return;
    const inv = selectedLoan;

    if (!mndId || !mndAmount) {
      setToastMessage({ text: 'Mandate ID and Amount are required.', type: 'error' });
      return;
    }

    const newMandate = {
      mandateId: mndId,
      activationDate: mndActivationDate,
      requestId: mndRequestId,
      startDate: mndStartDate,
      endDate: mndEndDate,
      amount: mndAmount.includes('₦') ? mndAmount : `₦${parseFloat(mndAmount.replace(/[₦$,\s]/g, '') || '0').toLocaleString()}`,
      status: 'Active' as const
    };

    // Stop other active mandates first
    const updatedMandates = (inv.mandates || []).map(m => m.status === 'Active' ? { ...m, status: 'Stopped' as const } : m);
    const finalMandates = [...updatedMandates, newMandate];

    // Create a log in the operations logs
    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: 'MANDATE ACTIVE',
      comment: `Direct Debit Mandate activated. Mandate ID: ${mndId}, Limit Amount: ${newMandate.amount}, Term Period: ${mndStartDate} to ${mndEndDate}`
    };

    const updatedLogs = [newLog, ...(inv.operationLogs || [])];

    const updatedLoan = {
      ...inv,
      mandates: finalMandates,
      operationLogs: updatedLogs
    };

    setSelectedLoan(updatedLoan);
    if (onUpdateRequest) {
      onUpdateRequest(updatedLoan);
    }

    setIsActivatingMandate(false);
    setToastMessage({ text: `Direct Debit Mandate ${mndId} successfully registered and activated!`, type: 'success' });
  };

  const handleStopMandate = (mandateId: string) => {
    if (!selectedLoan) return;
    const inv = selectedLoan;

    const updatedMandates = (inv.mandates || []).map(m => 
      m.mandateId === mandateId ? { ...m, status: 'Stopped' as const } : m
    );

    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: 'MANDATE STOPPED',
      comment: `Direct Debit Mandate stopped. Mandate ID: ${mandateId}`
    };

    const updatedLogs = [newLog, ...(inv.operationLogs || [])];

    const updatedLoan = {
      ...inv,
      mandates: updatedMandates,
      operationLogs: updatedLogs
    };

    setSelectedLoan(updatedLoan);
    if (onUpdateRequest) {
      onUpdateRequest(updatedLoan);
    }

    setToastMessage({ text: `Direct Debit Mandate ${mandateId} has been successfully stopped.`, type: 'success' });
  };

  const handleSendDebitInstruction = () => {
    if (!selectedLoan) return;
    const inv = selectedLoan;
    const activeMandate = (inv.mandates || []).find(m => m.status === 'Active');

    if (!activeMandate) {
      setToastMessage({ text: 'No active mandate found to issue debit instructions.', type: 'error' });
      return;
    }

    if (!debAmount || parseFloat(debAmount) <= 0) {
      setToastMessage({ text: 'Please specify a valid debit amount.', type: 'error' });
      return;
    }

    const instId = `DEB-${Math.floor(1000 + Math.random() * 9000).toString()}`;
    const newInstruction = {
      instructionId: instId,
      mandateId: activeMandate.mandateId,
      amount: `₦${parseFloat(debAmount).toLocaleString()}`,
      dateSent: new Date().toISOString(),
      status: 'PENDING' as const
    };

    const updatedInstructions = [newInstruction, ...(inv.debitInstructions || [])];

    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      action: 'DEBIT ISSUED',
      comment: `Direct debit instruction issued under mandate ${activeMandate.mandateId}. Instruction ID: ${instId}, Amount: ₦${parseFloat(debAmount).toLocaleString()}`
    };

    const updatedLogs = [newLog, ...(inv.operationLogs || [])];

    const updatedLoan = {
      ...inv,
      debitInstructions: updatedInstructions,
      operationLogs: updatedLogs
    };

    setSelectedLoan(updatedLoan);
    if (onUpdateRequest) {
      onUpdateRequest(updatedLoan);
    }

    setIsSendingDebit(false);
    setToastMessage({ text: `Debit Instruction ${instId} for ₦${parseFloat(debAmount).toLocaleString()} has been sent to the payment gateway.`, type: 'success' });
  };

  const handleCheckDebitStatus = (instructionId: string) => {
    if (!selectedLoan) return;
    const inv = selectedLoan;

    setCheckingInstructionId(instructionId);

    // Simulate checking gateway after 1.2s delay
    setTimeout(() => {
      const currentInst = (inv.debitInstructions || []).find(i => i.instructionId === instructionId);
      if (!currentInst) {
        setCheckingInstructionId(null);
        return;
      }

      // Simulate a random success or fail, but mostly success
      const simulatedStatus = Math.random() > 0.15 ? 'SUCCESS' : 'FAILED';

      const updatedInstructions = (inv.debitInstructions || []).map(i => 
        i.instructionId === instructionId 
          ? { ...i, status: simulatedStatus as 'SUCCESS' | 'FAILED', lastChecked: new Date().toISOString() } 
          : i
      );

      const statusComment = simulatedStatus === 'SUCCESS' 
        ? `Debit instruction ${instructionId} settled successfully via clearing network.`
        : `Debit instruction ${instructionId} failed: Insufficient wallet balance on payer's account.`;

      const newLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        actor: currentUser.name,
        action: simulatedStatus === 'SUCCESS' ? 'DEBIT SUCCESS' : 'DEBIT FAILED',
        comment: statusComment
      };

      const updatedLogs = [newLog, ...(inv.operationLogs || [])];

      const updatedLoan = {
        ...inv,
        debitInstructions: updatedInstructions,
        operationLogs: updatedLogs
      };

      setSelectedLoan(updatedLoan);
      if (onUpdateRequest) {
        onUpdateRequest(updatedLoan);
      }

      setCheckingInstructionId(null);
      setToastMessage({ 
        text: `Status for ${instructionId} resolved to ${simulatedStatus}: ${simulatedStatus === 'SUCCESS' ? 'Settled' : 'Failed'}`, 
        type: simulatedStatus === 'SUCCESS' ? 'success' : 'error' 
      });
    }, 1200);
  };

  const Section = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => {
    const isOpen = openSections.has(title);
    return (
      <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-4">
        <button 
          onClick={() => toggleSection(title)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">{icon}</span>
            <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h5>
          </div>
          <span className={`material-symbols-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {isOpen && (
          <div className="px-6 pb-8 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Field = ({ label, value }: { label: string, value: any }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
        {value || 'Not provided'}
      </p>
    </div>
  );

  const isCreditRole = currentUser.role === 'Credit Manager' || currentUser.role === 'Credit Officer' || currentUser.role === 'Super Admin';

  if (selectedLoan) {
    const inv = selectedLoan;
    const isStaffLoan = Boolean(
      inv.isStaffLoan || 
      inv.loanProduct === 'Staff Loan' || 
      subView === 'staff' || 
      inv.loanCategory === 'Staff Loan' || 
      inv.loanCategory === 'Staff' || 
      inv.loanCategory === 'EMPLOYEES' || 
      inv.loanCategory === 'Employees' ||
      inv.referenceId?.startsWith('SL-')
    );
    const app = inv.applicant;
    const currentNodeIndex = inv.currentNodeIndex !== undefined ? inv.currentNodeIndex : getDefaultNodeIndex(inv.status);
    
    const mandates = inv.mandates || [];
    const activeMandate = mandates.find(m => m.status === 'Active');
    const historicalMandates = mandates.filter(m => m.status === 'Stopped');
    const debitInstructions = inv.debitInstructions || [];
    
    // Check for Credit stages (Docs Verification / Credit Review / Internal Audit)
    const isCreditStage = inv.status === 'Docs Verification' || inv.status === 'Credit Review' || inv.status === 'Internal Audit';

    return (
      <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20 relative">
        {toastMessage && (
          <div id="toast-notification-panel" className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 bg-rose-50 dark:bg-rose-950/95 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-100 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300 max-w-[420px]">
            <span className="material-symbols-outlined text-[20px] shrink-0 text-rose-500 font-black">warning</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Limit Enforced</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug mt-0.5">{toastMessage.text}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="shrink-0 p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </div>
        )}
        {/* Detail Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => { setSelectedLoan(null); onClearSelection?.(); }} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">APPLICATION {inv.referenceId}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{app.name}</h2>
              <span className="px-3.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 dark:border-blue-500/20">
                {app.accountTier || 'Tier 1'}
              </span>
              {(inv.fraudFlag || inv.isBlacklisted || app.fraudFlag || app.isBlacklisted) && (
                <span className="px-3.5 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-300 dark:border-red-800 flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">gavel</span> FRAUD FLAGGED & BLACKLISTED
                </span>
              )}
              {inv.status === 'Declined' && (inv.rejectionCoolingExpiryDate || app.rejectionCoolingExpiryDate) && !(inv.fraudFlag || inv.isBlacklisted || app.fraudFlag || app.isBlacklisted) && (
                <span className="px-3.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">hourglass_top</span> 45D REJECTION COOLING
                </span>
              )}
              <button className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">edit</span> Edit Application
              </button>
            </div>
          </div>
        </div>

        {/* Fraud / Blacklist Notification Banner */}
        {(inv.fraudFlag || inv.isBlacklisted || app.fraudFlag || app.isBlacklisted) && (
          <div className="mb-6 p-6 rounded-[28px] bg-red-50 dark:bg-red-950/40 border-2 border-red-500/50 dark:border-red-800 flex items-start gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
              <span className="material-symbols-outlined text-2xl">gavel</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
                  FRAUD FLAGGED & BLACKLISTED PROFILE
                </span>
                <span className="text-xs font-black text-red-700 dark:text-red-300">
                  6-Month Loan Re-application Ban Active (Expires: {new Date(inv.blacklistExpiryDate || app.blacklistExpiryDate || Date.now() + 180*24*60*60*1000).toLocaleDateString(undefined, { dateStyle: 'long' })})
                </span>
              </div>
              <p className="text-sm font-black text-red-900 dark:text-red-200 mt-2">
                {inv.blacklistReason || inv.fraudReason || app.blacklistReason || app.fraudReason || 'This customer BVN has been flagged for fraud and blacklisted from all loan facilities.'}
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-300 font-bold mt-1">
                Target BVN: <span className="font-mono font-black">{app.bvn || '222****9901'}</span> • Blacklist Date: {inv.blacklistDate || app.blacklistDate ? new Date(inv.blacklistDate || app.blacklistDate || '').toLocaleDateString() : 'Active'} • Restriction: All retail, staff, & business loan applications blocked.
              </p>
            </div>
          </div>
        )}

        {/* 45-Day Rejection Cooling Notification Banner */}
        {inv.status === 'Declined' && (inv.rejectionCoolingExpiryDate || app.rejectionCoolingExpiryDate) && !(inv.fraudFlag || inv.isBlacklisted || app.fraudFlag || app.isBlacklisted) && (
          <div className="mb-6 p-6 rounded-[28px] bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-2xl">hourglass_top</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest">
                  45-DAY AUTO-REJECTION POLICY ACTIVE
                </span>
                <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                  Cooling Period Expiry: {new Date(inv.rejectionCoolingExpiryDate || app.rejectionCoolingExpiryDate || Date.now() + 45*24*60*60*1000).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
              </div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mt-1.5 leading-relaxed">
                {inv.rejectionReason || app.rejectionReason || 'Application declined during credit evaluation. Under risk policy, re-applications for this BVN will be automatically declined for 45 days.'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono mt-1">
                Locked BVN Key: {app.bvn || '222****9901'} • Rejected Date: {inv.rejectionDate || app.rejectionDate ? new Date(inv.rejectionDate || app.rejectionDate || '').toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>
        )}

        {/* Stepper Card */}
        <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm py-4 mb-8">
           <ApprovalStepper status={inv.status} type="Loan" currentNodeIndex={currentNodeIndex} isStaffLoan={isStaffLoan} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LOAN TYPE</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white uppercase">{inv.loanCategory || 'New'}</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">REQUESTED AMOUNT</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{inv.amount}</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TENURE</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{inv.repaymentPeriod || '18 Months'}</p>
              </div>
            </div>

            <Section title="PERSONAL INFORMATION" icon="person">
              <Field label="FULL NAME" value={app.name} />
              <Field label="GENDER" value={app.gender} />
              <Field label="DATE OF BIRTH" value={app.dateOfBirth} />
              <Field label="MARITAL STATUS" value={app.maritalStatus} />
              <Field label="PHONE" value={app.phone} />
              <Field label="EMAIL" value={app.email} />
              <Field label="ACCOUNT TIER" value={app.accountTier || 'Tier 1'} />
              <div className="col-span-full">
                <Field label="ADDRESS" value={app.address} />
              </div>
            </Section>

            <Section title="FINANCIAL PROFILE" icon="analytics">
              <Field label="MONTHLY INCOME" value={inv.monthlyIncome} />
              <Field label="ACTIVE LOANS" value={inv.hasActiveLoans ? 'YES' : 'NONE'} />
              <Field label="OCCUPATION" value={app.occupation} />
              <div className="col-span-full flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-800 mt-2">
                {mgmFee && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg border border-emerald-200 animate-in slide-in-from-left-2">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Management Fee Applied</span>
                  </div>
                )}
                {insFee && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg border border-blue-200 animate-in slide-in-from-left-2">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Insurance Fee Applied</span>
                  </div>
                )}
              </div>
            </Section>

            <Section title="DOCUMENTS" icon="description">
              <div className="col-span-full py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 mx-auto mb-2">
                  <span className="material-symbols-outlined text-3xl">folder_open</span>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No documents uploaded</p>
              </div>
            </Section>

            <Section title="REFERENCES" icon="group">
              {inv.references?.map((ref, i) => (
                <div key={i} className="col-span-1 space-y-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{ref.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{ref.relationship} • {ref.phone}</p>
                </div>
              ))}
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

            <Section title="DIRECT DEBIT MANDATE" icon="payments">
              <div className="col-span-full space-y-6">
                {/* Intro Info */}
                <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Agreed Repayment Protection</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                      Send direct debit instructions to auto-debit the customer's account once a payer mandate has been activated on the frontend. This prevents loan defaults on due dates.
                    </p>
                  </div>
                </div>

                {/* Mandate Status Header */}
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CURRENT MANDATE STATUS</p>
                    <div className="flex items-center gap-2 mt-1">
                      {activeMandate ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h6 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">ACTIVE MANDATE ({activeMandate.mandateId})</h6>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <h6 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">NO ACTIVE MANDATE</h6>
                        </>
                      )}
                    </div>
                  </div>

                  {!activeMandate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMndId(`MND-${Math.floor(100000 + Math.random() * 900000).toString()}`);
                        setMndActivationDate(new Date().toISOString().split('T')[0]);
                        setMndRequestId(inv.referenceId || inv.id);
                        setMndStartDate(new Date().toISOString().split('T')[0]);
                        const end = new Date();
                        end.setMonth(end.getMonth() + 6);
                        setMndEndDate(end.toISOString().split('T')[0]);
                        setMndAmount(inv.amount || '0');
                        setIsActivatingMandate(true);
                      }}
                      className="px-4 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-primary-hover shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
                      Activate Mandate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleStopMandate(activeMandate.mandateId);
                      }}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Stop Mandate
                    </button>
                  )}
                </div>

                {/* Mandate Activation Form */}
                {isActivatingMandate && (
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-primary/20 space-y-4 animate-in slide-in-from-top-3 duration-350">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">MANDATE REGISTRATION PAYLOAD</p>
                      <button 
                        type="button" 
                        onClick={() => setIsActivatingMandate(false)} 
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">MANDATE ID</label>
                        <input 
                          type="text" 
                          value={mndId} 
                          onChange={(e) => setMndId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ACTIVATION DATE</label>
                        <input 
                          type="date" 
                          value={mndActivationDate} 
                          onChange={(e) => setMndActivationDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">REQUEST ID</label>
                        <input 
                          type="text" 
                          value={mndRequestId} 
                          onChange={(e) => setMndRequestId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">AMOUNT LIMIT (₦)</label>
                        <input 
                          type="text" 
                          value={mndAmount} 
                          onChange={(e) => setMndAmount(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">START DATE</label>
                        <input 
                          type="date" 
                          value={mndStartDate} 
                          onChange={(e) => setMndStartDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">END DATE</label>
                        <input 
                          type="date" 
                          value={mndEndDate} 
                          onChange={(e) => setMndEndDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsActivatingMandate(false)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleActivateMandate}
                        className="px-5 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-primary-hover shadow-md"
                      >
                        Submit Activation Payload
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Mandate Info Details Card */}
                {activeMandate && (
                  <div className="bg-slate-50 dark:bg-slate-800/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">MANDATE ID</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{activeMandate.mandateId}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ACTIVATED ON</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{new Date(activeMandate.activationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">REQUEST ID</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{activeMandate.requestId}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">START DATE</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{new Date(activeMandate.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">END DATE</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{new Date(activeMandate.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">AGREED LIMIT AMOUNT</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeMandate.amount}</p>
                    </div>
                  </div>
                )}

                {/* Send Debit Instruction Panel (If Mandate is Active) */}
                {activeMandate && (
                  <div className="p-5 bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 rounded-2xl border border-primary/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[20px]">send_and_archive</span>
                        <h6 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">TRIGGER DEBIT INSTRUCTION</h6>
                      </div>
                      {!isSendingDebit && (
                        <button
                          type="button"
                          onClick={() => {
                            setDebAmount(activeMandate.amount.replace(/[₦$,\s]/g, ''));
                            setIsSendingDebit(true);
                          }}
                          className="px-3.5 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-hover shadow-sm transition-all"
                        >
                          Prepare Debit
                        </button>
                      )}
                    </div>

                    {isSendingDebit ? (
                      <div className="space-y-3 animate-in fade-in duration-205">
                        <div className="max-w-xs space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">DEBIT AMOUNT (₦)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={debAmount} 
                              onChange={(e) => setDebAmount(e.target.value)}
                              placeholder="Amount to debit"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSendDebitInstruction}
                              className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-hover shadow-sm shrink-0 h-[32px] flex items-center justify-center"
                            >
                              Send Now
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSendingDebit(false)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 shrink-0 h-[32px] flex items-center justify-center"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-relaxed">
                        Generate and send automated direct debit instruction to the clearing gateway using the active payer mandate.
                      </p>
                    )}
                  </div>
                )}

                {/* Sent Debit Instructions Table */}
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEBIT INSTRUCTIONS ({debitInstructions.length})</p>
                  
                  {debitInstructions.length > 0 ? (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {debitInstructions.map((inst) => (
                        <div key={inst.instructionId} className="p-4 bg-white dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-855 dark:text-white">{inst.instructionId}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                inst.status === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50' :
                                inst.status === 'FAILED' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/50' :
                                'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/50 animate-pulse'
                              }`}>
                                {inst.status}
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase space-x-2">
                              <span>Amount: <strong className="text-slate-700 dark:text-slate-300 font-black">₦{parseAmountToNumber(inst.amount).toLocaleString()}</strong></span>
                              <span>•</span>
                              <span>Sent: <strong className="text-slate-500 font-black">{new Date(inst.dateSent).toLocaleString()}</strong></span>
                              {inst.lastChecked && (
                                <>
                                  <span>•</span>
                                  <span>Checked: <strong className="text-slate-400 font-bold">{new Date(inst.lastChecked).toLocaleTimeString()}</strong></span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCheckDebitStatus(inst.instructionId)}
                              disabled={checkingInstructionId === inst.instructionId}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest transition-all flex items-center gap-1 hover:text-primary disabled:opacity-50"
                            >
                              {checkingInstructionId === inst.instructionId ? (
                                <>
                                  <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[14px]">find_in_page</span>
                                  Check Status
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-150 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No debit instructions triggered yet</p>
                    </div>
                  )}
                </div>

                {/* History of Completed / Stopped Mandates */}
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COMPLETED MANDATE HISTORY ({historicalMandates.length})</p>
                  
                  {historicalMandates.length > 0 ? (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {historicalMandates.map((mnd) => (
                        <div key={mnd.mandateId} className="p-4 bg-slate-50/40 dark:bg-slate-900/10 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-850 dark:text-white">{mnd.mandateId}</span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
                                {mnd.status} (COMPLETED)
                              </span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase space-x-2">
                              <span>Limit: <strong className="font-black text-slate-600 dark:text-slate-400">{mnd.amount}</strong></span>
                              <span>•</span>
                              <span>Term: <strong className="font-black text-slate-600 dark:text-slate-400">{new Date(mnd.startDate).toLocaleDateString()} to {new Date(mnd.endDate).toLocaleDateString()}</strong></span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-xl">history</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-150 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No previous completed or stopped mandates on this loan</p>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          </div>          {/* Action Column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">ACTION REQUIRED</p>
                  </div>
                  
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-tight">
                    {isStaffLoan ? (
                      <>
                        {currentNodeIndex === 0 && 'Submitted via HRIS'}
                        {currentNodeIndex === 1 && 'HR Officer Eligibility Check'}
                        {currentNodeIndex === 2 && 'HR Manager Validation'}
                        {currentNodeIndex === 3 && 'MD Node Approval'}
                        {currentNodeIndex === 4 && 'Credit Assessment I'}
                        {currentNodeIndex === 5 && 'Credit Assessment II'}
                        {currentNodeIndex === 6 && 'Internal Audit Review'}
                        {currentNodeIndex === 7 && 'Finance GL Booking'}
                        {currentNodeIndex === 8 && 'Staff Loan Disbursed'}
                      </>
                    ) : (
                      <>
                        {currentNodeIndex === 0 && 'Submission Vetting'}
                        {currentNodeIndex === 1 && 'Sales Verification'}
                        {currentNodeIndex === 2 && 'Customer Experience Review'}
                        {currentNodeIndex === 3 && 'Credit Assessment I'}
                        {currentNodeIndex === 4 && 'Credit Assessment II'}
                        {currentNodeIndex === 5 && 'Internal Audit Review'}
                        {currentNodeIndex === 6 && 'Finance Disbursement Approval'}
                        {currentNodeIndex === 7 && 'Application Disbursed'}
                      </>
                    )}
                  </h4>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">
                    {(isStaffLoan ? currentNodeIndex === 8 : currentNodeIndex === 7) ? 'This application has been successfully completed and disbursed.' : 'You have permission to process this application.'}
                  </p>

                  {/* HR Officer Verification Form (Node Index 1 for Staff Loans) */}
                  {inv.isStaffLoan && currentNodeIndex === 1 && (
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/40 rounded-3xl border border-blue-200 dark:border-blue-900/50 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl font-black">badge</span>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">HR OFFICER ELIGIBILITY CONFIRMATION</p>
                      </div>

                      <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">HRIS Staff Salary</label>
                          <input 
                            type="text"
                            value={inv.hrisSalary || '₦480,000'}
                            onChange={(e) => {
                              inv.hrisSalary = e.target.value;
                              setSelectedLoan({ ...inv, hrisSalary: e.target.value });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">HRIS Resumption Date</label>
                          <input 
                            type="text"
                            value={inv.hrisEmploymentDate || '2024-05-15'}
                            onChange={(e) => {
                              inv.hrisEmploymentDate = e.target.value;
                              setSelectedLoan({ ...inv, hrisEmploymentDate: e.target.value });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="pt-1">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={inv.hrisIsConfirmed !== false}
                              onChange={(e) => {
                                inv.hrisIsConfirmed = e.target.checked;
                                setSelectedLoan({ ...inv, hrisIsConfirmed: e.target.checked });
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Confirm Staff is Confirmed (&gt;6 Months Resumption)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HR Manager Validation Box (Node Index 2 for Staff Loans) */}
                  {inv.isStaffLoan && currentNodeIndex === 2 && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl font-black">verified</span>
                          <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">HR MANAGER VALIDATION CHECKLIST</p>
                        </div>
                        {inv.initiatedByMD && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/30">
                            MD INITIATED
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="text-slate-500">Salary Verified:</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">{inv.hrisSalary || '₦480,000'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="text-slate-500">Employment Date (&gt;6M):</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">{inv.hrisEmploymentDate || '2024-05-15'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="text-slate-500">Confirmation Status:</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">
                            {inv.hrisIsConfirmed !== false ? 'CONFIRMED STAFF' : 'PROBATION'}
                          </span>
                        </div>
                      </div>

                      {inv.initiatedByMD && (
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 italic">
                          Note: Since MD initiated this request, approving this node will automatically approve the MD stage and advance directly to Credit.
                        </p>
                      )}
                    </div>
                  )}

                  {currentNodeIndex < 7 && (
                    <div className="p-6 bg-slate-50 dark:bg-background-dark/30 rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">UPLOAD SUPPORTING DOCUMENT</p>
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                          Choose File
                          <input type="file" className="hidden" />
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">No file chosen</span>
                      </div>
                    </div>
                  )}

                  {/* Start Date Selector - Only for credit 1 and credit 2 stages (Node Index 3 and 4) */}
                  {(currentNodeIndex === 3 || currentNodeIndex === 4) && (
                    <div className="p-6 bg-slate-50 dark:bg-background-dark/30 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-300">
                      <button 
                        onClick={() => setIsStartDateExpanded(!isStartDateExpanded)}
                        className="w-full flex items-center justify-between text-left focus:outline-none"
                      >
                        <div>
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 select-none">LOAN START DATE</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                            {startDate ? new Date(startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                          </p>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${isStartDateExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>
                      
                      {isStartDateExpanded && (
                        <div className="space-y-2 pt-3 border-t border-slate-200/50 dark:border-slate-800 animate-in fade-in duration-200">
                          <label htmlFor="loan-start-date" className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Select Date</label>
                          <input 
                            id="loan-start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStartDate(val);
                               inv.startDate = val; // Simulated persistence
                            }}
                            className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fee Selection Checkboxes - Only for credit 1 and credit 2 stages (Node Index 3 and 4) */}
                  {(currentNodeIndex === 3 || currentNodeIndex === 4) && (
                    <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-3xl border border-primary/20 space-y-4 animate-in fade-in duration-300">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">FEE APPLICATION SETTINGS</p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={mgmFee}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setMgmFee(checked);
                              inv.managementFeeApplied = checked; // Simulated persistence
                            }}
                            className="w-4 h-4 rounded border-slate-300 dark:bg-slate-700 text-primary focus:ring-primary transition-all"
                          />
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider group-hover:text-primary transition-colors">Apply Management Fee</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={insFee}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setInsFee(checked);
                              inv.insuranceFeeApplied = checked; // Simulated persistence
                            }}
                            className="w-4 h-4 rounded border-slate-300 dark:bg-slate-700 text-primary focus:ring-primary transition-all"
                          />
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider group-hover:text-primary transition-colors">Apply Insurance Fee</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Tier Settings Dropdown - Available to Customer Experience and Super Admin roles inside Node Index 2 */}
                  {currentNodeIndex === 2 && (currentUser.role === 'Customer Experience' || currentUser.role === 'Super Admin') && (
                    <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-3xl border border-primary/20 space-y-3 animate-in fade-in duration-300">
                      <label htmlFor="customer-tier-select" className="text-[9px] font-black text-primary uppercase tracking-widest block">Customer Tier Settings</label>
                      <select 
                        id="customer-tier-select"
                        value={localTier}
                        onChange={(e) => {
                          const prevTier = (inv.applicant && inv.applicant.accountTier) || 'Tier 1';
                          const tier = e.target.value as 'Tier 1' | 'Tier 2' | 'Tier 3';
                          
                          // Capture tier upgrade/change log in timeline
                          const newLog: OperationLogEntry = {
                            id: Math.random().toString(36).substring(7),
                            timestamp: new Date().toISOString(),
                            actor: currentUser.name,
                            action: 'TIER UPDATE',
                            comment: `Kyc/Tier status updated. Upgraded customer tier status from ${prevTier} to ${tier}.`
                          };

                          const updatedLogs = [newLog, ...(inv.operationLogs || [])];

                          setSelectedLoan(prev => {
                            if (prev && prev.applicant) {
                              return {
                                ...prev,
                                applicant: {
                                  ...prev.applicant,
                                  accountTier: tier
                                },
                                operationLogs: updatedLogs
                              };
                            }
                            return prev;
                          });
                          setLocalTier(tier);
                          
                          if (inv.applicant) {
                            inv.applicant.accountTier = tier; // Simulated persistence
                          }
                          inv.operationLogs = updatedLogs;

                          if (onUpdateRequest) {
                            onUpdateRequest({
                              ...inv,
                              applicant: {
                                ...(inv.applicant || {}),
                                accountTier: tier
                              },
                              operationLogs: updatedLogs
                            });
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none h-[44px]"
                      >
                        <option value="Tier 1">Tier 1</option>
                        <option value="Tier 2">Tier 2</option>
                        <option value="Tier 3">Tier 3</option>
                      </select>
                    </div>
                  )}

                  {/* Bank GL Dropdown - Only for finance stage (Node Index 6 for regular loans, Node Index 7 for staff loans) */}
                  {((!isStaffLoan && currentNodeIndex === 6) || (isStaffLoan && currentNodeIndex === 7)) && (
                    <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20 space-y-4 animate-in fade-in duration-300">
                      <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">SELECT BANK GL (FINANCE NODE)</p>
                      <div className="relative">
                        <select
                          id="bank-gl-select"
                          value={selectedBankGL}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedBankGL(val);
                            inv.selectedBankGL = val;
                            setGlError('');
                          }}
                          className={`w-full bg-slate-50 dark:bg-background-dark/50 border ${glError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-[20px] p-4 text-xs font-black uppercase text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary transition-all`}
                        >
                          <option value="">-- SELECT BANK GL ACCOUNT --</option>
                          <option value="102001 - GTBank GL Account">102001 - GTBank GL Account</option>
                          <option value="102002 - Access Bank GL Account">102002 - Access Bank GL Account</option>
                          <option value="102003 - Zenith Bank GL Account">102003 - Zenith Bank GL Account</option>
                          <option value="102004 - Providus Bank GL Account">102004 - Providus Bank GL Account</option>
                          <option value="201005 - Treasury Operations GL Account">201005 - Treasury Operations GL Account</option>
                        </select>
                        {glError && (
                          <p className="text-[10px] font-black text-rose-500 uppercase mt-2 pl-1 italic">
                            {glError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {currentNodeIndex < (isStaffLoan ? 8 : 7) && (
                    <>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">REASON / COMMENT <span className="text-rose-500">*</span></p>
                        <textarea 
                          placeholder="Provide a reason for approval, return, or rejection..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full h-32 bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-[20px] p-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all resize-none"
                        />
                      </div>

                      <button 
                        onClick={() => {
                          const amtToCheck = localEligibleAmount ? parseAmountToNumber(localEligibleAmount) : parseAmountToNumber(inv.amount);
                          if (localTier === 'Tier 1' && amtToCheck > 300000) {
                            setToastMessage({
                              text: `Tier 1 limit exceeded! Current size ₦${amtToCheck.toLocaleString()} exceeds the ₦300,000 threshold limit. Please upgrade the customer tier status first.`,
                              type: 'error'
                            });
                            return;
                          }
                          if (localTier === 'Tier 2' && amtToCheck > 500000) {
                            setToastMessage({
                              text: `Tier 2 limit exceeded! Current size ₦${amtToCheck.toLocaleString()} exceeds the ₦500,000 threshold limit. Please upgrade the customer tier status first.`,
                              type: 'error'
                            });
                            return;
                          }

                          const isFinanceNode = (!isStaffLoan && currentNodeIndex === 6) || (isStaffLoan && currentNodeIndex === 7);
                          if (isFinanceNode && !selectedBankGL) {
                            setGlError('Please select a Bank GL account to proceed.');
                            return;
                          }
                          setGlError('');

                          const isStaff = isStaffLoan;
                          let nextIdx = currentNodeIndex + 1;
                          let defaultComment = `Advanced application from stage index ${currentNodeIndex} to stage index ${nextIdx}.`;

                          // Staff Loan rule: If MD is the initiator, when HR Manager approves (node index 2), automatically approve at MD node (node index 3) and advance to Credit (node index 4).
                          if (isStaff && currentNodeIndex === 2 && (inv.initiatedByMD || inv.applicant?.name?.toLowerCase().includes('md'))) {
                            nextIdx = 4;
                            defaultComment = 'HR Manager validated staff loan. Auto-approved at MD stage because MD is initiator. Advanced to Credit stage.';
                          }

                          const getStaffStatus = (idx: number): RequestStatus => {
                            switch(idx) {
                              case 0: return 'Returned';
                              case 1: return 'Pending Review';
                              case 2: return 'Docs Verification';
                              case 3: return 'Credit Review';
                              case 4: return 'Credit Review';
                              case 5: return 'Credit Review';
                              case 6: return 'Internal Audit';
                              case 7: return 'Pending Disbursement';
                              case 8: return 'Approved';
                              default: return 'Pending Review';
                            }
                          };

                          const nextStatus = isStaff ? getStaffStatus(nextIdx) : getStatusForNodeIndex(nextIdx);
                          const newLog: OperationLogEntry = {
                            id: Math.random().toString(36).substring(7),
                            timestamp: new Date().toISOString(),
                            actor: currentUser.name,
                            action: 'APPROVE',
                            comment: commentText || defaultComment
                          };
                          const updated: ReviewRequest = {
                            ...inv,
                            currentNodeIndex: nextIdx,
                            status: nextStatus,
                            startDate: (currentNodeIndex === 3 || currentNodeIndex === 4) ? startDate : inv.startDate,
                            selectedBankGL: selectedBankGL,
                            approvalComment: commentText,
                            operationLogs: [newLog, ...(inv.operationLogs || [])]
                          };
                          if (onUpdateRequest) {
                            onUpdateRequest(updated);
                          }
                          setSelectedLoan(updated);
                          setCommentText('');
                        }}
                        className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.15em] text-sm rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95"
                      >
                        APPROVE & PROCEED
                      </button>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => {
                              setReturnReason(commentText || '');
                              setIsReturnConfirmOpen(true);
                            }}
                            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                          >
                            <span className="material-symbols-outlined text-[14px]">undo</span>
                            RETURN
                          </button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setRejectReason(commentText || '');
                            setIsRejectConfirmOpen(true);
                          }}
                          className="w-full py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-900/30"
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          REJECT
                        </button>
                      </div>

                      {/* Blacklist Customer Button */}
                      <div>
                        <button 
                          type="button"
                          onClick={() => {
                            setBlacklistReason(commentText || '');
                            setIsBlacklistConfirmOpen(true);
                          }}
                          className="w-full py-3 bg-red-600/10 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white border border-red-200 dark:border-red-800 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group"
                        >
                          <span className="material-symbols-outlined text-[16px] text-red-600 group-hover:text-white transition-colors">gavel</span>
                          BLACKLIST CUSTOMER (FRAUD FLAG)
                        </button>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RETURN TO:</p>
                        <select 
                          value={returnStage}
                          onChange={(e) => setReturnStage(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-black uppercase focus:ring-2 focus:ring-primary"
                        >
                          <option value="Submission">Submission (Returned)</option>
                          <option value="Sales Verification">Sales Verification</option>
                          <option value="Customer Experience Review">Customer Experience Review</option>
                        </select>
                      </div>
                    </>
                  )}
               </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                   <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">TIMELINE & HISTORY</h5>
                </div>
              </div>
              
              {inv.operationLogs && inv.operationLogs.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {inv.operationLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 pb-2 last:pb-0">
                      <div className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                        <span>{log.actor} ({log.action})</span>
                        <span className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1 leading-relaxed">
                        {log.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 opacity-30">
                  <span className="material-symbols-outlined text-4xl mb-2">event_repeat</span>
                  <p className="text-[9px] font-black uppercase tracking-widest">No historical logs yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Return Confirmation Modal */}
        {isReturnConfirmOpen && selectedLoan && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">undo</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Application Return</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Application {selectedLoan.referenceId} • {selectedLoan.applicant.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">info</span>
                  Workflow Stage Rollback
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                  Returning this loan application will roll the workflow status back to the selected stage so that the originating team or credit officer can rectify discrepancies, update figures, or provide missing verification documents.
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
                    <option value="Submission">Stage 0: Submission (Returned)</option>
                    <option value="Sales Verification">Stage 1: Sales Verification</option>
                    <option value="Customer Experience Review">Stage 2: Customer Experience Review</option>
                    <option value="Credit Analysis">Stage 3: Credit Analysis</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Return Reason / Audit Note <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="State the reason for return (e.g. invalid bank statement upload, missing guarantor verification, incorrect employer details, indemnity clarification needed)..."
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
                    let targetIndex = 0;
                    if (returnStage === 'Sales Verification' || returnStage === 'sales' || returnStage === 'SALES') {
                      targetIndex = 1;
                    } else if (returnStage === 'Customer Experience Review' || returnStage === 'review' || returnStage === 'REVIEW') {
                      targetIndex = 2;
                    } else if (returnStage === 'Credit Analysis' || returnStage === 'credit' || returnStage === 'CREDIT') {
                      targetIndex = 3;
                    }
                    
                    const nextStatus = getStatusForNodeIndex(targetIndex);
                    const reason = returnReason || commentText || `Returned loan application to stage: ${returnStage}`;
                    
                    const newLog: OperationLogEntry = {
                      id: Math.random().toString(36).substring(7),
                      timestamp: new Date().toISOString(),
                      actor: currentUser.name,
                      action: 'RETURN',
                      comment: `Application returned to stage '${returnStage}'. Note: ${reason}`
                    };

                    const updated: ReviewRequest = {
                      ...selectedLoan,
                      currentNodeIndex: targetIndex,
                      status: nextStatus,
                      approvalComment: reason,
                      operationLogs: [newLog, ...(selectedLoan.operationLogs || [])]
                    };

                    if (onUpdateRequest) {
                      onUpdateRequest(updated);
                    }
                    setSelectedLoan(updated);
                    setIsReturnConfirmOpen(false);
                    setCommentText('');
                    setReturnReason('');
                    setToastMessage({
                      text: `Application #${selectedLoan.referenceId} returned to ${returnStage} successfully.`,
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

        {/* Rejection Confirmation Modal with 45-Day Auto-Rejection Cooling Explanation */}
        {isRejectConfirmOpen && selectedLoan && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">cancel</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Loan Rejection</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Application {selectedLoan.referenceId} • {selectedLoan.applicant.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">warning</span>
                  45-Day Auto-Rejection Cooling Rule
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                  Rejecting this application will register the customer's BVN (<span className="font-mono font-black">{selectedLoan.applicant.bvn || '222****9901'}</span>) for a <span className="underline font-black">45-day auto-rejection cooling policy</span>. If a salesperson attempts to re-apply for a loan for this customer within 45 days, it will be flagged and automatically rejected.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Rejection Reason / Audit Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify rejection justification (e.g. debt service capacity exceeded, adverse credit bureau rating, incomplete documentation)..."
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
                    const bvn = selectedLoan.applicant.bvn || '22233344455';
                    const coolingExpiry = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
                    const rejectionDt = new Date().toISOString();
                    const reason = rejectReason || commentText || 'Application rejected during credit review.';
                    
                    const newLog: OperationLogEntry = {
                      id: Math.random().toString(36).substring(7),
                      timestamp: rejectionDt,
                      actor: currentUser.name,
                      action: 'REJECT',
                      comment: `Application rejected. 45-day auto-rejection cooling activated for BVN ${bvn} until ${new Date(coolingExpiry).toLocaleDateString()}. Reason: ${reason}`
                    };

                    const updated: ReviewRequest = {
                      ...selectedLoan,
                      status: 'Declined',
                      rejectionDate: rejectionDt,
                      rejectionCoolingExpiryDate: coolingExpiry,
                      rejectionReason: reason,
                      applicant: {
                        ...selectedLoan.applicant,
                        bvn: bvn,
                        rejectionDate: rejectionDt,
                        rejectionCoolingExpiryDate: coolingExpiry,
                        rejectionReason: reason
                      },
                      approvalComment: reason,
                      operationLogs: [newLog, ...(selectedLoan.operationLogs || [])]
                    };

                    if (onUpdateRequest) {
                      onUpdateRequest(updated);
                    }
                    setSelectedLoan(updated);
                    setIsRejectConfirmOpen(false);
                    setCommentText('');
                    setToastMessage({
                      text: `Application #${selectedLoan.referenceId} rejected. BVN ${bvn} registered for 45-day auto-rejection cooling.`,
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

        {/* Blacklist Confirmation Modal with Fraud Flag Enforcement (6 Months) */}
        {isBlacklistConfirmOpen && selectedLoan && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark border-2 border-red-500/50 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
                  <span className="material-symbols-outlined text-2xl">gavel</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Blacklist & Flag Fraud</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Customer: {selectedLoan.applicant.name} • BVN: {selectedLoan.applicant.bvn || '222****9901'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2.5">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300 text-xs font-black uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">security</span>
                  Fraud Blacklist Enforcement (6 Months)
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">
                  This will attach an active <span className="font-black underline">FRAUD FLAG</span> to this customer's record and blacklist their BVN across the entire platform.
                </p>
                <ul className="text-[11px] text-red-800 dark:text-red-200 font-bold space-y-1.5 pl-4 list-disc">
                  <li><strong>6-Month Re-application Ban:</strong> Customer BVN is strictly prohibited from re-applying for loans for at least 180 days.</li>
                  <li><strong>Visible Fraud Badge:</strong> Prominently displayed across all customer directories, loan queues, and application searches.</li>
                  <li><strong>Immediate Loan Decline:</strong> Current application #{selectedLoan.referenceId} is declined immediately.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Fraud Justification / Blacklist Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="State precise reason for blacklist & fraud flag (e.g. forged bank statements, identity impersonation, fabricated employment records, falsified documents)..."
                  className="w-full h-28 bg-slate-50 dark:bg-background-dark/50 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBlacklistConfirmOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bvn = selectedLoan.applicant.bvn || '22233344455';
                    const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
                    const actionDt = new Date().toISOString();
                    const reason = blacklistReason || commentText || 'Customer blacklisted due to suspected fraud and compliance violation.';
                    
                    const newLog: OperationLogEntry = {
                      id: Math.random().toString(36).substring(7),
                      timestamp: actionDt,
                      actor: currentUser.name,
                      action: 'BLACKLIST',
                      comment: `FRAUD FLAG ACTIVATED & CUSTOMER BLACKLISTED: BVN ${bvn} banned from loan re-application until ${new Date(expiry).toLocaleDateString()} (6-month rule). Reason: ${reason}`
                    };

                    const updated: ReviewRequest = {
                      ...selectedLoan,
                      status: 'Declined',
                      isBlacklisted: true,
                      fraudFlag: true,
                      fraudReason: reason,
                      blacklistDate: actionDt,
                      blacklistExpiryDate: expiry,
                      blacklistReason: reason,
                      applicant: {
                        ...selectedLoan.applicant,
                        bvn: bvn,
                        isBlacklisted: true,
                        fraudFlag: true,
                        fraudReason: reason,
                        blacklistDate: actionDt,
                        blacklistExpiryDate: expiry,
                        blacklistReason: reason
                      },
                      approvalComment: reason,
                      operationLogs: [newLog, ...(selectedLoan.operationLogs || [])]
                    };

                    if (onUpdateRequest) {
                      onUpdateRequest(updated);
                    }
                    setSelectedLoan(updated);
                    setIsBlacklistConfirmOpen(false);
                    setCommentText('');
                    setToastMessage({
                      text: `Customer ${selectedLoan.applicant.name} (BVN: ${bvn}) is now BLACKLISTED with an active FRAUD FLAG for 6 months.`,
                      type: 'error'
                    });
                  }}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">gavel</span>
                  Confirm Blacklist & Flag Fraud
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (subView === 'dashboard') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 relative">
        <LoanDashboardView requests={requests} currentUser={currentUser} users={users} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toastMessage && (
        <div id="toast-notification-panel" className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 bg-rose-50 dark:bg-rose-950/95 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-100 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300 max-w-[420px]">
          <span className="material-symbols-outlined text-[20px] shrink-0 text-rose-500 font-black">warning</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Limit Enforced</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug mt-0.5">{toastMessage.text}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="shrink-0 p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-[16px] block">close</span>
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {subView === 'dashboard' ? 'Loans Dashboard' : subView === 'business' ? 'Business Loans' : subView === 'mobile' ? 'Mobile App Loans' : subView === 'staff' ? 'Staff Loans' : 'Loans'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">
            {subView === 'dashboard' 
              ? 'High-level analytics and summary of all active & pending loan applications.' 
              : subView === 'business'
              ? 'Commercial, corporate, SME, and working capital business loan applications.'
              : subView === 'mobile' 
              ? 'Loan applications originating from NOLT Mobile App customers.' 
              : subView === 'staff' 
              ? 'Dedicated staff loan management with maker-checker workflow.' 
              : 'Comprehensive management of historical and ongoing loan transactions.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentUser.role === 'Finance' && selectedIds.size > 0 && (
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-2xl">
               <div className="relative">
                 <select
                   id="bulk-bank-gl-select"
                   value={selectedBulkGL}
                   onChange={(e) => {
                     setSelectedBulkGL(e.target.value);
                     setBulkGLError('');
                   }}
                   className={`bg-white dark:bg-surface-dark border ${bulkGLError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl px-3 py-2 text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:outline-none`}
                 >
                   <option value="">-- SELECT BULK GL BANK --</option>
                   <option value="102001 - GTBank GL Account">102001 - GTBank GL Account</option>
                   <option value="102002 - Access Bank GL Account">102002 - Access Bank GL Account</option>
                   <option value="102003 - Zenith Bank GL Account">102003 - Zenith Bank GL Account</option>
                   <option value="102004 - Providus Bank GL Account">102004 - Providus Bank GL Account</option>
                   <option value="201005 - Treasury Operations GL Account">201005 - Treasury Operations GL Account</option>
                 </select>
               </div>
               <button 
                onClick={() => {
                  if (!selectedBulkGL) {
                    setBulkGLError('true');
                    alert('Please select a GL bank to use for bulk disbursement.');
                    return;
                  }
                  setBulkGLError('');
                  
                  const pendingIds = Array.from(selectedIds).filter(id => {
                    const req = loanRequests.find(r => r.id === id);
                    return req && req.status === 'Pending Disbursement';
                  });

                  if (pendingIds.length === 0) {
                    alert('None of the selected applications are of "Pending Disbursement" status.');
                    return;
                  }

                  if (onBulkStatusUpdate) {
                    onBulkStatusUpdate(
                      pendingIds, 
                      'Approved', 
                      `Bulk disbursed at stage 6 via selected GL Bank: ${selectedBulkGL}`,
                      { selectedBankGL: selectedBulkGL, currentNodeIndex: 7 }
                    );
                    alert(`Successfully bulk disbursed ${pendingIds.length} loan applications using ${selectedBulkGL}.`);
                  }
                  
                  setSelectedIds(new Set());
                  setSelectedBulkGL('');
                }}
                className="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 whitespace-nowrap"
              >
                Confirm Bulk Disbursement ({selectedIds.size})
              </button>
            </div>
          )}
          {subView === 'staff' ? (
            <div className="flex items-center gap-2">
              {isHRRole && (
                <button
                  onClick={() => setIsHRAccessModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/20"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  HR Staff Access Control
                </button>
              )}
              <button 
                onClick={() => {
                  if (!hasStaffLoanAccess) {
                    setToastMessage({
                      text: 'Your account is currently restricted from applying for Staff Loans by HR.',
                      type: 'error'
                    });
                    return;
                  }
                  setIsStaffModalOpen(true);
                }}
                disabled={!hasStaffLoanAccess}
                className={`px-6 py-2.5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-xl ${
                  hasStaffLoanAccess
                    ? 'bg-primary hover:bg-blue-600 shadow-primary/20'
                    : 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">badge</span>
                Apply for Staff Loan
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsNewLoanModalOpen(true)}
              className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Loan
            </button>
          )}
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="px-6 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
            {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export Dataset'}
          </button>
        </div>
      </div>

      {/* Staff Loan Access Restricted Banner if HR revoked access */}
      {subView === 'staff' && !hasStaffLoanAccess && (
        <div className="p-6 bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/30 rounded-3xl my-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-2xl flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-amber-900 dark:text-amber-200 text-base">Staff Loan Access Restricted by HR</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  HR Authorization Required
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-1 leading-relaxed max-w-3xl">
                Your account ({currentUser.name}) is currently restricted from submitting new Staff Loan applications. HR Officers (Blessing Udoh) or HR Managers (Funke Akindele) must select and authorize your profile in Team & Staff Management or the HR Staff Access Control panel.
              </p>
            </div>
          </div>
          {isHRRole && (
            <button 
              onClick={() => setIsHRAccessModalOpen(true)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md self-start md:self-auto flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">verified_user</span>
              Grant Access in HR Panel
            </button>
          )}
        </div>
      )}

      {/* Staff Loan Application Dashboard Hub (renders on Staff Loan View) */}
      {subView === 'staff' && (
        userStaffLoans.length === 0 ? (
          /* EMPTY STATE FOR STAFF WITHOUT LOANS */
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 md:p-12 shadow-sm text-center my-4 animate-in fade-in duration-300 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5">
              <span className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
                STAFF LOAN APPLICATION DASHBOARD
              </span>
              <span className="px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-500/20">
                3.5% STAFF RATE
              </span>
            </div>

            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-4xl">badge</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              No Active Staff Loans
            </h3>
            
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium max-w-xl mx-auto mt-2 leading-relaxed">
              You currently do not have any active or past staff loan records. All confirmed NOLT Finance staff with 6+ months of service can apply for low-interest staff loans up to ₦5,000,000 with instant HRIS eligibility verification.
            </p>

            <div className="flex flex-wrap justify-center gap-3 my-6 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                <span>3.5% Staff Interest</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                <span>No Collateral Required</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                <span>Automated Payroll Deduction</span>
              </div>
            </div>

            <button 
              onClick={() => setIsStaffModalOpen(true)}
              className="px-8 py-3.5 bg-primary hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all inline-flex items-center gap-2.5 transform hover:scale-105"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              <span>Apply for Staff Loan</span>
            </button>
          </div>
        ) : (
          /* POPULATED LIGHT-THEMED STAFF LOAN DASHBOARD HUB */
          <div className="space-y-6 bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white my-4 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
                    STAFF LOAN APPLICATION DASHBOARD
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-500/20">
                    3.5% STAFF RATE
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Staff Loan Hub
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold max-w-2xl mt-1">
                  Apply for low-interest employee loans with direct HRIS eligibility check and automated payroll deduction scheduling.
                </p>
              </div>
            </div>

            {/* The 3 Cards Grid (Outstanding Balance, Total Borrowed, Total Applications) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Outstanding Balance */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between relative overflow-hidden group">
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">OUTSTANDING BALANCE</span>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">₦1,500,000</h4>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">12 Months • ₦129,375/mo payroll deduction</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-500/20 shrink-0">
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                </div>
              </div>

              {/* Total Borrowed */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between relative overflow-hidden group">
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">TOTAL BORROWED</span>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">₦1,500,000</h4>
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Staff Interest Saved: ~₦185,000</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-500/20 shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
              </div>

              {/* Total Applications */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between relative overflow-hidden group">
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">TOTAL APPLICATIONS</span>
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">{userStaffLoans.length} Active</h4>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Current Stage: {userStaffLoans[0]?.status || 'HR Officer Review'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
                  <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
                </div>
              </div>

            </div>

            {/* Perks & Repayment Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Perks of NOLT Staff Loan */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-amber-500 text-xl">auto_awesome</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Perks of NOLT Staff Loan</h4>
                  </div>
                  <ul className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                      <span>Staff interest rate at 3.5% per annum</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                      <span>Zero collateral or third-party guarantor requirement</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                      <span>Automated HRIS confirmation verification</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">check_circle</span>
                      <span>Seamless monthly payroll deduction</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">HRIS Service Threshold: 6+ Months</span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ELIGIBLE FOR STAFF LOAN
                  </span>
                </div>
              </div>

              {/* Repayment Schedule */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Staff Repayment Schedule</h4>
                  </div>
                  <button 
                    onClick={() => {
                      setToastMessage({
                        text: 'Staff loan repayment statement (PDF) export started.',
                        type: 'success'
                      });
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black uppercase text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Export Statement</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[180px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="pb-2">Month</th>
                        <th className="pb-2">Due Date</th>
                        <th className="pb-2">Principal</th>
                        <th className="pb-2">Interest</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800 font-mono text-[11px]">
                      <tr>
                        <td className="py-2.5 text-slate-900 dark:text-white font-bold">M1 (May 2025)</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">15 May 2025</td>
                        <td className="py-2.5 text-slate-900 dark:text-white">₦125,000</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">₦4,375</td>
                        <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">PAID</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-900 dark:text-white font-bold">M2 (Jun 2025)</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">15 Jun 2025</td>
                        <td className="py-2.5 text-slate-900 dark:text-white">₦125,000</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">₦4,375</td>
                        <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">PAID</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-900 dark:text-white font-bold">M3 (Jul 2025)</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">15 Jul 2025</td>
                        <td className="py-2.5 text-slate-900 dark:text-white">₦125,000</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">₦4,375</td>
                        <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black">UPCOMING</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-900 dark:text-white font-bold">M4 (Aug 2025)</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">15 Aug 2025</td>
                        <td className="py-2.5 text-slate-900 dark:text-white">₦125,000</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">₦4,375</td>
                        <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-black">SCHEDULED</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )
      )}
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input 
            type="text" 
            placeholder="Search by ID or name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary text-sm font-black transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 dark:bg-slate-700 text-primary focus:ring-primary cursor-pointer transition-all"
                    checked={filteredLoans.length > 0 && selectedIds.size === filteredLoans.length}
                    onChange={() => {
                        if (selectedIds.size === filteredLoans.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(filteredLoans.map(r => r.id)));
                    }}
                  />
                </th>
                <th className="px-6 py-5">Borrower</th>
                <th className="px-6 py-5">Reference</th>
                <th className="px-6 py-5">Product</th>
                <th className="px-6 py-5">Indemnity</th>
                <th className="px-6 py-5">Current Node</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLoans.map((req) => {
                const node = getApprovalNode(req.status);
                const isChecked = selectedIds.has(req.id);
                return (
                  <tr 
                    key={req.id} 
                    onClick={() => setSelectedLoan(req)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${isChecked ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  >
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 dark:bg-slate-700 text-primary focus:ring-primary cursor-pointer"
                        checked={isChecked}
                        onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(req.id)) next.delete(req.id);
                            else next.add(req.id);
                            setSelectedIds(next);
                        }}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img src={req.applicant.avatar} className="w-10 h-10 rounded-xl" alt="" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wide group-hover:text-primary transition-colors">{req.applicant.name}</p>
                            {(req.fraudFlag || req.isBlacklisted || req.applicant?.fraudFlag || req.applicant?.isBlacklisted) && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-wider border border-red-300 dark:border-red-900 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">gavel</span> FRAUD
                              </span>
                            )}
                            {req.status === 'Declined' && (req.rejectionCoolingExpiryDate || req.applicant?.rejectionCoolingExpiryDate) && !(req.fraudFlag || req.isBlacklisted || req.applicant?.fraudFlag) && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[8px] font-black uppercase tracking-wider border border-amber-300 dark:border-amber-900">
                                45D COOLING
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-500">{req.applicant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-[11px] font-bold text-slate-500">{req.referenceId}</td>
                    <td className="px-6 py-5 text-xs font-black uppercase text-slate-500">{req.loanProduct || req.type}</td>
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
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${node.color}`}>
                        {node.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900 dark:text-white">{req.amount}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        (req.fraudFlag || req.isBlacklisted || req.applicant?.fraudFlag || req.applicant?.isBlacklisted)
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                          : req.status === 'Declined'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            : req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {(req.fraudFlag || req.isBlacklisted || req.applicant?.fraudFlag || req.applicant?.isBlacklisted) ? 'Blacklisted (Fraud)' : req.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all">chevron_right</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {isReturnConfirmOpen && selectedLoan && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">undo</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Application Return</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Application {selectedLoan.referenceId} • {selectedLoan.applicant.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">info</span>
                Workflow Stage Rollback
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                Returning this loan application will roll the workflow status back to the selected stage so that the originating team or credit officer can rectify discrepancies, update figures, or provide missing verification documents.
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
                  <option value="Submission">Stage 0: Submission (Returned)</option>
                  <option value="Sales Verification">Stage 1: Sales Verification</option>
                  <option value="Customer Experience Review">Stage 2: Customer Experience Review</option>
                  <option value="Credit Analysis">Stage 3: Credit Analysis</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Return Reason / Audit Note <span className="text-amber-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="State the reason for return (e.g. invalid bank statement upload, missing guarantor verification, incorrect employer details, indemnity clarification needed)..."
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
                  let targetIndex = 0;
                  if (returnStage === 'Sales Verification' || returnStage === 'sales' || returnStage === 'SALES') {
                    targetIndex = 1;
                  } else if (returnStage === 'Customer Experience Review' || returnStage === 'review' || returnStage === 'REVIEW') {
                    targetIndex = 2;
                  } else if (returnStage === 'Credit Analysis' || returnStage === 'credit' || returnStage === 'CREDIT') {
                    targetIndex = 3;
                  }
                  
                  const nextStatus = getStatusForNodeIndex(targetIndex);
                  const reason = returnReason || commentText || `Returned loan application to stage: ${returnStage}`;
                  
                  const newLog: OperationLogEntry = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toISOString(),
                    actor: currentUser.name,
                    action: 'RETURN',
                    comment: `Application returned to stage '${returnStage}'. Note: ${reason}`
                  };

                  const updated: ReviewRequest = {
                    ...selectedLoan,
                    currentNodeIndex: targetIndex,
                    status: nextStatus,
                    approvalComment: reason,
                    operationLogs: [newLog, ...(selectedLoan.operationLogs || [])]
                  };

                  if (onUpdateRequest) {
                    onUpdateRequest(updated);
                  }
                  setSelectedLoan(updated);
                  setIsReturnConfirmOpen(false);
                  setCommentText('');
                  setReturnReason('');
                  setToastMessage({
                    text: `Application #${selectedLoan.referenceId} returned to ${returnStage} successfully.`,
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

      {/* Rejection Confirmation Modal with 45-Day Auto-Rejection Cooling Explanation */}
      {isRejectConfirmOpen && selectedLoan && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">cancel</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Loan Rejection</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Application {selectedLoan.referenceId} • {selectedLoan.applicant.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">warning</span>
                45-Day Auto-Rejection Cooling Rule
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                Rejecting this application will register the customer's BVN (<span className="font-mono font-black">{selectedLoan.applicant.bvn || '222****9901'}</span>) for a <span className="underline font-black">45-day auto-rejection cooling policy</span>. If a salesperson attempts to re-apply for a loan for this customer within 45 days, it will be flagged and automatically rejected.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Rejection Reason / Audit Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify rejection justification (e.g. debt service capacity exceeded, adverse credit bureau rating, incomplete documentation)..."
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
                  const bvn = selectedLoan.applicant.bvn || '22233344455';
                  const coolingExpiry = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
                  const rejectionDt = new Date().toISOString();
                  const reason = rejectReason || commentText || 'Application rejected during credit review.';
                  
                  const newLog: OperationLogEntry = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: rejectionDt,
                    actor: currentUser.name,
                    action: 'REJECT',
                    comment: `Application rejected. 45-day auto-rejection cooling activated for BVN ${bvn} until ${new Date(coolingExpiry).toLocaleDateString()}. Reason: ${reason}`
                  };

                  const updated: ReviewRequest = {
                    ...selectedLoan,
                    status: 'Declined',
                    rejectionDate: rejectionDt,
                    rejectionCoolingExpiryDate: coolingExpiry,
                    rejectionReason: reason,
                    applicant: {
                      ...selectedLoan.applicant,
                      bvn: bvn,
                      rejectionDate: rejectionDt,
                      rejectionCoolingExpiryDate: coolingExpiry,
                      rejectionReason: reason
                    },
                    approvalComment: reason,
                    operationLogs: [newLog, ...(selectedLoan.operationLogs || [])]
                  };

                  if (onUpdateRequest) {
                    onUpdateRequest(updated);
                  }
                  setSelectedLoan(updated);
                  setIsRejectConfirmOpen(false);
                  setCommentText('');
                  setToastMessage({
                    text: `Application #${selectedLoan.referenceId} rejected. BVN ${bvn} registered for 45-day auto-rejection cooling.`,
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

      {/* Blacklist Confirmation Modal with Fraud Flag Enforcement (6 Months) */}
      {isBlacklistConfirmOpen && selectedLoan && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark border-2 border-red-500/50 rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Blacklist & Flag Fraud</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Customer: {selectedLoan.applicant.name} • BVN: {selectedLoan.applicant.bvn || '222****9901'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2.5">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 text-xs font-black uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">security</span>
                Fraud Blacklist Enforcement (6 Months)
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">
                This will attach an active <span className="font-black underline">FRAUD FLAG</span> to this customer's record and blacklist their BVN across the entire platform.
              </p>
              <ul className="text-[11px] text-red-800 dark:text-red-200 font-bold space-y-1.5 pl-4 list-disc">
                <li><strong>6-Month Re-application Ban:</strong> Customer BVN is strictly prohibited from re-applying for loans for at least 180 days.</li>
                <li><strong>Visible Fraud Badge:</strong> Prominently displayed across all customer directories, loan queues, and application searches.</li>
                <li><strong>Immediate Loan Decline:</strong> Current application #{selectedLoan.referenceId} is declined immediately.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Fraud Justification / Blacklist Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder="State precise reason for blacklist & fraud flag (e.g. forged bank statements, identity impersonation, fabricated employment records, falsified documents)..."
                className="w-full h-28 bg-slate-50 dark:bg-background-dark/50 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBlacklistConfirmOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const bvn = selectedLoan.applicant.bvn || '22233344455';
                  const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
                  const actionDt = new Date().toISOString();
                  const reason = blacklistReason || commentText || 'Customer blacklisted due to suspected fraud and compliance violation.';
                  
                  const newLog: OperationLogEntry = {
                    id: Math.random().toString(36).substring(7),
                    timestamp: actionDt,
                    actor: currentUser.name,
                    action: 'BLACKLIST',
                    comment: `FRAUD FLAG ACTIVATED & CUSTOMER BLACKLISTED: BVN ${bvn} banned from loan re-application until ${new Date(expiry).toLocaleDateString()} (6-month rule). Reason: ${reason}`
                  };

                  const updated: ReviewRequest = {
                    ...selectedLoan,
                    status: 'Declined',
                    isBlacklisted: true,
                    fraudFlag: true,
                    fraudReason: reason,
                    blacklistDate: actionDt,
                    blacklistExpiryDate: expiry,
                    blacklistReason: reason,
                    applicant: {
                      ...selectedLoan.applicant,
                      bvn: bvn,
                      isBlacklisted: true,
                      fraudFlag: true,
                      fraudReason: reason,
                      blacklistDate: actionDt,
                      blacklistExpiryDate: expiry,
                      blacklistReason: reason
                    },
                    approvalComment: reason,
                    operationLogs: [newLog, ...(selectedLoan.operationLogs || [])]
                  };

                  if (onUpdateRequest) {
                    onUpdateRequest(updated);
                  }
                  setSelectedLoan(updated);
                  setIsBlacklistConfirmOpen(false);
                  setCommentText('');
                  setToastMessage({
                    text: `Customer ${selectedLoan.applicant.name} (BVN: ${bvn}) is now BLACKLISTED with an active FRAUD FLAG for 6 months.`,
                    type: 'error'
                  });
                }}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">gavel</span>
                Confirm Blacklist & Flag Fraud
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportFieldsModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onConfirm={() => setIsExportModalOpen(false)} 
        categories={LOAN_EXPORT_CATEGORIES} 
      />
      <NewLoanModal 
        isOpen={isNewLoanModalOpen} 
        onClose={() => setIsNewLoanModalOpen(false)} 
        requests={requests}
        onAddRequest={(newReq) => {
          if (onAddRequest) {
            onAddRequest(newReq);
          }
          setIsNewLoanModalOpen(false);
          setToastMessage({
            text: `Loan application ${newReq.referenceId} created successfully!`,
            type: 'success'
          });
        }}
      />
      <NewStaffLoanModal 
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        currentUser={currentUser}
        onSubmit={(newReq) => {
          if (onAddRequest) {
            onAddRequest(newReq);
          }
          setIsStaffModalOpen(false);
          setToastMessage({
            text: `Staff loan application ${newReq.referenceId} submitted successfully and routed to HR Officer!`,
            type: 'success'
          });
        }}
      />
      <HRStaffLoanAccessModal
        isOpen={isHRAccessModalOpen}
        onClose={() => setIsHRAccessModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onUpdateUserAccess={(userId, hasAccess) => {
          setUsers(prev => prev.map(u => {
            if (u.id === userId) {
              return {
                ...u,
                hasStaffLoanAccess: hasAccess,
                staffLoanAccessGrantedBy: `${currentUser.name} (${currentUser.role})`,
                staffLoanAccessUpdatedAt: new Date().toISOString().split('T')[0]
              };
            }
              return u;
          }));
        }}
        onBulkSyncHRIS={() => {
          setUsers(prev => prev.map(u => ({
            ...u,
            hasStaffLoanAccess: u.status === 'Active',
            hrisSyncStatus: 'Synced'
          })));
        }}
      />
    </div>
  );
};

export default LoanView;
