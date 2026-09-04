
import React, { useState, useEffect } from 'react';
import { ReviewRequest, StatMetric, AppView, AppNotification, UserRole, User, RequestStatus } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import ReviewQueue from './components/ReviewQueue';
import QueueView from './components/QueueView';
import InvestmentView from './components/InvestmentView';
import LoanView from './components/LoanView';
import SettingsView from './components/SettingsView';
import UsersView from './components/UsersView';
import SecurityLogsView from './components/SecurityLogsView';
import FormBuilderView from './components/FormBuilderView';
import PromotionsView from './components/PromotionsView';
import ReportsView from './components/ReportsView';
import BIView from './components/BIView';
import CustomersView from './components/CustomersView';
import TransfersView from './components/TransfersView';
import PushNotificationsView from './components/PushNotificationsView';
import NotificationPanel from './components/NotificationPanel';
import LogoutModal from './components/LogoutModal';
import AuthView from './components/AuthView';
import PersonalDashboard from './components/PersonalDashboard';
import LoanCalculatorModal from './components/LoanCalculatorModal';
import SupportModal from './components/SupportModal';
import NewLoanModal from './components/NewLoanModal';
import NewStaffLoanModal from './components/NewStaffLoanModal';
import { getDashboardInsights } from './services/geminiService';
import { INITIAL_USERS } from './usersData';

