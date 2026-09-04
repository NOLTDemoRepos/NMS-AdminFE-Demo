
export type RequestType = 'Investment' | 'Loan' | 'Liquidation';
export type RequestStatus = 'Pending Review' | 'Docs Verification' | 'Credit Review' | 'Approved' | 'Declined' | 'Returned' | 'Internal Audit' | 'Pending Disbursement';
export type AppView = 
  | 'dashboard' 
  | 'queue' 
  | 'transfers'
  | 'push-notifications'
  | 'investments' 
  | 'investments-dashboard' 
  | 'investments-mobile' 
  | 'investments-backoffice'
  | 'loans' 
  | 'loans-dashboard' 
  | 'loans-business' 
  | 'loans-mobile' 
  | 'loans-staff' 
  | 'reports' 
  | 'settings' 
  | 'users' 
  | 'security' 
  | 'form-builder' 
  | 'promotions' 
  | 'customers' 
  | 'bi';

export type UserRole = 
  | 'Super Admin' 
  | 'HR Officer'
  | 'HR Manager'
  | 'Credit Manager' 
  | 'Credit Officer'
  | 'Sales Manager' 
  | 'Sales Team Lead'
  | 'Sales Officer' 
  | 'Customer Experience'
  | 'Internal Control'
  | 'Finance'
  | 'Marketing'
  | 'MD'
  | 'ED'
  | 'Agent';

export type UserStatus = 'Active' | 'Pending' | 'Suspended';

export interface PromoCampaign {
  id: string;
  code: string;
  type: 'Discount' | 'Boost' | 'Partner Tag';
  benefitValue: string; // e.g. "-0.5%" or "+1.5%"
  isBenefitNull?: boolean;
  targetProduct: string; // Updated from union to string for product specificity
  usageCount: number;
  maxUsage?: number;
  isMaxInfinity?: boolean;
  expiryDate: string;
  status: 'Active' | 'Paused' | 'Expired';
  description: string;
  utmSource?: string;
  utmMedium?: string;
}

export interface AppNotification {
  id: string;
  type: 'loan' | 'investment' | 'security' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  referenceId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  referralCode?: string;
  lastActive: string;
  avatar: string;
  teamLeadId?: string;
  wrapUser?: string;
  hasStaffLoanAccess?: boolean;
  staffLoanMaxCap?: number;
  staffLoanAccessGrantedBy?: string;
  staffLoanAccessUpdatedAt?: string;
  hrisSyncStatus?: 'Synced' | 'Pending HRIS' | 'Exempt';
  staffCode?: string;
  staffDepartment?: string;
  staffBadgeTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  approvedLoansCount?: number;
  investmentsBookedCount?: number;
  agentCode?: string;
  agentReferralUrl?: string;
  agentTier?: string;
  agentTotalCommissionEarned?: number;
  agentPendingCommission?: number;
  agentReferredInvestmentsCount?: number;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    email: string;
    avatar: string;
  };
  event: string;
  details: string;
  ipAddress: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  comment?: string;
}

export interface Reference {
  name: string;
  phone: string;
  relationship: string;
}

export interface Applicant {
  title?: string;
  name: string;
  email: string;
  avatar: string;
  isPep?: boolean;
  gender?: string;
  dateOfBirth?: string;
  mothersMaidenName?: string;
  religion?: string;
  maritalStatus?: string;
  countryCode?: string;
  phone?: string;
  bvn?: string;
  nin?: string;
  stateOfOrigin?: string;
  stateOfResidence?: string;
  address?: string;
  occupation?: string;
  nokName?: string;
  nokRelationship?: string;
  nokAddress?: string;
  residentialStatus?: string;
  dependents?: number;
  ippisNumber?: string;
  mda?: string;
  accountTier?: string;
  isBlacklisted?: boolean;
  fraudFlag?: boolean;
  fraudReason?: string;
  blacklistDate?: string;
  blacklistExpiryDate?: string;
  blacklistReason?: string;
  rejectionDate?: string;
  rejectionCoolingExpiryDate?: string;
  rejectionReason?: string;
}

export interface Customer extends Applicant {
  id: string;
  customerCode: string;
  joinedDate: string;
  status: 'Active' | 'Dormant' | 'Flagged';
  tier: 1 | 2 | 3;
  accountType: 'Individual' | 'Joint' | 'Corporate';
  availableBalance?: string;
  documents: {
    label: string;
    url: string;
    type: string;
  }[];
}

