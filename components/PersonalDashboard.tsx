import React, { useState } from 'react';
import { User, ReviewRequest, AppView } from '../types';
import ReviewQueue from './ReviewQueue';
import StaffLoanProgressModal from './StaffLoanProgressModal';

interface PersonalDashboardProps {
  currentUser: User;
  requests: ReviewRequest[];
  onNavigate: (view: AppView) => void;
  onSelectRequest: (id: string) => void;
  onOpenNewLoanModal: () => void;
  onOpenLoanCalculator: () => void;
  onOpenSupportModal: () => void;
  insights: string | null;
  isAnalyzing: boolean;
  onGenerateInsights: () => void;
  isCopied: boolean;
  onCopyReferral: () => void;
}

const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  currentUser,
  requests,
  onNavigate,
  onSelectRequest,
  onOpenNewLoanModal,
  onOpenLoanCalculator,
  onOpenSupportModal,
  insights,
  isAnalyzing,
  onGenerateInsights,
  isCopied,
  onCopyReferral,
}) => {
  const [showStatementToast, setShowStatementToast] = useState(false);
  const [isStaffProgressModalOpen, setIsStaffProgressModalOpen] = useState(false);

  const handleDownloadStatement = () => {
    setShowStatementToast(true);
    setTimeout(() => setShowStatementToast(false), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Toast Notification for Statement Download */}
      {showStatementToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-emerald-400 text-xl">download_done</span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">Statement Download Initiated</p>
            <p className="text-[11px] text-slate-400">Your staff loan account statement (PDF) is downloading...</p>
          </div>
        </div>
      )}

      {/* AI Assistant Banner */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent border border-primary/20 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-[20px] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40">
            <span className="material-symbols-outlined text-2xl animate-pulse">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">AI Assistant Intelligence</h4>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm font-black">
              {isAnalyzing ? "Analyzing current loan applications and repayment metrics..." : (insights || "Generate smart automated analysis for your active staff loans and team queues.")}
            </p>
          </div>
          <button 
            onClick={onGenerateInsights}
            disabled={isAnalyzing}
            className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-xs font-black rounded-2xl transition-all disabled:opacity-50 uppercase tracking-[0.15em] shadow-xl shadow-primary/20 shrink-0"
          >
            {isAnalyzing ? "Thinking..." : (insights ? "Refresh Analysis" : "Generate Analysis")}
          </button>
        </div>
      </div>

      {/* Top Personal Section Grid: Profile Banner + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Personalized Welcome Card (8 cols) */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white p-8 shadow-2xl border border-blue-500/30 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-400/30 transition-all duration-700"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-[10px] font-black uppercase tracking-widest border border-white/10">
                STAFF PROFILE PORTAL
              </span>
              <div className="flex flex-col items-end gap-1">
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/10 shadow-lg">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <span className="text-amber-300 font-black text-[11px] uppercase tracking-widest bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                  {currentUser.staffBadgeTier || 'Bronze'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Welcome back,</p>
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">{currentUser.name}</h3>
              <div className="flex flex-wrap items-center gap-2.5 text-blue-200 text-xs font-bold mt-2">
                <span className="bg-blue-900/60 px-3 py-1 rounded-lg border border-blue-400/30 font-mono text-sm">
                  {currentUser.staffCode || 'NT-127'}
                </span>
                <span>•</span>
                <span>{currentUser.staffDepartment || 'Information Technology'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-black flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Confirmed Staff
                </span>
              </div>
            </div>

            {/* Peculiar Staff Metric Boxes */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/15 transition-all">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {currentUser.approvedLoansCount ?? 20}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-100 mt-1">
                  Approved loans
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/15 transition-all">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {currentUser.investmentsBookedCount ?? 3}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-100 mt-1">
                  investments booked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HRIS Information & Notification Area (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-surface-dark p-7 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl font-black">badge</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">HRIS Info & Feed</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[9px] font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                HRIS SYNCED
              </span>
            </div>

            <div className="space-y-3">
              {/* Notification 1: Active Loan Progress */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="font-mono text-primary font-black text-[11px]">SL-90210</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">10m ago</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-snug">
                  Application forwarded to <span className="text-primary font-black">HR Officer Queue</span> for salary & confirmation check.
                </p>
                <button
                  onClick={() => setIsStaffProgressModalOpen(true)}
                  className="w-full mt-1 py-1.5 px-3 bg-primary hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  <span>Track Loan Activity</span>
                </button>
              </div>

              {/* Notification 2: HRIS Payroll Deduction */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">HRIS Payroll Verified</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">1d ago</span>
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] leading-snug">
                  Automated monthly payroll deduction of <span className="font-mono text-slate-900 dark:text-white font-black">₦129,375</span> scheduled.
                </p>
              </div>

              {/* Notification 3: Staff Rate Info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">3.5% Staff Rate Active</span>
                  <span className="text-[9px] font-bold text-slate-400">2d ago</span>
                </div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Confirmed staff eligibility tier auto-applied via HR manual v2.4.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsStaffProgressModalOpen(true)}
            className="w-full text-center text-xs font-black text-primary hover:text-blue-600 uppercase tracking-wider pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1 mt-3"
          >
            <span>View Full Loan Progress Modal</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </div>

      </div>



      {/* Quick Actions & Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Advert Banner: Apply for Staff Loan (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 p-7 rounded-[32px] border border-blue-100 dark:border-blue-900/50 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                STAFF LOAN ELIGIBILITY
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Apply for a Staff Loan</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-bold leading-relaxed max-w-sm">
                Check your eligibility and apply for staff loans at very affordable interest rates!
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-3xl">add_notes</span>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={onOpenNewLoanModal}
              className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2 group hover:scale-[1.02]"
            >
              <span>Start New Application</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Toolbar (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="material-symbols-outlined text-amber-500 text-xl font-black">bolt</span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Quick Actions</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              onClick={onOpenNewLoanModal}
              className="p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">post_add</span>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Apply Loan</span>
            </button>

            <button
              onClick={onOpenLoanCalculator}
              className="p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">calculate</span>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Loan Calculator</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">calendar_month</span>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Repayment Schedule</span>
            </button>

            <button
              onClick={handleDownloadStatement}
              className="p-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex flex-col items-center text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">file_download</span>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">Download Statement</span>
            </button>
          </div>
        </div>

        {/* Need Help? We're here for you Support Card (3 cols) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 rounded-[32px] shadow-xl border border-indigo-700/40 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <span className="material-symbols-outlined text-2xl">headset_mic</span>
            </div>
            <h4 className="text-lg font-black text-white tracking-tight">Need Help? We're here for you!</h4>
            <p className="text-indigo-200 text-xs font-bold leading-relaxed">
              Our dedicated staff loan support team is ready to assist you with any questions.
            </p>
          </div>

          <div className="pt-4 relative z-10">
            <button
              onClick={onOpenSupportModal}
              className="w-full py-2.5 bg-white text-indigo-950 hover:bg-blue-50 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              Contact Support
            </button>
          </div>
        </div>

      </div>


      {/* Referral CTA Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-slate-900 dark:bg-slate-800 p-8 shadow-2xl border border-slate-800 dark:border-slate-700 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-primary/20 duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24 transition-all group-hover:bg-blue-500/20 duration-700"></div>
        
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/20 transform group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-3xl">share_reviews</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">SHARE YOUR REFERRAL LINK</h3>
              <p className="text-slate-400 text-sm font-medium">Share your unique referral link for easy performance tracking and rewards</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:w-64 px-4 py-3 bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
              <span className="text-slate-300 text-xs font-mono truncate">nolt.finance/join?ref={currentUser.id.toUpperCase()}-{currentUser.name.split(' ')[0].toUpperCase()}</span>
              <span className="material-symbols-outlined text-slate-500 text-sm">link</span>
            </div>
            <button 
              onClick={onCopyReferral}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all duration-300 min-w-[160px] ${
                isCopied 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCopied ? 'check_circle' : 'content_copy'}
              </span>
              {isCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* System Review Queue Section */}
      <div className="pt-4">
        <ReviewQueue 
          requests={requests} 
          onViewAll={() => onNavigate('queue')} 
          onSelectRequest={onSelectRequest} 
        />
      </div>

      {/* State 2: Staff Loan Progress & Activity Modal */}
      <StaffLoanProgressModal 
        isOpen={isStaffProgressModalOpen} 
        onClose={() => setIsStaffProgressModalOpen(false)} 
      />

    </div>
  );
};

export default PersonalDashboard;