const INITIAL_REQUESTS: ReviewRequest[] = [
  {
    id: 'sl-1',
    referenceId: 'SL-90210',
    type: 'Loan',
    isStaffLoan: true,
    loanCategory: 'Employees',
    loanProduct: 'Staff Loan',
    amount: '₦1,500,000',
    eligibleAmount: '₦1,500,000',
    dateSubmitted: '28 Jun 2025',
    status: 'Pending Review',
    currentNodeIndex: 1, // Stage 1: HR OFFICER
    repaymentPeriod: '12 Months',
    tenure: '12 months',
    monthlyIncome: '₦480,000',
    hrisStaffId: 'NT-127',
    hrisSalary: '₦480,000',
    hrisEmploymentDate: '2024-05-15',
    hrisIsConfirmed: true,
    ownerId: 'u1',
    ownerName: 'Alex Morgan',
    applicant: {
      title: 'Mr',
      name: 'Alex Morgan',
      email: 'alex.m@nolt.finance',
      avatar: 'https://picsum.photos/seed/admin/100/100',
      phone: '08031122334',
      address: 'NOLT HQ, Victoria Island, Lagos'
    },
    operationLogs: [
      {
        id: 'sllog-1',
        timestamp: '28 Jun 2025 09:30 AM',
        actor: 'Alex Morgan',
        action: 'SUBMITTED',
        comment: 'Staff loan application submitted via HRIS verification portal.'
      }
    ]
  },
  {
    id: 'sl-2',
    referenceId: 'SL-90211',
    type: 'Loan',
    isStaffLoan: true,
    initiatedByMD: true,
    loanCategory: 'Employees',
    loanProduct: 'Staff Loan',
    amount: '₦3,500,000',
    eligibleAmount: '₦3,500,000',
    dateSubmitted: '29 Jun 2025',
    status: 'Docs Verification',
    currentNodeIndex: 2, // Stage 2: HR MANAGER
    repaymentPeriod: '24 Months',
    tenure: '24 months',
    monthlyIncome: '₦1,200,000',
    hrisStaffId: 'NT-001',
    hrisSalary: '₦1,200,000',
    hrisEmploymentDate: '2022-01-10',
    hrisIsConfirmed: true,
    ownerId: 'u_md',
    ownerName: 'Dr. Segun Arinze',
    applicant: {
      title: 'Dr',
      name: 'Dr. Segun Arinze',
      email: 'segun.a@nolt.finance',
      avatar: 'https://picsum.photos/seed/md/100/100',
      phone: '08020000001',
      address: 'Ikoyi, Lagos'
    },
    operationLogs: [
      {
        id: 'sllog-2',
        timestamp: '29 Jun 2025 11:00 AM',
        actor: 'Dr. Segun Arinze',
        action: 'SUBMITTED BY MD',
        comment: 'Staff loan initiated by Managing Director. Eligible for automatic MD node approval upon HR Manager validation.'
      }
    ]
  },
  {
    id: '1',
    referenceId: '#INV-8821',
    type: 'Investment',
    amount: '₦2,500,000',
    targetAmount: '₦5,000,000',
    dateSubmitted: 'Oct 24, 2023',
    status: 'Pending Review',
    selectedPlan: 'NOLT Vault',
    tenure: '12 Months',
    rolloverOption: 'Principal & Interest',
    paymentStatus: 'PAID',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    promoCode: 'BOOST',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Transfer+Receipt',
    paymentSource: 'Bank Transfer - GTBank (****1234)',
    governmentIdUrl: 'https://placehold.co/600x400?text=Government+ID',
    proofOfAddressUrl: 'https://placehold.co/600x400?text=Utility+Bill',
    isIndemnitySigned: true,
    indemnityFormUrl: 'https://placehold.co/600x800?text=Signed+Indemnity+Form',
    applicant: {
      title: 'Mr',
      name: 'David Chen',
      email: 'david.c@example.com',
      avatar: 'https://picsum.photos/seed/david/100/100',
      isPep: true,
      gender: 'Male',
      dateOfBirth: '1985-03-15',
      mothersMaidenName: 'Rosemary',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '9012345678',
      bvn: '22233344455',
      nin: '11122233344',
      stateOfOrigin: 'Lagos',
      stateOfResidence: 'Lagos',
      address: 'No 42, Victoria Island, Lagos',
      occupation: 'Business Executive',
      nokName: 'Linda Chen',
      nokRelationship: 'Spouse',
      nokAddress: 'No 42, Victoria Island, Lagos'
    }
  },
  {
    id: 'inv-agt-1',
    referenceId: '#INV-9031',
    type: 'Investment',
    amount: '₦500,000',
    targetAmount: '₦500,000',
    dateSubmitted: 'Oct 26, 2023',
    status: 'Pending Review',
    selectedPlan: 'NOLT Rise',
    tenure: '30 Days',
    rolloverOption: 'Principal Only',
    paymentStatus: 'PAID',
    isAgentReferral: true,
    agentId: 'u_agt1',
    agentName: 'Tunde Davies',
    agentCode: 'AGT-702',
    referralCodeUsed: 'AGT-TUNDE',
    agentReferralUrl: 'https://nolt.finance/invest?ref=AGT-TUNDE',
    agentCommissionRate: 2.0,
    agentCommissionAmount: 10000,
    agentCommissionStatus: 'Pending',
    ownerId: 'u_agt1',
    ownerName: 'Tunde Davies',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Receipt-500k',
    paymentSource: 'Bank Transfer - Zenith Bank (****7721)',
    isIndemnitySigned: true,
    applicant: {
      title: 'Dr',
      name: 'Amina Bello',
      email: 'amina.bello@example.com',
      avatar: 'https://picsum.photos/seed/amina/100/100',
      isPep: false,
      gender: 'Female',
      dateOfBirth: '1988-11-14',
      mothersMaidenName: 'Fatima',
      religion: 'Islam',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8039988112',
      bvn: '22288899901',
      nin: '11188899902',
      stateOfOrigin: 'Kano',
      stateOfResidence: 'Abuja',
      address: 'Maitama District, Abuja',
      occupation: 'Senior Medical Officer',
      nokName: 'Ibrahim Bello',
      nokRelationship: 'Spouse',
      nokAddress: 'Maitama District, Abuja'
    },
    operationLogs: [
      {
        id: 'log-agt-1',
        timestamp: '26 Oct 2023 10:15 AM',
        actor: 'System',
        action: 'AGENT ATTRIBUTION',
        comment: 'Investment originated via Agent Referral link AGT-TUNDE (Tunde Davies · AGT-702). Mapped tier: 100k-1M for 30 Days attracts 2.0% commission (₦10,000.00).'
      }
    ]
  },
  {
    id: 'inv-agt-2',
    referenceId: '#INV-9032',
    type: 'Investment',
    amount: '₦850,000',
    targetAmount: '₦850,000',
    dateSubmitted: 'Oct 26, 2023',
    status: 'Pending Review',
    selectedPlan: 'NOLT Vault',
    tenure: '60 Days',
    rolloverOption: 'Principal & Interest',
    paymentStatus: 'PAID',
    isAgentReferral: true,
    agentId: 'u_agt1',
    agentName: 'Tunde Davies',
    agentCode: 'AGT-702',
    referralCodeUsed: 'AGT-TUNDE',
    agentReferralUrl: 'https://nolt.finance/invest?ref=AGT-TUNDE',
    agentCommissionRate: 3.0,
    agentCommissionAmount: 25500,
    agentCommissionStatus: 'Approved',
    ownerId: 'u_agt1',
    ownerName: 'Tunde Davies',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Receipt-850k',
    paymentSource: 'Bank Transfer - Access Bank (****4412)',
    isIndemnitySigned: true,
    applicant: {
      title: 'Engr',
      name: 'Chukwuma Eze',
      email: 'c.eze@example.com',
      avatar: 'https://picsum.photos/seed/eze/100/100',
      isPep: false,
      gender: 'Male',
      dateOfBirth: '1982-04-09',
      mothersMaidenName: 'Nkechi',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8023344556',
      bvn: '22277766655',
      nin: '11177766655',
      stateOfOrigin: 'Enugu',
      stateOfResidence: 'Lagos',
      address: 'Lekki Phase 1, Lagos',
      occupation: 'Civil Engineering Contractor',
      nokName: 'Grace Eze',
      nokRelationship: 'Spouse',
      nokAddress: 'Lekki Phase 1, Lagos'
    },
    operationLogs: [
      {
        id: 'log-agt-2',
        timestamp: '26 Oct 2023 11:40 AM',
        actor: 'System',
        action: 'AGENT ATTRIBUTION',
        comment: 'Investment originated via Agent Referral link AGT-TUNDE (Tunde Davies · AGT-702). Mapped tier: 100k-1M for 60 Days attracts 3.0% commission (₦25,500.00).'
      }
    ]
  },
  {
    id: 'inv-agt-3',
    referenceId: '#INV-9033',
    type: 'Investment',
    amount: '₦2,000,000',
    targetAmount: '₦2,000,000',
    dateSubmitted: 'Oct 25, 2023',
    status: 'Docs Verification',
    selectedPlan: 'NOLT Vault',
    tenure: '90 Days',
    rolloverOption: 'Principal & Interest',
    paymentStatus: 'PAID',
    isAgentReferral: true,
    agentId: 'u_agt2',
    agentName: 'Blessing Okon',
    agentCode: 'AGT-884',
    referralCodeUsed: 'AGT-BLESSING',
    agentReferralUrl: 'https://nolt.finance/invest?ref=AGT-BLESSING',
    agentCommissionRate: 3.5,
    agentCommissionAmount: 70000,
    agentCommissionStatus: 'Paid',
    ownerId: 'u_agt2',
    ownerName: 'Blessing Okon',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Receipt-2M',
    paymentSource: 'Bank Transfer - First Bank (****9012)',
    isIndemnitySigned: true,
    applicant: {
      title: 'Mrs',
      name: 'Folake Adeyemi',
      email: 'folake.adeyemi@example.com',
      avatar: 'https://picsum.photos/seed/folake/100/100',
      isPep: false,
      gender: 'Female',
      dateOfBirth: '1979-08-30',
      mothersMaidenName: 'Omotola',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8095566778',
      bvn: '22244433322',
      nin: '11144433322',
      stateOfOrigin: 'Oyo',
      stateOfResidence: 'Ibadan',
      address: 'Bodija Estate, Ibadan',
      occupation: 'Supply Chain Director',
      nokName: 'Babatunde Adeyemi',
      nokRelationship: 'Spouse',
      nokAddress: 'Bodija Estate, Ibadan'
    },
    operationLogs: [
      {
        id: 'log-agt-3',
        timestamp: '25 Oct 2023 03:20 PM',
        actor: 'Finance Lead',
        action: 'COMMISSION SETTLEMENT',
        comment: 'Commission of ₦70,000.00 (3.5%) paid to Agent Blessing Okon (AGT-884) via Providus Bank.'
      }
    ]
  },
  {
    id: 'bo-inv-1',
    referenceId: '#BO-INV-5001',
    type: 'Investment',
    amount: '₦25,000,000',
    targetAmount: '₦25,000,000',
    dateSubmitted: 'Oct 28, 2023',
    status: 'Approved',
    selectedPlan: 'NOLT Vault',
    tenure: '12 Months',
    rolloverOption: 'Principal & Interest',
    paymentStatus: 'PAID',
    isBackOfficeInvestment: true,
    bookingChannel: 'Back Office',
    branchOffice: 'Head Office (Victoria Island)',
    relationshipManager: 'Chioma Adebayo (RM-042)',
    mandateNumber: 'BO-MND-84910',
    ownerId: 'u1',
    ownerName: 'Alex Morgan',
    transferReceiptUrl: 'https://placehold.co/400x600?text=RTGS+Receipt-25M',
    paymentSource: 'Direct Wire / RTGS - Zenith Bank (****9102)',
    isIndemnitySigned: true,
    indemnityFormUrl: 'https://placehold.co/600x800?text=BackOffice+Indemnity+Form',
    applicant: {
      title: 'Alhaji',
      name: 'Alhaji Garba Shehu',
      email: 'garba.shehu@dangotedistrib.ng',
      avatar: 'https://picsum.photos/seed/garba/100/100',
      isPep: false,
      gender: 'Male',
      dateOfBirth: '1970-05-18',
      mothersMaidenName: 'Zainab',
      religion: 'Islam',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8033221199',
      bvn: '22114455667',
      nin: '11223344556',
      stateOfOrigin: 'Kano',
      stateOfResidence: 'Lagos',
      address: 'Plot 12, Commercial Road, Apapa, Lagos',
      occupation: 'Managing Director & Commodity Distributor',
      nokName: 'Fatima Garba',
      nokRelationship: 'Spouse',
      nokAddress: 'Victoria Island, Lagos'
    },
    operationLogs: [
      {
        id: 'bo-log-1',
        timestamp: '28 Oct 2023 09:30 AM',
        actor: 'Chioma Adebayo (RM-042)',
        action: 'BACK_OFFICE_BOOKING',
        comment: 'Term deposit booked via Head Office Private Banking Desk. Verified corporate RTGS wire of ₦25,000,000 to treasury collection account.'
      }
    ]
  },
  {
    id: 'bo-inv-2',
    referenceId: '#BO-INV-5002',
    type: 'Investment',
    amount: '₦40,000,000',
    targetAmount: '₦40,000,000',
    dateSubmitted: 'Oct 29, 2023',
    status: 'Pending Review',
    selectedPlan: 'NOLT Vault',
    tenure: '6 Months',
    rolloverOption: 'Principal Only',
    paymentStatus: 'PAID',
    isBackOfficeInvestment: true,
    bookingChannel: 'Back Office',
    branchOffice: 'Ikeja Commercial Branch',
    relationshipManager: 'Femi Otedola (RM-015)',
    mandateNumber: 'BO-MND-84911',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Interbank+Clearance-40M',
    paymentSource: 'Interbank Settlement - Access Bank (****1180)',
    isIndemnitySigned: true,
    applicant: {
      title: 'Chief',
      name: 'Apex Logistics & Haulage Ltd (Treasury Desk)',
      email: 'treasury@apexlogistics.ng',
      avatar: 'https://picsum.photos/seed/apex/100/100',
      isPep: false,
      gender: 'Male',
      dateOfBirth: '1976-10-12',
      mothersMaidenName: 'Victoria',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8022334411',
      bvn: '22998877665',
      nin: '11998877665',
      stateOfOrigin: 'Ogun',
      stateOfResidence: 'Lagos',
      address: '22, Mobolaji Bank Anthony Way, Ikeja',
      occupation: 'Corporate Logistics & Heavy Haulage Operator',
      nokName: 'Oluwaseun Balogun (CFO)',
      nokRelationship: 'Colleague',
      nokAddress: 'Ikeja GRA, Lagos'
    },
    operationLogs: [
      {
        id: 'bo-log-2',
        timestamp: '29 Oct 2023 11:15 AM',
        actor: 'Femi Otedola (RM-015)',
        action: 'BACK_OFFICE_BOOKING',
        comment: 'Corporate liquidity placement originating from Ikeja Commercial Branch. Institutional mandate form executed.'
      }
    ]
  },
  {
    id: 'bo-inv-3',
    referenceId: '#BO-INV-5003',
    type: 'Investment',
    amount: '₦15,000,000',
    targetAmount: '₦15,000,000',
    dateSubmitted: 'Oct 29, 2023',
    status: 'Docs Verification',
    selectedPlan: 'NOLT Rise',
    tenure: '24 Months',
    rolloverOption: 'Payout',
    paymentStatus: 'PAID',
    isBackOfficeInvestment: true,
    bookingChannel: 'Back Office',
    branchOffice: 'Abuja Central Branch',
    relationshipManager: 'Adewale Adeleke (RM-088)',
    mandateNumber: 'BO-MND-84912',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    transferReceiptUrl: 'https://placehold.co/400x600?text=CASA+Debit-15M',
    paymentSource: 'CASA Account Transfer (****8833)',
    isIndemnitySigned: true,
    applicant: {
      title: 'Chief',
      name: 'Chief Olumide Macaulay (Family Trust)',
      email: 'macaulay.trust@wealth.ng',
      avatar: 'https://picsum.photos/seed/macaulay/100/100',
      isPep: true,
      gender: 'Male',
      dateOfBirth: '1962-03-24',
      mothersMaidenName: 'Abiola',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8099887766',
      bvn: '22881122334',
      nin: '11881122334',
      stateOfOrigin: 'Lagos',
      stateOfResidence: 'Abuja',
      address: 'Plot 401, Diplomatic Zone, Maitama, Abuja',
      occupation: 'Chairman & Principal Trustee',
      nokName: 'Barrister Folashade Macaulay',
      nokRelationship: 'Child',
      nokAddress: 'Maitama, Abuja'
    },
    operationLogs: [
      {
        id: 'bo-log-3',
        timestamp: '29 Oct 2023 02:45 PM',
        actor: 'Adewale Adeleke (RM-088)',
        action: 'BACK_OFFICE_BOOKING',
        comment: 'High Net Worth Trust account placement. Indemnity and Trust deed documentation routed to Compliance.'
      }
    ]
  },
  {
    id: 'bo-inv-4',
    referenceId: '#BO-INV-5004',
    type: 'Investment',
    amount: '₦10,000,000',
    targetAmount: '₦10,000,000',
    dateSubmitted: 'Oct 30, 2023',
    status: 'Internal Audit',
    selectedPlan: 'NOLT Vault',
    tenure: '180 Days',
    rolloverOption: 'Principal & Interest',
    paymentStatus: 'PAID',
    isBackOfficeInvestment: true,
    bookingChannel: 'Back Office',
    branchOffice: 'Port Harcourt Regional Centre',
    relationshipManager: 'Blessing Udoh (RM-031)',
    mandateNumber: 'BO-MND-84913',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Wire-10M',
    paymentSource: 'Wire Transfer - Stanbic IBTC (****5541)',
    isIndemnitySigned: true,
    applicant: {
      title: 'Dr',
      name: 'Dr. Ngozi Okonjo-Briggs',
      email: 'ngozi.briggs@oilserv.com',
      avatar: 'https://picsum.photos/seed/ngozi/100/100',
      isPep: false,
      gender: 'Female',
      dateOfBirth: '1974-09-15',
      mothersMaidenName: 'Nkechi',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8033776655',
      bvn: '22334455667',
      nin: '11334455667',
      stateOfOrigin: 'Rivers',
      stateOfResidence: 'Port Harcourt',
      address: '14, Stadium Road, GRA Phase 2, Port Harcourt',
      occupation: 'Upstream Petroleum Geoscientist',
      nokName: 'Tamuno Briggs',
      nokRelationship: 'Spouse',
      nokAddress: 'GRA Phase 2, Port Harcourt'
    },
    operationLogs: [
      {
        id: 'bo-log-4',
        timestamp: '30 Oct 2023 10:10 AM',
        actor: 'Blessing Udoh (RM-031)',
        action: 'BACK_OFFICE_BOOKING',
        comment: 'Walk-in HNI term investment serviced at PH Regional Centre. Special yield concession submitted to Treasury.'
      }
    ]
  },
  {
    id: 'bo-inv-5',
    referenceId: '#BO-INV-5005',
    type: 'Investment',
    amount: '₦50,000,000',
    targetAmount: '₦50,000,000',
    dateSubmitted: 'Oct 30, 2023',
    status: 'Pending Disbursement',
    selectedPlan: 'NOLT Target',
    tenure: '12 Months',
    rolloverOption: 'Principal Only',
    paymentStatus: 'PAID',
    isBackOfficeInvestment: true,
    bookingChannel: 'Back Office',
    branchOffice: 'Head Office (Victoria Island)',
    relationshipManager: 'Chioma Adebayo (RM-042)',
    mandateNumber: 'BO-MND-84914',
    ownerId: 'u1',
    ownerName: 'Alex Morgan',
    transferReceiptUrl: 'https://placehold.co/400x600?text=Treasury+Deposit-50M',
    paymentSource: 'Central Bank / NIBSS Direct Credit',
    isIndemnitySigned: true,
    applicant: {
      title: 'Mr',
      name: 'Quantum Capital Asset Managers (Fixed Return Fund III)',
      email: 'investments@quantumcapital.ng',
      avatar: 'https://picsum.photos/seed/quantum/100/100',
      isPep: false,
      gender: 'Male',
      dateOfBirth: '1980-01-20',
      mothersMaidenName: 'Stella',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8088990011',
      bvn: '22776655443',
      nin: '11776655443',
      stateOfOrigin: 'Lagos',
      stateOfResidence: 'Lagos',
      address: 'Floor 7, Landmark Towers, Water Corporation Drive, Victoria Island',
      occupation: 'Institutional Portfolio & Treasury Fund Manager',
      nokName: 'Adekunle Phillips (Managing Partner)',
      nokRelationship: 'Colleague',
      nokAddress: 'Victoria Island, Lagos'
    },
    operationLogs: [
      {
        id: 'bo-log-5',
        timestamp: '30 Oct 2023 04:00 PM',
        actor: 'Alex Morgan',
        action: 'BACK_OFFICE_BOOKING',
        comment: 'Institutional placement of ₦50M booked via Head Office Institutional Desk. Passed Credit & Audit checks.'
      }
    ]
  },
  {
    id: '2',
    referenceId: '#LON-8822',
    type: 'Loan',
    amount: '₦450,000',
    dateSubmitted: 'Oct 24, 2023',
    status: 'Pending Review',
    loanCategory: 'Employees',
    loanProduct: 'Salary Advance',
    repaymentPeriod: '6 Months',
    hasActiveLoans: false,
    monthlyIncome: '₦280,000',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    promoCode: 'SAVE50',
    governmentIdUrl: 'https://placehold.co/600x400?text=Gov+ID',
    bankStatementUrl: 'https://placehold.co/600x400?text=Bank+Statement',
    proofOfAddressUrl: 'https://placehold.co/600x400?text=Utility+Bill',
    selfieUrl: 'https://placehold.co/400x400?text=Selfie',
    isIndemnitySigned: false,
    references: [
      { name: 'John Miller', phone: '08012345678', relationship: 'Family Member' },
      { name: 'Alice Smith', phone: '08123456789', relationship: 'Colleague' },
      { name: 'Peter Parker', phone: '09011223344', relationship: 'Friend' }
    ],
    applicant: {
      title: 'Mrs',
      name: 'Sarah Miller',
      email: 'sarah.m@example.com',
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      isPep: false,
      gender: 'Female',
      dateOfBirth: '1992-07-22',
      mothersMaidenName: 'Elizabeth',
      religion: 'Christianity',
      maritalStatus: 'Married',
      countryCode: '+234',
      phone: '8123456789',
      bvn: '55566677788',
      nin: '99988877766',
      stateOfOrigin: 'Ogun',
      stateOfResidence: 'Lagos',
      address: '7, Admiralty Way, Lekki',
      occupation: 'Nurse',
      residentialStatus: 'Rent',
      dependents: 2
    }
  },
  {
    id: '3',
    referenceId: '#LON-9904',
    type: 'Loan',
    amount: '₦2,500,000',
    dateSubmitted: 'Oct 25, 2023',
    status: 'Returned',
    loanCategory: 'Business',
    loanProduct: 'Working Capital',
    repaymentPeriod: '12 Months',
    hasActiveLoans: true,
    monthlyIncome: '₦850,000',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    promoCode: 'NOLT2024',
    applicant: {
      title: 'Mr',
      name: 'Boluwatife Adeyemi',
      email: 'bolu.ade@techhub.ng',
      avatar: 'https://picsum.photos/seed/bolu/100/100',
      isPep: false,
      gender: 'Male',
      dateOfBirth: '1988-11-05',
      phone: '7034455667',
      address: 'Surulere, Lagos',
      occupation: 'Software Engineer'
    }
  },
  {
    id: '4',
    referenceId: '#INV-1021',
    type: 'Investment',
    amount: '₦10,000,000',
    targetAmount: '₦10,000,000',
    dateSubmitted: 'Oct 22, 2023',
    status: 'Approved',
    selectedPlan: 'NOLT Rise',
    tenure: '24 Months',
    rolloverOption: 'Payout',
    paymentStatus: 'VERIFIED',
    ownerId: 'u1',
    ownerName: 'Alex Morgan',
    referralCodeUsed: 'ALEX-ADMIN',
    promoCode: 'BOOST',
    applicant: {
      title: 'Dr',
      name: 'Emily Nwosu',
      email: 'e.nwosu@med.com',
      avatar: 'https://picsum.photos/seed/emily/100/100',
      isPep: false,
      gender: 'Female',
      dateOfBirth: '1975-04-12',
      phone: '8023344556',
      address: 'Maitama, Abuja',
      occupation: 'Medical Consultant'
    }
  },
  {
    id: '5',
    referenceId: '#LON-1105',
    type: 'Loan',
    amount: '₦1,200,000',
    dateSubmitted: 'Oct 26, 2023',
    status: 'Internal Audit',
    loanCategory: 'Employees',
    loanProduct: 'IPPIS',
    repaymentPeriod: '18 Months',
    hasActiveLoans: false,
    monthlyIncome: '₦400,000',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    applicant: {
      title: 'Ms',
      name: 'Chioma Okeke',
      email: 'c.okeke@lifestyle.ng',
      avatar: 'https://picsum.photos/seed/chioma/100/100',
      isPep: false,
      gender: 'Female',
      dateOfBirth: '1995-09-30',
      phone: '9051122334',
      address: 'Enugu, Nigeria',
      occupation: 'Civil Servant',
      ippisNumber: 'IP-9901223',
      mda: 'Federal Ministry of Health'
    }
  },
  {
    id: '6',
    referenceId: '#LON-1201',
    type: 'Loan',
    amount: '₦1,500,000',
    eligibleAmount: '₦1,500,000',
    dateSubmitted: 'Oct 27, 2023',
    status: 'Pending Disbursement',
    loanCategory: 'Business',
    loanProduct: 'Working Capital',
    repaymentPeriod: '12 Months',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    applicant: {
      title: 'Mr',
      name: 'James Bond',
      email: '007@mi6.gov.uk',
      avatar: 'https://picsum.photos/seed/bond/100/100',
      phone: '0800070007',
      address: 'London, UK'
    }
  },
  {
    id: '7',
    referenceId: '#LON-1202',
    type: 'Loan',
    amount: '₦2,200,000',
    eligibleAmount: '₦2,200,000',
    dateSubmitted: 'Oct 27, 2023',
    status: 'Pending Disbursement',
    loanCategory: 'Niche',
    loanProduct: 'Direct Loan',
    repaymentPeriod: '24 Months',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    applicant: {
      title: 'Ms',
      name: 'Ada Lovelace',
      email: 'ada@computing.org',
      avatar: 'https://picsum.photos/seed/ada/100/100',
      phone: '0812233445',
      address: 'Enugu, Nigeria'
    }
  },
  {
    id: '8',
    referenceId: '#LON-1203',
    type: 'Loan',
    amount: '₦800,000',
    eligibleAmount: '₦750,000',
    dateSubmitted: 'Oct 28, 2023',
    status: 'Pending Disbursement',
    loanCategory: 'Employees',
    loanProduct: 'Salary Advance',
    repaymentPeriod: '6 Months',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    applicant: {
      title: 'Mrs',
      name: 'Funke Akindele',
      email: 'funke@jenifa.ng',
      avatar: 'https://picsum.photos/seed/funke/100/100',
      phone: '0901234432',
      address: 'Lekki, Lagos'
    }
  },
  {
    id: '9',
    referenceId: '#LIQ-2021',
    type: 'Liquidation',
    amount: '₦1,500,000',
    dateSubmitted: 'Oct 29, 2023',
    status: 'Pending Review',
    selectedPlan: 'NOLT Vault',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    applicant: {
      title: 'Mr',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://picsum.photos/seed/john/100/100',
      phone: '08011223344',
      address: 'Ikeja, Lagos'
    }
  },
  {
    id: '10',
    referenceId: '#LIQ-2022',
    type: 'Liquidation',
    amount: '₦500,000',
    dateSubmitted: 'Oct 29, 2023',
    status: 'Pending Review',
    selectedPlan: 'NOLT Rise',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    applicant: {
      title: 'Ms',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      avatar: 'https://picsum.photos/seed/jane/100/100',
      phone: '08022334455',
      address: 'Lekki, Lagos'
    }
  },
  {
    id: 'mob-1',
    referenceId: '#MOB-3011',
    type: 'Loan',
    isMobileLoan: true,
    loanCategory: 'Mobile App',
    loanProduct: 'Mobile App Loan',
    amount: '₦350,000',
    eligibleAmount: '₦350,000',
    dateSubmitted: 'Nov 02, 2023',
    status: 'Pending Review',
    repaymentPeriod: '3 Months',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    applicant: {
      title: 'Mr',
      name: 'Olamide Bakare',
      email: 'olamide.b@gmail.com',
      avatar: 'https://picsum.photos/seed/olamide/100/100',
      phone: '08139988776',
      address: 'Yaba, Lagos'
    }
  },
  {
    id: 'mob-2',
    referenceId: '#MOB-3012',
    type: 'Loan',
    isMobileLoan: true,
    loanCategory: 'Mobile App',
    loanProduct: 'Mobile App Loan',
    amount: '₦650,000',
    eligibleAmount: '₦650,000',
    dateSubmitted: 'Nov 03, 2023',
    status: 'Docs Verification',
    repaymentPeriod: '6 Months',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    applicant: {
      title: 'Mrs',
      name: 'Amina Bello',
      email: 'amina.bello@yahoo.com',
      avatar: 'https://picsum.photos/seed/amina/100/100',
      phone: '08055443322',
      address: 'Kano, Nigeria'
    }
  },
  {
    id: 'biz-1',
    referenceId: '#BIZ-5001',
    type: 'Loan',
    isBusinessLoan: true,
    loanCategory: 'Business',
    loanProduct: 'SME Working Capital',
    amount: '₦15,000,000',
    eligibleAmount: '₦15,000,000',
    dateSubmitted: 'Nov 01, 2023',
    status: 'Credit Review',
    repaymentPeriod: '12 Months',
    monthlyIncome: '₦4,500,000',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    governmentIdUrl: 'https://placehold.co/600x400?text=Director+Gov+ID',
    bankStatementUrl: 'https://placehold.co/600x400?text=Corporate+Bank+Statement',
    proofOfAddressUrl: 'https://placehold.co/600x400?text=Corporate+Utility+Bill',
    isIndemnitySigned: true,
    indemnityFormUrl: 'https://placehold.co/600x800?text=Corporate+Board+Resolution',
    applicant: {
      title: 'Chief',
      name: 'Alhaji Tunde Balogun',
      email: 'tunde.b@balogunlogistics.com',
      avatar: 'https://picsum.photos/seed/balogun/100/100',
      isPep: false,
      gender: 'Male',
      phone: '08033221100',
      bvn: '22334455667',
      nin: '11223344556',
      address: 'Plot 14, Commercial Avenue, Ikeja Industrial Estate, Lagos',
      occupation: 'Managing Director, Balogun Global Logistics Ltd',
      accountTier: 'Tier 3'
    }
  },
  {
    id: 'biz-2',
    referenceId: '#BIZ-5002',
    type: 'Loan',
    isBusinessLoan: true,
    loanCategory: 'Business',
    loanProduct: 'Invoice Discounting Facility',
    amount: '₦28,000,000',
    eligibleAmount: '₦25,000,000',
    dateSubmitted: 'Nov 04, 2023',
    status: 'Internal Audit',
    repaymentPeriod: '6 Months',
    monthlyIncome: '₦9,200,000',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    governmentIdUrl: 'https://placehold.co/600x400?text=CAC+Form+CAC1.1',
    bankStatementUrl: 'https://placehold.co/600x400?text=Audited+Financials',
    proofOfAddressUrl: 'https://placehold.co/600x400?text=Office+Tenancy+Agreement',
    isIndemnitySigned: true,
    indemnityFormUrl: 'https://placehold.co/600x800?text=Debenture+Agreement',
    applicant: {
      title: 'Dr',
      name: 'Mrs. Folashade Adeleke',
      email: 'folashade@novamedical.ng',
      avatar: 'https://picsum.photos/seed/folashade/100/100',
      isPep: false,
      gender: 'Female',
      phone: '08022446688',
      bvn: '55667788990',
      nin: '99887766554',
      address: '22 Admiralty Way, Lekki Phase 1, Lagos',
      occupation: 'CEO, Nova Medical Diagnostics & Equipment Ltd',
      accountTier: 'Tier 3'
    }
  },
  {
    id: 'biz-3',
    referenceId: '#BIZ-5003',
    type: 'Loan',
    isBusinessLoan: true,
    loanCategory: 'Business',
    loanProduct: 'Asset & Equipment Finance',
    amount: '₦8,500,000',
    eligibleAmount: '₦8,500,000',
    dateSubmitted: 'Nov 05, 2023',
    status: 'Pending Disbursement',
    repaymentPeriod: '24 Months',
    monthlyIncome: '₦2,800,000',
    ownerId: 'u5',
    ownerName: 'Chidi Okoro',
    referralCodeUsed: 'SO-CHIDI',
    governmentIdUrl: 'https://placehold.co/600x400?text=Proforma+Invoice',
    bankStatementUrl: 'https://placehold.co/600x400?text=6-Month+Statement',
    proofOfAddressUrl: 'https://placehold.co/600x400?text=Business+Premises+Permit',
    isIndemnitySigned: true,
    applicant: {
      title: 'Mr',
      name: 'Emeka Onyekwelu',
      email: 'emeka@apexagroallied.com',
      avatar: 'https://picsum.photos/seed/emeka/100/100',
      isPep: false,
      gender: 'Male',
      phone: '08177553311',
      bvn: '77889900112',
      nin: '33445566778',
      address: 'Km 12, Lagos-Ibadan Expressway, Ogun State',
      occupation: 'Founder, Apex Agro Processing Mills',
      accountTier: 'Tier 3'
    }
  }
];

