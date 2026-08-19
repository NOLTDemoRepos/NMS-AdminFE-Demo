
import React from 'react';
import { RequestStatus, RequestType } from '../types';

interface ApprovalStepperProps {
  status: RequestStatus;
  type: RequestType;
  amount?: string;
  currentNodeIndex?: number;
  isStaffLoan?: boolean;
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

const LOAN_STAGES = [
  { id: 'submission', label: 'SUBMISSION', icon: 'send' },
  { id: 'sales', label: 'SALES', icon: 'person' },
  { id: 'review', label: 'REVIEW', icon: 'headphones' },
  { id: 'credit1', label: 'CREDIT I', icon: 'analytics' },
  { id: 'credit2', label: 'CREDIT II', icon: 'analytics' },
  { id: 'audit', label: 'AUDIT', icon: 'verified_user' },
  { id: 'finance', label: 'FINANCE', icon: 'payments' },
  { id: 'disbursed', label: 'DISBURSED', icon: 'done_all' },
];

const INVESTMENT_STAGES = [
  { id: 'customer_exp', label: 'CUSTOMER EXP.', icon: 'check' },
  { id: 'compliance', label: 'COMPLIANCE', icon: 'check' },
  { id: 'finance', label: 'FINANCE', icon: 'check' },
  { id: 'active', label: 'ACTIVE', icon: 'check' },
];

const LIQUIDATION_STAGES_HIGH = [
  { id: 'liquidation', label: 'LIQUIDATION', icon: 'check' },
  { id: 'cx_team', label: 'CX TEAM', icon: 'check' },
  { id: 'compliance', label: 'COMPLIANCE', icon: 'check' },
  { id: 'md', label: 'MD', icon: 'check' },
  { id: 'finance', label: 'FINANCE', icon: 'check' },
];

const LIQUIDATION_STAGES_LOW = [
  { id: 'liquidation', label: 'LIQUIDATION', icon: 'check' },
  { id: 'cx_team', label: 'CX TEAM', icon: 'check' },
  { id: 'compliance', label: 'COMPLIANCE', icon: 'check' },
  { id: 'finance', label: 'FINANCE', icon: 'check' },
];

const ApprovalStepper: React.FC<ApprovalStepperProps> = ({ status, type, amount, currentNodeIndex, isStaffLoan }) => {
  const isLoan = type === 'Loan';
  const isLiquidation = type === 'Liquidation';
  
  const parseAmount = (amt?: string) => {
    if (!amt) return 0;
    return Number(amt.replace(/[^0-9.-]+/g, ""));
  };

  const amountVal = parseAmount(amount);
  const isHighValue = amountVal > 1000000;

  const getStages = () => {
    if (isStaffLoan) return STAFF_LOAN_STAGES;
    if (isLoan) return LOAN_STAGES;
    if (isLiquidation) return isHighValue ? LIQUIDATION_STAGES_HIGH : LIQUIDATION_STAGES_LOW;
    return INVESTMENT_STAGES;
  };

  const stages = getStages();

  const getActiveIndex = () => {
    if (currentNodeIndex !== undefined) {
      return currentNodeIndex;
    }
    if (isStaffLoan) {
      switch (status) {
        case 'Returned': return 0;
        case 'Pending Review': return 1; // HR Officer
        case 'Docs Verification': return 2; // HR Manager
        case 'Credit Review': return 4; // Credit 1
        case 'Internal Audit': return 6; // Audit
        case 'Pending Disbursement': return 7; // Finance
        case 'Approved': return 8; // Disbursed
        default: return 1;
      }
    }
    if (isLoan) {
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
    } else if (isLiquidation) {
      if (isHighValue) {
        switch (status) {
          case 'Returned': return 0;
          case 'Pending Review': return 1; // CX Team
          case 'Docs Verification': return 2; // Compliance
          case 'Internal Audit': return 3; // MD
          case 'Pending Disbursement': return 4; // Finance
          case 'Approved': return 5;
          default: return 1;
        }
      } else {
        switch (status) {
          case 'Returned': return 0;
          case 'Pending Review': return 1; // CX Team
          case 'Docs Verification': return 2; // Compliance
          case 'Internal Audit':
          case 'Pending Disbursement': return 3; // Finance
          case 'Approved': return 4;
          default: return 1;
        }
      }
    } else {
      switch (status) {
        case 'Returned': return 0;
        case 'Pending Review': return 0; // Customer Exp
        case 'Docs Verification': return 1; // Compliance
        case 'Internal Audit': return 2; // Finance
        case 'Pending Disbursement': return 2; // Finance
        case 'Approved': return 3; // Active
        default: return 0;
      }
    }
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="w-full py-8 px-10">
      <div className="relative flex items-center justify-between max-w-4xl mx-auto">
        {/* Background Line */}
        <div className="absolute top-[20px] left-0 w-full h-[1px] bg-slate-100 dark:bg-slate-800 z-0" />
        
        {stages.map((stage, idx) => {
          const isCompleted = idx <= activeIndex;
          const isActive = idx === activeIndex;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  isCompleted 
                    ? 'bg-white dark:bg-surface-dark text-emerald-500 border-emerald-500 shadow-sm' 
                    : 'bg-white dark:bg-surface-dark text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isCompleted ? 'font-black' : ''}`}>
                  {stage.icon}
                </span>
              </div>
              <div className="mt-4 text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  isCompleted ? 'text-slate-400' : 'text-slate-300'
                }`}>
                  {stage.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalStepper;
