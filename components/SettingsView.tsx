
import React, { useState } from 'react';
import { UserRole } from '../types';
import AgentCommissionSettings from './AgentCommissionSettings';

type SettingsTab = 'Change Password' | 'Agent Commissions' | 'GL Wrapper' | 'Integrations' | 'API & Webhooks';
type EmailMethod = 'SMTP' | 'API';

interface SettingsViewProps {
  currentUser?: { name: string; role: UserRole; avatar: string };
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser = { name: 'Super Admin', role: 'Super Admin', avatar: '' } }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Change Password');
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [emailMethod, setEmailMethod] = useState<EmailMethod>('SMTP');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // GL accounts state
  const [glAccounts, setGlAccounts] = useState([
    { code: '102001', name: 'GTBank GL Account', balance: '₦450,230,100.00', status: 'Active' },
    { code: '102002', name: 'Access Bank GL Account', balance: '₦120,450,000.00', status: 'Active' },
    { code: '102003', name: 'Zenith Bank GL Account', balance: '₦890,111,350.00', status: 'Active' },
    { code: '102004', name: 'Providus Bank GL Account', balance: '₦34,500,000.00', status: 'Active' },
    { code: '201005', name: 'Treasury Operations GL Account', balance: '₦0.00', status: 'Active' },
    { code: '401001', name: 'Loan Interest Income GL', balance: '₦15,450,000.00', status: 'Active' },
    { code: '501002', name: 'Management Fee Revenue GL', balance: '₦6,890,400.00', status: 'Active' },
    { code: '202001', name: 'Customer Deposits liability', balance: '₦1,250,000,000.00', status: 'Active' },
  ]);

  // Edit states for GL Accounts
  const [editingGLCode, setEditingGLCode] = useState<string | null>(null);
  const [editGLCodeVal, setEditGLCodeVal] = useState('');
  const [editGLNameVal, setEditGLNameVal] = useState('');
  const [editGLBalanceVal, setEditGLBalanceVal] = useState('');
  const [editGLStatusVal, setEditGLStatusVal] = useState('Active');

  const [glMappings, setGlMappings] = useState([
    { event: 'Loan Disbursement', debitGL: '201005 - Treasury Operations GL Account', creditGL: '102001 - GTBank GL Account', authRequired: true },
    { event: 'Loan Repayment (Principal)', debitGL: '102001 - GTBank GL Account', creditGL: '201005 - Treasury Operations GL Account', authRequired: false },
    { event: 'Interest Earning Posting', debitGL: '201005 - Treasury Operations GL Account', creditGL: '401001 - Loan Interest Income GL', authRequired: true },
    { event: 'Management Fee Realization', debitGL: '102004 - Providus Bank GL Account', creditGL: '501002 - Management Fee Revenue GL', authRequired: false },
    { event: 'Investment Placement Receipt', debitGL: '102003 - Zenith Bank GL Account', creditGL: '202001 - Customer Deposits liability', authRequired: true },
  ]);

  // Add GL Account form states
  const [showAddGLAccount, setShowAddGLAccount] = useState(false);
  const [newGLCode, setNewGLCode] = useState('');
  const [newGLName, setNewGLName] = useState('');
  const [newGLBalance, setNewGLBalance] = useState('₦0.00');

  // Add GL Mapping form states
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [newMapEvent, setNewMapEvent] = useState('');
  const [newMapDebit, setNewMapDebit] = useState('');
  const [newMapCredit, setNewMapCredit] = useState('');
  const [newMapAuth, setNewMapAuth] = useState(false);

  // Authorizations
  const isGLAuthorized = currentUser?.role === 'Super Admin' || currentUser?.role === 'Finance';
  const tabs = isGLAuthorized 
    ? (['Change Password', 'Agent Commissions', 'GL Wrapper', 'Integrations', 'API & Webhooks'] as SettingsTab[])
    : (['Change Password', 'Agent Commissions', 'Integrations', 'API & Webhooks'] as SettingsTab[]);

  const toggleVisibility = (id: string) => {
    const next = new Set(visibleFields);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleFields(next);
  };

  const IntegrationCard = ({ name, description, icon, status, color }: { name: string, description: string, icon: string, status: 'Connected' | 'Disconnected', color: string }) => (
    <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-opacity-100`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{status}</span>
        </div>
      </div>
      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{name}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2">
        <button className="flex-1 px-4 py-2 bg-slate-50 dark:bg-background-dark text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors">
          View Logs
        </button>
        <button className="flex-1 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors">
          Configure
        </button>
      </div>
    </div>
  );

  const InputField = ({ label, placeholder, isSensitive = false, value, onChange }: { label: string, placeholder: string, isSensitive?: boolean, value?: string, onChange?: (e: any) => void }) => {
    const isVisible = visibleFields.has(label);
    return (
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em]">{label}</label>
        <div className="relative">
          <input 
            type={isSensitive && !isVisible ? 'password' : 'text'}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-50 dark:bg-background-dark/50 border border-transparent dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-200 transition-all"
          />
          {isSensitive && (
            <button 
              onClick={() => toggleVisibility(label)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isVisible ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold">Manage external connections, security credentials, and system parameters.</p>
        </div>
        <button className="px-8 py-3 bg-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/30 hover:bg-blue-600 transition-all flex items-center gap-2 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[20px]">save</span>
          Save All Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-5 text-xs font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${
              activeTab === tab 
                ? 'text-primary' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Change Password' && (
        <div className="max-w-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
          <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Change Password</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                Maintain credential integrity by periodically updating your account security password.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!currentPassword || !newPassword || !confirmPassword) {
              alert('Please populate all fields to proceed.');
              return;
            }
            if (newPassword !== confirmPassword) {
              alert('Confirm Password does not match New Password.');
              return;
            }
            setShowPasswordSuccess(true);
            setTimeout(() => {
              setShowPasswordSuccess(false);
            }, 5000);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }} className="space-y-6">
            <InputField 
              label="Current Password" 
              placeholder="Enter your old password" 
              isSensitive 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="New Password" 
                placeholder="Minimum 8 characters" 
                isSensitive 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <InputField 
                label="Confirm New Password" 
                placeholder="Re-enter new password" 
                isSensitive 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {showPasswordSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-black uppercase flex items-center gap-2 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Credentials successfully secured. Your password has been changed.
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="submit"
                className="px-8 py-4 bg-primary text-white font-black uppercase tracking-[0.15em] text-xs rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
              >
                Save New Password
              </button>
              <button 
                type="button"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-6 py-4 bg-slate-50 dark:bg-background-dark text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-100 transition-all"
              >
                Clear Fields
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'Agent Commissions' && (
        <AgentCommissionSettings currentUser={currentUser} />
      )}

      {activeTab === 'GL Wrapper' && !isGLAuthorized && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 text-center max-w-xl animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-rose-500 text-5xl mb-4">gpp_maybe</span>
          <h3 className="text-xl font-black text-rose-600 uppercase tracking-widest">Unauthorized Access</h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">
            Only Finance and Super Admin roles are authorized to read or adjust General Ledger settings.
          </p>
        </div>
      )}

      {activeTab === 'GL Wrapper' && isGLAuthorized && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Top Info Banner */}
          <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-start gap-4">
            <span className="material-symbols-outlined text-emerald-500 text-3xl font-black mt-0.5">account_balance_wallet</span>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">General Ledger Mappings (GL Wrapper)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                Configure double-entry accounting wrappers. Mappings bind business activities (Disbursements, Payments, Interest) directly to underlying cash or clearing ledger charts for automated downstream ledger posting.
              </p>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">lists</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">GL Chart Registry</h3>
              </div>
              <button 
                onClick={() => setShowAddGLAccount(!showAddGLAccount)}
                className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-blue-600 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                {showAddGLAccount ? 'Close Form' : 'Add Ledger'}
              </button>
            </div>

            {/* Add GL Account Form */}
            {showAddGLAccount && (
              <div className="p-6 bg-slate-50 dark:bg-background-dark/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Register New GL Account</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">GL Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 102005" 
                      value={newGLCode}
                      onChange={(e) => setNewGLCode(e.target.value)}
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">GL Account Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sterling Escrow GL" 
                      value={newGLName}
                      onChange={(e) => setNewGLName(e.target.value)}
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Initial Balance</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ₦0.00" 
                      value={newGLBalance}
                      onChange={(e) => setNewGLBalance(e.target.value)}
                      className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!newGLCode || !newGLName) {
                      alert('Please fill out Code and Name.');
                      return;
                    }
                    const updatedAccounts = [
                      ...glAccounts,
                      { code: newGLCode, name: newGLName, balance: newGLBalance || '₦0.00', status: 'Active' }
                    ];
                    setGlAccounts(updatedAccounts);
                    setNewGLCode('');
                    setNewGLName('');
                    setNewGLBalance('₦0.00');
                    setShowAddGLAccount(false);
                  }}
                  className="w-full py-2.5 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Add to Chart of Accounts
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 w-[20%]">Code</th>
                    <th className="pb-3 w-[45%]">Account Name</th>
                    <th className="pb-3 w-[15%] text-right">Balance</th>
                    <th className="pb-3 w-[10%] text-center">Status</th>
                    <th className="pb-3 w-[10%] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {glAccounts.map((account) => {
                    const isEditing = editingGLCode === account.code;
                    return (
                      <tr key={account.code} className="group text-xs text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                        {isEditing ? (
                          <>
                            <td className="py-4">
                              <input 
                                type="text"
                                value={editGLCodeVal}
                                onChange={(e) => setEditGLCodeVal(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-black"
                              />
                            </td>
                            <td className="py-4">
                              <input 
                                type="text"
                                value={editGLNameVal}
                                onChange={(e) => setEditGLNameVal(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                              />
                            </td>
                            <td className="py-4">
                              <input 
                                type="text"
                                value={editGLBalanceVal}
                                onChange={(e) => setEditGLBalanceVal(e.target.value)}
                                className="w-full p-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-black text-right"
                              />
                            </td>
                            <td className="py-4 text-center">
                              <select 
                                value={editGLStatusVal}
                                onChange={(e) => setEditGLStatusVal(e.target.value)}
                                className="p-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black uppercase text-center"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => {
                                    if (!editGLCodeVal || !editGLNameVal) {
                                      alert('Please provide a valid GL Code and Account Name.');
                                      return;
                                    }
                                    setGlAccounts(glAccounts.map((ac) => 
                                      ac.code === account.code 
                                        ? { code: editGLCodeVal, name: editGLNameVal, balance: editGLBalanceVal || '₦0.00', status: editGLStatusVal }
                                        : ac
                                    ));
                                    setEditingGLCode(null);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all"
                                  title="Save"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </button>
                                <button 
                                  onClick={() => setEditingGLCode(null)}
                                  className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all"
                                  title="Cancel"
                                >
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 font-mono font-black text-primary">{account.code}</td>
                            <td className="py-4">{account.name}</td>
                            <td className="py-4 text-right font-mono font-black">{account.balance}</td>
                            <td className="py-4 text-center">
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-widest ${
                                account.status === 'Active' 
                                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                                  : 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400'
                              }`}>
                                {account.status}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingGLCode(account.code);
                                    setEditGLCodeVal(account.code);
                                    setEditGLNameVal(account.name);
                                    setEditGLBalanceVal(account.balance);
                                    setEditGLStatusVal(account.status);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
                                  title="Edit GL Account"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Do you really wish to delete GL account ${account.code} (${account.name})?`)) {
                                      setGlAccounts(glAccounts.filter((ac) => ac.code !== account.code));
                                    }
                                  }}
                                  className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all"
                                  title="Delete GL Account"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Integrations' && (
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl font-black">verified_user</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">KYC & Identity Verification</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <IntegrationCard 
                name="SmileID" 
                description="Global KYC & identity verification including biometrics and document validation."
                icon="face"
                status="Connected"
                color="bg-emerald-500 text-emerald-500"
              />
              <IntegrationCard 
                name="VerifyMe" 
                description="Address verification and identity matching for Nigerian market standards."
                icon="location_searching"
                status="Disconnected"
                color="bg-blue-500 text-blue-500"
              />
              <IntegrationCard 
                name="Dojo ID" 
                description="Real-time AML screening and Politically Exposed Person (PEP) list integration."
                icon="policy"
                status="Connected"
                color="bg-indigo-500 text-indigo-500"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl font-black">analytics</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Credit Bureaus</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <IntegrationCard 
                name="CRC Credit Bureau" 
                description="Direct access to credit reports and historical financial reliability data."
                icon="history_edu"
                status="Connected"
                color="bg-purple-500 text-purple-500"
              />
              <IntegrationCard 
                name="FirstCentral" 
                description="Alternate credit scoring and fraud detection metrics for retail lending."
                icon="troubleshoot"
                status="Disconnected"
                color="bg-rose-500 text-rose-500"
              />
              <IntegrationCard 
                name="CreditRegistry" 
                description="Automated credit check during loan application processing."
                icon="inventory"
                status="Disconnected"
                color="bg-amber-500 text-amber-500"
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'API & Webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">key</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Live API Credentials</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">PRODUCTION</span>
            </div>
            <div className="space-y-4">
              <InputField label="Public API Key" placeholder="pk_live_492019..." />
              <InputField label="Secret Key" placeholder="sk_live_••••••••••••" isSensitive />
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-blue-600 flex items-center gap-1 transition-all">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Roll Secret Key
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 h-fit">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary">webhook</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Webhook Configuration</h3>
            </div>
            <div className="space-y-4">
              <InputField label="Webhook Endpoint URL" placeholder="https://your-domain.com/webhooks/nolt" />
              <InputField label="Signing Secret" placeholder="whsec_••••••••••••" isSensitive />
              <div className="flex flex-wrap gap-2 pt-2">
                {['loan.approved', 'investment.matured', 'payment.failed'].map(e => (
                  <span key={e} className="px-3 py-1 bg-slate-100 dark:bg-background-dark/50 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-800">
                    {e}
                    <button className="hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-[14px]">close</span></button>
                  </span>
                ))}
                <button className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-dashed border-primary/30 hover:bg-primary/20 transition-all">+ Add Event</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mail</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Email Service Integration</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-background-dark p-1 rounded-xl">
                <button 
                  onClick={() => setEmailMethod('SMTP')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${emailMethod === 'SMTP' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  SMTP
                </button>
                <button 
                  onClick={() => setEmailMethod('API')}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${emailMethod === 'API' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Via API
                </button>
              </div>
            </div>

            {emailMethod === 'SMTP' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
                <InputField label="SMTP Host" placeholder="smtp.gmail.com" />
                <InputField label="SMTP Port" placeholder="587" />
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em]">Encryption Type</label>
                   <select className="w-full bg-slate-50 dark:bg-background-dark/50 border border-transparent dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-200">
                      <option>None</option>
                      <option>SSL</option>
                      <option>TLS</option>
                      <option selected>STARTTLS</option>
                   </select>
                </div>
                <InputField label="SMTP Username" placeholder="sender@nolt.finance" />
                <InputField label="SMTP Password" placeholder="••••••••••••" isSensitive />
                <InputField label="Sender Name" placeholder="NOLT Finance Alerts" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em]">API Provider</label>
                   <select className="w-full bg-slate-50 dark:bg-background-dark/50 border border-transparent dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary dark:text-slate-200">
                      <option>SendGrid</option>
                      <option>Mailgun</option>
                      <option>Amazon SES</option>
                      <option>Postmark</option>
                   </select>
                </div>
                <InputField label="API Secret Key" placeholder="SG.••••••••••••" isSensitive />
                <InputField label="Sender Name" placeholder="NOLT Finance Support" />
                <InputField label="Sender Domain" placeholder="mail.nolt.finance" />
                <InputField label="Default Sender Email" placeholder="no-reply@nolt.finance" />
                <InputField label="Reply-To Address" placeholder="support@nolt.finance" />
                <div className="flex items-end pb-1">
                  <button className="w-full px-4 py-3 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                    Test Connection
                  </button>
                </div>
              </div>
            )}
            <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">info</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                <span className="text-primary uppercase tracking-tighter">Pro Tip:</span> SMTP is standard for existing mail servers, while API integration offers higher deliverability and granular tracking for transactional system notifications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
