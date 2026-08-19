# Standalone Staff Loan System Specification & Implementation Guide

This document provides a comprehensive technical specification, architectural design, and implementation guide for building the **NOLT Staff Loan Management System** as a standalone service or micro-frontend microservice.

---

## 1. Executive Summary

The **NOLT Staff Loan System** is a specialized loan origination and approval management platform designed exclusively for confirmed employees of NOLT Finance. Key highlights include:

1. **HRIS Direct Integration**: Instant staff identification, service duration calculation, salary verification, and confirmation status check.
2. **Flexible CASA Account Management**: 
   - **Existing Account**: Direct linkage of an existing NOLT CASA account.
   - **New Account via BVN**: Real-time BVN lookup matching the staff's official name on HRIS, with **deferred automated CASA account creation** upon final application submission.
3. **Waived Documentation**: Zero requirement for utility bills, payslips, or third-party guarantors due to internal HRIS verification and automatic payroll deduction.
4. **8-Stage Maker-Checker Approval Workflow**:
   - **Stage 1**: Submission (HRIS & CASA/BVN verified)
   - **Stage 2**: HR Officer (Eligibility & Service Duration Check)
   - **Stage 3**: HR Manager (Validation)
   - **Stage 4**: Managing Director (MD Approval)
   - **Stage 5**: Credit Officer I (Risk Assessment I)
   - **Stage 6**: Credit Officer II (Risk Assessment II)
   - **Stage 7**: Internal Audit (Compliance & Audit Trail)
   - **Stage 8**: Finance (Bank GL Selection & GL Booking)
   - **Stage 9**: Disbursed (Active Servicing & Payroll Schedule)

---

## 2. Core Architecture & System Components

```
+-----------------------------------------------------------------------------------+
|                                 STAFF LOAN PORTAL                                 |
|                               (Frontend / React)                                  |
+-----------------------------------------------------------------------------------+
       |                                |                                   |
       v                                v                                   v
+------------------+         +--------------------+              +--------------------+
|   HRIS ENGINE    |         | CORE BANKING (CBS) |              | WORKFLOW ENGINE    |
| - Staff ID       |         | - CASA Verification|              | - 8-Stage Stepper  |
| - Net Salary     |         | - Auto CASA Creation|             | - Maker-Checker    |
| - Service Months |         | - Payroll GL       |              | - Audit Trail Logs |
+------------------+         +--------------------+              +--------------------+
```

### Component Breakdown:

1. **Staff Loan Hub Dashboard (Light Theme)**
   - **Empty State**: Displayed for new staff without active loans, highlighting staff loan perks (3.5% p.a. interest, no collateral, automated payroll deduction) and an instant CTA button to apply.
   - **Active State**: Displays outstanding balance, total borrowed, interest savings, current approval stage, and a 12-month payroll repayment schedule table.

2. **3-Step Application Modal**:
   - **Step 1: HRIS & Account Setup**:
     - Query HRIS with `Staff ID` (e.g. `NT-127`).
     - Choose CASA method: Provide 10-digit CASA OR verify 11-digit BVN.
     - Product locked to `STAFF LOAN (Code: 310)`.
   - **Step 2: Personal & Employment Details**:
     - Full Name, Email, Role, Department auto-populated from HRIS.
     - Employer pre-filled and locked to **NOLT Finance**.
     - Residential address pre-filled from HRIS profile.
   - **Step 3: Staff Loan Terms**:
     - Requested Amount & Tenure (3 to 24 months).
     - Automated calculation of monthly payroll deduction at 3.5% p.a.
     - Notice highlighting zero documentation requirement.

---

## 3. Application Workflow & Data Lifecycle

```
[Staff Enters Staff ID] ──> [Query HRIS API] ──> [Display Verified Staff Profile]
                                                             │
                                                             ▼
                                                [Choose Account Option]
                                               /                       \
                       [Existing CASA]                                     [BVN Account Opening]
                              │                                                      │
                       [Verify 10-Digit CASA]                             [Verify 11-Digit BVN]
                              │                                                      │
                              └──────────────────────┬───────────────────────────────┘
                                                     │
                                                     ▼
                                        [Step 2: Pre-filled Details]
                                                     │
                                                     ▼
                                        [Step 3: Loan Config & Submit]
                                                     │
                                                     ▼
                       ┌──────────────────────────────────────────────────────────┐
                       │ IF BVN Route Selected:                                   │
                       │ System auto-creates NOLT Savings CASA Account (019XXXXX) │
                       └──────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                                        [Enters Approval Workflow]
```

---

## 4. 8-Stage Maker-Checker Workflow Matrix

