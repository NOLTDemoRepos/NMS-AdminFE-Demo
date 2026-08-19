import { TransferTransaction, LedgerMovement, TransferAuditStep } from '../types';

export const NIP_ERROR_CODES: Record<string, { code: string; name: string; description: string; category: 'Technical' | 'Business' | 'System' }> = {
  '00': { code: '00', name: 'Approved or Completed Successfully', description: 'Transaction completed successfully and credited to beneficiary account.', category: 'Business' },
  '07': { code: '07', name: 'Invalid Beneficiary Account Number', description: 'Destination account number does not exist on the beneficiary bank core banking system.', category: 'Business' },
  '09': { code: '09', name: 'Request in Progress / In Doubt', description: 'Transaction dispatched to NIBSS switch but response timed out. Awaiting settlement reconciliation.', category: 'Technical' },
  '12': { code: '12', name: 'Invalid Transaction Type', description: 'Transaction parameters or destination currency code unsupported.', category: 'Business' },
  '25': { code: '25', name: 'Unable to Locate Record', description: 'Original transaction reference could not be located for status check.', category: 'Technical' },
  '51': { code: '51', name: 'Insufficient Funds', description: 'Customer CASA account has insufficient available balance to cover transfer amount and NIP fees.', category: 'Business' },
  '61': { code: '61', name: 'Exceeds Transfer Limit', description: 'Transfer amount exceeds customer KYC Tier daily single or cumulative transaction limit.', category: 'Business' },
  '91': { code: '91', name: 'Beneficiary Bank Inoperative / Timeout', description: 'Destination bank inward switch did not respond within 30 seconds. Switch timeout.', category: 'Technical' },
  '96': { code: '96', name: 'NIBSS Switch System Malfunction', description: 'Interbank central switch failure or gateway socket connection reset.', category: 'System' }
};

export const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '000014', cbnCode: '044', logo: 'account_balance' },
  { name: 'Zenith Bank', code: '000015', cbnCode: '057', logo: 'account_balance' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '000013', cbnCode: '058', logo: 'account_balance' },
  { name: 'First Bank of Nigeria', code: '000016', cbnCode: '011', logo: 'account_balance' },
  { name: 'United Bank for Africa (UBA)', code: '000004', cbnCode: '033', logo: 'account_balance' },
  { name: 'Kuda Microfinance Bank', code: '090267', cbnCode: '50211', logo: 'savings' },
  { name: 'OPay Digital Services', code: '090328', cbnCode: '304', logo: 'payments' },
  { name: 'PalmPay', code: '090332', cbnCode: '327', logo: 'payments' },
  { name: 'Stanbic IBTC Bank', code: '000012', cbnCode: '221', logo: 'account_balance' },
  { name: 'Sterling Bank', code: '000001', cbnCode: '232', logo: 'account_balance' },
  { name: 'Fidelity Bank', code: '000007', cbnCode: '070', logo: 'account_balance' },
  { name: 'Wema Bank', code: '000017', cbnCode: '035', logo: 'account_balance' }
];

