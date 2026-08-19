import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface HRStaffLoanAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: { name: string; role: UserRole; avatar: string };
  onUpdateUserAccess: (userId: string, hasAccess: boolean, maxCap?: number) => void;
  onBulkSyncHRIS?: () => void;
}

export const HRStaffLoanAccessModal: React.FC<HRStaffLoanAccessModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onUpdateUserAccess,
  onBulkSyncHRIS
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccess, setFilterAccess] = useState<'all' | 'enabled' | 'restricted'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isHR = currentUser.role === 'HR Officer' || currentUser.role === 'HR Manager' || currentUser.role === 'Super Admin';

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterAccess === 'enabled') return matchesSearch && u.hasStaffLoanAccess !== false;
    if (filterAccess === 'restricted') return matchesSearch && u.hasStaffLoanAccess === false;
    return matchesSearch;
  });

  const handleSyncHRIS = () => {
    setIsSyncing(true);
    setSyncSuccessMsg('');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessMsg('Successfully synced staff list with HRIS! 6 confirmed staff members auto-enabled for staff loans.');
      if (onBulkSyncHRIS) onBulkSyncHRIS();
      setTimeout(() => setSyncSuccessMsg(''), 5000);
    }, 1200);
  };

  const enabledCount = users.filter(u => u.hasStaffLoanAccess !== false).length;
  const restrictedCount = users.filter(u => u.hasStaffLoanAccess === false).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-dark w-full max-w-4xl rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">Staff Loan Access Management</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  HR Role Authorization
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Managed by HR Officers & HR Managers. Select which staff members are eligible to apply for 3.5% staff loans.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Action & Stats Bar */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterAccess('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterAccess === 'all' 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All Staff ({users.length})
              </button>
              <button
                onClick={() => setFilterAccess('enabled')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterAccess === 'enabled' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Access Enabled ({enabledCount})
              </button>
              <button
                onClick={() => setFilterAccess('restricted')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filterAccess === 'restricted' 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Restricted ({restrictedCount})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncHRIS}
                disabled={isSyncing}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin' : ''}`}>
                  {isSyncing ? 'sync' : 'cloud_sync'}
                </span>
                {isSyncing ? 'Syncing with HRIS...' : 'Sync Staff List from HRIS'}
              </button>
            </div>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input 
              type="text"
              placeholder="Filter staff by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{syncSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* User Access Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Staff / Admin</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">HRIS Eligibility Status</th>
                  <th className="px-4 py-3">Authorized By</th>
                  <th className="px-4 py-3 text-right">Staff Loan Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const hasAccess = user.hasStaffLoanAccess !== false;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 object-cover" alt="" />
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-xs">{user.name}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{user.role}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            user.status === 'Active' 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                          }`}>
                            {user.hrisSyncStatus || (user.status === 'Active' ? 'HRIS Confirmed' : 'Pending HRIS')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-medium">
                          {user.staffLoanAccessGrantedBy || 'HR Officer'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => onUpdateUserAccess(user.id, !hasAccess)}
                            disabled={!isHR}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ml-auto shadow-sm ${
                              hasAccess
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">
                              {hasAccess ? 'check_circle' : 'block'}
                            </span>
                            <span>{hasAccess ? 'Access Enabled' : 'Access Disabled'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 text-base">info</span>
            <span>Access settings take effect immediately for staff loan applications and views.</span>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default HRStaffLoanAccessModal;