const USERS: User[] = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex.m@nolt.finance', role: 'Super Admin', status: 'Active', lastActive: '2 mins ago', avatar: 'https://picsum.photos/seed/admin/100/100' },
  { id: 'u3', name: 'Michael Scott', role: 'Sales Team Lead', email: 'scott@nolt.finance', status: 'Active', lastActive: '1 hr ago', avatar: 'https://picsum.photos/seed/scott/100/100' },
  { id: 'u5', name: 'Chidi Okoro', role: 'Sales Officer', email: 'chidi@nolt.finance', status: 'Active', lastActive: '10 mins ago', avatar: 'https://picsum.photos/seed/chidi/100/100', teamLeadId: 'u3' },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'loan',
    title: 'New Loan Request',
    message: 'Sarah Miller submitted a Salary Advance application for ₦450,000.',
    timestamp: '2 mins ago',
    isRead: false,
    referenceId: '#LON-8822'
  },
  {
    id: 'n2',
    type: 'system',
    title: 'Indemnity Form Signed',
    message: 'David Chen has signed the indemnity form for #INV-8821.',
    timestamp: '5 mins ago',
    isRead: false,
    referenceId: '#INV-8821'
  }
];

const STATS: StatMetric[] = [
  { 
    label: 'Investment Applications', 
    value: '142 Applications', 
    subValue: '₦45,200,000.00',
    change: '+12.5%', 
    isPositive: true, 
    icon: 'trending_up', 
    color: 'bg-blue-500 text-blue-500' 
  },
  { 
    label: 'Loan Requests', 
    value: '1,204 Applications', 
    subValue: '₦12,840,000.00',
    change: '+5.0%', 
    isPositive: true, 
    icon: 'payments', 
    color: 'bg-indigo-500 text-indigo-500' 
  },
  { 
    label: 'Active Users', 
    value: '842 Users', 
    change: '+8.4%', 
    isPositive: true, 
    icon: 'group', 
    color: 'bg-purple-500 text-purple-500' 
  },
  { 
    label: 'Ongoing Applications', 
    value: '56 Pending', 
    badgeText: 'High Priority',
    icon: 'pending_actions', 
    color: 'bg-amber-500 text-amber-500' 
  },
];

