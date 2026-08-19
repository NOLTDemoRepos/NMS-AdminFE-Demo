import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransferTransaction, TransferStatus, ReconciliationStatus, LedgerMovement, User } from '../types';
import { INITIAL_TRANSFERS, NIP_ERROR_CODES, NIGERIAN_BANKS } from '../data/mockTransfers';

interface TransfersViewProps {
  currentUser?: User;
  onBack?: () => void;
}

const TransfersView: React.FC<TransfersViewProps> = ({ currentUser, onBack }) => {
  const [transfers, setTransfers] = useState<TransferTransaction[]>(INITIAL_TRANSFERS);
  const [activeTab, setActiveTab] = useState<'feed' | 'reconciliation' | 'analytics'>('feed');
  const [selectedTransfer, setSelectedTransfer] = useState<TransferTransaction | null>(null);
  const [detailDrawerTab, setDetailDrawerTab] = useState<'overview' | 'ledger' | 'audit' | 'payload'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'All'>('All');
  const [bankFilter, setBankFilter] = useState<string>('All');
  const [errorCodeFilter, setErrorCodeFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | '7days' | '30days'>('All');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [receiptModalTxn, setReceiptModalTxn] = useState<TransferTransaction | null>(null);
  const [reQuerySessionModalOpen, setReQuerySessionModalOpen] = useState(false);
  const [reQuerySessionInput, setReQuerySessionInput] = useState('');
  const [reQueryLoading, setReQueryLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalCount = transfers.length;
    const totalValue = transfers.reduce((acc, t) => acc + t.amount, 0);
    const successful = transfers.filter(t => t.status === 'Successful');
    const failed = transfers.filter(t => t.status === 'Failed');
    const pending = transfers.filter(t => t.status === 'Pending');
    const reversed = transfers.filter(t => t.status === 'Reversed');
    
    const successValue = successful.reduce((acc, t) => acc + t.amount, 0);
    const failedValue = failed.reduce((acc, t) => acc + t.amount, 0);
    const pendingValue = pending.reduce((acc, t) => acc + t.amount, 0);
    const totalFees = transfers.reduce((acc, t) => acc + t.fee + t.vat, 0);
    
    const successRate = totalCount > 0 ? ((successful.length / totalCount) * 100).toFixed(1) : '0.0';
    const failureRate = totalCount > 0 ? (((failed.length + reversed.length) / totalCount) * 100).toFixed(1) : '0.0';

    return {
      totalCount,
      totalValue,
      successCount: successful.length,
      successValue,
      successRate,
      failedCount: failed.length,
      failedValue,
      failureRate,
      pendingCount: pending.length,
      pendingValue,
      reversedCount: reversed.length,
      totalFees
    };
  }, [transfers]);

  // Filtered transactions
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        t.reference.toLowerCase().includes(q) ||
        t.sessionId.toLowerCase().includes(q) ||
        t.narration.toLowerCase().includes(q) ||
        t.sourceAccount.accountName.toLowerCase().includes(q) ||
        t.sourceAccount.accountNumber.includes(q) ||
        t.destinationAccount.beneficiaryName.toLowerCase().includes(q) ||
        t.destinationAccount.accountNumber.includes(q) ||
        t.destinationAccount.bankName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesBank = bankFilter === 'All' || t.destinationAccount.bankName === bankFilter;
      const matchesErrorCode = errorCodeFilter === 'All' || (errorCodeFilter === 'NONE' ? !t.nipResponseCode || t.nipResponseCode === '00' : t.nipResponseCode === errorCodeFilter);

      return matchesSearch && matchesStatus && matchesBank && matchesErrorCode;
    });
  }, [transfers, searchTerm, statusFilter, bankFilter, errorCodeFilter]);

  // Re-query simulation
  const handleReQuery = (txn: TransferTransaction) => {
    setIsProcessingAction(`requery-${txn.id}`);
    setTimeout(() => {
      setIsProcessingAction(null);
      if (txn.status === 'Pending') {
        const updated: TransferTransaction = {
          ...txn,
          status: 'Successful',
          nipResponseCode: '00',
          nipResponseMessage: 'Approved or Completed Successfully',
          reconciliationStatus: 'Matched',
          completedAt: new Date().toISOString(),
          auditTrail: [
            ...txn.auditTrail,
            {
              id: `aud-${Date.now()}`,
              step: 'Manual NIBSS Session Status Query',
              timestamp: new Date().toISOString(),
              actor: currentUser?.name || 'Operations Lead',
              status: 'Completed',
              details: 'Queried NIBSS switch gateway for Session ID ' + txn.sessionId + '. Result: 00 Approved.'
            }
          ]
        };
        setTransfers(prev => prev.map(item => item.id === txn.id ? updated : item));
        if (selectedTransfer?.id === txn.id) setSelectedTransfer(updated);
        showToast(`Session query successful: Transaction #${txn.reference} confirmed SUCCESSFUL.`, 'success');
      } else {
        showToast(`NIBSS Switch status confirmed for #${txn.reference}: Code ${txn.nipResponseCode || '00'} (${txn.nipResponseMessage || 'Verified'}).`, 'success');
      }
    }, 1200);
  };

  // Reverse transaction simulation
  const handleReverseTransaction = (txn: TransferTransaction) => {
    if (txn.status === 'Reversed') {
      showToast('This transaction has already been reversed.', 'warning');
      return;
    }

    setIsProcessingAction(`reverse-${txn.id}`);
    setTimeout(() => {
      setIsProcessingAction(null);
      const reversalLog: LedgerMovement[] = [
        ...txn.ledgerEntries,
        {
          id: `lg-rev-${Date.now()}-1`,
          entryType: 'CREDIT',
          accountType: 'Customer CASA',
          accountNumber: txn.sourceAccount.accountNumber,
          accountName: `${txn.sourceAccount.accountName} - Refund`,
          amount: txn.totalDebited,
          formattedAmount: `₦${txn.totalDebited.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          narration: `MANUAL REVERSAL: Refund for ${txn.reference} - Error: ${txn.nipResponseCode || 'Manual'}`,
          postingRef: `JRNL-MREV-${Math.floor(100000 + Math.random() * 900000)}`,
          postingTimestamp: new Date().toISOString(),
          status: 'POSTED'
        },
        {
          id: `lg-rev-${Date.now()}-2`,
          entryType: 'DEBIT',
          accountType: 'NIP Clearing GL',
          accountNumber: 'GL-200109-NIBSS',
          accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
          amount: txn.amount,
          formattedAmount: `₦${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          narration: `MANUAL REVERSAL: Clearing Release Ref ${txn.reference}`,
          postingRef: `JRNL-MREV-${Math.floor(100000 + Math.random() * 900000)}`,
          postingTimestamp: new Date().toISOString(),
          status: 'POSTED'
        }
      ];

      const updated: TransferTransaction = {
        ...txn,
        status: 'Reversed',
        reconciliationStatus: 'Reversed',
        reversedAt: new Date().toISOString(),
        reversalReason: `Manual reversal triggered by ${currentUser?.name || 'Administrator'} following NIP timeout exception.`,
        sourceAccount: {
          ...txn.sourceAccount,
          balanceAfter: txn.sourceAccount.balanceBefore
        },
        ledgerEntries: reversalLog,
        auditTrail: [
          ...txn.auditTrail,
          {
            id: `aud-${Date.now()}`,
            step: 'Manual Operator Reversal Executed',
            timestamp: new Date().toISOString(),
            actor: currentUser?.name || 'Administrator',
            status: 'Completed',
            details: `Full refund of ₦${txn.totalDebited.toLocaleString(undefined, { minimumFractionDigits: 2 })} credited to customer CASA ${txn.sourceAccount.accountNumber}.`
          }
        ]
      };

      setTransfers(prev => prev.map(item => item.id === txn.id ? updated : item));
      if (selectedTransfer?.id === txn.id) setSelectedTransfer(updated);
      showToast(`Transaction #${txn.reference} successfully REVERSED. Funds refunded to customer CASA.`, 'warning');
    }, 1400);
  };

  // Export CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = ['Reference', 'Session ID', 'Timestamp', 'Sender Name', 'Sender Account', 'Beneficiary Name', 'Beneficiary Account', 'Destination Bank', 'Amount (NGN)', 'Fee', 'VAT', 'Total Debited', 'Status', 'NIP Code', 'Narration', 'Recon Status'];
      const rows = filteredTransfers.map(t => [
        t.reference,
        t.sessionId,
        t.timestamp,
        `"${t.sourceAccount.accountName}"`,
        t.sourceAccount.accountNumber,
        `"${t.destinationAccount.beneficiaryName}"`,
        t.destinationAccount.accountNumber,
        `"${t.destinationAccount.bankName}"`,
        t.amount,
        t.fee,
        t.vat,
        t.totalDebited,
        t.status,
        t.nipResponseCode || 'N/A',
        `"${t.narration.replace(/"/g, '""')}"`,
        t.reconciliationStatus
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `NOLT_NIP_Transfers_Report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      showToast('NIP Transfers CSV report exported successfully.', 'success');
    }, 800);
  };

  // Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Live NIP switch feed refreshed.', 'success');
    }, 600);
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'Successful':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Successful
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Failed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Pending
          </span>
        );
      case 'Reversed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Reversed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            {onBack && (
              <button 
                onClick={onBack}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Dashboard
              </button>
            )}
            {onBack && <span>/</span>}
            <span>MANAGEMENT</span>
            <span>/</span>
            <span className="text-primary font-black">NIP TRANSFERS & SETTLEMENT</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Mobile App Transfers
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              NIBSS Gateway Live
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">
            Real-time NIP instant payments monitoring, double-entry ledger verification, error code analysis, and audit trails.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setReQuerySessionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-800"
          >
            <span className="material-symbols-outlined text-[18px]">search_check</span>
            <span>Query NIBSS Session</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-800"
          >
            <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transfers Value</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ₦{metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.totalCount} transactions logged</span>
            <span className="text-primary font-black">Fee: ₦{metrics.totalFees.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Successful Transfers</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₦{metrics.successValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.successCount} Successful</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-[10px]">
              {metrics.successRate}% Success
            </span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Failed & Reversed</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">error</span>
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            ₦{(metrics.failedValue + metrics.reversedCount * 250000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.failedCount} Failed • {metrics.reversedCount} Reversed</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-black text-[10px]">
              {metrics.failureRate}% Rate
            </span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Pending / In-Doubt</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">hourglass_top</span>
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            ₦{metrics.pendingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.pendingCount} Awaiting Reconciliation</span>
            <span className="text-amber-600 font-black text-[10px]">Auto-Query in 30s</span>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'feed'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Transaction Feed ({filteredTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'reconciliation'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          <span>Reconciliation & GL Settlement</span>
          {metrics.pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black">
              {metrics.pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'analytics'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">monitoring</span>
          <span>Switch Analytics & Error Codes</span>
        </button>
      </div>

      {/* TAB 1: TRANSACTION FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Reference, Session ID, Narration, Sender, Beneficiary, Account, or BVN..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-background-dark/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                  </button>
                )}
              </div>

              {/* Status Pill Filters */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-background-dark rounded-2xl overflow-x-auto w-full lg:w-auto">
                {(['All', 'Successful', 'Failed', 'Pending', 'Reversed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Filters */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank:</span>
                <select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All Destination Banks</option>
                  {NIGERIAN_BANKS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIP Code:</span>
                <select
                  value={errorCodeFilter}
                  onChange={(e) => setErrorCodeFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All NIP Error Codes</option>
                  <option value="00">00 - Success</option>
                  <option value="91">91 - Switch Timeout</option>
                  <option value="51">51 - Insufficient Funds</option>
                  <option value="07">07 - Invalid Account</option>
                  <option value="96">96 - System Malfunction</option>
                  <option value="09">09 - In Progress / In Doubt</option>
                </select>
              </div>

              {(searchTerm || statusFilter !== 'All' || bankFilter !== 'All' || errorCodeFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setBankFilter('All');
                    setErrorCodeFilter('All');
                  }}
                  className="ml-auto text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Txn Ref / Session ID</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source (Initiator)</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination (Beneficiary)</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount & Fees</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narration</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / NIP Code</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 dark:text-slate-600">receipt_long</span>
                          <p className="font-bold">No transfer records found matching your filters.</p>
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('All');
                              setBankFilter('All');
                              setErrorCodeFilter('All');
                            }}
                            className="mt-3 text-xs font-black text-primary uppercase"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((txn) => (
                      <tr 
                        key={txn.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedTransfer(txn);
                          setDetailDrawerTab('overview');
                        }}
                      >
                        {/* Reference & Session ID */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {txn.reference}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={txn.sessionId}>
                              {txn.sessionId}
                            </span>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {new Date(txn.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* Source Account */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                              {txn.sourceAccount.accountName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                              <span>CASA {txn.sourceAccount.accountNumber}</span>
                              <span className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase text-slate-500">
                                {txn.sourceAccount.accountType}
                              </span>
                            </span>
                          </div>
                        </td>

                        {/* Destination Account */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                              {txn.destinationAccount.beneficiaryName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span className="font-mono">{txn.destinationAccount.accountNumber}</span>
                              <span>•</span>
                              <span className="font-bold truncate max-w-[110px]">{txn.destinationAccount.bankName}</span>
                            </span>
                          </div>
                        </td>

                        {/* Amount & Fees */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-slate-900 dark:text-white text-sm">
                              {txn.formattedAmount}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Fee: ₦{(txn.fee + txn.vat).toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Narration */}
                        <td className="py-4 px-6">
                          <p className="font-medium text-slate-600 dark:text-slate-300 text-xs line-clamp-1 max-w-[200px]" title={txn.narration}>
                            {txn.narration}
                          </p>
                        </td>

                        {/* Status & Error Code */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col items-start gap-1">
                            {getStatusBadge(txn.status)}
                            {txn.nipResponseCode && txn.nipResponseCode !== '00' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-mono font-black" title={txn.nipResponseMessage || txn.failureReason}>
                                <span className="material-symbols-outlined text-[10px]">warning</span>
                                Code {txn.nipResponseCode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedTransfer(txn);
                                setDetailDrawerTab('overview');
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Inspect Details & Ledger"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>

                            <button
                              onClick={() => setReceiptModalTxn(txn)}
                              className="p-2 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              title="Generate NIP Transfer Receipt"
                            >
                              <span className="material-symbols-outlined text-lg">receipt</span>
                            </button>

                            {txn.status === 'Pending' && (
                              <button
                                onClick={() => handleReQuery(txn)}
                                disabled={isProcessingAction === `requery-${txn.id}`}
                                className="p-2 rounded-xl text-amber-600 hover:bg-amber-500/10 transition-colors"
                                title="Re-query NIBSS Session"
                              >
                                <span className={`material-symbols-outlined text-lg ${isProcessingAction === `requery-${txn.id}` ? 'animate-spin' : ''}`}>sync</span>
                              </button>
                            )}

                            {txn.status === 'Failed' && (
                              <button
                                onClick={() => handleReverseTransaction(txn)}
                                disabled={isProcessingAction === `reverse-${txn.id}`}
                                className="p-2 rounded-xl text-purple-600 hover:bg-purple-500/10 transition-colors"
                                title="Execute Manual Reversal"
                              >
                                <span className={`material-symbols-outlined text-lg ${isProcessingAction === `reverse-${txn.id}` ? 'animate-spin' : ''}`}>undo</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECONCILIATION & GENERAL LEDGER (GL) SETTLEMENT */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Settlement Balancing Matrix */}
          <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  End-of-Day NIP Clearing & Double-Entry Ledger Trial Balance
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Verification of Customer CASA Debits vs NIBSS Outward Settlement Accounts & Fee Incomes.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">verified</span>
                General Ledger in Balance (Variance ₦0.00)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Debited from CASAs</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  ₦{transfers.filter(t => t.status === 'Successful' || t.status === 'Reversed').reduce((a, b) => a + b.totalDebited, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">Customer Account Outflows</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIBSS Outward Clearing GL</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  ₦{transfers.filter(t => t.status === 'Successful').reduce((a, b) => a + b.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">Account: GL-200109-NIBSS</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refunds & Reversals Credited</span>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  ₦{transfers.filter(t => t.status === 'Reversed').reduce((a, b) => a + b.totalDebited, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] font-bold text-purple-500 mt-1 block">Auto & Manual Refunds</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee & VAT Income GLs</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  ₦{transfers.filter(t => t.status === 'Successful').reduce((a, b) => a + b.fee + b.vat, 0).toFixed(2)}
                </p>
                <span className="text-[10px] font-bold text-emerald-500 mt-1 block">GL-400102 & GL-200115</span>
              </div>
            </div>
          </div>

          {/* Exceptions & Unreconciled Queue */}
          <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Exception & Pending In-Doubt Reconciliation Queue
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Transactions pending switch confirmation or requiring operator reversal.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase">
                {transfers.filter(t => t.reconciliationStatus === 'Unreconciled' || t.status === 'Pending').length} Pending Items
              </span>
            </div>

            <div className="space-y-3">
              {transfers.filter(t => t.reconciliationStatus === 'Unreconciled' || t.status === 'Pending').length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <span className="material-symbols-outlined text-3xl text-emerald-500 mb-1">task_alt</span>
                  <p className="text-xs font-bold">All transactions are fully reconciled with NIBSS settlement batches.</p>
                </div>
              ) : (
                transfers.filter(t => t.reconciliationStatus === 'Unreconciled' || t.status === 'Pending').map(item => (
                  <div 
                    key={item.id}
                    className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-sm">{item.reference}</span>
                        <span className="font-mono text-[10px] text-slate-400">Session: {item.sessionId}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase">
                          In-Doubt
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                        {item.sourceAccount.accountName} ({item.sourceAccount.accountNumber}) ➔ {item.destinationAccount.beneficiaryName} ({item.destinationAccount.bankName})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Amount: <strong className="text-slate-900 dark:text-white">{item.formattedAmount}</strong> • Initiated: {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReQuery(item)}
                        disabled={isProcessingAction === `requery-${item.id}`}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <span className={`material-symbols-outlined text-base ${isProcessingAction === `requery-${item.id}` ? 'animate-spin' : ''}`}>sync</span>
                        Re-query NIBSS
                      </button>
                      <button
                        onClick={() => handleReverseTransaction(item)}
                        disabled={isProcessingAction === `reverse-${item.id}`}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">undo</span>
                        Force Reversal
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NETWORK ANALYTICS & ERROR CODES */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* NIP Error Code Breakdown */}
            <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  NIP Return Codes & Failure Root Causes
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Standard CBN/NIBSS response code frequency and descriptions.
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(NIP_ERROR_CODES).map(([code, info]) => {
                  const count = transfers.filter(t => t.nipResponseCode === code).length;
                  return (
                    <div 
                      key={code}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded font-mono font-black text-xs ${
                            code === '00' 
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            Code {code}
                          </span>
                          <span className="font-black text-xs text-slate-900 dark:text-white">{info.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          {info.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-slate-900 dark:text-white">{count}</span>
                        <span className="text-[10px] text-slate-400 block font-bold">occurrences</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination Bank Reliability Matrix */}
            <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Destination Bank Inward Settlement Reliability
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Transaction throughput and success rates by receiving institution.
                </p>
              </div>

              <div className="space-y-4">
                {NIGERIAN_BANKS.slice(0, 8).map(bank => {
                  const bankTxns = transfers.filter(t => t.destinationAccount.bankName.includes(bank.name.split(' ')[0]));
                  const total = bankTxns.length;
                  const success = bankTxns.filter(t => t.status === 'Successful').length;
                  const rate = total > 0 ? ((success / total) * 100).toFixed(0) : '100';

                  return (
                    <div key={bank.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-sm">{bank.logo}</span>
                          <span className="font-black text-slate-900 dark:text-white">{bank.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({bank.code})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold">{total} Txns</span>
                          <span className={`font-black text-xs ${Number(rate) >= 90 ? 'text-emerald-500' : Number(rate) >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {rate}% Success
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${Number(rate) >= 90 ? 'bg-emerald-500' : Number(rate) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL & LEDGER AUDIT DRAWER */}
      <AnimatePresence>
        {selectedTransfer && (
          <div className="fixed inset-0 z-[120] overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransfer(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-2xl bg-white dark:bg-surface-dark border-l border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIP TRANSACTION AUDIT</span>
                      {getStatusBadge(selectedTransfer.status)}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      {selectedTransfer.formattedAmount}
                    </h2>
                    <p className="font-mono text-xs text-slate-400">
                      Ref: <strong className="text-slate-700 dark:text-slate-200">{selectedTransfer.reference}</strong> • Session: {selectedTransfer.sessionId}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReceiptModalTxn(selectedTransfer)}
                      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      title="View Receipt"
                    >
                      <span className="material-symbols-outlined text-lg">receipt</span>
                    </button>
                    <button
                      onClick={() => setSelectedTransfer(null)}
                      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>

                {/* Drawer Nav Tabs */}
                <div className="flex items-center px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                  {(['overview', 'ledger', 'audit', 'payload'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDetailDrawerTab(tab)}
                      className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                        detailDrawerTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab === 'overview' ? 'Overview' : tab === 'ledger' ? `Ledger (${selectedTransfer.ledgerEntries.length})` : tab === 'audit' ? `Audit Trail (${selectedTransfer.auditTrail.length})` : 'NIP Payload'}
                    </button>
                  ))}
                </div>

                {/* Drawer Body Content */}
                <div className="p-8 flex-1 space-y-6">
                  {/* TAB 1: OVERVIEW */}
                  {detailDrawerTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Failure / Error Notice */}
                      {selectedTransfer.failureReason && (
                        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-2">
                          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-xs uppercase tracking-wide">
                            <span className="material-symbols-outlined text-base">error</span>
                            NIP Failure Reason (Code {selectedTransfer.nipResponseCode || 'ERR'})
                          </div>
                          <p className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-relaxed">
                            {selectedTransfer.failureReason}
                          </p>
                        </div>
                      )}

                      {/* Source vs Destination Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Source Card */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm text-primary">arrow_upward</span>
                            Source Account (Initiator)
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {selectedTransfer.sourceAccount.accountName}
                          </h4>
                          <div className="text-xs space-y-1 text-slate-500 font-medium">
                            <p>Account No: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedTransfer.sourceAccount.accountNumber}</strong> ({selectedTransfer.sourceAccount.accountType})</p>
                            <p>Bank: {selectedTransfer.sourceAccount.bankName}</p>
                            <p>BVN: <strong className="font-mono">{selectedTransfer.sourceAccount.bvn}</strong></p>
                            <p>Pre-Debit Balance: ₦{selectedTransfer.sourceAccount.balanceBefore.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p>Post-Debit Balance: ₦{selectedTransfer.sourceAccount.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        {/* Destination Card */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm text-emerald-500">arrow_downward</span>
                            Destination (Beneficiary)
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {selectedTransfer.destinationAccount.beneficiaryName}
                          </h4>
                          <div className="text-xs space-y-1 text-slate-500 font-medium">
                            <p>Account No: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedTransfer.destinationAccount.accountNumber}</strong></p>
                            <p>Bank: <strong className="text-slate-800 dark:text-slate-200">{selectedTransfer.destinationAccount.bankName}</strong></p>
                            <p>NIP Bank Code: <span className="font-mono">{selectedTransfer.destinationAccount.bankCode}</span></p>
                            <p>KYC Tier: Tier {selectedTransfer.destinationAccount.kycTier || 3}</p>
                          </div>
                        </div>
                      </div>

                      {/* Financial Pricing Breakdown */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Transaction Pricing & Charges</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Principal Transfer Amount:</span>
                            <span className="font-black text-slate-900 dark:text-white">{selectedTransfer.formattedAmount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">NIP Switch Processing Fee:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">₦{selectedTransfer.fee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">VAT on Electronic Transfer (7.5%):</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">₦{selectedTransfer.vat.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                            <span className="text-slate-900 dark:text-white">Total Amount Debited:</span>
                            <span className="text-primary">₦{selectedTransfer.totalDebited.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Narration */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Narration</span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                          "{selectedTransfer.narration}"
                        </p>
                      </div>

                      {/* Telemetry & Channel Details */}
                      {selectedTransfer.channelDetails && (
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mobile App Device Telemetry</span>
                          <div className="grid grid-cols-2 gap-2 text-slate-500">
                            <p>Channel: <strong className="text-slate-800 dark:text-slate-200">{selectedTransfer.channel} ({selectedTransfer.channelDetails.os})</strong></p>
                            <p>App Version: <strong className="text-slate-800 dark:text-slate-200">{selectedTransfer.channelDetails.appVersion}</strong></p>
                            <p>Device Model: <strong className="text-slate-800 dark:text-slate-200">{selectedTransfer.channelDetails.deviceModel}</strong></p>
                            <p>IP Address: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedTransfer.channelDetails.ipAddress}</strong></p>
                            <p className="col-span-2">Originating Geolocation: <strong className="text-slate-800 dark:text-slate-200">{selectedTransfer.channelDetails.location}</strong></p>
                          </div>
                        </div>
                      )}

                      {/* Action Trigger Buttons */}
                      <div className="flex items-center gap-3 pt-4">
                        {selectedTransfer.status === 'Pending' && (
                          <button
                            onClick={() => handleReQuery(selectedTransfer)}
                            disabled={isProcessingAction === `requery-${selectedTransfer.id}`}
                            className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            <span className={`material-symbols-outlined text-base ${isProcessingAction === `requery-${selectedTransfer.id}` ? 'animate-spin' : ''}`}>sync</span>
                            Re-query NIBSS Session
                          </button>
                        )}

                        {selectedTransfer.status === 'Failed' && (
                          <button
                            onClick={() => handleReverseTransaction(selectedTransfer)}
                            disabled={isProcessingAction === `reverse-${selectedTransfer.id}`}
                            className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                          >
                            <span className="material-symbols-outlined text-base">undo</span>
                            Execute Manual Reversal (Refund CASA)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: GENERAL LEDGER (GL) ENTRIES */}
                  {detailDrawerTab === 'ledger' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase">
                          <span className="material-symbols-outlined text-base">account_balance</span>
                          Double-Entry Postings
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          {selectedTransfer.ledgerEntries.length} Ledger Legs
                        </span>
                      </div>

                      {selectedTransfer.ledgerEntries.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <p className="font-bold">No ledger postings created (Transaction failed at pre-auth validation stage).</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedTransfer.ledgerEntries.map((lg) => (
                            <div 
                              key={lg.id}
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                                    lg.entryType === 'DEBIT' 
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {lg.entryType}
                                  </span>
                                  <span className="font-black text-slate-900 dark:text-white">{lg.accountName}</span>
                                </div>
                                <span className="font-black text-slate-900 dark:text-white">{lg.formattedAmount}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Account No: <strong className="font-mono text-slate-700 dark:text-slate-300">{lg.accountNumber}</strong> ({lg.accountType})
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Journal: {lg.postingRef} • Timestamp: {new Date(lg.postingTimestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: AUDIT TRAIL */}
                  {detailDrawerTab === 'audit' && (
                    <div className="space-y-6">
                      <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                        {selectedTransfer.auditTrail.map((aud, index) => (
                          <div key={aud.id || index} className="relative space-y-1.5">
                            {/* Bullet icon */}
                            <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 bg-white dark:bg-surface-dark flex items-center justify-center ${
                              aud.status === 'Completed'
                                ? 'border-emerald-500'
                                : aud.status === 'Failed'
                                ? 'border-rose-500'
                                : 'border-amber-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                aud.status === 'Completed' ? 'bg-emerald-500' : aud.status === 'Failed' ? 'bg-rose-500' : 'bg-amber-500 animate-ping'
                              }`} />
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                {aud.step}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {new Date(aud.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                              {aud.details}
                            </p>

                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <span>Actor: <strong className="text-primary">{aud.actor}</strong></span>
                              <span>•</span>
                              <span className={`uppercase font-black ${
                                aud.status === 'Completed' ? 'text-emerald-500' : aud.status === 'Failed' ? 'text-rose-500' : 'text-amber-500'
                              }`}>{aud.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: RAW NIP PAYLOAD */}
                  {detailDrawerTab === 'payload' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIBSS ISO/JSON Telemetry Payload</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(selectedTransfer, null, 2));
                            showToast('Payload copied to clipboard.', 'success');
                          }}
                          className="text-xs font-black text-primary hover:underline flex items-center gap-1 uppercase"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                          Copy JSON
                        </button>
                      </div>

                      <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[450px] leading-relaxed">
                        {JSON.stringify(selectedTransfer, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* NIP OFFICIAL ELECTRONIC TRANSFER RECEIPT MODAL */}
      <AnimatePresence>
        {receiptModalTxn && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptModalTxn(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl space-y-6 text-slate-900 border border-slate-200"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-2 border-b border-slate-200 pb-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-primary mx-auto flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  NOLT FINANCE MICROFINANCE BANK
                </h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Official NIP Instant Payment Electronic Receipt
                </p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {receiptModalTxn.formattedAmount}
                  </span>
                  <div className="mt-1">
                    {receiptModalTxn.status === 'Successful' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        Transfer Successful
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                        {receiptModalTxn.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Transaction Date:</span>
                  <span className="font-bold text-slate-800">{new Date(receiptModalTxn.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Sender Name:</span>
                  <span className="font-black text-slate-900">{receiptModalTxn.sourceAccount.accountName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Source Account:</span>
                  <span className="font-mono font-bold text-slate-800">{receiptModalTxn.sourceAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Beneficiary Name:</span>
                  <span className="font-black text-slate-900">{receiptModalTxn.destinationAccount.beneficiaryName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Destination Bank:</span>
                  <span className="font-bold text-slate-800">{receiptModalTxn.destinationAccount.bankName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Destination Account:</span>
                  <span className="font-mono font-bold text-slate-800">{receiptModalTxn.destinationAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Reference:</span>
                  <span className="font-mono font-bold text-primary">{receiptModalTxn.reference}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">NIBSS Session ID:</span>
                  <span className="font-mono font-bold text-slate-700 text-[10px]">{receiptModalTxn.sessionId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Narration:</span>
                  <span className="font-bold text-slate-700 text-right max-w-[240px] truncate">{receiptModalTxn.narration}</span>
                </div>
              </div>

              {/* Receipt Footer Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setReceiptModalTxn(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs rounded-xl tracking-wider transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3.5 bg-primary hover:bg-blue-600 text-white font-black uppercase text-xs rounded-xl tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK NIBSS SESSION QUERY MODAL */}
      <AnimatePresence>
        {reQuerySessionModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReQuerySessionModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-surface-dark rounded-[32px] p-8 shadow-2xl space-y-6 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">search_check</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Manual NIBSS Session Query</h3>
                  <p className="text-xs font-bold text-slate-400">Direct query to NIBSS switch gateway for terminal status.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Enter 30-Digit NIBSS Session ID or Reference
                </label>
                <input
                  type="text"
                  value={reQuerySessionInput}
                  onChange={(e) => setReQuerySessionInput(e.target.value)}
                  placeholder="e.g. 999001231025143208000000000042 or NIP-20231025-9948201"
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReQuerySessionModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reQuerySessionInput.trim() || reQueryLoading}
                  onClick={() => {
                    setReQueryLoading(true);
                    setTimeout(() => {
                      setReQueryLoading(false);
                      setReQuerySessionModalOpen(false);
                      setReQuerySessionInput('');
                      showToast(`NIBSS Switch response: Session ${reQuerySessionInput.slice(0, 16)}... confirmed with Code 00 (Approved).`, 'success');
                    }, 1200);
                  }}
                  className="flex-1 py-3.5 bg-primary hover:bg-blue-600 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className={`material-symbols-outlined text-base ${reQueryLoading ? 'animate-spin' : ''}`}>
                    {reQueryLoading ? 'sync' : 'search'}
                  </span>
                  {reQueryLoading ? 'Querying...' : 'Query Gateway'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[200] max-w-md px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {toastMessage.type === 'error' ? 'error' : toastMessage.type === 'warning' ? 'warning' : 'check_circle'}
            </span>
            <p className="text-xs font-bold leading-tight flex-1">{toastMessage.text}</p>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransfersView;
