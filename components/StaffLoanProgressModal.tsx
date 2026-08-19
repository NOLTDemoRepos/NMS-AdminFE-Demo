import React from 'react';
import { ReviewRequest } from '../types';

interface StaffLoanProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan?: ReviewRequest | null;
}

const STAFF_LOAN_STAGES = [
  { id: 'submission', label: 'SUBMISSION', icon: 'send', desc: 'Submitted via Staff HRIS' },
  { id: 'hr_officer', label: 'HR OFFICER', icon: 'badge', desc: 'HR Officer Eligibility Check' },
  { id: 'hr_manager', label: 'HR MANAGER', icon: 'verified', desc: 'HR Manager Validation' },
  { id: 'md', label: 'MD', icon: 'military_tech', desc: 'MD Stage Approval' },
  { id: 'credit1', label: 'CREDIT I', icon: 'analytics', desc: 'Credit Risk Assessment I' },
  { id: 'credit2', label: 'CREDIT II', icon: 'analytics', desc: 'Credit Risk Assessment II' },
  { id: 'audit', label: 'AUDIT', icon: 'verified_user', desc: 'Internal Control Audit' },
  { id: 'finance', label: 'FINANCE', icon: 'payments', desc: 'Finance GL Booking' },
  { id: 'disbursed', label: 'DISBURSED', icon: 'done_all', desc: 'Loan Active & Disbursed' },
];

const StaffLoanProgressModal: React.FC<StaffLoanProgressModalProps> = ({ isOpen, onClose, loan }) => {
  if (!isOpen) return null;

  const refId = loan?.referenceId || 'SL-90210';
  const currentNodeIndex = loan?.currentNodeIndex ?? 1; // Default to Stage 2 (HR Officer Review) if not specified
  const amount = loan?.amount || '₦1,500,000';
  const tenor = loan?.tenor || '12 Months';
  const monthlyRepayment = loan?.monthlyRepayment || '₦129,375';
  const isDisbursed = currentNodeIndex >= 8;

  // Mock or real logs
  const logs = loan?.operationLogs && loan.operationLogs.length > 0 ? loan.operationLogs : [
    {
      id: 'log_1',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      actor: loan?.applicant?.name || 'Alex Morgan',
      action: 'SUBMITTED',
      comment: 'Staff Loan Application submitted via HRIS Portal. Confirmation verified (>6 months resumption).'
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      actor: 'HRIS Automated Service',
      action: 'HRIS_VERIFIED',
      comment: 'HRIS System check passed. Base salary verified at ₦480,000/mo. Staff rate tier applied (3.5% p.a.).'
    },
    ...(currentNodeIndex >= 2 ? [{
      id: 'log_3',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      actor: 'Kemi Balogun (HR Officer)',
      action: 'APPROVE',
      comment: 'HR Officer Eligibility Check completed. Employment date and salary confirmed against payroll.'
    }] : []),
    ...(currentNodeIndex >= 3 ? [{
      id: 'log_4',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      actor: 'Victor Eze (HR Manager)',
      action: 'APPROVE',
      comment: 'HR Manager Validation passed. Escalated to MD Stage for executive concurrence.'
    }] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[36px] shadow-2xl w-full max-w-4xl overflow-hidden my-8">
        
        {/* Modal Top Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between border-b border-indigo-900/50 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                STAFF LOAN
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-500/30 font-mono">
                {refId}
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Staff Loan Application Progress & Activity
            </h3>
            <p className="text-indigo-200 text-xs font-bold max-w-xl">
              Real-time audit trail and maker-checker approval status for employee staff loan.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shrink-0 relative z-10"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">

          {/* 8-Node Progress Stepper Bar */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MAKER-CHECKER STAGE PROGRESS</span>
              <span className="text-xs font-black text-primary uppercase tracking-wider">
                Current Node: {STAFF_LOAN_STAGES[currentNodeIndex]?.label || 'HR OFFICER'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {STAFF_LOAN_STAGES.map((stage, idx) => {
                const isPassed = idx < currentNodeIndex;
                const isCurrent = idx === currentNodeIndex;

                return (
                  <div 
                    key={stage.id} 
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center ${
                      isCurrent
                        ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/20'
                        : isPassed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 font-black ${
                      isCurrent ? 'bg-white/20 text-white' : isPassed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{isPassed ? 'check' : stage.icon}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight line-clamp-1">{stage.label}</span>
                    <span className="text-[8px] font-bold opacity-70 mt-0.5">{isPassed ? 'Completed' : isCurrent ? 'Active Node' : 'Pending'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Financial Terms Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">REQUESTED AMOUNT</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{amount}</p>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Staff Loan Rate: 3.5% p.a.</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">REPAYMENT TENOR</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{tenor}</p>
              <span className="text-[9px] font-bold text-slate-500">Fixed Monthly Term</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">MONTHLY PAYROLL DEDUCTION</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{monthlyRepayment}</p>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Automated HRIS Salary Deduction</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">HRIS VERIFIED SALARY</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₦480,000</p>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Confirmed Staff (&gt;6M)</span>
            </div>
          </div>

          {/* Audit Trail & Event Activity Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl font-black">history</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Audit Trail & Activity Logs
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {logs.length} Recorded Events
              </span>
            </div>

            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{log.actor}</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {log.comment && (
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed pl-4 border-l-2 border-primary/30">
                      {log.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Repayment Schedule Preview Table */}
          <div className="space-y-3 bg-slate-900 text-white p-6 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-xl">calendar_month</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Estimated Payroll Repayment Schedule</h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 font-mono">Rate: 3.5% p.a.</span>
            </div>

            <div className="overflow-x-auto max-h-[160px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-widest text-indigo-300 border-b border-slate-800">
                    <th className="pb-2">Month</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2">Principal</th>
                    <th className="pb-2">Interest (3.5%)</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 text-white font-bold">Month 1</td>
                    <td className="py-2.5 text-slate-300">15 Jul 2025</td>
                    <td className="py-2.5 text-white">₦125,000</td>
                    <td className="py-2.5 text-indigo-300">₦4,375</td>
                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black">UPCOMING</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-bold">Month 2</td>
                    <td className="py-2.5 text-slate-300">15 Aug 2025</td>
                    <td className="py-2.5 text-white">₦125,000</td>
                    <td className="py-2.5 text-indigo-300">₦4,375</td>
                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[9px] font-black">SCHEDULED</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-bold">Month 3</td>
                    <td className="py-2.5 text-slate-300">15 Sep 2025</td>
                    <td className="py-2.5 text-white">₦125,000</td>
                    <td className="py-2.5 text-indigo-300">₦4,375</td>
                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[9px] font-black">SCHEDULED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">
            NOLT Finance HRIS Integrated Staff Portal
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffLoanProgressModal;
