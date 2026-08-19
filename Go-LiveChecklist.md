# NOLT Finance - Production Go-Live Checklist

This document outlines the technical and operational tasks required to transition the frontend prototype into a production environment.

---

## 1. Infrastructure & Environment
- [ ] **CI/CD Pipeline:** Set up automated workflows for linting, testing, and deployment.
- [ ] **Secret Management:** Securely configure `process.env.API_KEY` and Webhook secrets.

## 2. Authentication & Security
- [ ] **MFA Logic:** Verify the TOTP window of validity matches Microsoft Authenticator standards.
- [ ] **Portal Redirection:** Test the "Go To Customer Portal" link across different device screen sizes.
- [ ] **RBAC Masking:** Verify restricted roles cannot access URL paths for Core System modules (Settings/Users/Security).

## 3. Form Designer Integrity
- [ ] **Dependent Category Logic:** Confirm that selecting "Investment" clears any previous "Loan" categories and updates the list to "Rise/Vault".
- [ ] **Advanced Field Rendering:** Verify `Toggle` and `Radio` fields render correctly in the Form Preview mode.
- [ ] **Layout Elements:** Ensure `Divider` and `Breakpoint` labels are exported correctly in the JSON schema.

## 4. Data & Operation Log
- [ ] **Credit Assessment Validation:** Block "Submit to Manager" if the **Eligible Amount** field is empty or non-numeric.
- [ ] **Sales Reassignment:** Verify that re-assigning an owner triggers a high-severity "Security Log" entry and a low-priority "Operation Log" comment.
- [ ] **Mandatory Comments:** Ensure the "Confirm Decline" button is disabled until a comment is provided in the modal.

## 5. UI/UX Consistency
- [ ] **Progress Stepper Mapping:** Test that `Internal Audit` correctly positions the indicator at "Request For Payment" for Loans.
- [ ] **Dark Mode Contrast:** Verify all new form elements (toggles, radios) have accessible contrast ratios in `dark:bg-surface-dark`.
- [ ] **Export Flattening:** Confirm that the CSV export correctly handles flattened data from applications using the new custom form fields.