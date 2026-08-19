
import React, { useState } from 'react';
import { PromoCampaign, UserRole } from '../types';

const INITIAL_PROMOS: PromoCampaign[] = [
  {
    id: 'p1',
    code: 'BOOST',
    type: 'Boost',
    benefitValue: '+1.5%',
    targetProduct: 'NOLT Vault',
    usageCount: 142,
    maxUsage: 500,
    expiryDate: '2024-12-31',
    status: 'Active',
    description: 'Interest rate boost for new investment applications.'
  },
  {
    id: 'p2',
    code: 'SAVE50',
    type: 'Discount',
    benefitValue: '-0.5%',
    targetProduct: 'Salary Advance',
    usageCount: 89,
    maxUsage: 200,
    expiryDate: '2024-06-30',
    status: 'Active',
    description: 'Loan interest discount for early repayments.'
  },
  {
    id: 'p3',
    code: 'NOLT2024',
    type: 'Partner Tag',
    benefitValue: 'TAG_ONLY',
    isBenefitNull: true,
    targetProduct: 'All Products',
    usageCount: 1204,
    isMaxInfinity: true,
    expiryDate: '2024-12-31',
    status: 'Active',
    description: 'General 2024 referral campaign tag for tracking.'
  }
];

interface PromotionsViewProps {
  currentUser: { name: string, role: UserRole, avatar: string };
  onNavigate?: (view: any, promoCode?: string) => void;
}

