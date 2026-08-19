# NOLT Finance - Platform Architecture Description

This document outlines the technical architecture for the NOLT Finance LMS Admin Dashboard.

---

## 1. High-Level Architecture Layers

### A. Frontend Layer (The UI)
- **Technology Stack**: React, Tailwind CSS, Material Symbols.
- **Workflow Stepper**: A custom progress component that maps backend statuses to logical UI stages.
- **Form Designer**: A drag-and-drop/append interface for building dynamic JSON schemas for the applicant portal.
- **Intelligence**: Integrated with **Gemini 3 Flash** for executive queue summaries.

### B. API Gateway & Security
- **RBAC Engine**: Enforces role-based view masking.
- **MFA Gateway**: Microsoft Authenticator TOTP integration for admin access.
- **Public Portal Link**: Dedicated redirection on the auth screen for applicant access.

---

## 2. Core Backend Services

### 1. Application Engine (State Orchestrator)
- **State Machine**: Manages transitions between 8+ technical statuses (e.g., `Docs Verification` -> `Credit Review`).
- **Credit Tiering**: Facilitates internal handoffs between Credit Officers and Managers with eligible amount confirmation logic.
- **Audit Logger**: Captures a granular "Operation Log" for every significant action, including reassignment and audit passes.

### 2. Form Engine (Dynamic Schema)
- **Categorization Logic**: Handles dependent sub-categories (Loan -> Business/Niche/Employee, Investment -> Rise/Vault).
- **Rich Field Support**: Supports layout primitives (Dividers, Breakpoints) and interactive controls (Toggles, Radios).
- **Dynamic Field Mapping**: Presents contextual fields to reviewers based on the form schema used during intake.

---

## 3. External Integrations

### A. Identity & Credit
- **KYC**: SmileID / VerifyMe triggers at the `Customer Validation` node.
- **Bureau Pulls**: Automated CRC report generation during `Credit Checks`.

### B. Financial Execution
- **Payout Webhooks**: Automated triggers to banking systems upon `Finance` confirmation.
- **Notifications**: Transactional alerts via SendGrid.

---

## 4. Data Persistence Strategy

- **PostgreSQL**: Relational storage for users, roles, and operation logs.
- **S3 Storage**: Encrypted document vault for sensitive KYC uploads.
- **Audit Trail**: Verifiable trail of all PII access and data export events.