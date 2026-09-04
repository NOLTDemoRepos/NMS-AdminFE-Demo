import { AgentCommissionTier } from '../types';

export const DEFAULT_COMMISSION_TIERS: AgentCommissionTier[] = [
  {
    id: 'tier-1',
    name: 'Starter Tier 30-Day',
    minAmount: 100000,
    maxAmount: 1000000,
    isMaxInfinity: false,
    tenureDays: 30,
    tenureLabel: '30 Days (1 Month)',
    commissionPercent: 2.0,
    status: 'Active',
    description: '₦100k - ₦1M investment for 30 days attracts 2% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-2',
    name: 'Growth Tier 60-Day',
    minAmount: 100000,
    maxAmount: 1000000,
    isMaxInfinity: false,
    tenureDays: 60,
    tenureLabel: '60 Days (2 Months)',
    commissionPercent: 3.0,
    status: 'Active',
    description: '₦100k - ₦1M investment for 60 days attracts 3% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-3',
    name: 'Quarterly Placement 90-Day',
    minAmount: 100000,
    maxAmount: 1000000,
    isMaxInfinity: false,
    tenureDays: 90,
    tenureLabel: '90 Days (3 Months)',
    commissionPercent: 3.5,
    status: 'Active',
    description: '₦100k - ₦1M investment for 90 days attracts 3.5% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-4',
    name: 'Prime Capital 30-Day',
    minAmount: 1000001,
    maxAmount: 5000000,
    isMaxInfinity: false,
    tenureDays: 30,
    tenureLabel: '30 Days (1 Month)',
    commissionPercent: 2.5,
    status: 'Active',
    description: '₦1M - ₦5M investment for 30 days attracts 2.5% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-5',
    name: 'Prime Capital 60-Day',
    minAmount: 1000001,
    maxAmount: 5000000,
    isMaxInfinity: false,
    tenureDays: 60,
    tenureLabel: '60 Days (2 Months)',
    commissionPercent: 3.5,
    status: 'Active',
    description: '₦1M - ₦5M investment for 60 days attracts 3.5% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-6',
    name: 'Prime Capital 90-Day',
    minAmount: 1000001,
    maxAmount: 5000000,
    isMaxInfinity: false,
    tenureDays: 90,
    tenureLabel: '90 Days (3 Months)',
    commissionPercent: 4.0,
    status: 'Active',
    description: '₦1M - ₦5M investment for 90 days attracts 4.0% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-7',
    name: 'High Net Worth 180-Day',
    minAmount: 5000001,
    maxAmount: 20000000,
    isMaxInfinity: false,
    tenureDays: 180,
    tenureLabel: '180 Days (6 Months)',
    commissionPercent: 4.5,
    status: 'Active',
    description: '₦5M - ₦20M investment for 180 days attracts 4.5% commission.',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'tier-8',
    name: 'Institutional Vault 365-Day',
    minAmount: 20000001,
    maxAmount: 100000000,
    isMaxInfinity: true,
    tenureDays: 365,
    tenureLabel: '365 Days (12 Months)',
    commissionPercent: 5.0,
    status: 'Active',
    description: '₦20M+ investment for 12 months attracts 5.0% commission.',
    lastUpdated: '2026-09-01'
  }
];

const STORAGE_KEY = 'nolt_agent_commission_tiers_v1';

export function getStoredCommissionTiers(): AgentCommissionTier[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading commission tiers from storage', e);
  }
  return DEFAULT_COMMISSION_TIERS;
}

export function saveStoredCommissionTiers(tiers: AgentCommissionTier[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tiers));
    // Dispatch window event so components can sync reactively
    window.dispatchEvent(new CustomEvent('agent-commission-tiers-updated', { detail: tiers }));
  } catch (e) {
    console.error('Error saving commission tiers to storage', e);
  }
}

export function resetCommissionTiers(): AgentCommissionTier[] {
  saveStoredCommissionTiers(DEFAULT_COMMISSION_TIERS);
  return DEFAULT_COMMISSION_TIERS;
}

/**
 * Normalizes an amount string like "₦1,000,000.00" or number to numeric float
 */
