# NOLT Finance - Application Process & Approval Workflow

This document outlines the operational lifecycle of applications within the NOLT system, detailing specific roles, administrative onboarding, and the sequential stages of the approval pipeline.

---

## 1. Role Matrix & Access Control

The system implements a strict Role-Based Access Control (RBAC) model to ensure data privacy and operational integrity.

| Role | Visibility Scope | Functional Approval Action |
| :--- | :--- | :--- |
| **Super Admin** | Global (All Modules) | Full system configuration, user provisioning, **Form Design**, and overriding any gate. |
| **Sales Manager** | Global (All Modules) | **Approval Gate 1**: Review initial entries, **Re-assign** owners, and **Decline** applications. |
| **Sales Staff / Officer** | Ownership-based | **Entry Node**: Gather requirements; rectify **Returned** applications at the **Submission** node. |
| **Customer Experience** | Global (All Modules) | **Approval Gate 2**: Minimum entry point for review. Document vetting and customer validation. |
| **Credit Officer** | Loan Records (Post-CX) | **Tier 1 Credit Check**: Performs risk assessment and sets **Initial Eligible Amount**. |
| **Credit Manager**| Loan Records (Post-Officer) | **Tier 2 Credit Check**: Confirms final assessment. Must confirm **Final Eligible Amount**. |
| **Internal Control** | Global (All Modules) | **Approval Gate 3 (Audit)**: Final compliance audit on logs and assessment logic. |
| **Finance Team** | Global (Audit Passed) | **Execution Gate**: Confirmation of fund movement (Payouts or Receipt receipt). |

---

## 2. Dynamic Form Configuration (Form Designer)

The Form Designer allows Super Admins to build contextual intake forms tailored to specific product lines.

### A. Contextual Categorization
Forms are categorized based on the application type:
*   **Loan Types**: Forms can be assigned to **Business**, **Niche**, or **Employee** categories.
*   **Investment Types**: Forms can be assigned to **Rise** or **Vault** categories.
*   *Logic*: The category selection is dependent on the primary form type.

### B. Advanced Input Registry
The system supports complex layout and interactive elements:
*   **Structural**: `Section Divider` (visual grouping) and `Section Breakpoint` (multi-step separation).
*   **Interactive**: `Toggle Switch` (boolean states) and `Radio Groups` (exclusive choice with custom options).
*   **Standard**: Text, Date, Numeric (NGN focused), Paragraph, and Document Upload.

---

## 3. Minimum Entry Point Rule

To optimize administrative efficiency:
*   **Default Entry**: All successfully submitted applications land directly at the **Customer Validation** node.
*   **Submission Node Restriction**: The **Submission** node (Stage 0) is hidden from standard review queues. It only becomes active if an application is **Returned** or **Rejected** for corrections. Once edited, these are "re-submitted" to the validation node.

---

## 4. Sequential Approval Workflows

### A. Loan Application Flow (5 UI Stages)
1.  **Submission**: Active only for re-work on returned/rejected records.
2.  **Customer Validation**: Minimum entry point. CX verifies ID and core documents.
3.  **Credit Checks**: A unified phase encompassing Tier 1 (Officer) and Tier 2 (Manager) reviews.
4.  **Request For Payment**: Internal Control audits the application, then Finance prepares the payout.
5.  **Disbursed**: Final confirmation of fund transfer.

### B. Investment Application Flow (4 UI Stages)
1.  **Submission**: Active only for re-work on returned/rejected records.
2.  **Customer Validation**: Minimum entry point. CX verifies identity and rollover preferences.
3.  **Payment Verification**: Finance confirms receipt of the investment principal.
4.  **Issue Certificate**: Final stage where the legal investment document is generated.