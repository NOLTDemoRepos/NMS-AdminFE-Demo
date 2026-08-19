import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PushNotificationCampaign, 
  PushCategory, 
  PushStatus, 
  PushAudience, 
  PushTriggerType, 
  User, 
  PromoCampaign 
} from '../types';
import { INITIAL_PUSH_CAMPAIGNS, PRESET_AUDIENCES } from '../data/mockPushNotifications';

interface PushNotificationsViewProps {
  currentUser?: User;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
  activePromos?: PromoCampaign[];
  initialSelectedPromoCode?: string;
}

const DEFAULT_PROMOS: PromoCampaign[] = [
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

const PushNotificationsView: React.FC<PushNotificationsViewProps> = ({ 
  currentUser, 
  onBack, 
  onNavigate,
  activePromos = DEFAULT_PROMOS,
  initialSelectedPromoCode 
}) => {
  const [campaigns, setCampaigns] = useState<PushNotificationCampaign[]>(INITIAL_PUSH_CAMPAIGNS);
  const [activeTab, setActiveTab] = useState<'hub' | 'designer' | 'analytics' | 'promotions-bridge'>('hub');
  const [selectedCampaign, setSelectedCampaign] = useState<PushNotificationCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PushStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<PushCategory | 'All'>('All');
  const [selectedPromoFilter, setSelectedPromoFilter] = useState<string>('All');
  
  // Interactive Phone Simulator State
  const [phoneOS, setPhoneOS] = useState<'ios' | 'android'>('ios');
  const [phoneScreenState, setPhoneScreenState] = useState<'lockscreen' | 'inapp'>('lockscreen');
  const [simulatedTestPush, setSimulatedTestPush] = useState<PushNotificationCampaign | null>(null);

  // New / Edit Campaign Designer Form State
  const [designerForm, setDesignerForm] = useState<Partial<PushNotificationCampaign>>({
    name: '',
    title: '🚀 Limited Offer: Unlock Higher Yields on NOLT Vault!',
    body: 'Supercharge your savings today! Apply promo code BOOST to earn enhanced interest rates. Tap to claim before midnight.',
    category: 'Promotional',
    targetAudience: 'High-Net-Worth Depositors',
    targetAudienceCount: 18500,
    triggerType: 'Immediate',
    iconType: 'rocket_launch',
    accentColor: '#2563EB',
    sound: 'Cash Register',
    badgeCount: 1,
    richMediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    deepLinkScreen: 'investments-mobile',
    actionButtons: [
      { id: 'act-1', label: 'Claim Offer', action: 'open_promo', isPrimary: true },
      { id: 'act-2', label: 'Learn More', action: 'open_url', isPrimary: false }
    ],
    linkedPromoCode: initialSelectedPromoCode || ''
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeOrCompleted = campaigns.filter(c => c.status === 'Completed' || c.status === 'In Flight');
    const totalPushed = activeOrCompleted.reduce((sum, c) => sum + c.stats.sent, 0);
    const totalDelivered = activeOrCompleted.reduce((sum, c) => sum + c.stats.delivered, 0);
    const totalOpened = activeOrCompleted.reduce((sum, c) => sum + c.stats.opened, 0);
    const totalClicked = activeOrCompleted.reduce((sum, c) => sum + c.stats.clicked, 0);
    const totalPromoClaims = activeOrCompleted.reduce((sum, c) => sum + (c.stats.promoClaims || 0), 0);
    const totalConversionsValue = activeOrCompleted.reduce((sum, c) => sum + (c.stats.conversionsValue || 0), 0);

    const avgDeliveryRate = totalPushed > 0 ? ((totalDelivered / totalPushed) * 100).toFixed(1) : '98.8';
    const avgOpenRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '44.2';
    const avgCtrRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '21.5';

    return {
      totalCampaigns,
      totalPushed,
      totalDelivered,
      avgDeliveryRate,
      totalOpened,
      avgOpenRate,
      totalClicked,
      avgCtrRate,
      totalPromoClaims,
      totalConversionsValue
    };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q) ||
        (c.linkedPromoCode && c.linkedPromoCode.toLowerCase().includes(q)) ||
        c.targetAudience.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
      const matchesPromo = selectedPromoFilter === 'All' || (selectedPromoFilter === 'NONE' ? !c.linkedPromoCode : c.linkedPromoCode === selectedPromoFilter);

      return matchesSearch && matchesStatus && matchesCategory && matchesPromo;
    });
  }, [campaigns, searchTerm, statusFilter, categoryFilter, selectedPromoFilter]);

  // Auto-connect promotion to designer
  const handleSelectPromoForDesigner = (promo: PromoCampaign) => {
    setDesignerForm(prev => ({
      ...prev,
      linkedPromoId: promo.id,
      linkedPromoCode: promo.code,
      promoDiscountBenefit: promo.isBenefitNull ? 'Partner Tag' : promo.benefitValue,
      name: `${promo.code} Push Campaign Blast`,
      title: promo.type === 'Boost' 
        ? `🚀 Special Boost: Unlock ${promo.benefitValue} extra return with code ${promo.code}!`
        : `⚡ Limited Offer: Enjoy ${promo.benefitValue} discount with code ${promo.code}!`,
      body: `${promo.description} Apply promo code ${promo.code} on checkout to redeem instantly. Valid until ${promo.expiryDate}.`,
      deepLinkScreen: promo.targetProduct.includes('Vault') ? 'investments-mobile' : promo.targetProduct.includes('Loan') || promo.targetProduct.includes('Advance') ? 'loans-mobile' : 'promotions',
      actionButtons: [
        { id: 'act-p1', label: `Claim ${promo.code}`, action: 'open_promo', isPrimary: true },
        { id: 'act-p2', label: 'View Details', action: 'open_url', isPrimary: false }
      ]
    }));
    setActiveTab('designer');
    showToast(`Linked promo code "${promo.code}" to push campaign designer!`, 'info');
  };

  // Insert dynamic tag into Title or Body
  const handleInsertTag = (field: 'title' | 'body', tag: string) => {
    setDesignerForm(prev => ({
      ...prev,
      [field]: (prev[field] || '') + ' ' + tag
    }));
  };

  // Send Test Push Simulation
  const handleSendTestPush = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      const testCamp: PushNotificationCampaign = {
        id: `test-${Date.now()}`,
        name: designerForm.name || 'Test Push Notification',
        title: designerForm.title || 'NOLT Finance Alert',
        body: designerForm.body || 'Test push notification message from admin portal.',
        category: designerForm.category || 'Promotional',
        targetAudience: designerForm.targetAudience || 'All Active Users',
        targetAudienceCount: 1,
        triggerType: 'Immediate',
        status: 'In Flight',
        createdAt: new Date().toISOString(),
        authorName: currentUser?.name || 'Admin',
        iconType: designerForm.iconType || 'rocket_launch',
        accentColor: designerForm.accentColor || '#2563EB',
        sound: designerForm.sound || 'Default',
        badgeCount: designerForm.badgeCount || 1,
        richMediaUrl: designerForm.richMediaUrl,
        deepLinkScreen: designerForm.deepLinkScreen || 'promotions',
        linkedPromoCode: designerForm.linkedPromoCode,
        actionButtons: designerForm.actionButtons,
        stats: {
          targeted: 1,
          sent: 1,
          delivered: 1,
          deliveredRate: 100,
          opened: 1,
          openRate: 100,
          clicked: 1,
          ctrRate: 100,
          dismissed: 0,
          bounced: 0,
          optOuts: 0,
          promoClaims: 1,
          conversionsValue: 0
        }
      };
      setSimulatedTestPush(testCamp);
      showToast('Simulated push notification dispatched to preview simulator!', 'success');
      setTimeout(() => setSimulatedTestPush(null), 8000);
    }, 600);
  };

  // Save / Launch Campaign
  const handleSaveCampaign = (statusToSet: PushStatus = 'In Flight') => {
    if (!designerForm.name?.trim() || !designerForm.title?.trim() || !designerForm.body?.trim()) {
      showToast('Please fill in campaign name, title, and body before launching.', 'warning');
      return;
    }

    setIsLaunchingCampaign(true);
    setTimeout(() => {
      setIsLaunchingCampaign(false);
      const audienceInfo = PRESET_AUDIENCES.find(a => a.name === designerForm.targetAudience);
      const audienceCount = audienceInfo ? audienceInfo.count : 12500;

      const newCamp: PushNotificationCampaign = {
        id: `push-${Date.now()}`,
        name: designerForm.name!,
        title: designerForm.title!,
        body: designerForm.body!,
        category: designerForm.category || 'Promotional',
        targetAudience: designerForm.targetAudience || 'All Active Users',
        targetAudienceCount: audienceCount,
        triggerType: designerForm.triggerType || 'Immediate',
        status: statusToSet,
        createdAt: new Date().toISOString(),
        sentAt: statusToSet === 'In Flight' ? new Date().toISOString() : undefined,
        scheduledFor: designerForm.scheduledFor,
        authorName: currentUser?.name || 'Administrator',
        iconType: designerForm.iconType || 'campaign',
        accentColor: designerForm.accentColor || '#2563EB',
        sound: designerForm.sound || 'Default',
        badgeCount: designerForm.badgeCount || 1,
        richMediaUrl: designerForm.richMediaUrl,
        deepLinkScreen: designerForm.deepLinkScreen || 'promotions',
        linkedPromoId: designerForm.linkedPromoId,
        linkedPromoCode: designerForm.linkedPromoCode,
        promoDiscountBenefit: designerForm.promoDiscountBenefit,
        actionButtons: designerForm.actionButtons,
        stats: {
          targeted: audienceCount,
          sent: statusToSet === 'In Flight' ? audienceCount : 0,
          delivered: statusToSet === 'In Flight' ? Math.floor(audienceCount * 0.985) : 0,
          deliveredRate: statusToSet === 'In Flight' ? 98.5 : 0,
          opened: statusToSet === 'In Flight' ? Math.floor(audienceCount * 0.412) : 0,
          openRate: statusToSet === 'In Flight' ? 41.2 : 0,
          clicked: statusToSet === 'In Flight' ? Math.floor(audienceCount * 0.187) : 0,
          ctrRate: statusToSet === 'In Flight' ? 18.7 : 0,
          dismissed: 0,
          bounced: 0,
          optOuts: 0,
          promoClaims: statusToSet === 'In Flight' ? Math.floor(audienceCount * 0.045) : 0,
          conversionsValue: statusToSet === 'In Flight' ? 15400000 : 0
        },
        deviceBreakdown: {
          iosDelivered: Math.floor(audienceCount * 0.58),
          iosClicked: Math.floor(audienceCount * 0.11),
          androidDelivered: Math.floor(audienceCount * 0.42),
          androidClicked: Math.floor(audienceCount * 0.08)
        },
        hourlyHeatmap: [
          { hour: '08:00', opens: Math.floor(audienceCount * 0.15), clicks: Math.floor(audienceCount * 0.07) },
          { hour: '09:00', opens: Math.floor(audienceCount * 0.18), clicks: Math.floor(audienceCount * 0.09) },
          { hour: '10:00', opens: Math.floor(audienceCount * 0.08), clicks: Math.floor(audienceCount * 0.03) }
        ]
      };

      setCampaigns(prev => [newCamp, ...prev]);
      setActiveTab('hub');
      showToast(
        statusToSet === 'In Flight' 
          ? `Campaign "${newCamp.name}" launched to ${audienceCount.toLocaleString()} devices!`
          : `Campaign "${newCamp.name}" saved as ${statusToSet}!`,
        'success'
      );
    }, 1000);
  };

  // Toggle status (Pause / Resume)
  const handleToggleStatus = (camp: PushNotificationCampaign) => {
    const nextStatus: PushStatus = camp.status === 'In Flight' ? 'Paused' : 'In Flight';
    setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: nextStatus } : c));
    if (selectedCampaign?.id === camp.id) setSelectedCampaign(prev => prev ? { ...prev, status: nextStatus } : null);
    showToast(`Campaign status updated to ${nextStatus}.`, 'info');
  };

  // Delete Campaign
  const handleDeleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selectedCampaign?.id === id) setSelectedCampaign(null);
    setDeleteConfirmModalOpen(null);
    showToast('Push notification campaign deleted.', 'warning');
  };

  const getStatusBadge = (status: PushStatus) => {
    switch (status) {
      case 'In Flight':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            In Flight
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Completed
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Scheduled
          </span>
        );
      case 'Paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Paused
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* SIMULATED IN-APP / FLOATING TEST PUSH NOTIFICATION POPUP */}
      <AnimatePresence>
        {simulatedTestPush && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.9 }}
            className="fixed top-6 right-6 z-[250] w-full max-w-sm bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 space-y-3 cursor-pointer"
            onClick={() => setSimulatedTestPush(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white text-[12px] font-black">
                  N
                </div>
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-300">NOLT FINANCE</span>
                <span className="text-[10px] text-slate-400 font-medium">• now</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">TEST PREVIEW</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-black text-white leading-tight">{simulatedTestPush.title}</h4>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{simulatedTestPush.body}</p>
            </div>

            {simulatedTestPush.richMediaUrl && (
              <img 
                src={simulatedTestPush.richMediaUrl} 
                alt="Banner" 
                className="w-full h-24 object-cover rounded-xl border border-slate-700" 
              />
            )}

            {simulatedTestPush.actionButtons && simulatedTestPush.actionButtons.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {simulatedTestPush.actionButtons.map(btn => (
                  <button 
                    key={btn.id}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      btn.isPrimary ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Breadcrumbs */}
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
            <span>MARKETING & ENGAGEMENT</span>
            <span>/</span>
            <span className="text-primary font-black">PUSH NOTIFICATIONS</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Push Notification Center
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FCM & APNs Gateways Operational
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">
            Design customizable mobile push widgets, link to promotional discount codes, broadcast targeted alerts, and analyze click-through conversion funnels.
          </p>
        </div>

        {/* Top Global Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setDesignerForm({
                name: '',
                title: '⚡ New Announcement from NOLT Finance',
                body: 'Check out our latest update with enhanced features and rates. Tap to explore.',
                category: 'Promotional',
                targetAudience: 'All Active Users',
                targetAudienceCount: 48500,
                triggerType: 'Immediate',
                iconType: 'campaign',
                accentColor: '#2563EB',
                sound: 'Default',
                badgeCount: 1,
                deepLinkScreen: 'promotions'
              });
              setActiveTab('designer');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>New Push Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Notifications Pushed</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">send</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {metrics.totalPushed.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.totalCampaigns} campaigns created</span>
            <span className="text-emerald-500 font-black">{metrics.avgDeliveryRate}% Delivered</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Open & Read Rate</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">mark_email_read</span>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {metrics.avgOpenRate}%
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.totalOpened.toLocaleString()} total opens</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-[10px]">
              +4.8% vs industry
            </span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Click-Through Rate (CTR)</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">ads_click</span>
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {metrics.avgCtrRate}%
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.totalClicked.toLocaleString()} deep link actions</span>
            <span className="text-indigo-600 font-black text-[10px]">High Intent</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Push-Driven Conversions</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">monetization_on</span>
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            ₦{(metrics.totalConversionsValue / 1000000).toFixed(1)}M
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-2">
            <span>{metrics.totalPromoClaims} promo codes claimed</span>
            <span className="text-amber-600 font-black text-[10px]">ROI 34x</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hub')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'hub'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          <span>Campaigns Hub ({filteredCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('designer')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'designer'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
          <span>Interactive Designer & Widget Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">query_stats</span>
          <span>Delivery & Click Funnel Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions-bridge')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'promotions-bridge'
              ? 'bg-primary text-white shadow-xl shadow-primary/20'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">sell</span>
          <span>Promotions Bridge ({activePromos.length})</span>
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS HUB */}
      {activeTab === 'hub' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filters Bar */}
          <div className="p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns by name, message title, promo code, or audience segment..."
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

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-background-dark rounded-2xl overflow-x-auto w-full lg:w-auto">
                {(['All', 'In Flight', 'Completed', 'Scheduled', 'Draft', 'Paused'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
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
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Transactional">Transactional</option>
                  <option value="Security & Auth">Security & Auth</option>
                  <option value="Product Update">Product Update</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Promo:</span>
                <select
                  value={selectedPromoFilter}
                  onChange={(e) => setSelectedPromoFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="All">All Promotions</option>
                  {activePromos.map(p => (
                    <option key={p.id} value={p.code}>{p.code} ({p.benefitValue})</option>
                  ))}
                  <option value="NONE">Unlinked Broadcasts</option>
                </select>
              </div>

              {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || selectedPromoFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                    setSelectedPromoFilter('All');
                  }}
                  className="ml-auto text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Campaigns Table Grid */}
          <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign / Notification Title</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Audience</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Promo</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Delivery & Opens</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Clicks / CTR</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 dark:text-slate-600">notifications_off</span>
                          <p className="font-bold">No push campaigns match the selected filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((camp) => (
                      <tr 
                        key={camp.id}
                        onClick={() => setSelectedCampaign(camp)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      >
                        {/* Campaign Name & Title */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-xl">{camp.iconType}</span>
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-black text-slate-900 dark:text-white truncate block group-hover:text-primary transition-colors">
                                {camp.name}
                              </span>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                                {camp.title}
                              </p>
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                {camp.category} • {new Date(camp.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Audience */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {camp.targetAudience}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {camp.targetAudienceCount.toLocaleString()} devices
                            </span>
                          </div>
                        </td>

                        {/* Linked Promo */}
                        <td className="py-4 px-6">
                          {camp.linkedPromoCode ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-black text-[11px]">
                                {camp.linkedPromoCode}
                              </span>
                              {camp.promoDiscountBenefit && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  ({camp.promoDiscountBenefit})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold uppercase italic">
                              Direct Alert
                            </span>
                          )}
                        </td>

                        {/* Delivery & Opens */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-slate-900 dark:text-white">
                              {camp.stats.delivered.toLocaleString()} ({camp.stats.deliveredRate}%)
                            </span>
                            <span className="text-[10px] text-emerald-500 font-bold">
                              {camp.stats.opened.toLocaleString()} Opens ({camp.stats.openRate}%)
                            </span>
                          </div>
                        </td>

                        {/* Clicks / CTR */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-primary">
                              {camp.stats.clicked.toLocaleString()} Clicks
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              CTR: {camp.stats.ctrRate}%
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          {getStatusBadge(camp.status)}
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCampaign(camp)}
                              className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="View Delivery Report & Funnel"
                            >
                              <span className="material-symbols-outlined text-lg">query_stats</span>
                            </button>

                            <button
                              onClick={() => {
                                setDesignerForm(camp);
                                setActiveTab('designer');
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                              title="Edit in Designer Simulator"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>

                            {camp.status === 'In Flight' ? (
                              <button
                                onClick={() => handleToggleStatus(camp)}
                                className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors"
                                title="Pause Campaign"
                              >
                                <span className="material-symbols-outlined text-lg">pause_circle</span>
                              </button>
                            ) : camp.status === 'Paused' ? (
                              <button
                                onClick={() => handleToggleStatus(camp)}
                                className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                title="Resume Campaign"
                              >
                                <span className="material-symbols-outlined text-lg">play_circle</span>
                              </button>
                            ) : null}

                            <button
                              onClick={() => setDeleteConfirmModalOpen(camp.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Campaign"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
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

      {/* TAB 2: INTERACTIVE DESIGNER & LIVE PHONE WIDGET SIMULATOR */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          {/* Left Panel: Campaign Builder Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Push Notification Builder
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    Configure copy, media, target segment, and linked promotional codes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestPush}
                    disabled={isSendingTest}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    <span className={`material-symbols-outlined text-base ${isSendingTest ? 'animate-spin' : ''}`}>
                      {isSendingTest ? 'sync' : 'vibration'}
                    </span>
                    <span>Test Notification</span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Campaign Name */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Internal Campaign Identifier
                  </label>
                  <input
                    type="text"
                    value={designerForm.name || ''}
                    onChange={(e) => setDesignerForm({ ...designerForm, name: e.target.value })}
                    placeholder="e.g. Q4 Weekend Yield Booster Blast"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Link to Promotion Banner / Selector */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">sell</span>
                      Link to Active Promo Code
                    </span>
                    {designerForm.linkedPromoCode && (
                      <button
                        type="button"
                        onClick={() => setDesignerForm({ ...designerForm, linkedPromoCode: undefined, linkedPromoId: undefined })}
                        className="text-[10px] font-black text-rose-500 uppercase hover:underline"
                      >
                        Unlink
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activePromos.map(promo => {
                      const isSelected = designerForm.linkedPromoCode === promo.code;
                      return (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => handleSelectPromoForDesigner(promo)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                              : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                          }`}
                        >
                          <div className="font-black text-xs font-mono">{promo.code}</div>
                          <div className="text-[10px] opacity-80 truncate">{promo.targetProduct} ({promo.benefitValue})</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Notification Title (Bold)
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Insert Dynamic Tag:</span>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('title', '{{first_name}}')}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold hover:bg-primary/20 text-primary"
                      >
                        {`{{first_name}}`}
                      </button>
                      {designerForm.linkedPromoCode && (
                        <button
                          type="button"
                          onClick={() => handleInsertTag('title', designerForm.linkedPromoCode!)}
                          className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400"
                        >
                          {designerForm.linkedPromoCode}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={designerForm.title || ''}
                    onChange={(e) => setDesignerForm({ ...designerForm, title: e.target.value })}
                    placeholder="e.g. 🚀 Limited Offer: +1.5% APY Boost on NOLT Vault!"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Notification Message Body
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(designerForm.body || '').length} / 180 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={designerForm.body || ''}
                    onChange={(e) => setDesignerForm({ ...designerForm, body: e.target.value })}
                    placeholder="Enter notification text..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Tags:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('body', '{{first_name}}')}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold hover:bg-primary/20 text-primary"
                    >
                      + First Name
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('body', '{{account_balance}}')}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold hover:bg-primary/20 text-primary"
                    >
                      + CASA Balance
                    </button>
                    {designerForm.linkedPromoCode && (
                      <button
                        type="button"
                        onClick={() => handleInsertTag('body', `code ${designerForm.linkedPromoCode}`)}
                        className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400"
                      >
                        + Promo Code
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Audience & Trigger Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Target Audience Segment
                    </label>
                    <select
                      value={designerForm.targetAudience}
                      onChange={(e) => setDesignerForm({ ...designerForm, targetAudience: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      {PRESET_AUDIENCES.map(aud => (
                        <option key={aud.id} value={aud.name}>
                          {aud.name} (~{aud.count.toLocaleString()} users)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Dispatch Trigger Type
                    </label>
                    <select
                      value={designerForm.triggerType}
                      onChange={(e) => setDesignerForm({ ...designerForm, triggerType: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Immediate">Immediate Broadcast</option>
                      <option value="Scheduled">Scheduled Specific Time</option>
                      <option value="Recurring">Recurring Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Rich Media Banner URL */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Rich Media Banner Attachment (Optional Image URL)
                  </label>
                  <input
                    type="text"
                    value={designerForm.richMediaUrl || ''}
                    onChange={(e) => setDesignerForm({ ...designerForm, richMediaUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                {/* Deep Link Destination Screen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      In-App Deep Link Action Route
                    </label>
                    <select
                      value={designerForm.deepLinkScreen}
                      onChange={(e) => setDesignerForm({ ...designerForm, deepLinkScreen: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="promotions">Promotions Redemption Screen</option>
                      <option value="investments-mobile">NOLT Vault & Fixed Deposits</option>
                      <option value="loans-mobile">Salary Advance & Quick Loans</option>
                      <option value="loans-staff">Staff Loan Portal</option>
                      <option value="transfers">NIP Transfers & CASA Wallet</option>
                      <option value="dashboard">Main Dashboard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Notification Sound & Chime
                    </label>
                    <select
                      value={designerForm.sound}
                      onChange={(e) => setDesignerForm({ ...designerForm, sound: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Default">Default OS Ping</option>
                      <option value="Cash Register">Cash Register (Financial Win)</option>
                      <option value="Chime">Pleasant Chime</option>
                      <option value="Urgent Alert">Urgent Security Alert</option>
                      <option value="Silent">Silent Push (No Sound)</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons Builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Interactive Push Action Buttons (Max 2)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={designerForm.actionButtons?.[0]?.label || ''}
                      onChange={(e) => {
                        const btns = [...(designerForm.actionButtons || [])];
                        btns[0] = { id: 'act-1', label: e.target.value, action: 'open_promo', isPrimary: true };
                        setDesignerForm({ ...designerForm, actionButtons: btns });
                      }}
                      placeholder="Primary Button Label (e.g. Claim Offer)"
                      className="px-4 py-2.5 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={designerForm.actionButtons?.[1]?.label || ''}
                      onChange={(e) => {
                        const btns = [...(designerForm.actionButtons || [])];
                        btns[1] = { id: 'act-2', label: e.target.value, action: 'open_url', isPrimary: false };
                        setDesignerForm({ ...designerForm, actionButtons: btns });
                      }}
                      placeholder="Secondary Button Label (e.g. View Details)"
                      className="px-4 py-2.5 bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Launch & Save Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSaveCampaign('Draft')}
                    className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCampaign('Scheduled')}
                    className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Schedule Broadcast
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCampaign('In Flight')}
                    disabled={isLaunchingCampaign}
                    className="flex-1 py-3.5 bg-primary hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
                  >
                    <span className={`material-symbols-outlined text-base ${isLaunchingCampaign ? 'animate-spin' : ''}`}>
                      {isLaunchingCampaign ? 'sync' : 'send'}
                    </span>
                    <span>{isLaunchingCampaign ? 'Broadcasting...' : 'Broadcast to Audience Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Mobile Phone Simulator (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Live Phone Preview
                </span>
                
                {/* OS Switcher Toggle */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPhoneOS('ios')}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      phoneOS === 'ios'
                        ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Apple iOS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneOS('android')}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      phoneOS === 'android'
                        ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Android
                  </button>
                </div>
              </div>

              {/* Realistic Mobile Device Frame */}
              <div className="w-[320px] h-[640px] bg-slate-950 rounded-[48px] p-4 shadow-2xl border-4 border-slate-800 relative overflow-hidden flex flex-col justify-between">
                {/* Dynamic Island / Camera Notch */}
                <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
                  <div className="w-2 h-2 rounded-full bg-blue-900" />
                </div>

                {/* Wallpaper & Simulated Lockscreen Clock */}
                <div className="flex flex-col items-center justify-center my-4 space-y-1 text-white">
                  <span className="text-4xl font-light tracking-tight font-mono">09:41</span>
                  <span className="text-[11px] font-medium text-slate-300">Wednesday, October 25</span>
                </div>

                {/* THE PUSH NOTIFICATION WIDGET ITSELF */}
                <div className="flex-1 flex flex-col justify-start pt-4">
                  {phoneOS === 'ios' ? (
                    /* iOS Glassmorphism Card Style */
                    <div className="w-full bg-white/15 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 text-white shadow-2xl space-y-2.5 animate-in slide-in-from-top-4 duration-300">
                      {/* App Header */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center text-white font-black text-[10px]">
                            N
                          </div>
                          <span className="font-bold tracking-wide uppercase text-slate-200">NOLT FINANCE</span>
                        </div>
                        <span className="text-[10px] text-slate-300 font-medium">now</span>
                      </div>

                      {/* Title & Body */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white leading-snug">
                          {designerForm.title || 'Notification Title'}
                        </h4>
                        <p className="text-[11px] text-slate-200 leading-snug font-medium line-clamp-3">
                          {designerForm.body || 'Notification message body text appears here...'}
                        </p>
                      </div>

                      {/* Rich Media Banner */}
                      {designerForm.richMediaUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/20">
                          <img 
                            src={designerForm.richMediaUrl} 
                            alt="Media Preview" 
                            className="w-full h-28 object-cover" 
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      {designerForm.actionButtons && designerForm.actionButtons.some(b => b.label) && (
                        <div className="flex items-center gap-2 pt-1">
                          {designerForm.actionButtons.filter(b => b.label).map((b, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                b.isPrimary ? 'bg-primary text-white shadow-md' : 'bg-white/20 text-white'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Android Material You Notification Style */
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 text-slate-100 shadow-2xl space-y-2.5 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-[10px]">
                            N
                          </div>
                          <span className="font-bold text-slate-300">NOLT App</span>
                          <span className="text-[10px] text-slate-500">• 2m</span>
                        </div>
                        <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">{designerForm.title}</h4>
                        <p className="text-[11px] text-slate-300 leading-snug">{designerForm.body}</p>
                      </div>

                      {designerForm.richMediaUrl && (
                        <img 
                          src={designerForm.richMediaUrl} 
                          alt="Android Banner" 
                          className="w-full h-28 object-cover rounded-2xl border border-slate-800" 
                        />
                      )}

                      {designerForm.actionButtons && designerForm.actionButtons.some(b => b.label) && (
                        <div className="flex items-center gap-2 pt-1">
                          {designerForm.actionButtons.filter(b => b.label).map((b, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-black uppercase tracking-wider"
                            >
                              {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Home Indicator Bar */}
                <div className="w-32 h-1 bg-white/60 rounded-full mx-auto mt-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY & CLICK FUNNEL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Aggregate Funnel Overview (8 Cols) */}
            <div className="lg:col-span-8 p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  End-to-End Push Conversion Funnel
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Targeted mobile audience conversion stages from network dispatch to promo redemption.
                </p>
              </div>

              {/* Conversion Stages Visual Bars */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-700 dark:text-slate-300">1. Targeted Audience Devices</span>
                    <span className="font-mono text-slate-900 dark:text-white">{metrics.totalPushed.toLocaleString()} (100%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-700 dark:text-slate-300">2. Handset Delivered (FCM / APNs)</span>
                    <span className="font-mono text-emerald-500">{metrics.totalDelivered.toLocaleString()} ({metrics.avgDeliveryRate}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.avgDeliveryRate}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-700 dark:text-slate-300">3. Opened & Engaged (Banner Tap)</span>
                    <span className="font-mono text-indigo-500">{metrics.totalOpened.toLocaleString()} ({metrics.avgOpenRate}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${metrics.avgOpenRate}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-700 dark:text-slate-300">4. Clicked Action Button / Deep Link</span>
                    <span className="font-mono text-amber-500">{metrics.totalClicked.toLocaleString()} ({metrics.avgCtrRate}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${metrics.avgCtrRate}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-700 dark:text-slate-300">5. Completed Transaction / Promo Claimed</span>
                    <span className="font-mono text-purple-500">{metrics.totalPromoClaims.toLocaleString()} Redemptions</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '8.5%' }} />
                  </div>
                </div>
              </div>

              {/* Attribution Callout */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attributed Deposit & Loan Volume</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    ₦{metrics.totalConversionsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase">
                  High Performance
                </span>
              </div>
            </div>

            {/* Platform & OS Breakdown (4 Cols) */}
            <div className="lg:col-span-4 p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Operating System Distribution
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Delivery reliability & CTR by client mobile OS.
                </p>
              </div>

              <div className="space-y-5">
                {/* Apple iOS */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">phone_iphone</span>
                      <span>Apple iOS (APNs)</span>
                    </div>
                    <span className="text-primary font-mono">58% Share</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>Delivery Rate:</span>
                      <strong className="text-slate-800 dark:text-slate-200">99.1%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Open Rate:</span>
                      <strong className="text-slate-800 dark:text-slate-200">46.5%</strong>
                    </div>
                  </div>
                </div>

                {/* Google Android */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">android</span>
                      <span>Google Android (FCM)</span>
                    </div>
                    <span className="text-emerald-500 font-mono">42% Share</span>
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>Delivery Rate:</span>
                      <strong className="text-slate-800 dark:text-slate-200">98.4%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Open Rate:</span>
                      <strong className="text-slate-800 dark:text-slate-200">41.8%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROMOTIONS BRIDGE (LINKAGE MATRIX) */}
      {activeTab === 'promotions-bridge' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Promotions & Push Notification Coverage Matrix
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Direct connection between marketing promotional codes and targeted mobile push broadcasts.
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('promotions')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-base">sell</span>
                Manage All Promo Codes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activePromos.map(promo => {
                const linkedCampaigns = campaigns.filter(c => c.linkedPromoCode === promo.code);
                const totalPushClaims = linkedCampaigns.reduce((sum, c) => sum + (c.stats.promoClaims || 0), 0);
                const totalAttributedRev = linkedCampaigns.reduce((sum, c) => sum + (c.stats.conversionsValue || 0), 0);

                return (
                  <div
                    key={promo.id}
                    className="p-6 rounded-[28px] bg-slate-50 dark:bg-background-dark/50 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-black text-sm border border-amber-500/20">
                          {promo.code}
                        </span>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {promo.isBenefitNull ? 'Partner Tag' : promo.benefitValue}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{promo.targetProduct}</h4>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1">
                          {promo.description}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Linked Push Blasts:</span>
                          <strong className="text-slate-900 dark:text-white">{linkedCampaigns.length} Campaigns</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Push Redemptions:</span>
                          <strong className="text-emerald-500 font-black">{totalPushClaims} claimed</strong>
                        </div>
                        {totalAttributedRev > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Attributed Value:</span>
                            <strong className="text-primary font-black">₦{(totalAttributedRev / 1000000).toFixed(1)}M</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPromoForDesigner(promo)}
                      className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                    >
                      <span className="material-symbols-outlined text-base">rocket_launch</span>
                      <span>Launch Push Blast for {promo.code}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL & FUNNEL INSPECTION DRAWER */}
      <AnimatePresence>
        {selectedCampaign && (
          <div className="fixed inset-0 z-[140] overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCampaign(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-xl bg-white dark:bg-surface-dark border-l border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md z-10 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        CAMPAIGN DELIVERY REPORT
                      </span>
                      {getStatusBadge(selectedCampaign.status)}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      {selectedCampaign.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-bold">
                      Created by {selectedCampaign.authorName} • {new Date(selectedCampaign.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-8 space-y-6 flex-1">
                  {/* Notification Content Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Dispatched Message Content
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedCampaign.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      "{selectedCampaign.body}"
                    </p>
                    {selectedCampaign.linkedPromoCode && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Linked Promo:</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono font-black text-xs">
                          {selectedCampaign.linkedPromoCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Funnel Stats */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Performance Funnel & Click Metrics
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                        <span className="text-[10px] font-black text-blue-600 uppercase">Total Delivered</span>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                          {selectedCampaign.stats.delivered.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">{selectedCampaign.stats.deliveredRate}% delivery rate</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Total Opened</span>
                        <p className="text-xl font-black text-emerald-600 mt-1">
                          {selectedCampaign.stats.opened.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">{selectedCampaign.stats.openRate}% open rate</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
                        <span className="text-[10px] font-black text-indigo-600 uppercase">Action Clicks</span>
                        <p className="text-xl font-black text-indigo-600 mt-1">
                          {selectedCampaign.stats.clicked.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">CTR {selectedCampaign.stats.ctrRate}%</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] font-black text-amber-600 uppercase">Promo Claims</span>
                        <p className="text-xl font-black text-amber-600 mt-1">
                          {selectedCampaign.stats.promoClaims} Redemptions
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">Direct Conversion</span>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Engagement Breakdown */}
                  {selectedCampaign.hourlyHeatmap && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-background-dark/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Hourly Response Velocity (First 6 Hours)
                      </span>
                      <div className="space-y-2 text-xs">
                        {selectedCampaign.hourlyHeatmap.map(h => (
                          <div key={h.hour} className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-500">{h.hour}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-emerald-500 font-bold">{h.opens} opens</span>
                              <span className="text-primary font-black">{h.clicks} clicks</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons in Drawer */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setDesignerForm(selectedCampaign);
                        setSelectedCampaign(null);
                        setActiveTab('designer');
                      }}
                      className="flex-1 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Clone / Re-trigger in Designer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmModalOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmModalOpen(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-[32px] p-8 shadow-2xl space-y-5 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight">Delete Push Campaign?</h3>
                <p className="text-xs text-slate-400 font-bold">
                  Are you sure you want to delete this campaign? This will remove all delivery and click analytics.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmModalOpen(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCampaign(deleteConfirmModalOpen)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-rose-600/30"
                >
                  Confirm Delete
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
              toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500'
                : toastMessage.type === 'info'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {toastMessage.type === 'warning' ? 'warning' : toastMessage.type === 'info' ? 'info' : 'check_circle'}
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

export default PushNotificationsView;