const MARKETING_STATS: StatMetric[] = [
  { 
    label: 'Promo Redemptions', 
    value: '248 Uses', 
    change: '+18.2%', 
    isPositive: true, 
    icon: 'sell', 
    color: 'bg-primary text-primary' 
  },
  { 
    label: 'Active Campaigns', 
    value: '6 Live', 
    subValue: '4 Expiring Soon',
    icon: 'campaign', 
    color: 'bg-emerald-500 text-emerald-500' 
  },
  { 
    label: 'Total Acquisition', 
    value: '₦18.4M', 
    change: '+12.4%', 
    isPositive: true, 
    icon: 'trending_up', 
    color: 'bg-indigo-500 text-indigo-500' 
  },
  { 
    label: 'Referral Growth', 
    value: '14.2%', 
    badgeText: 'Goal Met',
    icon: 'rocket_launch', 
    color: 'bg-rose-500 text-rose-500' 
  },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuth') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<any>({
    id: 'u1',
    name: 'Alex Morgan',
    role: 'Super Admin' as UserRole,
    avatar: 'https://picsum.photos/seed/admin/100/100'
  });

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const [requests, setRequests] = useState<ReviewRequest[]>(INITIAL_REQUESTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedPromoForPush, setSelectedPromoForPush] = useState<string | undefined>(undefined);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoanCalculatorOpen, setIsLoanCalculatorOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAppNewLoanModalOpen, setIsAppNewLoanModalOpen] = useState(false);
  const [isStaffLoanModalOpen, setIsStaffLoanModalOpen] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuth');
    setIsLogoutModalOpen(false);
    setCurrentView('dashboard');
    setSelectedRequestId(null);
  };

  const handleCopyReferral = () => {
    const referralLink = `https://nolt.finance/join?ref=${currentUser.id.toUpperCase()}-${currentUser.name.split(' ')[0].toUpperCase()}`;
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpdateIndemnity = (requestId: string, url: string) => {
    setRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, isIndemnitySigned: true, indemnityFormUrl: url } : r
    ));
    
    const req = requests.find(r => r.id === requestId);
    if (req) {
      const newNotif = {
        id: Math.random().toString(36).substring(7),
        title: 'Indemnity Uploaded',
        message: `Indemnity form uploaded for ${req.referenceId}`,
        time: 'Just now',
        isRead: false,
        type: 'success' as const
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleBulkStatusUpdate = (ids: string[], nextStatus: RequestStatus, logMessage: string, extraFields?: Partial<ReviewRequest>) => {
    setRequests(prev => prev.map(req => {
      if (ids.includes(req.id)) {
        const log = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleString(),
          actor: currentUser.name,
          action: 'BULK STATUS UPDATE',
          comment: logMessage
        };
        return {
          ...req,
          status: nextStatus,
          ...extraFields,
          operationLogs: [log, ...(req.operationLogs || [])]
        };
      }
      return req;
    }));
  };

  const handleUpdateRequest = (updated: ReviewRequest) => {
    setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
    const newNotif = {
      id: Math.random().toString(36).substring(7),
      title: 'Application Progressed',
      message: `${updated.referenceId} has been updated to ${updated.status}`,
      time: 'Just now',
      isRead: false,
      type: 'info' as const
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleAddRequest = (newReq: ReviewRequest) => {
    setRequests(prev => [newReq, ...prev]);
    const newNotif = {
      id: Math.random().toString(36).substring(7),
      title: 'New Application Submitted',
      message: `${newReq.referenceId} has been filed under review.`,
      time: 'Just now',
      isRead: false,
      type: 'info' as const
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleGenerateInsights = async () => {
    setIsAnalyzing(true);
    const result = await getDashboardInsights(getVisibleQueue());
    setInsights(result);
    setIsAnalyzing(false);
  };

  const handleSelectRequest = (req: ReviewRequest) => {
    setSelectedRequestId(req.id);
    if (req.type === 'Investment') {
      setCurrentView('investments');
    } else {
      setCurrentView('loans');
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNavigate = (view: AppView) => {
    const isCoreSystemView = ['settings', 'users', 'security', 'form-builder'].includes(view);
    if (isCoreSystemView && currentUser.role !== 'Super Admin') return;
    
    const canAccessPromotions = currentUser.role === 'Super Admin' || currentUser.role === 'Marketing' || currentUser.role === 'Sales Manager';
    if (view === 'promotions' && !canAccessPromotions) return;
    
    if ((currentUser.role === 'Credit Manager' || currentUser.role === 'Credit Officer') && view === 'investments') return;

    // Restriction for Customers Module
    if (view === 'customers' && currentUser.role !== 'Customer Experience' && currentUser.role !== 'Super Admin') return;

    setCurrentView(view);
    setSelectedRequestId(null); 
  };

  const handleRoleChange = (role: UserRole) => {
    const roleProfiles: Record<UserRole, any> = {
      'Super Admin': { id: 'u1', name: 'Alex Morgan', role: 'Super Admin', avatar: 'https://picsum.photos/seed/admin/100/100' },
      'Marketing': { id: 'u_mark', name: 'Julian Draper', role: 'Marketing', avatar: 'https://picsum.photos/seed/julian/100/100' },
      'Sales Manager': { id: 'u_sm', name: 'Sarah Jenkins', role: 'Sales Manager', avatar: 'https://picsum.photos/seed/sarahj/100/100' },
      'Sales Team Lead': { id: 'u3', name: 'Michael Scott', role: 'Sales Team Lead', avatar: 'https://picsum.photos/seed/scott/100/100' },
      'Sales Officer': { id: 'u5', name: 'Chidi Okoro', role: 'Sales Officer', avatar: 'https://picsum.photos/seed/chidi/100/100' },
      'Customer Experience': { id: 'u_cx', name: 'Jessica Wu', role: 'Customer Experience', avatar: 'https://picsum.photos/seed/jess/100/100' },
      'Credit Manager': { id: 'u_cm', name: 'Tunde Bakare', role: 'Credit Manager', avatar: 'https://picsum.photos/seed/tunde/100/100' },
      'Credit Officer': { id: 'u_co', name: 'Bisi Adekunle', role: 'Credit Officer', avatar: 'https://picsum.photos/seed/bisi/100/100' },
      'Internal Control': { id: 'u_ic', name: 'Femi Adekunle', role: 'Internal Control', avatar: 'https://picsum.photos/seed/femi/100/100' },
      'Finance': { id: 'u_fin', name: 'Hassan Bello', role: 'Finance', avatar: 'https://picsum.photos/seed/hassan/100/100' },
      'MD': { id: 'u_md', name: 'Dr. Segun Arinze', role: 'MD', avatar: 'https://picsum.photos/seed/md/100/100' },
      'ED': { id: 'u_ed', name: 'Mrs. Funke Akindele', role: 'ED', avatar: 'https://picsum.photos/seed/ed/100/100' },
      'HR Officer': { id: 'u_hro', name: 'Kemi Balogun', role: 'HR Officer', avatar: 'https://picsum.photos/seed/kemi/100/100' },
      'HR Manager': { id: 'u_hrm', name: 'Victor Eze', role: 'HR Manager', avatar: 'https://picsum.photos/seed/victor/100/100' },
      'Agent': { id: 'u_agt1', name: 'Tunde Davies', role: 'Agent', avatar: 'https://picsum.photos/seed/tunded/100/100' },
    };
    const profile = roleProfiles[role];
    setCurrentUser(profile);
    setInsights(null); 
    
    const isCoreSystemView = ['settings', 'users', 'security', 'form-builder'].includes(currentView);
    if (isCoreSystemView && role !== 'Super Admin') {
      setCurrentView('dashboard');
    }
    if ((role === 'Credit Manager' || role === 'Credit Officer') && currentView === 'investments') {
      setCurrentView('dashboard');
    }
    const canAccessPromotions = role === 'Super Admin' || role === 'Marketing' || role === 'Sales Manager';
    if (currentView === 'promotions' && !canAccessPromotions) {
      setCurrentView('dashboard');
    }

    if (currentView === 'customers' && role !== 'Customer Experience' && role !== 'Super Admin') {
      setCurrentView('dashboard');
    }
  };

  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const getVisibleQueue = () => {
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Sales Manager' || currentUser.role === 'Internal Control' || currentUser.role === 'Customer Experience' || currentUser.role === 'MD') {
      return requests;
    }
    if (currentUser.role === 'Marketing') {
      return requests.filter(r => !!r.promoCode);
    }
    if (currentUser.role === 'Finance') {
      return requests.filter(r => r.status === 'Pending Disbursement' || r.status === 'Approved');
    }
    if (currentUser.role === 'Credit Manager' || currentUser.role === 'Credit Officer') {
      return requests.filter(r => r.type === 'Loan' && (
        r.status === 'Docs Verification' || 
        r.status === 'Credit Review' ||
        r.status === 'Pending Review' || 
        r.status === 'Returned' || 
        r.status === 'Internal Audit'
      ));
    }
    if (currentUser.role === 'Sales Team Lead') {
      const subordinateIds = USERS.filter(u => u.teamLeadId === currentUser.id).map(u => u.id);
      return requests.filter(r => r.ownerId && subordinateIds.includes(r.ownerId));
    }
    if (currentUser.role === 'Sales Officer') {
      return requests.filter(r => r.ownerId === currentUser.id);
    }
    return [];
  };

  const renderDashboard = () => {
    const isMarketing = currentUser.role === 'Marketing';
    const activeStats = isMarketing ? MARKETING_STATS : STATS;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome back, {currentUser.name}
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              {isMarketing 
                ? "Campaign performance and referral acquisition summary." 
                : "Overview of financial metrics and system logs for today."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <span className="text-sm font-black text-primary uppercase tracking-wider">{currentUser.role} View</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl transition-all shadow-lg border border-slate-700">
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span className="text-xs font-black uppercase tracking-[0.1em]">Export Report</span>
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent border border-primary/20 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 w-16 h-16 rounded-[20px] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40">
              <span className="material-symbols-outlined text-3xl animate-pulse">auto_awesome</span>
            </div>
            <div className="flex-1">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">AI Assistant Intelligence</h4>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-base font-black">
                {isAnalyzing ? "Generating smart insights from current queue..." : (insights || `Analyzing ${isMarketing ? 'campaign-attributed' : 'pending'} records for high-level summaries.`)}
              </p>
            </div>
            <button 
              onClick={handleGenerateInsights}
              disabled={isAnalyzing}
              className="px-8 py-3 bg-primary hover:bg-blue-600 text-white text-xs font-black rounded-2xl transition-all disabled:opacity-50 uppercase tracking-[0.15em] shadow-xl shadow-primary/20"
            >
              {isAnalyzing ? "Thinking..." : (insights ? "Refresh Analysis" : "Generate Analysis")}
            </button>
          </div>
        </div>

        {/* Referral CTA Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900 dark:bg-slate-800 p-8 shadow-2xl border border-slate-800 dark:border-slate-700 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-primary/20 duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24 transition-all group-hover:bg-blue-500/20 duration-700"></div>
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/20 transform group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl">share_reviews</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">SHARE YOUR REFERRAL LINK</h3>
                <p className="text-slate-400 text-sm font-medium">Share your unique referral link for easy performance tracking and rewards</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:w-64 px-4 py-3 bg-slate-800 dark:bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
                <span className="text-slate-300 text-xs font-mono truncate">nolt.finance/join?ref={currentUser.id.toUpperCase()}-{currentUser.name.split(' ')[0].toUpperCase()}</span>
                <span className="material-symbols-outlined text-slate-500 text-sm">link</span>
              </div>
              <button 
                onClick={handleCopyReferral}
                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all duration-300 min-w-[160px] ${
                  isCopied 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isCopied ? 'check_circle' : 'content_copy'}
                </span>
                {isCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeStats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </div>

        <ReviewQueue 
          requests={getVisibleQueue()} 
          onViewAll={() => setCurrentView('queue')} 
          onSelectRequest={handleSelectRequest} 
        />
      </div>
    );
  };

  const AccessRestrictedView = ({ title, message }: { title: string, message: string }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-[28px] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20">
            <span className="material-symbols-outlined text-4xl font-black">lock_person</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mt-2">
            {message}
        </p>
        <button onClick={() => setCurrentView('dashboard')} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">Back to Dashboard</button>
    </div>
  );

  const renderContent = () => {
    const isCoreSystemView = ['settings', 'users', 'security', 'form-builder'].includes(currentView);
    if (isCoreSystemView && currentUser.role !== 'Super Admin') {
      return <AccessRestrictedView title="Admin Access Restricted" message="Access to the Core System area is limited to Super Administrators only. Please contact your system lead for permissions." />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <PersonalDashboard 
            currentUser={currentUser}
            requests={getVisibleQueue()}
            onNavigate={handleNavigate}
            onSelectRequest={handleSelectRequest}
            onOpenNewLoanModal={() => setIsStaffLoanModalOpen(true)}
            onOpenLoanCalculator={() => setIsLoanCalculatorOpen(true)}
            onOpenSupportModal={() => setIsSupportModalOpen(true)}
            insights={insights}
            isAnalyzing={isAnalyzing}
            onGenerateInsights={handleGenerateInsights}
            isCopied={isCopied}
            onCopyReferral={handleCopyReferral}
          />
        );
      case 'queue':
        return <QueueView requests={getVisibleQueue()} onBack={() => setCurrentView('dashboard')} onSelectRequest={handleSelectRequest} />;
      case 'investments':
      case 'investments-dashboard':
      case 'investments-mobile':
      case 'investments-backoffice':
        if (currentUser.role === 'Credit Manager' || currentUser.role === 'Credit Officer') {
            return <AccessRestrictedView title="Access Restricted" message="The Credit team scope is limited to Loan Records only. You do not have permissions to view Investment data." />;
        }
        return (
          <InvestmentView 
            subView={
              currentView === 'investments-dashboard' 
                ? 'dashboard' 
                : currentView === 'investments-mobile' 
                ? 'mobile' 
                : currentView === 'investments-backoffice' 
                ? 'backoffice' 
                : undefined
            }
            requests={getVisibleQueue()} 
            onBack={() => setCurrentView('dashboard')} 
            selectedId={selectedRequestId} 
            onClearSelection={() => setSelectedRequestId(null)} 
            currentUser={currentUser}
            onUpdateIndemnity={handleUpdateIndemnity}
            onUpdateRequest={handleUpdateRequest}
            onAddRequest={handleAddRequest}
          />
        );
      case 'loans':
      case 'loans-staff':
      case 'loans-dashboard':
      case 'loans-business':
      case 'loans-mobile':
        return (
          <LoanView 
            subView={currentView === 'loans-dashboard' ? 'dashboard' : currentView === 'loans-business' ? 'business' : currentView === 'loans-mobile' ? 'mobile' : currentView === 'loans-staff' ? 'staff' : undefined}
            requests={getVisibleQueue()} 
            onBack={() => setCurrentView('dashboard')} 
            selectedId={selectedRequestId} 
            onClearSelection={() => setSelectedRequestId(null)} 
            currentUser={currentUser}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onUpdateIndemnity={handleUpdateIndemnity}
            onUpdateRequest={handleUpdateRequest}
            onAddRequest={handleAddRequest}
            users={users}
            onUpdateUsers={setUsers}
          />
        );
      case 'transfers':
        return (
          <TransfersView 
            currentUser={currentUser} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'customers':
        if (currentUser.role !== 'Customer Experience' && currentUser.role !== 'Super Admin') {
          return <AccessRestrictedView title="Access Restricted" message="The Customers module is reserved for Customer Experience teams. Please contact your administrator for access." />;
        }
        return <CustomersView requests={requests} onUpdateRequest={handleUpdateRequest} currentUser={currentUser} />;
      case 'reports':
        return <ReportsView requests={requests} currentUser={currentUser} />;
      case 'promotions':
        return (
          <PromotionsView 
            currentUser={currentUser} 
            onNavigate={(view, promoCode) => {
              if (promoCode) setSelectedPromoForPush(promoCode);
              setCurrentView(view as AppView);
            }}
          />
        );
      case 'push-notifications':
        return (
          <PushNotificationsView 
            currentUser={currentUser}
            onBack={() => setCurrentView('dashboard')}
            onNavigate={(view) => setCurrentView(view as AppView)}
            initialSelectedPromoCode={selectedPromoForPush}
          />
        );
      case 'bi':
        return <BIView />;
      case 'settings':
        return <SettingsView currentUser={currentUser} />;
      case 'users':
        return <UsersView currentUser={currentUser} users={users} onUpdateUsers={setUsers} />;
      case 'security':
        return <SecurityLogsView />;
      case 'form-builder':
        return <FormBuilderView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <h3 className="text-xl font-black uppercase">Screen Under Construction</h3>
            <p className="font-bold">We're working on the {currentView} module.</p>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-black uppercase text-xs tracking-widest"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar 
          currentView={currentView}
          onNavigate={handleNavigate}
          onClose={() => setIsSidebarOpen(false)} 
          onLogoutClick={() => setIsLogoutModalOpen(true)}
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
        />
      </div>

      <main className="flex-1 h-full overflow-y-auto bg-[#f8fafc] dark:bg-surface-darker relative flex flex-col transition-colors duration-300">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onNotificationClick={() => setIsNotifPanelOpen(true)}
          unreadCount={unreadCount}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex-1">
          {renderContent()}
        </div>
      </main>

      <NotificationPanel 
        isOpen={isNotifPanelOpen}
        onClose={() => setIsNotifPanelOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllAsRead}
        onClearAll={clearNotifications}
      />

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />

      <LoanCalculatorModal 
        isOpen={isLoanCalculatorOpen}
        onClose={() => setIsLoanCalculatorOpen(false)}
        onApplyForLoan={() => {
          setIsLoanCalculatorOpen(false);
          setIsAppNewLoanModalOpen(true);
        }}
      />

      <SupportModal 
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      <NewLoanModal 
        isOpen={isAppNewLoanModalOpen}
        onClose={() => setIsAppNewLoanModalOpen(false)}
        requests={requests}
        onAddRequest={handleAddRequest}
      />

      <NewStaffLoanModal
        isOpen={isStaffLoanModalOpen}
        onClose={() => setIsStaffLoanModalOpen(false)}
        currentUser={currentUser}
        onSuccessSubmit={handleAddRequest}
      />
    </div>
  );
};

export default App;
