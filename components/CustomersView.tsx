
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, ReviewRequest, User } from '../types';
import NewCustomerModal from './NewCustomerModal';

interface CustomersViewProps {
  requests: ReviewRequest[];
  onUpdateRequest?: (updated: ReviewRequest) => void;
  currentUser?: User;
}

const CustomersView: React.FC<CustomersViewProps> = ({ requests, onUpdateRequest, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Direct Debit Mandate state variables for customer-specific actions
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [quickMndId, setQuickMndId] = useState('');
  const [isActivatingQuickMandate, setIsActivatingQuickMandate] = useState(false);
  const [isProcessingDebit, setIsProcessingDebit] = useState<string | null>(null);
  const [localMandates, setLocalMandates] = useState<any[]>([]);
  const [localDebitInstructions, setLocalDebitInstructions] = useState<any[]>([]);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Derive customers from requests for consistent mock data
  const customers: Customer[] = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    requests.forEach((req, idx) => {
      const email = req.applicant.email;
      const hasFraud = !!(req.fraudFlag || req.isBlacklisted || req.applicant?.fraudFlag || req.applicant?.isBlacklisted);
      const isBlacklisted = !!(req.isBlacklisted || req.applicant?.isBlacklisted);
      const hasCooling = !!(req.status === 'Declined' && (req.rejectionCoolingExpiryDate || req.applicant?.rejectionCoolingExpiryDate));

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          ...req.applicant,
          id: `cust-${idx}`,
          customerCode: `NOLT-8823-${990 + idx}`,
          joinedDate: req.dateSubmitted,
          status: hasFraud ? 'Flagged' : 'Active',
          tier: (idx % 3 + 1) as 1 | 2 | 3,
          accountType: idx % 3 === 0 ? 'Individual' : idx % 3 === 1 ? 'Joint' : 'Corporate',
          availableBalance: `₦${(Math.random() * 200000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          isBlacklisted: isBlacklisted,
          fraudFlag: hasFraud,
          fraudReason: req.fraudReason || req.blacklistReason || req.applicant?.fraudReason,
          blacklistDate: req.blacklistDate || req.applicant?.blacklistDate,
          blacklistExpiryDate: req.blacklistExpiryDate || req.applicant?.blacklistExpiryDate,
          blacklistReason: req.blacklistReason || req.applicant?.blacklistReason,
          rejectionDate: req.rejectionDate || req.applicant?.rejectionDate,
          rejectionCoolingExpiryDate: req.rejectionCoolingExpiryDate || req.applicant?.rejectionCoolingExpiryDate,
          rejectionReason: req.rejectionReason || req.applicant?.rejectionReason,
          documents: [
            { label: 'GOVERNMENT ID', url: req.governmentIdUrl || 'https://placehold.co/600x400?text=Government+ID', type: 'PNG' },
            { label: 'PROOF OF ADDRESS', url: req.proofOfAddressUrl || 'https://placehold.co/600x400?text=Utility+Bill', type: 'PNG' },
          ].filter(doc => !!doc.url)
        });
      } else if (hasFraud || hasCooling) {
        const existing = customerMap.get(email)!;
        customerMap.set(email, {
          ...existing,
          status: hasFraud ? 'Flagged' : existing.status,
          isBlacklisted: isBlacklisted || existing.isBlacklisted,
          fraudFlag: hasFraud || existing.fraudFlag,
          fraudReason: req.fraudReason || req.blacklistReason || existing.fraudReason,
          blacklistDate: req.blacklistDate || existing.blacklistDate,
          blacklistExpiryDate: req.blacklistExpiryDate || existing.blacklistExpiryDate,
          blacklistReason: req.blacklistReason || existing.blacklistReason,
          rejectionDate: req.rejectionDate || existing.rejectionDate,
          rejectionCoolingExpiryDate: req.rejectionCoolingExpiryDate || existing.rejectionCoolingExpiryDate,
          rejectionReason: req.rejectionReason || existing.rejectionReason
        });
      }
    });
    return Array.from(customerMap.values());
  }, [requests]);

  const [tierFilter, setTierFilter] = useState<'All' | 'Tier 1' | 'Tier 2' | 'Tier 3'>('All');

  const stats = useMemo(() => {
    return {
      onboarded: customers.length,
      verified: customers.filter(c => c.status === 'Active').length,
      tier3: customers.filter(c => c.tier === 3).length
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTier = tierFilter === 'All' || `Tier ${c.tier}` === tierFilter;
      
      return matchesSearch && matchesTier;
    });
  }, [customers, searchTerm, tierFilter]);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId), 
    [customers, selectedCustomerId]
  );

  const customerLoan = useMemo(() => {
    if (!selectedCustomer) return null;
    return requests.find(req => req.type === 'Loan' && req.applicant.email === selectedCustomer.email);
  }, [requests, selectedCustomer]);

  const handleTriggerOneClickDebit = (amountStr: string, rowDate: string) => {
    const mandates = customerLoan ? (customerLoan.mandates || []) : localMandates;
    const activeMandate = mandates.find(m => m.status === 'Active');
    
    if (!activeMandate) {
      setToastMessage({ text: 'No active direct debit mandate. Quick setup initiated below.', type: 'warning' });
      setIsActivatingQuickMandate(true);
      setQuickMndId(`MND-${Math.floor(100000 + Math.random() * 900000).toString()}`);
      return;
    }

    setIsProcessingDebit(rowDate);

    setTimeout(() => {
      // Parse numeric value
      const cleanAmt = amountStr.replace(/[₦$,\s]/g, '');
      const instId = `DEB-${Math.floor(1000 + Math.random() * 9000).toString()}`;
      const newInstruction = {
        instructionId: instId,
        mandateId: activeMandate.mandateId,
        amount: cleanAmt,
        dateSent: new Date().toISOString(),
        status: 'SUCCESS' as const,
        lastChecked: new Date().toISOString()
      };

      if (customerLoan) {
        const updatedInstructions = [newInstruction, ...(customerLoan.debitInstructions || [])];

        const newLog = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          actor: currentUser?.name || 'Customer Experience',
          action: 'DEBIT SUCCESS',
          comment: `One-Click Direct Debit triggered for installment due ${rowDate}. Amount: ₦${parseFloat(cleanAmt).toLocaleString()}. Instruction ID: ${instId}`
        };

        const updatedLogs = [newLog, ...(customerLoan.operationLogs || [])];

        const updatedLoan = {
          ...customerLoan,
          debitInstructions: updatedInstructions,
          operationLogs: updatedLogs
        };

        if (onUpdateRequest) {
          onUpdateRequest(updatedLoan);
        }
      } else {
        setLocalDebitInstructions(prev => [newInstruction, ...prev]);
      }

      setIsProcessingDebit(null);
      setToastMessage({ text: `Successfully auto-debited ₦${parseFloat(cleanAmt).toLocaleString()} for installment due ${rowDate}! (Instruction ID: ${instId})`, type: 'success' });
    }, 1000);
  };

  const handleQuickActivateMandate = () => {
    const loanId = customerLoan ? (customerLoan.referenceId || customerLoan.id) : `LN-MOCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const loanAmt = customerLoan ? customerLoan.amount : '₦2,500,000.00';

    if (!quickMndId) {
      setToastMessage({ text: 'Please enter a Mandate ID.', type: 'error' });
      return;
    }

    const newMandate = {
      mandateId: quickMndId,
      activationDate: new Date().toISOString().split('T')[0],
      requestId: loanId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months term
      amount: loanAmt,
      status: 'Active' as const
    };

    if (customerLoan) {
      const updatedMandates = (customerLoan.mandates || []).map(m => m.status === 'Active' ? { ...m, status: 'Stopped' as const } : m);
      const finalMandates = [...updatedMandates, newMandate];

      const newLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        actor: currentUser?.name || 'Customer Experience',
        action: 'MANDATE ACTIVE',
        comment: `Direct Debit Mandate activated via one-click customer portal. Mandate ID: ${quickMndId}, Limit Amount: ${customerLoan.amount}`
      };

      const updatedLogs = [newLog, ...(customerLoan.operationLogs || [])];

      const updatedLoan = {
        ...customerLoan,
        mandates: finalMandates,
        operationLogs: updatedLogs
      };

      if (onUpdateRequest) {
        onUpdateRequest(updatedLoan);
      }
    } else {
      setLocalMandates(prev => {
        const updated = prev.map(m => m.status === 'Active' ? { ...m, status: 'Stopped' as const } : m);
        return [...updated, newMandate];
      });
    }

    setIsActivatingQuickMandate(false);
    setToastMessage({ text: `Direct Debit Mandate ${quickMndId} activated successfully! One-click auto debits are now enabled.`, type: 'success' });
  };

  const handleExportSummary = (customer: Customer) => {
    setIsExporting(true);
    // Simulate generation of printable PDF and downloading files
    setTimeout(() => {
      alert(`Preparing Individual Export Summary for ${customer.name}...\n\n1. Generating printable Profile PDF\n2. Bundling ${customer.documents.length} verified documents\n3. Exporting as ZIP archive`);
      setIsExporting(false);
    }, 1500);
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);
    const count = selectedIds.size;
    
    // Simulate complex bundling process
    setTimeout(() => {
      const details = Array.from(selectedIds).map(id => {
        const c = customers.find(cust => cust.id === id);
        return `• ${c?.name} (Profile PDF + ${c?.documents.length} Docs)`;
      }).join('\n');

      alert(`Bulk Export Successful!\n\nArchive: NOLT_Batch_Export_${Date.now()}.zip\n\nBundled records for ${count} customers:\n${details}`);
      setIsExporting(false);
      setSelectedIds(new Set());
    }, 2500);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const CustomerList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Customer Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Verified customer profiles across all financial products.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            New Customer
          </button>
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkExport}
              disabled={isExporting}
              className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {isExporting ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              )}
              Export Bundled ZIP ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Onboarded Customers', value: stats.onboarded, icon: 'person_add', color: 'text-primary bg-primary/10' },
          { label: 'Verified Customers', value: stats.verified, icon: 'verified', color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Tier 3 Customers', value: stats.tier3, icon: 'military_tech', color: 'text-amber-500 bg-amber-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value.toLocaleString()}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full">
          <div className="relative flex-1 md:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              type="text" 
              placeholder="Search by Code, Name, or Email..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary text-sm font-black transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {['All', 'Tier 1', 'Tier 2', 'Tier 3'].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier as any)}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  tierFilter === tier 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-white dark:bg-surface-dark text-slate-500 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-6 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 dark:bg-slate-700 text-primary focus:ring-primary cursor-pointer transition-all"
                    checked={filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-6">Customer Code</th>
                <th className="px-8 py-6">Full Name</th>
                <th className="px-8 py-6">Tier</th>
                <th className="px-8 py-6">Contact Details</th>
                <th className="px-8 py-6">Account Type</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-6 py-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map(cust => {
                const isSelected = selectedIds.has(cust.id);
                return (
                  <tr 
                    key={cust.id} 
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  >
                    <td className="px-6 py-6 text-center" onClick={(e) => toggleSelect(e, cust.id)}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 dark:bg-slate-700 text-primary focus:ring-primary cursor-pointer"
                        checked={isSelected}
                        readOnly
                      />
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-primary uppercase tracking-wider">{cust.customerCode}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">{cust.joinedDate}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <img src={cust.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wide group-hover:text-primary transition-colors">{cust.name}</p>
                            {(cust.fraudFlag || cust.isBlacklisted) && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-wider border border-red-300 dark:border-red-900 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">gavel</span> FRAUD
                              </span>
                            )}
                            {cust.rejectionCoolingExpiryDate && !(cust.fraudFlag || cust.isBlacklisted) && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[8px] font-black uppercase tracking-wider border border-amber-300 dark:border-amber-900">
                                45D COOLING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        cust.tier === 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        cust.tier === 2 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        Tier {cust.tier}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{cust.email}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{cust.phone}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{cust.accountType}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        (cust.fraudFlag || cust.isBlacklisted)
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                          : cust.status === 'Flagged'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100'
                      }`}>
                        {(cust.fraudFlag || cust.isBlacklisted) ? 'Blacklisted (Fraud)' : cust.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right text-slate-300 group-hover:text-primary transition-all">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const CustomerDetail = ({ customer }: { customer: Customer }) => {
    const [activeTab, setActiveTab] = useState('identity');
    const [expandedInvId, setExpandedInvId] = useState<string | null>('rise-442');

    const investments = [
      {
        id: 'vault-001',
        name: 'Nolt Vault',
        type: 'Fixed Deposit',
        ref: 'INV-2023-VLT-001',
        status: 'Active',
        icon: 'lock',
        color: 'blue',
        typeLabel: 'Fixed Deposit',
        details: {
          principal: '₦2,500,000.00',
          apy: '14.5%',
           maturityDate: 'Dec 15, 2024',
          accrued: '₦362,500.00',
          timeline: 65,
          origination: 'Feb 10, 2024',
          remaining: '228 Days Remaining'
        }
      },
      {
        id: 'rise-442',
        name: 'Nolt Rise',
        type: 'Savings',
        ref: 'INV-2024-RSE-442',
        status: 'Active',
        icon: 'rocket_launch',
        color: 'indigo',
        typeLabel: 'High Yield Savings',
        details: {
          principal: '₦1,550,000.00',
          apy: '18.2%',
          maturityDate: 'Feb 10, 2025',
          accrued: '₦89,212.00',
          timeline: 30,
          origination: 'Feb 10, 2024',
          remaining: '280 Days Remaining'
        }
      }
    ];

    const Field = ({ label, value, verified = false }: { label: string, value: string | undefined, verified?: boolean }) => (
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">{value || 'N/A'}</p>
          {verified && (
            <span className="material-symbols-outlined text-blue-500 text-[16px] fill-1">check_circle</span>
          )}
        </div>
      </div>
    );

    const BadgeField = ({ label, value }: { label: string, value: string | undefined }) => (
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{value || 'N/A'}</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 pb-12 relative">
        {toastMessage && (
          <div id="toast-notification-panel" className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-2 duration-300 max-w-[420px] ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-100'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/95 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-100'
              : 'bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-100'
          }`}>
            <span className={`material-symbols-outlined text-[20px] shrink-0 font-black ${
              toastMessage.type === 'success' ? 'text-emerald-500' : toastMessage.type === 'warning' ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {toastMessage.type === 'success' ? 'check_circle' : toastMessage.type === 'warning' ? 'info' : 'warning'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider ${
                toastMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : toastMessage.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>{toastMessage.type === 'success' ? 'Operation Success' : toastMessage.type === 'warning' ? 'Mandate Required' : 'Error Occurred'}</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug mt-0.5">{toastMessage.text}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="shrink-0 p-1 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedCustomerId(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Directory
          </button>
          <div className="flex items-center gap-3">
             <button className="p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">print</span>
             </button>
             <button 
               onClick={() => handleExportSummary(customer)}
               disabled={isExporting}
               className="px-8 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
             >
               <span className="material-symbols-outlined text-[18px]">ios_share</span>
               Export Summary
             </button>
          </div>
        </div>

        {/* Customer Header Card */}
        <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl p-10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative">
            <img src={customer.avatar} className="w-48 h-48 rounded-[48px] object-cover shadow-2xl border-4 border-white dark:border-slate-800" alt="" />
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-surface-dark p-2 rounded-2xl shadow-lg border border-slate-50 dark:border-slate-700">
               <span className="material-symbols-outlined text-blue-500 text-2xl fill-1">verified</span>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">{customer.name}</h3>
                {(customer.fraudFlag || customer.isBlacklisted) ? (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">gavel</span>
                    FRAUD FLAGGED
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-blue-500 text-2xl fill-1">verified</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">Tier {customer.tier}</span>
                <span className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100 dark:border-slate-800">{customer.accountType}</span>
                {(customer.fraudFlag || customer.isBlacklisted) && (
                  <span className="px-4 py-1.5 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-300 dark:border-red-800">
                    BLACKLISTED (6-MONTH BAN)
                  </span>
                )}
                {customer.rejectionCoolingExpiryDate && !(customer.fraudFlag || customer.isBlacklisted) && (
                  <span className="px-4 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-300 dark:border-amber-800">
                    45-DAY REJECTION COOLING
                  </span>
                )}
              </div>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">USER ID: <span className="text-slate-900 dark:text-white">{customer.customerCode}</span> • BVN: <span className="font-mono text-slate-900 dark:text-white">{customer.bvn || '222****9901'}</span></p>
            </div>
          </div>

          <div className="w-full md:w-auto space-y-4">
            <div className="bg-slate-50 dark:bg-background-dark/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 min-w-[320px] relative">
              <span className="absolute top-4 right-4 material-symbols-outlined text-slate-300">account_balance_wallet</span>
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Available Balance</p>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4 italic">{customer.availableBalance}</h2>
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">credit_card</span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-widest">0123456789 -</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">CASA (NUBAN)</span>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Flag & Blacklist Persistent Alert Banner */}
        {(customer.fraudFlag || customer.isBlacklisted) && (
          <div className="p-6 rounded-[28px] bg-red-600 text-white shadow-2xl shadow-red-600/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-red-500 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-white">gavel</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black tracking-tight uppercase">FRAUD FLAGGED & BLACKLISTED (6-MONTH BAN)</h4>
                  <span className="px-2 py-0.5 rounded bg-black/30 text-white text-[9px] font-black uppercase tracking-widest">CRITICAL RISK</span>
                </div>
                <p className="text-xs text-red-100 font-bold max-w-3xl leading-relaxed">
                  This customer record carries an active <span className="underline font-black">FRAUD FLAG</span>. Customer BVN (<span className="font-mono font-black">{customer.bvn || '222****9901'}</span>) is blacklisted from applying for or originating any loan facility until <span className="font-black text-white">{customer.blacklistExpiryDate ? new Date(customer.blacklistExpiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '6 Months'}</span>.
                </p>
                {customer.blacklistReason && (
                  <p className="text-[11px] text-red-200 font-mono pt-1">
                    <span className="font-bold uppercase tracking-wider text-white">Audit Note:</span> {customer.blacklistReason}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-center shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest block text-red-200">Re-application Ban</span>
              <span className="text-sm font-black text-white uppercase tracking-wider">6 Months Active</span>
            </div>
          </div>
        )}

        {/* 45-Day Rejection Cooling Policy Alert Banner */}
        {customer.rejectionCoolingExpiryDate && !(customer.fraudFlag || customer.isBlacklisted) && (
          <div className="p-6 rounded-[28px] bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-amber-400">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-slate-950">hourglass_top</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black tracking-tight uppercase">45-DAY AUTO-REJECTION POLICY ACTIVE</h4>
                  <span className="px-2 py-0.5 rounded bg-black/20 text-slate-950 text-[9px] font-black uppercase tracking-widest">COOLING WINDOW</span>
                </div>
                <p className="text-xs text-amber-950 font-bold max-w-3xl leading-relaxed">
                  A recent loan application for this customer was declined on {customer.rejectionDate ? new Date(customer.rejectionDate).toLocaleDateString() : 'recent review'}. Any new loan application attempted for this BVN will be automatically flagged for rejection until <span className="font-black underline">{new Date(customer.rejectionCoolingExpiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>.
                </p>
                {customer.rejectionReason && (
                  <p className="text-[11px] text-amber-900 font-mono pt-1">
                    <span className="font-bold uppercase tracking-wider text-slate-950">Decline Reason:</span> {customer.rejectionReason}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 py-2 bg-black/10 rounded-xl border border-black/15 text-center shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest block text-amber-900">Cooling Policy</span>
              <span className="text-sm font-black text-slate-950 uppercase tracking-wider">45 Days</span>
            </div>
          </div>
        )}

        {/* Custom Tabs */}
        <div className="border-b border-slate-100 dark:border-slate-800 flex items-center gap-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'identity', label: 'IDENTITY & KYC', icon: 'person' },
            { id: 'loan', label: 'LOAN', icon: 'payments' },
            { id: 'investment', label: 'INVESTMENT', icon: 'trending_up' },
            { id: 'bill', label: 'BILL PAYMENTS', icon: 'description' },
            { id: 'audit', label: 'AUDIT LOG', icon: 'history' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 pb-6 relative group transition-all ${
                activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === tab.id ? 'fill-1' : ''}`}>{tab.icon}</span>
              <span className={`text-xs font-black uppercase tracking-widest`}>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-lg shadow-primary/50 animate-in fade-in zoom-in duration-300"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'identity' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-3 space-y-12">
                {/* TIER 1 */}
                <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-xl overflow-hidden">
                   <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50"></div>
                         <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">TIER 1: IDENTITY, CONTACT & DOCUMENTS</h4>
                      </div>
                      <button className="text-primary hover:bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                         <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                   </div>
                   <div className="p-10 space-y-12">
                      <div className="space-y-8">
                         <p className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">PERSONAL INFORMATION</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16">
                            <div className="col-span-full">
                               <Field label="FULL LEGAL NAME" value={customer.name} />
                            </div>
                            <Field label="DATE OF BIRTH" value="12 August, 1988" />
                            <Field label="GENDER" value="Male" />
                            <BadgeField label="BVN" value="222****9901" />
                            <BadgeField label="NIN" value="551****0023" />
                         </div>
                      </div>

                      <div className="space-y-8 pt-12 border-t border-slate-50 dark:border-slate-800/50">
                         <p className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">CONTACT DETAILS</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16">
                            <Field label="EMAIL ADDRESS" value={customer.email} verified />
                            <Field label="PHONE NUMBER" value="+234 801 234 5678" verified />
                            <div className="col-span-full">
                               <Field label="REGISTERED ADDRESS" value="142, Ahmadu Bello Way, Victoria Island, Lagos" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* TIER 2 */}
                <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-xl overflow-hidden opacity-80">
                   <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></div>
                         <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">TIER 2: FAMILY & NEXT OF KIN</h4>
                      </div>
                      <button className="text-primary hover:bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                         <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                   </div>
                   <div className="p-10 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">FULL NAME</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Sarah Johnson</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">RELATIONSHIP</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Sister</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-8">
                   <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 border-b border-slate-50 dark:border-slate-800 pb-3">QUICK ACTIONS</h5>
                   <div className="space-y-3">
                      <button className="w-full p-4 bg-primary text-white rounded-2xl flex items-center justify-between hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                         <span className="text-[10px] font-black uppercase">Freeze Account</span>
                         <span className="material-symbols-outlined text-[20px]">ac_unit</span>
                      </button>
                      <button className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-2xl flex items-center justify-between hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-800">
                         <span className="text-[10px] font-black uppercase">Send Message</span>
                         <span className="material-symbols-outlined text-[20px]">mail</span>
                      </button>
                      <button className="w-full p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-2xl flex items-center justify-between hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900">
                         <span className="text-[10px] font-black uppercase">Flag Profile</span>
                         <span className="material-symbols-outlined text-[20px]">flag</span>
                      </button>
                   </div>
                </div>

                <div className="bg-indigo-600 rounded-[32px] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-all duration-700"></div>
                   <div>
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">PROMOTION APPLIED</p>
                      <h4 className="text-2xl font-black italic tracking-tight uppercase">WELCOME-2024</h4>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase">Verified</span>
                      <span className="text-[10px] font-bold opacity-60 italic">Used 1x for Investment</span>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loan' && (() => {
            const mandates = customerLoan ? (customerLoan.mandates || []) : localMandates;
            const activeMandate = mandates.find(m => m.status === 'Active');
            const debitInstructions = customerLoan ? (customerLoan.debitInstructions || []) : localDebitInstructions;
            return (
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">play_arrow</span>
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Active Loan Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Loan Category', value: 'Salary Advance', sub: 'Ref: #LN-2023-882', icon: 'account_tree', color: 'primary' },
                    { label: 'Principal', value: '₦2,500,000.00', sub: '@ 3.5% Interest Rate', icon: 'payments', color: 'indigo' },
                    { label: 'Outstanding Debt', value: '₦850,000.00', sub: '⚠️ DUE SOON', icon: 'account_balance', color: 'rose' },
                    { label: 'Next Repayment', value: 'Nov 15, 2024', sub: 'Amount: ₦212,500.00', icon: 'calendar_today', color: 'emerald' },
                  ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-surface-dark p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-6 right-6 w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600`}>
                        <span className="material-symbols-outlined text-lg">{card.icon}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{card.label}</p>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-1 leading-none">{card.value}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${card.sub.includes('DUE') ? 'text-rose-500' : 'text-slate-400'}`}>{card.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Repayment Schedule</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-8 py-5">Due Date</th>
                          <th className="px-8 py-5">Installment</th>
                          <th className="px-8 py-5">Principal</th>
                          <th className="px-8 py-5">Interest</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5">Method</th>
                          <th className="px-8 py-5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 italic">
                        {[
                          { date: 'SEP 15, 2024', amt: '₦212,500.00', p: '₦200,000.00', i: '₦12,500.00', s: 'PAID', m: 'AUTO-DEBITED' },
                          { date: 'OCT 15, 2024', amt: '₦212,500.00', p: '₦200,000.00', i: '₦12,500.00', s: 'PAID', m: 'MANUAL PAY' },
                          { date: 'NOV 15, 2024', amt: '₦212,500.00', p: '₦200,000.00', i: '₦12,500.00', s: 'PENDING', m: 'FORCE DEBIT' },
                          { date: 'DEC 15, 2024', amt: '₦212,500.00', p: '₦200,000.00', i: '₦12,500.00', s: 'SCHEDULED', m: '-' },
                        ].map((row, idx) => {
                          const hasDebited = debitInstructions.some((inst: any) => inst.status === 'SUCCESS' && parseFloat(inst.amount) === 212500);
                          const displayStatus = (row.date === 'NOV 15, 2024' && hasDebited) ? 'PAID' : row.s;
                          const displayMethod = (row.date === 'NOV 15, 2024' && hasDebited) ? 'AUTO-DEBITED' : row.m;

                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="px-8 py-6 font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.date}</td>
                              <td className="px-8 py-6 font-black text-slate-900 dark:text-white tracking-tight">{row.amt}</td>
                              <td className="px-8 py-6 font-black text-slate-400 tracking-tight">{row.p}</td>
                              <td className="px-8 py-6 font-black text-slate-400 tracking-tight">{row.i}</td>
                              <td className="px-8 py-6">
                                <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  displayStatus === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50' :
                                  displayStatus === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/50' :
                                  'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>
                                  {displayStatus}
                                </span>
                              </td>
                              <td className="px-8 py-6 font-black text-slate-500 italic text-[10px] tracking-widest uppercase">{displayMethod}</td>
                              <td className="px-8 py-6">
                                {displayStatus === 'PENDING' ? (
                                  <div className="flex items-center gap-2">
                                    {activeMandate ? (
                                      <button
                                        type="button"
                                        onClick={() => handleTriggerOneClickDebit(row.amt, row.date)}
                                        disabled={isProcessingDebit === row.date}
                                        className="px-3.5 py-1.5 bg-primary hover:bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1 hover:scale-[1.02]"
                                      >
                                        {isProcessingDebit === row.date ? (
                                          <>
                                            <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            <span className="material-symbols-outlined text-[13px]">bolt</span>
                                            One-Click Debit
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickMndId(`MND-${Math.floor(100000 + Math.random() * 900000).toString()}`);
                                          setIsActivatingQuickMandate(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1 hover:scale-[1.02]"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">power_settings_new</span>
                                        Setup Mandate
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700 font-bold">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline quick direct debit mandate activation */}
                  {isActivatingQuickMandate && (
                    <div className="p-6 bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/40 space-y-4 animate-in slide-in-from-top-3 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-[20px]">power_settings_new</span>
                          <h5 className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">Quick Direct Debit Mandate Setup</h5>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIsActivatingQuickMandate(false)}
                          className="text-amber-500 hover:text-amber-700"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                      
                      <p className="text-[10px] font-bold text-amber-600 uppercase leading-relaxed">
                        Activate a direct debit mandate to enable secure one-click auto-debits for the customer's pending repayments.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">MANDATE ID</label>
                          <input 
                            type="text" 
                            value={quickMndId} 
                            onChange={(e) => setQuickMndId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none h-[38px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">LIMIT AMOUNT (₦)</label>
                          <input 
                            type="text" 
                            readOnly
                            value={customerLoan?.amount || '₦2,500,000.00'} 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 h-[38px]"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={handleQuickActivateMandate}
                            className="w-full h-[38px] bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-600 shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[15px]">verified_user</span>
                            Confirm & Activate
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'investment' && (
            <div className="space-y-6">
              {investments.map((inv) => (
                <div key={inv.id} className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
                  {/* Header Row */}
                  <div 
                    className="p-8 cursor-pointer flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    onClick={() => setExpandedInvId(expandedInvId === inv.id ? null : inv.id)}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl bg-${inv.color}-50 flex items-center justify-center text-${inv.color}-600 shadow-lg shadow-${inv.color}-100`}>
                        <span className="material-symbols-outlined text-2xl">{inv.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black italic uppercase tracking-tight">{inv.name}</h3>
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">{inv.typeLabel}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">REF: {inv.ref}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">PRINCIPAL</p>
                        <p className="text-sm font-black italic uppercase italic">{inv.details.principal}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ring-1 ring-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></div> {inv.status}
                        </span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedInvId === inv.id ? 'bg-primary text-white rotate-180' : 'bg-slate-50 text-slate-400 hover:text-primary'}`}>
                          <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {expandedInvId === inv.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-10 pb-10 pt-4 space-y-12 border-t border-slate-50 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-500">
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10 pt-6">
                              {[
                                 { label: 'Principal Amount', value: inv.details.principal, trend: null },
                                 { label: 'APY Growth Rate', value: inv.details.apy, trend: 'up' },
                                 { label: 'Maturity Date', value: inv.details.maturityDate, trend: null },
                                 { label: 'Interest Accrued', value: inv.details.accrued, trend: null },
                              ].map((metric, i) => (
                                 <div key={i} className="space-y-2">
                                    <p className="text-[11px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">{metric.label}</p>
                                    <div className="flex items-center gap-2">
                                       <h4 className="text-2xl font-black italic uppercase tracking-tighter italic">{metric.value}</h4>
                                       {metric.trend === 'up' && <span className="material-symbols-outlined text-emerald-500 text-xl font-black">trending_up</span>}
                                    </div>
                                 </div>
                              ))}
                           </div>

                           <div className="space-y-6 pt-6">
                              <div className="flex items-center justify-between">
                                 <p className="text-[11px] font-black uppercase italic tracking-tighter leading-none italic">Maturity Timeline</p>
                                 <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black italic italic">{inv.details.timeline}%</span>
                              </div>
                              <div className="h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex p-0.5">
                                 <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 animate-in slide-in-from-left shadow-lg shadow-blue-500/30" style={{ width: `${inv.details.timeline}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-background-dark/30 p-2 rounded-xl">
                                 <span className="text-[10px] font-black text-slate-400 uppercase italic">Origination: {inv.details.origination}</span>
                                 <span className="text-[10px] font-black text-emerald-500 uppercase italic">{inv.details.remaining}</span>
                              </div>
                           </div>

                           <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-6 sm:h-20">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                 <button className="flex-1 sm:flex-none px-8 py-4 bg-primary text-white rounded-[22px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    Top-up Principal
                                 </button>
                                 <button className="flex-1 sm:flex-none px-8 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[22px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all border-b-2">
                                    <span className="material-symbols-outlined text-lg">description</span>
                                    Investment Terms
                                 </button>
                              </div>
                              <button className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[22px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all group">
                                 <span className="material-symbols-outlined text-lg opacity-60 group-hover:opacity-100 transition-all">lock</span>
                                 Force Liquidate
                              </button>
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}


          {activeTab === 'bill' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">history</span>
                   </div>
                   <h3 className="text-xl font-black italic uppercase tracking-tight italic">Transaction History</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">search</span>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Search transactions..."
                        className="pl-12 pr-6 py-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl w-80 text-xs font-bold transition-all focus:ring-2 focus:ring-primary shadow-sm"
                      />
                    </div>
                    <button className="p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
                       <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button>
                    <button className="p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
                       <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                 </div>
              </div>

              <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                         <tr>
                            <th className="px-8 py-6">Transaction ID</th>
                            <th className="px-8 py-6">Category</th>
                            <th className="px-8 py-6">Biller</th>
                            <th className="px-8 py-6">Service Identifier</th>
                            <th className="px-8 py-6">Amount</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                         {[
                            { id: '#TRX-88291', date: 'OCT 24, 2023 14:20', cat: 'ELECTRICITY', biller: 'Ikeja Electric (IKEDC)', sid: '45001299182', amt: '₦15,000.00', s: 'SUCCESSFUL', icon: 'bolt', color: 'amber' },
                            { id: '#TRX-88102', date: 'OCT 20, 2023 09:15', cat: 'AIRTIME', biller: 'MTN Nigeria', sid: '08033221100', amt: '₦2,000.00', s: 'SUCCESSFUL', icon: 'smartphone', color: 'yellow' },
                            { id: '#TRX-87994', date: 'OCT 18, 2023 18:30', cat: 'CABLE TV', biller: 'DSTV Multichoice', sid: '7022134511', amt: '₦24,500.00', s: 'FAILED', icon: 'tv', color: 'blue' },
                            { id: '#TRX-87550', date: 'OCT 12, 2023 10:05', cat: 'INTERNET', biller: 'Spectranet', sid: '112233', amt: '₦12,000.00', s: 'SUCCESSFUL', icon: 'wifi', color: 'purple' },
                            { id: '#TRX-86112', date: 'SEP 28, 2023 16:45', cat: 'AIRTIME', biller: 'Airtel Nigeria', sid: '09021234567', amt: '₦500.00', s: 'PENDING', icon: 'smartphone', color: 'rose' },
                         ].map((trx, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="px-8 py-8">
                                  <div className="flex flex-col">
                                     <span className="text-[12px] font-black text-slate-900 uppercase italic">{trx.id}</span>
                                     <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{trx.date}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-8">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-xl bg-${trx.color}-100 flex items-center justify-center text-${trx.color}-600 ring-2 ring-white`}>
                                        <span className="material-symbols-outlined text-[20px]">{trx.icon}</span>
                                     </div>
                                     <span className="text-[11px] font-black text-slate-900 italic italic">{trx.cat}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-8 text-xs font-black text-slate-600 uppercase tracking-tight">{trx.biller}</td>
                               <td className="px-8 py-8">
                                  <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black italic">{trx.sid}</span>
                               </td>
                               <td className="px-8 py-8 text-sm font-black text-slate-900 h-20 italic italic">{trx.amt}</td>
                               <td className="px-8 py-8">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full ${trx.s === 'SUCCESSFUL' ? 'bg-emerald-500 animate-pulse' : trx.s === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500 animate-bounce'}`}></div>
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${trx.s === 'SUCCESSFUL' ? 'text-emerald-600' : trx.s === 'FAILED' ? 'text-rose-500' : 'text-amber-600'}`}>{trx.s}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-8 text-right">
                                  <button className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-[0.2em] hover:bg-primary/5 px-4 py-2 rounded-xl transition-all h-10 leading-none">
                                     <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                     Receipt
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showing 1-5 of 5 records</p>
                   <div className="flex items-center gap-2">
                       <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 transition-all"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                       <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[11px] font-black shadow-lg shadow-primary/30">1</button>
                       <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 transition-all"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-10">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">manage_search</span>
                   </div>
                   <h3 className="text-xl font-black italic uppercase tracking-tight italic">Activity History</h3>
                 </div>
                 <div className="relative w-96">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <span className="material-symbols-outlined text-[18px]">search</span>
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search by admin, action or details..."
                      className="w-full pl-12 pr-6 py-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold transition-all focus:ring-2 focus:ring-primary shadow-sm"
                    />
                 </div>
              </div>

              <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                         <tr>
                            <th className="px-10 py-6">Timestamp</th>
                            <th className="px-10 py-6">Admin Name</th>
                            <th className="px-10 py-6">Action Category</th>
                            <th className="px-10 py-6">Description</th>
                            <th className="px-10 py-6 text-right">Details</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                         {[
                            { time: 'OCT 24, 2023', h: '10:42 AM', admin: 'JAMES ANDERSON', initial: 'JA', cat: 'TIER CHANGE', desc: 'Upgraded user from Tier 1 to Tier 2 after manual KYC review.', color: 'purple' },
                            { time: 'OCT 24, 2023', h: '10:40 AM', admin: 'JAMES ANDERSON', initial: 'JA', cat: 'DOCUMENT VERIFICATION', desc: 'Approved uploaded document "Utility_Bill_Oct2023.pdf".', color: 'blue' },
                            { time: 'OCT 15, 2023', h: '02:15 PM', admin: 'SARAH JENKINS', initial: 'SJ', cat: 'PROFILE EDIT', desc: 'Updated phone number from +234 801... to +234 809...', color: 'slate' },
                            { time: 'SEP 30, 2023', h: '09:12 AM', admin: 'SYSTEM AUTOMATED', initial: 'SYS', cat: 'LOAN APPROVAL', desc: 'Loan #LN-2023-889 approved automatically based on credit score.', color: 'emerald' },
                            { time: 'SEP 12, 2023', h: '11:00 AM', admin: 'JAMES ANDERSON', initial: 'JA', cat: 'NOTE ADDED', desc: 'Added note: "Customer requested limit increase call scheduled".', color: 'amber' },
                         ].map((log, i) => (
                            <tr key={i} className="hover:bg-slate-100/30 transition-all group h-24">
                               <td className="px-10 py-6 font-black uppercase text-[11px] leading-tight flex p-0">
                                  <div className="flex flex-col italic">
                                     <span className="text-slate-900">{log.time}</span>
                                     <span className="text-slate-400 text-[9px] mt-1 italic italic">{log.h}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-full ${log.initial === 'SYS' ? 'bg-sky-50 text-sky-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center text-[10px] font-black ring-2 ring-white group-hover:scale-110 transition-transform`}>
                                        {log.initial}
                                     </div>
                                     <span className="text-xs font-black text-slate-900 italic italic">{log.admin}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-6">
                                  <span className={`px-4 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest leading-none flex items-center justify-center italic bg-${log.color}-50 text-${log.color}-600 ring-1 ring-${log.color}-100`}>
                                     {log.cat}
                                  </span>
                               </td>
                               <td className="px-10 py-6">
                                  <p className="text-xs font-bold text-slate-500 max-w-sm overflow-hidden text-ellipsis italic italic">{log.desc}</p>
                               </td>
                               <td className="px-10 py-6 text-right">
                                  <button className="text-slate-300 hover:text-primary transition-all p-2 rounded-lg hover:bg-blue-50">
                                     <span className="material-symbols-outlined text-[18px]">info</span>
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 italic italic">
                   <p className="text-[11px] font-black text-slate-400 uppercase italic">Showing 1-5 of 5 actions</p>
                   <div className="flex items-center gap-4">
                       <button className="px-6 py-2 bg-white dark:bg-surface-dark border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 italic">Previous</button>
                       <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 italic">Next</button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {selectedCustomerId ? (
        <CustomerDetail customer={selectedCustomer!} />
      ) : (
        <CustomerList />
      )}
      <NewCustomerModal 
        isOpen={isNewCustomerModalOpen} 
        onClose={() => setIsNewCustomerModalOpen(false)} 
      />
    </div>
  );
};

export default CustomersView;
