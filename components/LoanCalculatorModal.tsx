import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoanCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyForLoan?: (calculatedAmount: number, tenureMonths: number) => void;
}

const LoanCalculatorModal: React.FC<LoanCalculatorModalProps> = ({ isOpen, onClose, onApplyForLoan }) => {
  const [loanAmount, setLoanAmount] = useState<number>(1500000);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(3.5); // % per month

  if (!isOpen) return null;

  // Calculate monthly repayment
  // Flat rate formula for staff loans: Monthly = (Principal / Tenure) + (Principal * Monthly Interest Rate / 100)
  const monthlyPrincipal = loanAmount / tenureMonths;
  const monthlyInterest = loanAmount * (interestRate / 100);
  const monthlyRepayment = monthlyPrincipal + monthlyInterest;
  const totalInterest = monthlyInterest * tenureMonths;
  const totalRepayable = loanAmount + totalInterest;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl max-w-3xl w-full overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-2xl font-black">calculate</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Staff Loan Calculator</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-0.5">Estimate your monthly installments and repayment schedule</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Controls */}
              <div className="space-y-6">
                {/* Loan Amount */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Loan Amount</label>
                    <span className="text-lg font-black text-primary">₦{loanAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={100000}
                    max={10000000}
                    step={100000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>₦100,000</span>
                    <span>₦5,000,000</span>
                    <span>₦10,000,000</span>
                  </div>
                </div>

                {/* Tenure */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Tenure Period</label>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{tenureMonths} Months</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>1 Month</span>
                    <span>12 Months</span>
                    <span>24 Months</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Interest Rate (Monthly)</label>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{interestRate}% / mo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[2.5, 3.5, 4.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setInterestRate(rate)}
                        className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                          interestRate === rate
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {rate}% Rate
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Output Card */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-[28px] p-6 flex flex-col justify-between shadow-xl border border-slate-800">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">ESTIMATED MONTHLY INSTALLMENT</span>
                    <h2 className="text-3xl font-black text-white mt-1">₦{Math.round(monthlyRepayment).toLocaleString()}</h2>
                    <p className="text-[11px] font-bold text-slate-400 mt-1">Deducted automatically from monthly salary</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Principal Amount:</span>
                      <span className="font-black text-white">₦{loanAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Total Interest ({interestRate}% × {tenureMonths}m):</span>
                      <span className="font-black text-emerald-400">₦{Math.round(totalInterest).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-800/80">
                      <span className="text-slate-300 font-bold">Total Repayable:</span>
                      <span className="font-black text-amber-300">₦{Math.round(totalRepayable).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      onClose();
                      onApplyForLoan?.(loanAmount, tenureMonths);
                    }}
                    className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Apply for this Loan</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Repayment Breakdown preview */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">event_note</span>
                Repayment Breakdown Preview
              </h4>

              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-500 font-black uppercase text-[9px] tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Monthly Repayment</th>
                      <th className="px-4 py-3">Principal Portion</th>
                      <th className="px-4 py-3">Interest Portion</th>
                      <th className="px-4 py-3">Remaining Principal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-bold text-slate-700 dark:text-slate-300">
                    {Array.from({ length: Math.min(tenureMonths, 4) }).map((_, i) => {
                      const rem = Math.max(0, loanAmount - (monthlyPrincipal * (i + 1)));
                      return (
                        <tr key={i} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2.5">Month {i + 1}</td>
                          <td className="px-4 py-2.5 font-black text-slate-900 dark:text-white">₦{Math.round(monthlyRepayment).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-slate-500">₦{Math.round(monthlyPrincipal).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">₦{Math.round(monthlyInterest).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-slate-400">₦{Math.round(rem).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {tenureMonths > 4 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-center text-[10px] text-slate-400 italic">
                          ... and {tenureMonths - 4} more monthly installments of ₦{Math.round(monthlyRepayment).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoanCalculatorModal;
