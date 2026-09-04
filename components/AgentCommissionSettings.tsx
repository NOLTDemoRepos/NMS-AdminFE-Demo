import React, { useState, useEffect } from 'react';
import { AgentCommissionTier, UserRole } from '../types';
import { 
  getStoredCommissionTiers, 
  saveStoredCommissionTiers, 
  resetCommissionTiers, 
  calculateAgentCommission, 
  formatNaira 
} from '../services/agentCommissionService';

interface AgentCommissionSettingsProps {
  currentUser?: { name: string; role: UserRole; avatar: string };
}

export const AgentCommissionSettings: React.FC<AgentCommissionSettingsProps> = ({ currentUser }) => {
  const [tiers, setTiers] = useState<AgentCommissionTier[]>(() => getStoredCommissionTiers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<AgentCommissionTier | null>(null);

  // Live Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(500000);
  const [calcTenure, setCalcTenure] = useState<number>(30);
  const [simResult, setSimResult] = useState(() => calculateAgentCommission(500000, 30, tiers));

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formMinAmount, setFormMinAmount] = useState<number>(100000);
  const [formMaxAmount, setFormMaxAmount] = useState<number>(1000000);
  const [formIsMaxInfinity, setFormIsMaxInfinity] = useState(false);
  const [formTenureDays, setFormTenureDays] = useState<number>(30);
  const [formTenureLabel, setFormTenureLabel] = useState('30 Days (1 Month)');
  const [formPercent, setFormPercent] = useState<number>(2.0);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formDesc, setFormDesc] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'Super Admin' || currentUser?.role === 'Finance' || currentUser?.role === 'MD';

  // Sync tiers with localStorage and trigger calculation
  useEffect(() => {
    setSimResult(calculateAgentCommission(calcAmount, calcTenure, tiers));
  }, [calcAmount, calcTenure, tiers]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingTier(null);
    setFormName('');
    setFormMinAmount(100000);
    setFormMaxAmount(1000000);
    setFormIsMaxInfinity(false);
    setFormTenureDays(30);
    setFormTenureLabel('30 Days (1 Month)');
    setFormPercent(2.0);
    setFormStatus('Active');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tier: AgentCommissionTier) => {
    setEditingTier(tier);
    setFormName(tier.name);
    setFormMinAmount(tier.minAmount);
    setFormMaxAmount(tier.maxAmount);
    setFormIsMaxInfinity(!!tier.isMaxInfinity);
    setFormTenureDays(tier.tenureDays);
    setFormTenureLabel(tier.tenureLabel);
    setFormPercent(tier.commissionPercent);
    setFormStatus(tier.status);
    setFormDesc(tier.description || '');
    setIsModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please provide a descriptive name for this commission tier.');
      return;
    }
    if (formMinAmount < 0 || (!formIsMaxInfinity && formMaxAmount < formMinAmount)) {
      alert('Please specify valid minimum and maximum investment amounts.');
      return;
    }

    let updatedList: AgentCommissionTier[];
    if (editingTier) {
      updatedList = tiers.map(t => t.id === editingTier.id ? {
        ...t,
        name: formName.trim(),
        minAmount: Number(formMinAmount),
        maxAmount: formIsMaxInfinity ? 999999999 : Number(formMaxAmount),
        isMaxInfinity: formIsMaxInfinity,
        tenureDays: Number(formTenureDays),
        tenureLabel: formTenureLabel,
        commissionPercent: Number(formPercent),
        status: formStatus,
        description: formDesc.trim(),
        lastUpdated: new Date().toISOString().split('T')[0]
      } : t);
      showToast(`Updated tier "${formName}" successfully.`);
    } else {
      const newTier: AgentCommissionTier = {
        id: `tier_${Date.now()}`,
        name: formName.trim(),
        minAmount: Number(formMinAmount),
        maxAmount: formIsMaxInfinity ? 999999999 : Number(formMaxAmount),
        isMaxInfinity: formIsMaxInfinity,
        tenureDays: Number(formTenureDays),
        tenureLabel: formTenureLabel,
        commissionPercent: Number(formPercent),
        status: formStatus,
        description: formDesc.trim(),
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      updatedList = [newTier, ...tiers];
      showToast(`Added new tier "${formName}" with ${formPercent}% commission.`);
    }

    setTiers(updatedList);
    saveStoredCommissionTiers(updatedList);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    const updated = tiers.map(t => t.id === id ? { ...t, status: (t.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive' } : t);
    setTiers(updated);
    saveStoredCommissionTiers(updated);
    showToast('Tier status updated.');
  };

  const handleDeleteTier = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the commission tier "${name}"?`)) {
      const updated = tiers.filter(t => t.id !== id);
      setTiers(updated);
      saveStoredCommissionTiers(updated);
      showToast(`Deleted tier "${name}".`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all agent commission rules back to system baseline defaults? (e.g. 100k-1M for 30 days = 2%, 100k-1M for 60 days = 3%)')) {
      const defaults = resetCommissionTiers();
      setTiers(defaults);
      showToast('Agent commission matrix reset to standard defaults.');
    }
  };

  const handleTenurePresetSelect = (days: number, label: string) => {
    setFormTenureDays(days);
    setFormTenureLabel(label);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-xs font-black uppercase tracking-wider">{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-primary/80 rounded-[32px] p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200 border border-white/10 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">real_estate_agent</span>
              Agent Commission Engine
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              Active Matrix
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
            Agent Referral Commission Rules
          </h3>
          <p className="text-sm font-medium text-slate-300 leading-relaxed">
            Configure how different investment capital amounts and deposit tenures map to percentage commissions for licensed Agents. When investors sign up and book an investment via an Agent’s unique URL, the commission is automatically calculated and credited.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Rules</p>
              <p className="text-xl font-black text-white">{tiers.filter(t => t.status === 'Active').length} Tiers</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Base Example</p>
              <p className="text-sm font-black text-emerald-300">₦100k-₦1M @ 30d (2%) / 60d (3%)</p>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-1.5"
                title="Restore initial rules"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset Defaults
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add Commission Tier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Live Simulator Widget */}
      <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">calculate</span>
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Live Commission Rate Simulator
              </h4>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
              Test how any investment amount and duration maps to agent commissions in real-time
            </p>
          </div>
          {/* Quick preset tests for user requirement */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Quick Scenarios:</span>
            <button
              onClick={() => { setCalcAmount(500000); setCalcTenure(30); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                calcAmount === 500000 && calcTenure === 30 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
              }`}
            >
              ₦500k · 30 Days (2%)
            </button>
            <button
              onClick={() => { setCalcAmount(500000); setCalcTenure(60); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                calcAmount === 500000 && calcTenure === 60 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
              }`}
            >
              ₦500k · 60 Days (3%)
            </button>
            <button
              onClick={() => { setCalcAmount(1000000); setCalcTenure(60); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                calcAmount === 1000000 && calcTenure === 60 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
              }`}
            >
              ₦1M · 60 Days (3%)
            </button>
            <button
              onClick={() => { setCalcAmount(2500000); setCalcTenure(90); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                calcAmount === 2500000 && calcTenure === 90 
                  ? 'bg-primary text-white border-primary shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
              }`}
            >
              ₦2.5M · 90 Days (4%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Simulator Inputs */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Test Investment Amount
                </label>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {formatNaira(calcAmount)}
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={10000000}
                step={50000}
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                <span>₦100k</span>
                <span>₦1M</span>
                <span>₦5M</span>
                <span>₦10M</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                Investment Duration / Tenure
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 30, label: '30 Days' },
                  { days: 60, label: '60 Days' },
                  { days: 90, label: '90 Days' },
                  { days: 180, label: '180 Days' },
                ].map(item => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setCalcTenure(item.days)}
                    className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      calcTenure === item.days
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulator Output Box */}
          <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Calculated Commission Breakdown
                </span>
                {simResult.isEligible ? (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Matched Tier
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Unmatched
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commission Rate</p>
                  <p className="text-3xl font-black text-primary mt-1">
                    {simResult.commissionPercent}%
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Of total principal</p>
                </div>
                <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Commission Payout</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatNaira(simResult.commissionAmount)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Payable on confirmation</p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  <span className="font-black text-primary uppercase mr-1.5">Rule Output:</span>
                  {simResult.explanation}
                </p>
                {simResult.matchedTier && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Matched Tier: <strong className="text-slate-800 dark:text-white">{simResult.matchedTier.name}</strong> ({simResult.matchedTier.tenureLabel})
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Commission Tiers Table */}
      <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Configured Amount & Duration Tiers
            </h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
              Mappings enforced whenever an investment application is created from an Agent referral URL
            </p>
          </div>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {tiers.length} Total Rules Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Tier / Name</th>
                <th className="px-6 py-4">Investment Capital Range</th>
                <th className="px-6 py-4">Duration / Tenure</th>
                <th className="px-6 py-4">Commission %</th>
                <th className="px-6 py-4">Sample Payout</th>
                <th className="px-6 py-4">Status</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {tiers.map((tier) => {
                const sampleMinPayout = (tier.minAmount * tier.commissionPercent) / 100;
                const sampleMaxPayout = (Math.min(tier.maxAmount, 10000000) * tier.commissionPercent) / 100;
                
                return (
                  <tr key={tier.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase">{tier.name}</p>
                        {tier.description && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 max-w-xs truncate">{tier.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span>{formatNaira(tier.minAmount)}</span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span>{tier.isMaxInfinity ? 'Unlimited' : formatNaira(tier.maxAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono">
                        {tier.tenureDays} Days ({tier.tenureLabel})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
                        {tier.commissionPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                      {formatNaira(sampleMinPayout)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={!canEdit}
                        onClick={() => handleToggleStatus(tier.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                          tier.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-600'
                        }`}
                      >
                        {tier.status}
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(tier)}
                            className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Tier"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTier(tier.id, tier.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            title="Delete Tier"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Link Instructions and Referral Mechanics */}
      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[28px] p-8 border border-slate-200/80 dark:border-slate-800">
        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">link</span>
          How Agent Referral Link Tracking Works
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          <div className="space-y-1.5">
            <p className="font-black text-slate-900 dark:text-white uppercase">1. Agent Referral URL</p>
            <p>Every Agent role receives a unique tracking URL: <code className="text-primary font-mono text-[11px] bg-primary/10 px-1.5 py-0.5 rounded">nolt.finance/invest?ref=AGENT-CODE</code>.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-black text-slate-900 dark:text-white uppercase">2. Matrix Attribution</p>
            <p>When an investment is placed, the engine evaluates principal amount and tenure days against this matrix to lock in the commission rate.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-black text-slate-900 dark:text-white uppercase">3. Finance Settlement</p>
            <p>Finance reviews the labeled application on the Investment dashboard and approves the commission payout upon deposit clearance.</p>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-xl rounded-[32px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    {editingTier ? 'edit' : 'add_circle'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingTier ? 'Edit Commission Tier' : 'Add Commission Tier'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">Configure amount range, tenure, and percentage</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-5">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tier Name / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter 30-Day Tier"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                    Min Investment (₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={formMinAmount}
                    onChange={(e) => setFormMinAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Max Investment (₦)
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsMaxInfinity}
                        onChange={(e) => setFormIsMaxInfinity(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span>No Max Cap</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    min={formMinAmount}
                    step={10000}
                    disabled={formIsMaxInfinity}
                    required={!formIsMaxInfinity}
                    value={formIsMaxInfinity ? '' : formMaxAmount}
                    placeholder={formIsMaxInfinity ? 'Unlimited' : '1000000'}
                    onChange={(e) => setFormMaxAmount(Number(e.target.value))}
                    className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary font-mono ${
                      formIsMaxInfinity 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                        : 'bg-slate-50 dark:bg-background-dark/50 border-slate-200 dark:border-slate-700 dark:text-slate-100'
                    }`}
                  />
                </div>
              </div>

              {/* Tenure Selection */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Investment Duration (Tenure in Days)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { days: 30, label: '30 Days (1 Month)' },
                    { days: 60, label: '60 Days (2 Months)' },
                    { days: 90, label: '90 Days (3 Months)' },
                    { days: 180, label: '180 Days (6 Months)' },
                  ].map(t => (
                    <button
                      key={t.days}
                      type="button"
                      onClick={() => handleTenurePresetSelect(t.days, t.label)}
                      className={`py-2 px-1 text-center rounded-xl text-[11px] font-black uppercase transition-all border ${
                        formTenureDays === t.days 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t.days} Days
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min={1}
                    max={730}
                    required
                    value={formTenureDays}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormTenureDays(val);
                      setFormTenureLabel(`${val} Days`);
                    }}
                    placeholder="Tenure Days"
                    className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100 font-mono"
                  />
                  <input
                    type="text"
                    value={formTenureLabel}
                    onChange={(e) => setFormTenureLabel(e.target.value)}
                    placeholder="Display Label"
                    className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Commission Percentage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                    Commission Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={25}
                      required
                      value={formPercent}
                      onChange={(e) => setFormPercent(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100 font-mono pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                    Tier Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  Rule Description / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₦100k - ₦1M for 30 days attracts 2% commission"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-100"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-600 transition-all shadow-lg shadow-primary/30"
                >
                  {editingTier ? 'Save Changes' : 'Create Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AgentCommissionSettings;