export function parseAmount(amount: string | number | undefined): number {
  if (amount === undefined || amount === null) return 0;
  if (typeof amount === 'number') return isNaN(amount) ? 0 : amount;
  const cleaned = String(amount).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalizes tenure string like "30 Days", "60 days", "12 Months", "6 Months", "3 Months" into days
 */
export function parseTenureDays(tenure: string | number | undefined): number {
  if (tenure === undefined || tenure === null) return 30;
  if (typeof tenure === 'number') return tenure;
  
  const lower = String(tenure).toLowerCase().trim();
  
  // Exact day patterns: "30 days", "60 d", "90"
  const dayMatch = lower.match(/(\d+)\s*(day|days|d)?/);
  if (lower.includes('month') || lower.includes('mo')) {
    const monthMatch = lower.match(/(\d+)\s*(month|months|mo)/);
    if (monthMatch && monthMatch[1]) {
      const months = parseInt(monthMatch[1], 10);
      if (months === 1) return 30;
      if (months === 2) return 60;
      if (months === 3) return 90;
      if (months === 6) return 180;
      if (months === 12) return 365;
      if (months === 24) return 730;
      return months * 30;
    }
  }

  if (dayMatch && dayMatch[1]) {
    const num = parseInt(dayMatch[1], 10);
    // If user passed 1, 2, 3, 6, 12, 24 without label, check if it meant months or days
    if (num <= 24 && !lower.includes('day')) {
      return num * 30;
    }
    return num;
  }

  return 30;
}

export interface CommissionCalculationResult {
  matchedTier: AgentCommissionTier | null;
  commissionPercent: number;
  commissionAmount: number;
  isEligible: boolean;
  explanation: string;
  tenureDaysUsed: number;
  numericAmount: number;
}

/**
 * Core function mapping amount ranges and duration of investment to attract commission percentage.
 * Example:
 * 100k - 1M investment for 30 days => 2% commission
 * 100k - 1M investment for 60 days => 3% commission
 */
export function calculateAgentCommission(
  amountInput: number | string,
  tenureInput: number | string,
  tiers?: AgentCommissionTier[]
): CommissionCalculationResult {
  const activeTiers = (tiers || getStoredCommissionTiers()).filter(t => t.status === 'Active');
  const amount = parseAmount(amountInput);
  const tenureDays = parseTenureDays(tenureInput);

  if (amount <= 0) {
    return {
      matchedTier: null,
      commissionPercent: 0,
      commissionAmount: 0,
      isEligible: false,
      explanation: 'Investment amount must be greater than zero.',
      tenureDaysUsed: tenureDays,
      numericAmount: amount
    };
  }

  // 1. Look for exact match: amount in range AND tenureDays matching
  let matched = activeTiers.find(tier => {
    const isMinOk = amount >= tier.minAmount;
    const isMaxOk = tier.isMaxInfinity ? true : amount <= tier.maxAmount;
    const isTenureOk = tier.tenureDays === tenureDays;
    return isMinOk && isMaxOk && isTenureOk;
  });

  // 2. If no exact tenure match, look for the closest tenure in that amount range <= tenureDays
  if (!matched) {
    const matchingAmountTiers = activeTiers.filter(tier => {
      const isMinOk = amount >= tier.minAmount;
      const isMaxOk = tier.isMaxInfinity ? true : amount <= tier.maxAmount;
      return isMinOk && isMaxOk;
    });

    if (matchingAmountTiers.length > 0) {
      // Find tier with highest tenureDays <= tenureDays
      const eligibleTenures = matchingAmountTiers
        .filter(t => t.tenureDays <= tenureDays)
        .sort((a, b) => b.tenureDays - a.tenureDays);

      if (eligibleTenures.length > 0) {
        matched = eligibleTenures[0];
      } else {
        // Fallback to lowest tenure if user has shorter tenure
        matched = matchingAmountTiers.sort((a, b) => a.tenureDays - b.tenureDays)[0];
      }
    }
  }

  if (matched) {
    const commissionPercent = matched.commissionPercent;
    const commissionAmount = (amount * commissionPercent) / 100;
    return {
      matchedTier: matched,
      commissionPercent,
      commissionAmount,
      isEligible: true,
      explanation: `Mapped to "${matched.name}": ${commissionPercent}% of ₦${amount.toLocaleString()} for ${tenureDays} days tenor.`,
      tenureDaysUsed: tenureDays,
      numericAmount: amount
    };
  }

  return {
    matchedTier: null,
    commissionPercent: 0,
    commissionAmount: 0,
    isEligible: false,
    explanation: `No active commission tier covers ₦${amount.toLocaleString()} for ${tenureDays} days.`,
    tenureDaysUsed: tenureDays,
    numericAmount: amount
  };
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
}