| Stage | Node Name | Responsible Role | Key Actions & Validations |
| :--- | :--- | :--- | :--- |
| **0** | **SUBMISSION** | Staff Member | Verified via HRIS & BVN/CASA. Deferred account creation executed if applicable. |
| **1** | **HR OFFICER** | HR Officer | Validates minimum service duration (6+ months) and confirmation status. |
| **2** | **HR MANAGER** | HR Manager | Validates payroll capacity and monthly net salary deduction limits (< 33.3% net). |
| **3** | **MD** | Managing Director | Executive approval stage for staff loans. |
| **4** | **CREDIT I** | Credit Risk Officer I | Risk assessment, debt-to-income ratio analysis, and credit score check. |
| **5** | **CREDIT II** | Credit Risk Manager II | Second-level credit risk review and loan exposure limit signoff. |
| **6** | **AUDIT** | Internal Control | Pre-disbursement audit, policy compliance verification, and documentation check. |
| **7** | **FINANCE** | Finance Officer | Selects disbursement Bank GL account and triggers booking. |
| **8** | **DISBURSED** | System / CBS | Loan marked active; monthly payroll deduction schedule generated. |

---

## 5. Data Models & Database Schemas

### 5.1 Staff Loan Application (`staff_loans`)

```typescript
interface StaffLoanApplication {
  id: string; // e.g., 'sl-102938'
  referenceId: string; // e.g., 'SL-482910'
  staffId: string; // e.g., 'NT-127'
  staffName: string;
  staffEmail: string;
  department: string;
  role: string;
  employerName: 'NOLT Finance'; // Locked
  
  // Account Information
  accountOption: 'casa' | 'bvn';
  casaAccountNo: string; // Auto-generated if accountOption === 'bvn'
  bvnNumber?: string;
  bvnVerified: boolean;

  // Loan Terms
  amount: number; // e.g., 1500000
  tenureMonths: number; // e.g., 12
  interestRateAnnual: number; // 0.035 (3.5%)
  monthlyDeduction: number;
  purpose: string;

  // Status & Stepper Tracking
  status: 'Pending Review' | 'Docs Verification' | 'Credit Review' | 'Internal Audit' | 'Pending Disbursement' | 'Approved' | 'Returned';
  currentNodeIndex: number; // 0 to 8
  
  // Auditing
  dateSubmitted: string;
  operationLogs: OperationLogEntry[];
}
```

### 5.2 Operation Log Schema (`operation_logs`)

```typescript
interface OperationLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  comment: string;
}
```

---

## 6. Recommended API Specifications

### 6.1 HRIS Staff Lookup
- **Endpoint**: `GET /api/v1/hris/staff/:staffId`
- **Response**:
```json
{
  "staffId": "NT-127",
  "name": "Alex Morgan",
  "email": "alex.m@nolt.finance",
  "department": "Information Technology",
  "role": "Senior Software Engineer",
  "monthlySalary": 480000,
  "isConfirmed": true,
  "monthsOfService": 27,
  "address": "14 Alexander Avenue, Ikoyi, Lagos State"
}
```

### 6.2 BVN Name Match Verification
- **Endpoint**: `POST /api/v1/verification/bvn`
- **Body**: `{ "bvn": "22233445566", "staffName": "Alex Morgan" }`
- **Response**:
```json
{
  "bvnVerified": true,
  "nameMatch": true,
  "registeredName": "Alex Morgan"
}
```

### 6.3 Submit Staff Loan Application
- **Endpoint**: `POST /api/v1/staff-loans/apply`
- **Behavior**:
  1. Validates HRIS staff status and salary limits.
  2. If `accountOption === 'bvn'`, triggers Core Banking System (CBS) to auto-open a NOLT Savings CASA account.
  3. Initializes application record with `currentNodeIndex = 1` (HR Officer queue).
- **Response**:
```json
{
  "success": true,
  "loanId": "sl-99201",
  "referenceId": "SL-918234",
  "assignedCASA": "0192900508",
  "status": "Pending Review",
  "currentNodeIndex": 1
}
```

### 6.4 Approval / Advance Node Endpoint
- **Endpoint**: `POST /api/v1/staff-loans/:id/advance`
- **Body**:
```json
{
  "currentNodeIndex": 7,
  "action": "APPROVE",
  "comment": "Bank GL selected and verified.",
  "selectedBankGL": "GL-10029 - First Bank Treasury"
}
```

---

## 7. Frontend Integration Checklist

- [x] Integrate HRIS query with auto-population of address, role, and salary.
- [x] Lock employer to `NOLT Finance` and product to `STAFF LOAN`.
- [x] Enable deferred CASA account generation post-submission when BVN option is selected.
- [x] Remove duplicate application CTA buttons on the dashboard.
- [x] Render light-themed empty and active states for staff dashboard view.
- [x] Align 8-stage approval stepper (`SUBMISSION` -> `HR OFFICER` -> `HR MANAGER` -> `MD` -> `CREDIT I` -> `CREDIT II` -> `AUDIT` -> `FINANCE` -> `DISBURSED`).