export const INITIAL_TRANSFERS: TransferTransaction[] = [
  {
    id: 'trf-001',
    reference: 'NIP-20231025-9948201',
    sessionId: '999001231025143208000000000042',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'iPhone 14 Pro',
      os: 'iOS',
      ipAddress: '102.89.43.118',
      location: 'Victoria Island, Lagos, NG'
    },
    timestamp: '2023-10-25T14:32:08.000Z',
    amount: 150000,
    formattedAmount: '₦150,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 150011.56,
    status: 'Successful',
    narration: 'Payment for Office IT Equipment Supply',
    sourceAccount: {
      accountName: 'Sarah Miller',
      accountNumber: '2049102941',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Current',
      bvn: '55566677788',
      customerId: 'CUST-NOLT-1029',
      balanceBefore: 850400.00,
      balanceAfter: 700388.44
    },
    destinationAccount: {
      beneficiaryName: 'TEK-SOLUTIONS NIGERIA LIMITED',
      accountNumber: '0123948572',
      bankName: 'Guaranty Trust Bank (GTBank)',
      bankCode: '000013',
      kycTier: 3
    },
    nipResponseCode: '00',
    nipResponseMessage: 'Approved or Completed Successfully',
    reconciliationStatus: 'Matched',
    dispatchedAt: '2023-10-25T14:32:08.410Z',
    completedAt: '2023-10-25T14:32:09.680Z',
    ledgerEntries: [
      {
        id: 'lg-001-1',
        entryType: 'DEBIT',
        accountType: 'Customer CASA',
        accountNumber: '2049102941',
        accountName: 'Sarah Miller - Current CASA',
        amount: 150011.56,
        formattedAmount: '₦150,011.56',
        narration: 'NIP Outward TRF to TEK-SOLUTIONS NIGERIA (GTBank) - Ref: NIP-20231025-9948201',
        postingRef: 'JRNL-NOLT-904128',
        postingTimestamp: '2023-10-25T14:32:08.520Z',
        status: 'POSTED'
      },
      {
        id: 'lg-001-2',
        entryType: 'CREDIT',
        accountType: 'NIP Clearing GL',
        accountNumber: 'GL-200109-NIBSS',
        accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
        amount: 150000.00,
        formattedAmount: '₦150,000.00',
        narration: 'NIP Outward Settlement for Ref: NIP-20231025-9948201 GTBank/0123948572',
        postingRef: 'JRNL-NOLT-904128',
        postingTimestamp: '2023-10-25T14:32:08.520Z',
        status: 'POSTED'
      },
      {
        id: 'lg-001-3',
        entryType: 'CREDIT',
        accountType: 'Fee Income GL',
        accountNumber: 'GL-400102-FEE',
        accountName: 'Electronic Transfer Fee Income',
        amount: 10.75,
        formattedAmount: '₦10.75',
        narration: 'NIP Outward Processing Fee Income',
        postingRef: 'JRNL-NOLT-904128',
        postingTimestamp: '2023-10-25T14:32:08.520Z',
        status: 'POSTED'
      },
      {
        id: 'lg-001-4',
        entryType: 'CREDIT',
        accountType: 'VAT Payable GL',
        accountNumber: 'GL-200115-VAT',
        accountName: 'VAT on Electronic Transfer Fees (7.5%)',
        amount: 0.81,
        formattedAmount: '₦0.81',
        narration: '7.5% VAT on NIP Fee Ref: NIP-20231025-9948201',
        postingRef: 'JRNL-NOLT-904128',
        postingTimestamp: '2023-10-25T14:32:08.520Z',
        status: 'POSTED'
      }
    ],
    auditTrail: [
      {
        id: 'aud-001-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T14:32:08.110Z',
        actor: 'Sarah Miller (App User)',
        status: 'Completed',
        details: 'User authenticated via FaceID & PIN on iPhone 14 Pro. Source CASA: 2049102941. Beneficiary: TEK-SOLUTIONS (GTBank).'
      },
      {
        id: 'aud-001-2',
        step: 'Account Balance & Limit Verification',
        timestamp: '2023-10-25T14:32:08.320Z',
        actor: 'Core Banking Engine (NOLT-CASA-SVC)',
        status: 'Completed',
        details: 'Verified available balance ₦850,400.00 >= ₦150,011.56. Tier 3 daily limit verified. Lien placed.'
      },
      {
        id: 'aud-001-3',
        step: 'Ledger Debit Posting',
        timestamp: '2023-10-25T14:32:08.520Z',
        actor: 'General Ledger Engine',
        status: 'Completed',
        details: 'Debited CASA 2049102941 with ₦150,011.56. Balanced against NIP Clearing GL & Fee accounts. Journal: JRNL-NOLT-904128.'
      },
      {
        id: 'aud-001-4',
        step: 'NIBSS NIP Switch Dispatch',
        timestamp: '2023-10-25T14:32:08.750Z',
        actor: 'NIBSS Outward Gateway',
        status: 'Completed',
        details: 'Dispatched SingleWorkTransactionRequest to NIBSS central switch. Session ID: 999001231025143208000000000042.'
      },
      {
        id: 'aud-001-5',
        step: 'Beneficiary Bank Inward Acknowledgment',
        timestamp: '2023-10-25T14:32:09.680Z',
        actor: 'Guaranty Trust Bank (Host Switch)',
        status: 'Completed',
        details: 'Response Code 00: Approved or Completed Successfully. Account 0123948572 credited successfully.'
      },
      {
        id: 'aud-001-6',
        step: 'Settlement Reconciliation & Push Notification',
        timestamp: '2023-10-25T14:32:09.950Z',
        actor: 'Notification & Recon Daemon',
        status: 'Completed',
        details: 'Push notification & SMS debit alert dispatched. Transfer marked as Matched in daily settlement batch.'
      }
    ]
  },
  {
    id: 'trf-002',
    reference: 'NIP-20231025-9948202',
    sessionId: '999001231025150512000000000043',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'Samsung Galaxy S23',
      os: 'Android',
      ipAddress: '197.210.55.92',
      location: 'Ikeja, Lagos, NG'
    },
    timestamp: '2023-10-25T15:05:12.000Z',
    amount: 450000,
    formattedAmount: '₦450,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 450011.56,
    status: 'Failed',
    narration: 'Contractor advance payment for renovation materials',
    failureReason: 'NIP Error 91: Beneficiary Bank Inoperative / Timed Out. Zenith Bank inward switch unresponsive.',
    sourceAccount: {
      accountName: 'Boluwatife Adeyemi',
      accountNumber: '1092837465',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Savings',
      bvn: '70344556671',
      customerId: 'CUST-NOLT-2044',
      balanceBefore: 620000.00,
      balanceAfter: 620000.00
    },
    destinationAccount: {
      beneficiaryName: 'ALHAJI KABIRU SULE & SONS',
      accountNumber: '2081928471',
      bankName: 'Zenith Bank',
      bankCode: '000015',
      kycTier: 3
    },
    nipResponseCode: '91',
    nipResponseMessage: 'Beneficiary Bank Inoperative / Switch Timeout',
    reconciliationStatus: 'Reversed',
    dispatchedAt: '2023-10-25T15:05:12.250Z',
    reversedAt: '2023-10-25T15:05:42.890Z',
    reversalReason: 'Automated 30s timeout reversal due to destination bank non-response (Error 91). Funds restored to customer CASA.',
    canRetry: true,
    retryCount: 1,
    ledgerEntries: [
      {
        id: 'lg-002-1',
        entryType: 'DEBIT',
        accountType: 'Customer CASA',
        accountNumber: '1092837465',
        accountName: 'Boluwatife Adeyemi - Savings',
        amount: 450011.56,
        formattedAmount: '₦450,011.56',
        narration: 'NIP Outward TRF to ALHAJI KABIRU SULE (Zenith) - Ref: NIP-20231025-9948202',
        postingRef: 'JRNL-NOLT-904144',
        postingTimestamp: '2023-10-25T15:05:12.400Z',
        status: 'REVERSED'
      },
      {
        id: 'lg-002-2',
        entryType: 'CREDIT',
        accountType: 'NIP Clearing GL',
        accountNumber: 'GL-200109-NIBSS',
        accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
        amount: 450000.00,
        formattedAmount: '₦450,000.00',
        narration: 'NIP Clearing Hold for Ref: NIP-20231025-9948202',
        postingRef: 'JRNL-NOLT-904144',
        postingTimestamp: '2023-10-25T15:05:12.400Z',
        status: 'REVERSED'
      },
      {
        id: 'lg-002-3',
        entryType: 'CREDIT',
        accountType: 'Customer CASA',
        accountNumber: '1092837465',
        accountName: 'Boluwatife Adeyemi - Savings',
        amount: 450011.56,
        formattedAmount: '₦450,011.56',
        narration: 'AUTO-REVERSAL: NIP Timeout Error 91 Refund Ref: NIP-20231025-9948202',
        postingRef: 'JRNL-REV-904144',
        postingTimestamp: '2023-10-25T15:05:42.890Z',
        status: 'POSTED'
      },
      {
        id: 'lg-002-4',
        entryType: 'DEBIT',
        accountType: 'NIP Clearing GL',
        accountNumber: 'GL-200109-NIBSS',
        accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
        amount: 450000.00,
        formattedAmount: '₦450,000.00',
        narration: 'AUTO-REVERSAL: NIP Clearing Release Ref: NIP-20231025-9948202',
        postingRef: 'JRNL-REV-904144',
        postingTimestamp: '2023-10-25T15:05:42.890Z',
        status: 'POSTED'
      }
    ],
    auditTrail: [
      {
        id: 'aud-002-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T15:05:12.050Z',
        actor: 'Boluwatife Adeyemi (App User)',
        status: 'Completed',
        details: 'User initiated outward NIP transfer of ₦450,000.00 to Zenith Bank acct 2081928471.'
      },
      {
        id: 'aud-002-2',
        step: 'Pre-Auth Debit & Clearing Hold',
        timestamp: '2023-10-25T15:05:12.380Z',
        actor: 'Core Banking Engine',
        status: 'Completed',
        details: 'Debited customer CASA ₦450,011.56 pending switch response. Journal: JRNL-NOLT-904144.'
      },
      {
        id: 'aud-002-3',
        step: 'NIBSS Switch Gateway Transmission',
        timestamp: '2023-10-25T15:05:12.600Z',
        actor: 'NIP Gateway Outward Bridge',
        status: 'Completed',
        details: 'Forwarded XML payload to NIBSS. Session ID: 999001231025150512000000000043.'
      },
      {
        id: 'aud-002-4',
        step: 'Destination Bank Switch Response',
        timestamp: '2023-10-25T15:05:42.610Z',
        actor: 'Zenith Bank Switch',
        status: 'Failed',
        details: 'NIP Response Code 91: Beneficiary Bank Inoperative / Timeout. No ACK received within 30,000ms.'
      },
      {
        id: 'aud-002-5',
        step: 'Automated Auto-Reversal Engine',
        timestamp: '2023-10-25T15:05:42.890Z',
        actor: 'Auto-Reversal Watchdog',
        status: 'Completed',
        details: 'Triggered immediate full refund of ₦450,011.56 (Principal + Fees) back to CASA 1092837465. Journal: JRNL-REV-904144.'
      }
    ]
  },
  {
    id: 'trf-003',
    reference: 'NIP-20231025-9948203',
    sessionId: '999001231025161045000000000044',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'Google Pixel 7',
      os: 'Android',
      ipAddress: '105.112.98.204',
      location: 'Lekki Phase 1, Lagos, NG'
    },
    timestamp: '2023-10-25T16:10:45.000Z',
    amount: 75000,
    formattedAmount: '₦75,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 75011.56,
    status: 'Pending',
    narration: 'School Tuition Fee instalment - Grade 4',
    sourceAccount: {
      accountName: 'Chidi Okoro',
      accountNumber: '3029182736',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Current',
      bvn: '90812345671',
      customerId: 'CUST-NOLT-3091',
      balanceBefore: 310500.00,
      balanceAfter: 235488.44
    },
    destinationAccount: {
      beneficiaryName: 'CORONA SCHOOLS TRUST COUNCIL',
      accountNumber: '0029384712',
      bankName: 'Access Bank',
      bankCode: '000014',
      kycTier: 3
    },
    nipResponseCode: '09',
    nipResponseMessage: 'Request in Progress / In Doubt',
    reconciliationStatus: 'Unreconciled',
    dispatchedAt: '2023-10-25T16:10:45.320Z',
    canRetry: false,
    ledgerEntries: [
      {
        id: 'lg-003-1',
        entryType: 'DEBIT',
        accountType: 'Customer CASA',
        accountNumber: '3029182736',
        accountName: 'Chidi Okoro - Current',
        amount: 75011.56,
        formattedAmount: '₦75,011.56',
        narration: 'NIP Outward TRF to CORONA SCHOOLS (Access) - Ref: NIP-20231025-9948203',
        postingRef: 'JRNL-NOLT-904168',
        postingTimestamp: '2023-10-25T16:10:45.450Z',
        status: 'PENDING'
      },
      {
        id: 'lg-003-2',
        entryType: 'CREDIT',
        accountType: 'NIP Clearing GL',
        accountNumber: 'GL-200109-NIBSS',
        accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
        amount: 75000.00,
        formattedAmount: '₦75,000.00',
        narration: 'Pending In-Doubt NIP Clearing Ref: NIP-20231025-9948203',
        postingRef: 'JRNL-NOLT-904168',
        postingTimestamp: '2023-10-25T16:10:45.450Z',
        status: 'PENDING'
      }
    ],
    auditTrail: [
      {
        id: 'aud-003-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T16:10:45.100Z',
        actor: 'Chidi Okoro (App User)',
        status: 'Completed',
        details: 'Outward payment request submitted via Mobile App.'
      },
      {
        id: 'aud-003-2',
        step: 'CASA Debit Posting',
        timestamp: '2023-10-25T16:10:45.450Z',
        actor: 'Core Banking Engine',
        status: 'Completed',
        details: 'Debit posted to customer CASA. Ledger journal created in PENDING state.'
      },
      {
        id: 'aud-003-3',
        step: 'NIBSS Switch Gateway Transmission',
        timestamp: '2023-10-25T16:10:45.680Z',
        actor: 'NIP Switch Interface',
        status: 'In Progress',
        details: 'Transaction sent to NIBSS switch. Session ID: 999001231025161045000000000044. Awaiting final terminal status from Access Bank.'
      }
    ]
  },
  {
    id: 'trf-004',
    reference: 'NIP-20231025-9948204',
    sessionId: '999001231025172230000000000045',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.0 (Build 408)',
      deviceModel: 'iPhone 13',
      os: 'iOS',
      ipAddress: '102.89.22.44',
      location: 'Abuja, FCT, NG'
    },
    timestamp: '2023-10-25T17:22:30.000Z',
    amount: 1200000,
    formattedAmount: '₦1,200,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 1200011.56,
    status: 'Failed',
    narration: 'Land Purchase Commitment Deposit',
    failureReason: 'NIP Error 51: Insufficient Funds in Source CASA. Available balance ₦840,200.00 less than required ₦1,200,011.56.',
    sourceAccount: {
      accountName: 'Folake Adeleke',
      accountNumber: '4019283746',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Savings',
      bvn: '44455566677',
      customerId: 'CUST-NOLT-4012',
      balanceBefore: 840200.00,
      balanceAfter: 840200.00
    },
    destinationAccount: {
      beneficiaryName: 'PRIME PROPERTIES LTD',
      accountNumber: '1012938475',
      bankName: 'First Bank of Nigeria',
      bankCode: '000016',
      kycTier: 3
    },
    nipResponseCode: '51',
    nipResponseMessage: 'Insufficient Funds',
    reconciliationStatus: 'Matched',
    dispatchedAt: '2023-10-25T17:22:30.120Z',
    completedAt: '2023-10-25T17:22:30.340Z',
    ledgerEntries: [],
    auditTrail: [
      {
        id: 'aud-004-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T17:22:30.050Z',
        actor: 'Folake Adeleke (App User)',
        status: 'Completed',
        details: 'Attempted outward transfer of ₦1,200,000.00 to First Bank.'
      },
      {
        id: 'aud-004-2',
        step: 'Pre-Debit Balance Check',
        timestamp: '2023-10-25T17:22:30.220Z',
        actor: 'Core Banking Engine',
        status: 'Failed',
        details: 'Balance check failed. Account 4019283746 balance is ₦840,200.00. Shortfall: ₦359,811.56. Transaction rejected locally before switch dispatch.'
      }
    ]
  },
  {
    id: 'trf-005',
    reference: 'NIP-20231025-9948205',
    sessionId: '999001231025184510000000000046',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'Xiaomi Redmi Note 12',
      os: 'Android',
      ipAddress: '41.203.77.19',
      location: 'Port Harcourt, Rivers, NG'
    },
    timestamp: '2023-10-25T18:45:10.000Z',
    amount: 32000,
    formattedAmount: '₦32,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 32011.56,
    status: 'Successful',
    narration: 'Monthly Grocery & Provisions Shopping',
    sourceAccount: {
      accountName: 'Emeka Nwosu',
      accountNumber: '5019284756',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Savings',
      bvn: '22288899911',
      customerId: 'CUST-NOLT-5190',
      balanceBefore: 94200.00,
      balanceAfter: 62188.44
    },
    destinationAccount: {
      beneficiaryName: 'MARKET SQUARE SUPERMARKET',
      accountNumber: '2039485712',
      bankName: 'Kuda Microfinance Bank',
      bankCode: '090267',
      kycTier: 2
    },
    nipResponseCode: '00',
    nipResponseMessage: 'Approved or Completed Successfully',
    reconciliationStatus: 'Matched',
    dispatchedAt: '2023-10-25T18:45:10.200Z',
    completedAt: '2023-10-25T18:45:11.140Z',
    ledgerEntries: [
      {
        id: 'lg-005-1',
        entryType: 'DEBIT',
        accountType: 'Customer CASA',
        accountNumber: '5019284756',
        accountName: 'Emeka Nwosu - Savings',
        amount: 32011.56,
        formattedAmount: '₦32,011.56',
        narration: 'NIP Outward TRF to MARKET SQUARE (Kuda MFB) Ref: NIP-20231025-9948205',
        postingRef: 'JRNL-NOLT-904201',
        postingTimestamp: '2023-10-25T18:45:10.400Z',
        status: 'POSTED'
      },
      {
        id: 'lg-005-2',
        entryType: 'CREDIT',
        accountType: 'NIP Clearing GL',
        accountNumber: 'GL-200109-NIBSS',
        accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
        amount: 32000.00,
        formattedAmount: '₦32,000.00',
        narration: 'NIP Settlement for Kuda MFB Ref: NIP-20231025-9948205',
        postingRef: 'JRNL-NOLT-904201',
        postingTimestamp: '2023-10-25T18:45:10.400Z',
        status: 'POSTED'
      },
      {
        id: 'lg-005-3',
        entryType: 'CREDIT',
        accountType: 'Fee Income GL',
        accountNumber: 'GL-400102-FEE',
        accountName: 'Electronic Transfer Fee Income',
        amount: 10.75,
        formattedAmount: '₦10.75',
        narration: 'NIP Fee Ref: NIP-20231025-9948205',
        postingRef: 'JRNL-NOLT-904201',
        postingTimestamp: '2023-10-25T18:45:10.400Z',
        status: 'POSTED'
      },
      {
        id: 'lg-005-4',
        entryType: 'CREDIT',
        accountType: 'VAT Payable GL',
        accountNumber: 'GL-200115-VAT',
        accountName: 'VAT on Electronic Transfer Fees',
        amount: 0.81,
        formattedAmount: '₦0.81',
        narration: 'VAT 7.5% Ref: NIP-20231025-9948205',
        postingRef: 'JRNL-NOLT-904201',
        postingTimestamp: '2023-10-25T18:45:10.400Z',
        status: 'POSTED'
      }
    ],
    auditTrail: [
      {
        id: 'aud-005-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T18:45:10.050Z',
        actor: 'Emeka Nwosu (App User)',
        status: 'Completed',
        details: 'Mobile App outward transfer to Kuda Bank account 2039485712.'
      },
      {
        id: 'aud-005-2',
        step: 'Ledger Post & Dispatch',
        timestamp: '2023-10-25T18:45:10.400Z',
        actor: 'Core Banking Engine',
        status: 'Completed',
        details: 'Debit posted, dispatched to NIBSS switch.'
      },
      {
        id: 'aud-005-3',
        step: 'Kuda MFB Inward ACK',
        timestamp: '2023-10-25T18:45:11.140Z',
        actor: 'Kuda Bank Switch',
        status: 'Completed',
        details: 'Response Code 00: Approved. Beneficiary credited.'
      }
    ]
  },
  {
    id: 'trf-006',
    reference: 'NIP-20231025-9948206',
    sessionId: '999001231025191200000000000047',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'iPhone 12',
      os: 'iOS',
      ipAddress: '102.89.33.88',
      location: 'Yaba, Lagos, NG'
    },
    timestamp: '2023-10-25T19:12:00.000Z',
    amount: 15000,
    formattedAmount: '₦15,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 15011.56,
    status: 'Failed',
    narration: 'Quick family upkeep allowance',
    failureReason: 'NIP Error 07: Invalid Beneficiary Account Number. Destination account 0998877112 not found on OPay.',
    sourceAccount: {
      accountName: 'Zainab Danjuma',
      accountNumber: '6019283745',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Savings',
      bvn: '33344455566',
      customerId: 'CUST-NOLT-6021',
      balanceBefore: 120000.00,
      balanceAfter: 120000.00
    },
    destinationAccount: {
      beneficiaryName: 'UNKNOWN BENEFICIARY',
      accountNumber: '0998877112',
      bankName: 'OPay Digital Services',
      bankCode: '090328',
      kycTier: 1
    },
    nipResponseCode: '07',
    nipResponseMessage: 'Invalid Beneficiary Account Number',
    reconciliationStatus: 'Matched',
    dispatchedAt: '2023-10-25T19:12:00.220Z',
    completedAt: '2023-10-25T19:12:00.680Z',
    ledgerEntries: [],
    auditTrail: [
      {
        id: 'aud-006-1',
        step: 'Mobile App Name Enquiry / Transfer Request',
        timestamp: '2023-10-25T19:12:00.050Z',
        actor: 'Zainab Danjuma (App User)',
        status: 'Completed',
        details: 'Submitted outward transfer to OPay acct 0998877112.'
      },
      {
        id: 'aud-006-2',
        step: 'NIP Name Enquiry / Account Validation',
        timestamp: '2023-10-25T19:12:00.680Z',
        actor: 'OPay Host Switch via NIBSS',
        status: 'Failed',
        details: 'NIP Error 07: Invalid Account. The specified account number does not exist on the beneficiary institution.'
      }
    ]
  },
  {
    id: 'trf-007',
    reference: 'NIP-20231025-9948207',
    sessionId: '999001231025203015000000000048',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'Infinix Note 30',
      os: 'Android',
      ipAddress: '197.210.60.101',
      location: 'Enugu, Enugu, NG'
    },
    timestamp: '2023-10-25T20:30:15.000Z',
    amount: 500000,
    formattedAmount: '₦500,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 500011.56,
    status: 'Successful',
    narration: 'NOLT High-Yield Target Investment Liquidation to Commercial Bank',
    sourceAccount: {
      accountName: 'Oluwaseun Balogun',
      accountNumber: '7019283749',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Current',
      bvn: '77788899900',
      customerId: 'CUST-NOLT-7049',
      balanceBefore: 2150000.00,
      balanceAfter: 1649988.44
    },
    destinationAccount: {
      beneficiaryName: 'OLUWASEUN BALOGUN (PERSONAL)',
      accountNumber: '0039281745',
      bankName: 'United Bank for Africa (UBA)',
      bankCode: '000004',
      kycTier: 3
    },
    nipResponseCode: '00',
    nipResponseMessage: 'Approved or Completed Successfully',
    reconciliationStatus: 'Matched',
    dispatchedAt: '2023-10-25T20:30:15.190Z',
    completedAt: '2023-10-25T20:30:16.420Z',
    ledgerEntries: [
      {
        id: 'lg-007-1',
        entryType: 'DEBIT',
        accountType: 'Customer CASA',
        accountNumber: '7019283749',
        accountName: 'Oluwaseun Balogun - Current',
        amount: 500011.56,
        formattedAmount: '₦500,011.56',
        narration: 'NIP Outward TRF to OLUWASEUN BALOGUN (UBA) Ref: NIP-20231025-9948207',
        postingRef: 'JRNL-NOLT-904245',
        postingTimestamp: '2023-10-25T20:30:15.350Z',
        status: 'POSTED'
      },
      {
        id: 'lg-007-2',
        entryType: 'CREDIT',
        accountType: 'NIP Clearing GL',
        accountNumber: 'GL-200109-NIBSS',
        accountName: 'NIBSS NIP Interbank Settlement Clearing Account',
        amount: 500000.00,
        formattedAmount: '₦500,000.00',
        narration: 'NIP Settlement for UBA Ref: NIP-20231025-9948207',
        postingRef: 'JRNL-NOLT-904245',
        postingTimestamp: '2023-10-25T20:30:15.350Z',
        status: 'POSTED'
      },
      {
        id: 'lg-007-3',
        entryType: 'CREDIT',
        accountType: 'Fee Income GL',
        accountNumber: 'GL-400102-FEE',
        accountName: 'Electronic Transfer Fee Income',
        amount: 10.75,
        formattedAmount: '₦10.75',
        narration: 'Fee Ref: NIP-20231025-9948207',
        postingRef: 'JRNL-NOLT-904245',
        postingTimestamp: '2023-10-25T20:30:15.350Z',
        status: 'POSTED'
      },
      {
        id: 'lg-007-4',
        entryType: 'CREDIT',
        accountType: 'VAT Payable GL',
        accountNumber: 'GL-200115-VAT',
        accountName: 'VAT on Electronic Transfer Fees',
        amount: 0.81,
        formattedAmount: '₦0.81',
        narration: 'VAT Ref: NIP-20231025-9948207',
        postingRef: 'JRNL-NOLT-904245',
        postingTimestamp: '2023-10-25T20:30:15.350Z',
        status: 'POSTED'
      }
    ],
    auditTrail: [
      {
        id: 'aud-007-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T20:30:15.050Z',
        actor: 'Oluwaseun Balogun (App User)',
        status: 'Completed',
        details: 'Self-transfer payout request initiated via Mobile App.'
      },
      {
        id: 'aud-007-2',
        step: 'Ledger Post & Switch Dispatch',
        timestamp: '2023-10-25T20:30:15.350Z',
        actor: 'Core Banking Engine',
        status: 'Completed',
        details: 'Ledger debit posted, dispatched to NIBSS switch.'
      },
      {
        id: 'aud-007-3',
        step: 'UBA Inward Confirmation',
        timestamp: '2023-10-25T20:30:16.420Z',
        actor: 'UBA Host Switch',
        status: 'Completed',
        details: 'Response 00: Approved. Customer personal account credited.'
      }
    ]
  },
  {
    id: 'trf-008',
    reference: 'NIP-20231025-9948208',
    sessionId: '999001231025211540000000000049',
    channel: 'Mobile App',
    channelDetails: {
      appVersion: 'v2.4.1 (Build 412)',
      deviceModel: 'iPhone 15 Pro Max',
      os: 'iOS',
      ipAddress: '102.89.50.12',
      location: 'Ikoyi, Lagos, NG'
    },
    timestamp: '2023-10-25T21:15:40.000Z',
    amount: 250000,
    formattedAmount: '₦250,000.00',
    fee: 10.75,
    vat: 0.81,
    totalDebited: 250011.56,
    status: 'Reversed',
    narration: 'Urgent Supplier Settlement for Raw Materials',
    failureReason: 'NIP Error 96: Central Switch Socket Connection Reset. Transaction failed on bridge, auto-reversed.',
    sourceAccount: {
      accountName: 'Ibrahim Garba',
      accountNumber: '8019283741',
      bankName: 'NOLT Microfinance Bank (CASA)',
      accountType: 'Current',
      bvn: '66677788899',
      customerId: 'CUST-NOLT-8092',
      balanceBefore: 980000.00,
      balanceAfter: 980000.00
    },
    destinationAccount: {
      beneficiaryName: 'GARBA AGRO-ALLIED ENTERPRISES',
      accountNumber: '0239481726',
      bankName: 'Stanbic IBTC Bank',
      bankCode: '000012',
      kycTier: 3
    },
    nipResponseCode: '96',
    nipResponseMessage: 'System Malfunction',
    reconciliationStatus: 'Reversed',
    dispatchedAt: '2023-10-25T21:15:40.180Z',
    reversedAt: '2023-10-25T21:16:02.400Z',
    reversalReason: 'Automatic reversal processed following NIBSS system malfunction error 96.',
    canRetry: true,
    retryCount: 0,
    ledgerEntries: [
      {
        id: 'lg-008-1',
        entryType: 'DEBIT',
        accountType: 'Customer CASA',
        accountNumber: '8019283741',
        accountName: 'Ibrahim Garba - Current',
        amount: 250011.56,
        formattedAmount: '₦250,011.56',
        narration: 'NIP Outward TRF to GARBA AGRO (Stanbic) Ref: NIP-20231025-9948208',
        postingRef: 'JRNL-NOLT-904299',
        postingTimestamp: '2023-10-25T21:15:40.300Z',
        status: 'REVERSED'
      },
      {
        id: 'lg-008-2',
        entryType: 'CREDIT',
        accountType: 'Customer CASA',
        accountNumber: '8019283741',
        accountName: 'Ibrahim Garba - Current',
        amount: 250011.56,
        formattedAmount: '₦250,011.56',
        narration: 'AUTO-REVERSAL: System Error 96 Refund Ref: NIP-20231025-9948208',
        postingRef: 'JRNL-REV-904299',
        postingTimestamp: '2023-10-25T21:16:02.400Z',
        status: 'POSTED'
      }
    ],
    auditTrail: [
      {
        id: 'aud-008-1',
        step: 'Mobile App Initiation',
        timestamp: '2023-10-25T21:15:40.050Z',
        actor: 'Ibrahim Garba (App User)',
        status: 'Completed',
        details: 'Outward payment submitted on Mobile App.'
      },
      {
        id: 'aud-008-2',
        step: 'NIBSS Central Switch Gateway Error',
        timestamp: '2023-10-25T21:15:58.200Z',
        actor: 'NIBSS Outward Bridge',
        status: 'Failed',
        details: 'Error 96: System Malfunction / Socket Connection Reset.'
      },
      {
        id: 'aud-008-3',
        step: 'Automated Immediate Reversal',
        timestamp: '2023-10-25T21:16:02.400Z',
        actor: 'Auto-Reversal Watchdog',
        status: 'Completed',
        details: 'Refunded full amount ₦250,011.56 to customer CASA. Audit log written.'
      }
    ]
  }
];