export interface InvestmentRate {
  id: string;
  planName: 'NOLT Rise' | 'NOLT Vault' | 'NOLT Target';
  minAmount: number;
  maxAmount: number;
  isMaxInfinity?: boolean;
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
  tenureMonths: number;
  interestRate: number; // percentage
  status: 'Active' | 'Inactive';
  lastUpdated: string;
}

export interface AgentCommissionTier {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  isMaxInfinity?: boolean;
  tenureDays: number; // e.g. 30, 60, 90, 180, 365
  tenureLabel: string; // e.g. "30 Days", "60 Days"
  commissionPercent: number; // e.g. 2.0 (%), 3.0 (%)
  status: 'Active' | 'Inactive';
  description?: string;
  lastUpdated?: string;
}

export interface ReviewRequest {
  id: string;
  referenceId: string;
  applicant: Applicant;
  type: RequestType;
  amount: string;
  eligibleAmount?: string;
  dateSubmitted: string;
  status: RequestStatus;
  calculatedInterest?: string;
  wht?: string;
  ownerId?: string; 
  ownerName?: string; 
  referralCodeUsed?: string;
  promoCode?: string;
  isAgentReferral?: boolean;
  agentId?: string;
  agentName?: string;
  agentCode?: string;
  agentReferralUrl?: string;
  agentCommissionRate?: number; // e.g. 2.0 or 3.0 (%)
  agentCommissionAmount?: number; // e.g. 20000 (₦)
  agentCommissionStatus?: 'Pending Review' | 'Pending' | 'Approved' | 'Paid' | 'Declined';
  agentTenureDays?: number;
  operationLogs?: OperationLogEntry[];
  selectedPlan?: 'NOLT Rise' | 'NOLT Vault' | 'NOLT Target';
  targetAmount?: string;
  rolloverOption?: 'Principal & Interest' | 'Principal Only' | 'Payout';
  tenure?: string;
  loanCategory?: 'Business' | 'Employees' | 'Niche' | 'Mobile App';
  loanProduct?: string;
  hasActiveLoans?: boolean;
  monthlyIncome?: string;
  repaymentPeriod?: string;
  references?: Reference[];
  governmentIdUrl?: string;
  proofOfAddressUrl?: string;
  transferReceiptUrl?: string;
  paymentSource?: string;
  bankStatementUrl?: string;
  selfieUrl?: string;
  paymentStatus?: 'PENDING_PAYMENT' | 'PAID' | 'VERIFIED';
  managementFeeApplied?: boolean;
  insuranceFeeApplied?: boolean;
  indemnityFormUrl?: string;
  isIndemnitySigned?: boolean;
  currentNodeIndex?: number;
  selectedBankGL?: string;
  approvalComment?: string;
  startDate?: string;
  mandates?: Mandate[];
  debitInstructions?: DebitInstruction[];
  isStaffLoan?: boolean;
  isMobileLoan?: boolean;
  isBusinessLoan?: boolean;
  isBackOfficeInvestment?: boolean;
  isMobileInvestment?: boolean;
  bookingChannel?: 'Back Office' | 'Mobile App' | 'Agent Referral';
  branchOffice?: string;
  relationshipManager?: string;
  mandateNumber?: string;
  fixedDepositCertUrl?: string;
  hrisStaffId?: string;
  hrisSalary?: string;
  hrisEmploymentDate?: string;
  hrisIsConfirmed?: boolean;
  hrOfficerVerified?: boolean;
  hrManagerValidated?: boolean;
  hrNotes?: string;
  initiatedByMD?: boolean;
  isBlacklisted?: boolean;
  fraudFlag?: boolean;
  fraudReason?: string;
  blacklistDate?: string;
  blacklistExpiryDate?: string;
  blacklistReason?: string;
  rejectionDate?: string;
  rejectionCoolingExpiryDate?: string;
  rejectionReason?: string;
  isAutoRejected?: boolean;
}

export interface Mandate {
  mandateId: string;
  activationDate: string;
  requestId: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: 'Active' | 'Stopped';
}

export interface DebitInstruction {
  instructionId: string;
  mandateId: string;
  amount: string;
  dateSent: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  lastChecked?: string;
}

export interface StatMetric {
  label: string;
  value: string;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  icon: string;
  color: string;
  badgeText?: string;
}

export type TransferStatus = 'Successful' | 'Failed' | 'Pending' | 'Reversed';
export type ReconciliationStatus = 'Matched' | 'Unreconciled' | 'Reversed' | 'Disputed' | 'Manual Intervention Required';

