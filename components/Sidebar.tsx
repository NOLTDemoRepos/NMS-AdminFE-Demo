
import React, { useState } from 'react';
import { AppView, UserRole } from '../types';

interface SidebarProps {
  onClose?: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogoutClick: () => void;
  currentUser: { name: string, role: UserRole, avatar: string };
  onRoleChange: (role: UserRole) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, currentView, onNavigate, onLogoutClick, currentUser, onRoleChange }) => {
  const isLoansActive = ['loans', 'loans-dashboard', 'loans-business', 'loans-mobile', 'loans-staff'].includes(currentView);
  const isInvestmentsActive = ['investments', 'investments-dashboard', 'investments-mobile', 'investments-backoffice'].includes(currentView);

  const [isLoansOpen, setIsLoansOpen] = useState(isLoansActive);
  const [isInvestmentsOpen, setIsInvestmentsOpen] = useState(isInvestmentsActive);

  const NavLink = ({ icon, label, view, restricted = false, badge }: { icon: string, label: string, view: AppView, restricted?: boolean, badge?: string }) => {
    const active = currentView === view;
    
    if (restricted) {
      return (
        <div 
          className="flex items-center w-full gap-4 px-5 py-3 rounded-2xl opacity-30 cursor-not-allowed group"
          title="Access Restricted for your Role"
        >
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <span className="text-xs font-black uppercase tracking-widest">{label}</span>
        </div>
      );
    }

    return (
      <button 
        onClick={() => {
          onNavigate(view);
          onClose?.();
        }}
        className={`flex items-center justify-between w-full px-5 py-3 rounded-2xl transition-all group ${
          active 
            ? 'bg-primary text-white shadow-xl shadow-primary/20' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-dark hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <span className={`material-symbols-outlined text-[20px] ${active ? 'fill-1' : 'group-hover:fill-1 transition-all'}`}>{icon}</span>
          <span className="text-xs font-black uppercase tracking-wider">{label}</span>
        </div>
        {badge && (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SubNavLink = ({ icon, label, view, restricted = false }: { icon: string, label: string, view: AppView, restricted?: boolean }) => {
    const active = currentView === view;

    if (restricted) return null;

    return (
      <button
        onClick={() => {
          onNavigate(view);
          onClose?.();
        }}
        className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
          active
            ? 'bg-primary/10 text-primary font-black border-l-4 border-primary pl-3'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isMarketing = currentUser.role === 'Marketing';
  const isSalesManager = currentUser.role === 'Sales Manager';
  const isCX = currentUser.role === 'Customer Experience';
  
  const canSeePromotions = isSuperAdmin || isMarketing || isSalesManager;
  const canSeePushNotifications = isSuperAdmin || isMarketing || isSalesManager;
  const canSeeCustomers = isCX || isSuperAdmin;
  const canSeeInvestments = !(currentUser.role === 'Credit Manager' || currentUser.role === 'Credit Officer');

  const roles: UserRole[] = [
    'Super Admin', 
    'HR Officer',
    'HR Manager',
    'Marketing',
    'Credit Manager', 
    'Credit Officer', 
    'Sales Manager', 
    'Sales Team Lead', 
    'Sales Officer', 
    'Customer Experience', 
    'Internal Control', 
    'Finance',
    'MD',
    'ED',
    'Agent'
  ];

  return (
    <aside className="flex flex-col w-72 h-full border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-background-dark flex-shrink-0 transition-colors duration-300">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="max-w-[140px]">
            <img 
              src="https://pub-74b956e78e404291a932f28ada63b70c.r2.dev/logo%20updated%20white.png" 
              alt="NOLT Logo" 
              className="w-full h-auto dark:invert-0 invert" 
            />
          </div>
        </div>
        <button className="md:hidden text-slate-400 hover:text-rose-500" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="px-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <p className="px-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">MANAGEMENT</p>
          <div className="space-y-1">
            <NavLink icon="dashboard" label="DASHBOARD" view="dashboard" />
            
            {/* LOANS Collapsible Module */}
            <div className="space-y-1">
              <button 
                onClick={() => setIsLoansOpen(!isLoansOpen)}
                className={`flex items-center justify-between w-full px-5 py-3 rounded-2xl transition-all group ${
                  isLoansActive 
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-primary font-black' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-dark'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  <span className="text-xs font-black uppercase tracking-wider">LOANS</span>
                </div>
                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isLoansOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isLoansOpen && (
                <div className="pl-4 pr-1 space-y-1 border-l-2 border-primary/20 ml-6 my-1 animate-in slide-in-from-top-2 duration-200">
                  <SubNavLink icon="space_dashboard" label="Dashboard" view="loans-dashboard" />
                  <SubNavLink icon="storefront" label="Business Loans" view="loans-business" />
                  <SubNavLink icon="smartphone" label="Mobile App Loan" view="loans-mobile" />
                  <SubNavLink icon="badge" label="Staff Loan" view="loans-staff" />
                </div>
              )}
            </div>

            {/* INVESTMENTS Collapsible Module */}
            <div className="space-y-1">
              {!canSeeInvestments ? (
                <div 
                  className="flex items-center w-full gap-4 px-5 py-3 rounded-2xl opacity-30 cursor-not-allowed"
                  title="Access Restricted for your Role"
                >
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  <span className="text-xs font-black uppercase tracking-widest">INVESTMENTS</span>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsInvestmentsOpen(!isInvestmentsOpen)}
                    className={`flex items-center justify-between w-full px-5 py-3 rounded-2xl transition-all group ${
                      isInvestmentsActive 
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-primary font-black' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-dark'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="material-symbols-outlined text-[20px]">trending_up</span>
                      <span className="text-xs font-black uppercase tracking-wider">INVESTMENTS</span>
                    </div>
                    <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${isInvestmentsOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {isInvestmentsOpen && (
                    <div className="pl-4 pr-1 space-y-1 border-l-2 border-primary/20 ml-6 my-1 animate-in slide-in-from-top-2 duration-200">
                      <SubNavLink icon="space_dashboard" label="Dashboard" view="investments-dashboard" />
                      <SubNavLink icon="devices" label="Mobile App Investments" view="investments-mobile" />
                      <SubNavLink icon="corporate_fare" label="Back Office Investments" view="investments-backoffice" />
                    </div>
                  )}
                </>
              )}
            </div>

            <NavLink icon="swap_horiz" label="TRANSFERS" view="transfers" badge="NIP" />
            <NavLink icon="group" label="CUSTOMERS" view="customers" restricted={!canSeeCustomers} />
            <NavLink icon="lock" label="PROMOTIONS" view="promotions" restricted={!canSeePromotions} />
            <NavLink icon="notifications_active" label="PUSH NOTIFICATIONS" view="push-notifications" restricted={!canSeePushNotifications} badge="PUSH" />
            <NavLink icon="description" label="REPORTS" view="reports" />
            <NavLink icon="analytics" label="BI DASHBOARD" view="bi" />
          </div>
        </div>

        <div>
          <p className="px-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">CORE SYSTEM</p>
          <div className="space-y-1">
            <NavLink icon="lock" label="SETTINGS" view="settings" restricted={!isSuperAdmin} />
            <NavLink icon="lock" label="ADMIN USERS" view="users" restricted={!isSuperAdmin} />
          </div>
        </div>

        {/* NOLT Mission Advert Card (Left Side Pane Banner) */}
        <div className="p-1">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-900 p-4 text-white shadow-xl border border-blue-500/30 group">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/30 transition-all duration-500"></div>
            
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[8px] font-black uppercase tracking-widest border border-blue-400/30">
                  NOLT MISSION
                </span>
              </div>

              <p className="text-xs font-black leading-snug tracking-tight text-white/95">
                Empowering your dreams with flexible staff loans.
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Instant Approval</span>
                </div>
                
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="px-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">PREVIEW ROLE</label>
          <select 
            className="w-full bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 focus:ring-1 focus:ring-primary appearance-none"
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/50 dark:bg-surface-dark border border-slate-100 dark:border-slate-800/50 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-700 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${currentUser.avatar}')` }}></div>
          <div className="flex flex-col overflow-hidden text-left min-w-0">
            <span className="text-xs font-black text-slate-900 dark:text-white truncate">{currentUser.name}</span>
            <span className="text-[8px] font-bold text-primary uppercase tracking-widest truncate">{currentUser.role}</span>
          </div>
          <button 
            onClick={onLogoutClick}
            className="ml-auto w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shrink-0"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
