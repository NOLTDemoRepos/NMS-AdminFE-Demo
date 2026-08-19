
import React, { useState, useMemo } from 'react';
import { ReviewRequest, UserRole } from '../types';
import StatCard from './StatCard';
import { downloadAsCSV } from '../utils/exportUtils';

interface ReportsViewProps {
  requests: ReviewRequest[];
  currentUser: { name: string, role: UserRole, avatar: string };
}

interface AttributionReport {
  code: string;
  type: 'Referral' | 'Promo';
  owner: string;
  investmentVolume: number;
  loanVolume: number;
  totalCount: number;
  firstSeen: string;
  lastSeen: string;
}

const ReportsView: React.FC<ReportsViewProps> = ({ requests }) => {
  const [dateFilter, setDateFilter] = useState('This Quarter');
  const [typeFilter, setTypeFilter] = useState('All Sources');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to parse currency strings to numbers
  const parseCurrency = (val: string) => {
    return Number(val.replace(/[₦,]/g, ''));
  };

  // Aggregation Logic
  const reports = useMemo(() => {
    const map = new Map<string, AttributionReport>();

    requests.forEach(req => {
      const codes = [];
      if (req.referralCodeUsed) codes.push({ code: req.referralCodeUsed, type: 'Referral' as const, owner: req.ownerName || 'Unknown' });
      if (req.promoCode) codes.push({ code: req.promoCode, type: 'Promo' as const, owner: 'Marketing Campaign' });

      codes.forEach(({ code, type, owner }) => {
        const existing = map.get(code);
        const amount = parseCurrency(req.amount);
        const isInv = req.type === 'Investment';

        if (existing) {
          existing.investmentVolume += isInv ? amount : 0;
          existing.loanVolume += !isInv ? amount : 0;
          existing.totalCount += 1;
          
          // Basic timeline comparison (assumes ISO or standard date strings)
          if (new Date(req.dateSubmitted) < new Date(existing.firstSeen)) existing.firstSeen = req.dateSubmitted;
          if (new Date(req.dateSubmitted) > new Date(existing.lastSeen)) existing.lastSeen = req.dateSubmitted;
        } else {
          map.set(code, {
            code,
            type,
            owner,
            investmentVolume: isInv ? amount : 0,
            loanVolume: !isInv ? amount : 0,
            totalCount: 1,
            firstSeen: req.dateSubmitted,
            lastSeen: req.dateSubmitted
          });
        }
      });
    });

    return Array.from(map.values()).filter(r => {
      const matchesSearch = r.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All Sources' || 
                          (typeFilter === 'Referrals Only' && r.type === 'Referral') ||
                          (typeFilter === 'Promos Only' && r.type === 'Promo');
      return matchesSearch && matchesType;
    });
  }, [requests, searchTerm, typeFilter]);

  const totalAttributed = reports.reduce((acc, curr) => acc + curr.investmentVolume + curr.loanVolume, 0);
  const bestPerformer = reports.sort((a, b) => (b.investmentVolume + b.loanVolume) - (a.investmentVolume + a.loanVolume))[0];

  const reportStats = [
    { 
      label: 'Attributed Volume', 
      value: `₦${(totalAttributed / 1000000).toFixed(1)}M`, 
      change: '+14.2%', 
      isPositive: true, 
      icon: 'analytics', 
      color: 'text-primary' 
    },
    { 
      label: 'Top Performing Code', 
      value: bestPerformer?.code || 'N/A', 
      subValue: bestPerformer ? `₦${(bestPerformer.investmentVolume + bestPerformer.loanVolume).toLocaleString()}` : '',
      icon: 'stars', 
      color: 'text-amber-500' 
    },
    { 
      label: 'Total Code Redemptions', 
      value: reports.reduce((acc, curr) => acc + curr.totalCount, 0).toString(), 
      change: '+8.4%', 
      isPositive: true, 
      icon: 'sell', 
      color: 'text-indigo-500' 
    },
    { 
      label: 'Acquisition Growth', 
      value: '22.4%', 
      badgeText: 'On Track',
      icon: 'speed', 
      color: 'text-emerald-500' 
    },
  ];

  const handleExport = () => {
    const data = reports.map(r => ({
      'Code (Primary Key)': r.code,
      'Source Type': r.type,
      'Owner / Campaign': r.owner,
      'Investment Amount (₦)': r.investmentVolume,
      'Loan Amount (₦)': r.loanVolume,
      'Total Count': r.totalCount,
      'First Transaction': r.firstSeen,
      'Latest Transaction': r.lastSeen
    }));
    downloadAsCSV(data, `NOLT_Attribution_Report_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Attribution Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">In-depth analysis of revenue generated via Sales Officers and Marketing Promos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-6 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportStats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input 
            type="text" 
            placeholder="Search by Code or Officer..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary text-sm font-black transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary w-full md:w-auto"
          >
            <option>All Sources</option>
            <option>Referrals Only</option>
            <option>Promos Only</option>
          </select>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary w-full md:w-auto"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>Year to Date</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5">Attribution Code (PK)</th>
                <th className="px-8 py-5">Source Type</th>
                <th className="px-8 py-5">Linked Officer / Campaign</th>
                <th className="px-8 py-5">Inv. Volume</th>
                <th className="px-8 py-5">Loan Volume</th>
                <th className="px-8 py-5">Redemptions</th>
                <th className="px-8 py-5">Timeline (First &bull; Latest)</th>
                <th className="px-8 py-5 text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((report) => (
                <tr key={report.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <span className="material-symbols-outlined text-[20px] font-black">qr_code_2</span>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{report.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                      report.type === 'Promo' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{report.owner}</p>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                    ₦{report.investmentVolume.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 dark:text-white">
                    ₦{report.loanVolume.toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-slate-900 dark:text-white">{report.totalCount}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">APPS</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase">{report.firstSeen}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{report.lastSeen}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/5 text-emerald-500 rounded-lg border border-emerald-500/10">
                      <span className="material-symbols-outlined text-[16px] font-black">trending_up</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">High</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