export interface LedgerMovement {
  id: string;
  entryType: 'DEBIT' | 'CREDIT';
  accountType: 'Customer CASA' | 'NIP Clearing GL' | 'Fee Income GL' | 'VAT Payable GL' | 'Interbank Settlement GL' | 'Suspense Account';
  accountNumber: string;
  accountName: string;
  amount: number;
  formattedAmount: string;
  narration: string;
  postingRef: string;
  postingTimestamp: string;
  status: 'POSTED' | 'REVERSED' | 'PENDING';
}

export interface TransferAuditStep {
  id: string;
  step: string;
  timestamp: string;
  actor: string;
  status: 'Completed' | 'Failed' | 'In Progress' | 'Warning';
  details: string;
  ipAddress?: string;
  device?: string;
}

export interface TransferTransaction {
  id: string;
  reference: string;
  sessionId: string; // 30-digit NIBSS session ID
  channel: 'Mobile App' | 'USSD' | 'Web Portal' | 'Open API';
  channelDetails?: {
    appVersion: string;
    deviceModel: string;
    os: 'iOS' | 'Android' | 'Web';
    ipAddress: string;
    location: string;
  };
  timestamp: string;
  amount: number;
  formattedAmount: string;
  fee: number;
  vat: number;
  totalDebited: number;
  status: TransferStatus;
  narration: string;
  sourceAccount: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    accountType: 'Savings' | 'Current' | 'Staff CASA' | 'Wallet';
    bvn: string;
    customerId: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  destinationAccount: {
    beneficiaryName: string;
    accountNumber: string;
    bankName: string;
    bankCode: string; // NIP 6-digit or CBN 3-digit
    kycTier?: number;
  };
  nipResponseCode?: string;
  nipResponseMessage?: string;
  failureReason?: string;
  reconciliationStatus: ReconciliationStatus;
  ledgerEntries: LedgerMovement[];
  auditTrail: TransferAuditStep[];
  retryCount?: number;
  canRetry?: boolean;
  canReverse?: boolean;
  dispatchedAt?: string;
  completedAt?: string;
  reversedAt?: string;
  reversalReason?: string;
}

export type PushCategory = 'Promotional' | 'Transactional' | 'Product Update' | 'Security & Auth' | 'Reminder';
export type PushStatus = 'Draft' | 'Scheduled' | 'In Flight' | 'Completed' | 'Paused';
export type PushAudience = 
  | 'All Active Users' 
  | 'KYC Tier 3 CASA Holders' 
  | 'Active Borrowers' 
  | 'High-Net-Worth Depositors' 
  | 'Inactive (30+ Days)' 
  | 'Staff Loan Users' 
  | 'Custom Segment';
export type PushTriggerType = 'Immediate' | 'Scheduled' | 'Recurring' | 'Event Triggered';

export interface PushActionBtn {
  id: string;
  label: string;
  action: 'open_promo' | 'apply_loan' | 'invest_vault' | 'transfer_casa' | 'dismiss' | 'open_url';
  isPrimary?: boolean;
}

export interface PushNotificationCampaign {
  id: string;
  name: string;
  title: string;
  body: string;
  category: PushCategory;
  targetAudience: PushAudience;
  targetAudienceCount: number;
  triggerType: PushTriggerType;
  scheduledFor?: string;
  status: PushStatus;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  authorName: string;
  
  // Widget Customization & Media
  richMediaUrl?: string;
  iconType: 'campaign' | 'savings' | 'payments' | 'percent' | 'rocket_launch' | 'verified_user' | 'notifications';
  accentColor?: string;
  sound: 'Default' | 'Chime' | 'Cash Register' | 'Urgent Alert' | 'Silent';
  badgeCount: number;
  actionButtons?: PushActionBtn[];
  
  // Promotion Integration Linkage
  linkedPromoId?: string;
  linkedPromoCode?: string;
  promoDiscountBenefit?: string;
  
  // Deep Link Routing
  deepLinkScreen: 'promotions' | 'loans-mobile' | 'loans-business' | 'loans-staff' | 'investments-mobile' | 'transfers' | 'dashboard' | 'custom-url';
  deepLinkCustomUrl?: string;
  
  // Delivery & Click Analytics
  stats: {
    targeted: number;
    sent: number;
    delivered: number;
    deliveredRate: number; // e.g. 98.5%
    opened: number;
    openRate: number; // e.g. 34.2%
    clicked: number;
    ctrRate: number; // e.g. 18.1%
    dismissed: number;
    bounced: number;
    optOuts: number;
    promoClaims: number;
    conversionsValue: number; // e.g. 14500000 (₦14.5M)
  };
  deviceBreakdown?: {
    iosDelivered: number;
    iosClicked: number;
    androidDelivered: number;
    androidClicked: number;
  };
  hourlyHeatmap?: Array<{ hour: string; opens: number; clicks: number }>;
}