const PromotionsView: React.FC<PromotionsViewProps> = ({ currentUser, onNavigate }) => {
  const [promos, setPromos] = useState<PromoCampaign[]>(INITIAL_PROMOS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal / Form State
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromoCampaign>>({});

  const filteredPromos = promos.filter(p => 
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Updated: Only Marketing role can make adjustments
  const canAdjust = currentUser.role === 'Marketing';

  const stats = [
    { label: 'Active Campaigns', value: promos.filter(p => p.status === 'Active').length, icon: 'campaign', color: 'text-primary' },
    { label: 'Total Redemptions', value: promos.reduce((acc, p) => acc + p.usageCount, 0).toLocaleString(), icon: 'verified', color: 'text-emerald-500' },
    { label: 'Avg. Benefit', value: '0.85%', icon: 'percent', color: 'text-indigo-500' },
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200';
      case 'Paused': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200';
    }
  };

  const handleToggleStatus = (id: string) => {
    if (!canAdjust) return;
    setPromos(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Active' ? 'Paused' : 'Active';
        return { ...p, status: nextStatus as any };
      }
      return p;
    }));
  };

  const handleOpenCreateModal = () => {
    if (!canAdjust) return;
    setEditingPromoId(null);
    setFormData({
      code: '',
      type: 'Discount',
      benefitValue: '',
      targetProduct: 'All Products',
      description: '',
      usageCount: 0,
      maxUsage: 1000,
      expiryDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      utmSource: 'newsletter',
      utmMedium: 'email',
      isBenefitNull: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: PromoCampaign) => {
    if (!canAdjust) return;
    setEditingPromoId(promo.id);
    setFormData({ ...promo });
    setIsModalOpen(true);
  };

  const handleSavePromo = () => {
    if (!formData.code || !formData.description) return;

    if (editingPromoId) {
      setPromos(prev => prev.map(p => p.id === editingPromoId ? { ...p, ...formData } as PromoCampaign : p));
    } else {
      const newPromo: PromoCampaign = {
        ...(formData as PromoCampaign),
        id: `p-${Math.random().toString(36).substring(2, 7)}`,
      };
      setPromos(prev => [...prev, newPromo]);
    }
    setIsModalOpen(false);
  };

  const handleCopyLink = (promo: PromoCampaign) => {
    const url = `${window.location.origin}/apply?promo=${promo.code}&utm_source=${promo.utmSource || ''}&utm_medium=${promo.utmMedium || ''}&utm_campaign=${promo.code}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here if available
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Promo Management</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Define campaign rules and monitor promotional performance across products.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('push-notifications')}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-xs rounded-2xl transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">notifications_active</span>
              Push Campaigns
            </button>
          )}
          {canAdjust && (
            <button 
              onClick={handleOpenCreateModal}
              className="px-8 py-3 bg-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all flex items-center gap-2 uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[22px]">add_box</span>
              Create New Campaign
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-surface-dark p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-background-dark/50 flex items-center justify-center ${s.color}`}>
              <span className="material-symbols-outlined text-2xl font-black">{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <div className="relative max-w-md">
             <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
               <span className="material-symbols-outlined text-[20px]">search</span>
             </span>
             <input 
              type="text" 
              placeholder="Search by code or description..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-background-dark/50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5">UTM Campaign</th>
                <th className="px-8 py-5">Benefit</th>
                <th className="px-8 py-5">Product Target</th>
                <th className="px-8 py-5">Redemptions</th>
                <th className="px-8 py-5">Expiry</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPromos.map((promo) => (
                <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">sell</span>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest group-hover:text-primary transition-colors">{promo.code}</p>
                        <p className="text-[10px] font-bold text-slate-500 line-clamp-1 max-w-[200px]">{promo.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                      {promo.isBenefitNull ? 'None' : promo.benefitValue}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{promo.targetProduct}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>{promo.usageCount} used</span>
                        {promo.isMaxInfinity ? <span>∞ limit</span> : promo.maxUsage && <span>{promo.maxUsage} limit</span>}
                      </div>
                      {!promo.isMaxInfinity && promo.maxUsage && (
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(promo.usageCount / promo.maxUsage) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-mono font-bold text-slate-500">{promo.expiryDate}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(promo.status)}`}>
                      {promo.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('push-notifications', promo.code)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title={`Broadcast Push Notification for ${promo.code}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleCopyLink(promo)}
                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Copy Campaign Link"
                      >
                        <span className="material-symbols-outlined text-[20px]">link</span>
                      </button>
                      {canAdjust ? (
                        <>
                          <button 
                            onClick={() => handleOpenEditModal(promo)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="Edit Campaign"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit_square</span>
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(promo.id)}
                            className={`p-2 transition-colors ${promo.status === 'Active' ? 'text-amber-400 hover:text-amber-500' : 'text-emerald-400 hover:text-emerald-500'}`}
                            title={promo.status === 'Active' ? 'Pause Campaign' : 'Resume Campaign'}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {promo.status === 'Active' ? 'pause_circle' : 'play_circle'}
                            </span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-400 italic">Read Only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-surface-dark w-full max-w-xl rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {editingPromoId ? 'Edit Promotion' : 'Create Promotion'}
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-bold">Define the code behavior and application constraints.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
               {/* Section 1: Campaign Identity */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-1 h-4 bg-primary rounded-full" />
                   <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Campaign Identity</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UTM Campaign (Code)</label>
                     <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. FLASH50" 
                      className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black uppercase focus:ring-2 focus:ring-primary dark:text-white" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Product</label>
                     <select 
                      value={formData.targetProduct}
                      onChange={(e) => setFormData({...formData, targetProduct: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black uppercase focus:ring-2 focus:ring-primary dark:text-white"
                     >
                       <option value="All Products">All Products</option>
                       <optgroup label="Investments">
                         <option value="NOLT Rise">NOLT Rise</option>
                         <option value="NOLT Vault">NOLT Vault</option>
                       </optgroup>
                       <optgroup label="Loans">
                         <option value="IPPIS">IPPIS</option>
                         <option value="Salary Advance">Salary Advance</option>
                         <option value="Working Capital">Working Capital</option>
                         <option value="Direct Loan">Direct Loan</option>
                       </optgroup>
                     </select>
                   </div>
                 </div>
               </div>

               {/* Section 2: Attribution */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                   <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Attribution (UTM)</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UTM Source</label>
                     <select 
                      value={formData.utmSource}
                      onChange={(e) => setFormData({...formData, utmSource: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black uppercase focus:ring-2 focus:ring-primary dark:text-white"
                     >
                       <option value="newsletter">Newsletter</option>
                       <option value="twitter">Twitter</option>
                       <option value="google">Google</option>
                       <option value="facebook">Facebook</option>
                       <option value="instagram">Instagram</option>
                       <option value="linkedin">LinkedIn</option>
                       <option value="other social media">Other Social Media</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UTM Medium</label>
                     <div className="space-y-2">
                       <select 
                        value={['email', 'social', 'cpc', 'referral'].includes(formData.utmMedium || '') ? formData.utmMedium : 'other'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'other') {
                            setFormData({...formData, utmMedium: val});
                          } else {
                            setFormData({...formData, utmMedium: ''});
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black uppercase focus:ring-2 focus:ring-primary dark:text-white"
                       >
                         <option value="email">Email</option>
                         <option value="social">Social</option>
                         <option value="cpc">CPC</option>
                         <option value="referral">Referral</option>
                         <option value="other">Other (Type to add)</option>
                       </select>
                       {!['email', 'social', 'cpc', 'referral'].includes(formData.utmMedium || '') && (
                         <input 
                          type="text" 
                          value={formData.utmMedium}
                          onChange={(e) => setFormData({...formData, utmMedium: e.target.value})}
                          placeholder="Enter custom medium..." 
                          className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary dark:text-white animate-in slide-in-from-top-2" 
                         />
                       )}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Section 3: Rules & Constraints */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-1 h-4 bg-amber-500 rounded-full" />
                   <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Rules & Constraints</h4>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <div className="flex items-center justify-between ml-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Benefit Value</label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                         <input 
                           type="checkbox"
                           checked={formData.isBenefitNull}
                           onChange={(e) => setFormData({...formData, isBenefitNull: e.target.checked})}
                           className="w-3 h-3 rounded border-slate-300 text-primary focus:ring-primary"
                         />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Null</span>
                       </label>
                     </div>
                     <input 
                      type="text" 
                      value={formData.isBenefitNull ? '' : formData.benefitValue}
                      onChange={(e) => setFormData({...formData, benefitValue: e.target.value})}
                      placeholder={formData.isBenefitNull ? 'None' : '-0.5% or ₦0.00'} 
                      disabled={formData.isBenefitNull}
                      className={`w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary dark:text-white transition-all ${formData.isBenefitNull ? 'opacity-50 cursor-not-allowed' : ''}`} 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                     <input 
                      type="date" 
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary dark:text-white" 
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <div className="flex items-center justify-between ml-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Redemptions</label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                         <input 
                           type="checkbox"
                           checked={formData.isMaxInfinity}
                           onChange={(e) => setFormData({...formData, isMaxInfinity: e.target.checked})}
                           className="w-3 h-3 rounded border-slate-300 text-primary focus:ring-primary"
                         />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Infinity</span>
                       </label>
                     </div>
                     <input 
                      type="number" 
                      value={formData.isMaxInfinity ? '' : formData.maxUsage}
                      onChange={(e) => setFormData({...formData, maxUsage: parseInt(e.target.value) || 0})}
                      placeholder={formData.isMaxInfinity ? '∞' : '500'} 
                      disabled={formData.isMaxInfinity}
                      className={`w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary dark:text-white transition-all ${formData.isMaxInfinity ? 'opacity-50 cursor-not-allowed' : ''}`} 
                     />
                   </div>
                 </div>
               </div>

               {/* Section 4: Documentation */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-1 h-4 bg-slate-400 rounded-full" />
                   <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Documentation</h4>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Description</label>
                   <textarea 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Explain the purpose of this code for audit logs..." 
                    className="w-full bg-slate-50 dark:bg-background-dark/50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-white" 
                   />
                 </div>
               </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-background-dark/30 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest">Discard</button>
              <button 
                onClick={handleSavePromo}
                className="px-8 py-4 bg-primary text-white text-[10px] font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all uppercase tracking-widest"
              >
                {editingPromoId ? 'Update Campaign' : 'Deploy Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsView;
