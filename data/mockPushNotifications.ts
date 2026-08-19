import { PushNotificationCampaign } from '../types';

export const INITIAL_PUSH_CAMPAIGNS: PushNotificationCampaign[] = [
  {
    id: 'push-001',
    name: 'Weekend Yield Rush - +1.5% Boost Blast',
    title: '🚀 Limited Offer: Unlock +1.5% Extra APY on NOLT Vault!',
    body: 'Supercharge your savings this weekend! Apply promo code BOOST to earn enhanced interest rates on 12-month lockups. Tap to claim before Sunday midnight.',
    category: 'Promotional',
    targetAudience: 'High-Net-Worth Depositors',
    targetAudienceCount: 18500,
    triggerType: 'Immediate',
    status: 'Completed',
    createdAt: '2024-10-20T08:30:00.000Z',
    sentAt: '2024-10-20T09:00:00.000Z',
    completedAt: '2024-10-20T09:12:00.000Z',
    authorName: 'Funke Oladipo (Marketing Lead)',
    richMediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    iconType: 'rocket_launch',
    accentColor: '#2563EB',
    sound: 'Cash Register',
    badgeCount: 1,
    actionButtons: [
      { id: 'act-1', label: 'Claim +1.5% Boost', action: 'open_promo', isPrimary: true },
      { id: 'act-2', label: 'View Rates', action: 'invest_vault', isPrimary: false }
    ],
    linkedPromoId: 'p1',
    linkedPromoCode: 'BOOST',
    promoDiscountBenefit: '+1.5% Interest Boost',
    deepLinkScreen: 'investments-mobile',
    stats: {
      targeted: 18500,
      sent: 18500,
      delivered: 18240,
      deliveredRate: 98.6,
      opened: 7113,
      openRate: 39.0,
      clicked: 3465,
      ctrRate: 19.0,
      dismissed: 4120,
      bounced: 260,
      optOuts: 18,
      promoClaims: 482,
      conversionsValue: 68400000 // ₦68.4M in booked vaults
    },
    deviceBreakdown: {
      iosDelivered: 10400,
      iosClicked: 2180,
      androidDelivered: 7840,
      androidClicked: 1285
    },
    hourlyHeatmap: [
      { hour: '09:00', opens: 2840, clicks: 1420 },
      { hour: '10:00', opens: 1920, clicks: 960 },
      { hour: '11:00', opens: 1150, clicks: 540 },
      { hour: '12:00', opens: 680, clicks: 310 },
      { hour: '13:00', opens: 320, clicks: 145 },
      { hour: '14:00', opens: 203, clicks: 90 }
    ]
  },
  {
    id: 'push-002',
    name: 'Salary Advance 50% Origination Fee Waiver',
    title: '⚡ Need Fast Cash? 50% Off Processing Fees Today',
    body: 'Payday feels far? Access up to ₦500,000 instant salary advance with promo code SAVE50. Zero collateral, disbursed in 60 seconds.',
    category: 'Promotional',
    targetAudience: 'Active Borrowers',
    targetAudienceCount: 9200,
    triggerType: 'Immediate',
    status: 'In Flight',
    createdAt: '2024-10-24T10:15:00.000Z',
    sentAt: '2024-10-24T11:00:00.000Z',
    authorName: 'Alex Morgan (Product Growth)',
    richMediaUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80',
    iconType: 'payments',
    accentColor: '#10B981',
    sound: 'Chime',
    badgeCount: 2,
    actionButtons: [
      { id: 'act-21', label: 'Apply in 60s', action: 'apply_loan', isPrimary: true },
      { id: 'act-22', label: 'Calculate Repayment', action: 'open_promo', isPrimary: false }
    ],
    linkedPromoId: 'p2',
    linkedPromoCode: 'SAVE50',
    promoDiscountBenefit: '-0.5% Fee Discount',
    deepLinkScreen: 'loans-mobile',
    stats: {
      targeted: 9200,
      sent: 9200,
      delivered: 9080,
      deliveredRate: 98.7,
      opened: 3810,
      openRate: 41.9,
      clicked: 1725,
      ctrRate: 19.0,
      dismissed: 2200,
      bounced: 120,
      optOuts: 9,
      promoClaims: 210,
      conversionsValue: 18200000 // ₦18.2M in disbursed loans
    },
    deviceBreakdown: {
      iosDelivered: 4900,
      iosClicked: 960,
      androidDelivered: 4180,
      androidClicked: 765
    },
    hourlyHeatmap: [
      { hour: '11:00', opens: 1850, clicks: 890 },
      { hour: '12:00', opens: 1120, clicks: 510 },
      { hour: '13:00', opens: 540, clicks: 215 },
      { hour: '14:00', opens: 300, clicks: 110 }
    ]
  },
  {
    id: 'push-003',
    name: 'NOLT 2024 Referral Bonanza - Earn ₦5,000 Per Friend',
    title: '🎁 Refer Friends, Earn ₦5,000 Cash directly into your CASA',
    body: 'Share your personal referral code NOLT2024. When your friend signs up and books a loan or investment, you both get cash rewards!',
    category: 'Promotional',
    targetAudience: 'All Active Users',
    targetAudienceCount: 25000,
    triggerType: 'Scheduled',
    scheduledFor: '2024-11-01T08:00:00.000Z',
    status: 'Scheduled',
    createdAt: '2024-10-25T14:00:00.000Z',
    authorName: 'Funke Oladipo (Marketing Lead)',
    richMediaUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    iconType: 'campaign',
    accentColor: '#8B5CF6',
    sound: 'Default',
    badgeCount: 1,
    actionButtons: [
      { id: 'act-31', label: 'Copy Referral Code', action: 'open_promo', isPrimary: true },
      { id: 'act-32', label: 'Share Link', action: 'open_url', isPrimary: false }
    ],
    linkedPromoId: 'p3',
    linkedPromoCode: 'NOLT2024',
    promoDiscountBenefit: 'Partner Referral Tag',
    deepLinkScreen: 'promotions',
    stats: {
      targeted: 25000,
      sent: 0,
      delivered: 0,
      deliveredRate: 0,
      opened: 0,
      openRate: 0,
      clicked: 0,
      ctrRate: 0,
      dismissed: 0,
      bounced: 0,
      optOuts: 0,
      promoClaims: 0,
      conversionsValue: 0
    }
  },
  {
    id: 'push-004',
    name: 'Critical Security Alert - Biometric & FaceID Re-Enrollment',
    title: '🔒 Enhanced Account Protection: Enable Biometric PIN Now',
    body: 'To safeguard your high-value NIP transfer limits, please confirm your TouchID/FaceID enrollment in the Security Center.',
    category: 'Security & Auth',
    targetAudience: 'KYC Tier 3 CASA Holders',
    targetAudienceCount: 14200,
    triggerType: 'Immediate',
    status: 'Completed',
    createdAt: '2024-10-15T09:00:00.000Z',
    sentAt: '2024-10-15T09:30:00.000Z',
    completedAt: '2024-10-15T09:45:00.000Z',
    authorName: 'Internal Control & Security',
    iconType: 'verified_user',
    accentColor: '#EF4444',
    sound: 'Urgent Alert',
    badgeCount: 1,
    actionButtons: [
      { id: 'act-41', label: 'Secure Now', action: 'open_url', isPrimary: true },
      { id: 'act-42', label: 'Remind Later', action: 'dismiss', isPrimary: false }
    ],
    deepLinkScreen: 'dashboard',
    stats: {
      targeted: 14200,
      sent: 14200,
      delivered: 14050,
      deliveredRate: 98.9,
      opened: 8520,
      openRate: 60.6,
      clicked: 6140,
      ctrRate: 43.7,
      dismissed: 1980,
      bounced: 150,
      optOuts: 4,
      promoClaims: 0,
      conversionsValue: 0
    },
    deviceBreakdown: {
      iosDelivered: 8900,
      iosClicked: 4100,
      androidDelivered: 5150,
      androidClicked: 2040
    }
  },
  {
    id: 'push-005',
    name: 'Staff Loan Special: Zero Processing Fee for Q4',
    title: '🏢 Exclusive for NOLT Employees: Q4 Staff Loan Rate Slashed',
    body: 'All confirmed staff members can now access 12 to 24-month low-interest personal loans with zero origination deduction.',
    category: 'Promotional',
    targetAudience: 'Staff Loan Users',
    targetAudienceCount: 380,
    triggerType: 'Immediate',
    status: 'Completed',
    createdAt: '2024-10-18T12:00:00.000Z',
    sentAt: '2024-10-18T13:00:00.000Z',
    completedAt: '2024-10-18T13:05:00.000Z',
    authorName: 'HR & People Operations',
    iconType: 'savings',
    accentColor: '#3B82F6',
    sound: 'Default',
    badgeCount: 1,
    actionButtons: [
      { id: 'act-51', label: 'View Staff Eligibility', action: 'apply_loan', isPrimary: true }
    ],
    deepLinkScreen: 'loans-staff',
    stats: {
      targeted: 380,
      sent: 380,
      delivered: 378,
      deliveredRate: 99.5,
      opened: 312,
      openRate: 82.5,
      clicked: 184,
      ctrRate: 48.7,
      dismissed: 40,
      bounced: 2,
      optOuts: 0,
      promoClaims: 58,
      conversionsValue: 34500000 // ₦34.5M staff loans
    }
  }
];

export const PRESET_AUDIENCES = [
  { id: 'aud-all', name: 'All Active Users', count: 48500, description: 'Every user with an active mobile app session in the last 90 days.' },
  { id: 'aud-tier3', name: 'KYC Tier 3 CASA Holders', count: 14200, description: 'Verified users with BVN, proof of address, and daily limit >= ₦5,000,000.' },
  { id: 'aud-borrowers', name: 'Active Borrowers', count: 9200, description: 'Users with current active business loans or salary advance lines.' },
  { id: 'aud-investors', name: 'High-Net-Worth Depositors', count: 18500, description: 'Users with cumulative fixed deposits or vault holdings >= ₦1,000,000.' },
  { id: 'aud-inactive', name: 'Inactive (30+ Days)', count: 6800, description: 'Dormant mobile users who have not opened the app in 30+ days.' },
  { id: 'aud-staff', name: 'Staff Loan Users', count: 380, description: 'Verified NOLT employees with HRIS sync and internal staff codes.' }
];
