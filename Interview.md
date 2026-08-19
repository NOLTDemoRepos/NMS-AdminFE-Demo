# Interview Guide: Senior FullStack Developer (FinTech Admin Systems)

This guide focuses on evaluating a candidate's ability to build systems with complex workflows, strict security requirements, and dynamic data structures similar to the NOLT Finance platform.

---

## 1. System Design & Workflows
**Q1: How would you design a robust backend state machine for a multi-stage loan approval process involving 6+ distinct roles (Sales, CX, Credit, Audit, Finance)?**
*   **What to look for**: Mention of state patterns or workflow engines. Ability to handle "rejection/return" loops. Understanding of atomic state transitions.

**Q2: In a system where a loan skips the "Submission" node and goes straight to "Validation" on the first try, but must return to "Submission" on rejection, how do you handle this logic in your API and Database?**
*   **What to look for**: Discussion on conditional entry points, default state values, and decoupling the UI stage from the database status.

---

## 2. Security & RBAC (Role-Based Access Control)
**Q3: How do you ensure that a user cannot "hack" their way into a Super Admin view just by modifying the frontend state?**
*   **What to look for**: "Security First" mindset. The candidate should emphasize that every API endpoint must independently verify the JWT/Session role against the requested resource.

**Q4: We use Microsoft Authenticator for MFA. Describe the flow of binding a new user to a TOTP secret and verifying it on subsequent logins.**
*   **What to look for**: Understanding of the `otpauth://` URI, secret key storage (encryption at rest), and time-drift handling.

---

## 3. Dynamic Data & Form Management
**Q5: Design a schema for a "Form Designer" module. How do you implement dependent categorization (e.g., Loan categories like Business/Niche vs Investment categories like Rise/Vault)?**
*   **What to look for**: Relational mapping or JSONB schema logic. Ability to handle "on-change" UI updates that sync with the backend schema definition.

**Q6: How would you handle structural elements in a dynamic form, like Dividers or Section Breakpoints, in your database and frontend rendering logic?**
*   **What to look for**: Identification of "non-input" field types. Handling fields that have a `label` but no `value` in the application submission payload.

---

## 4. Frontend Engineering & UX
**Q7: How do you manage a "Preview Role" feature in React to ensure the entire UI updates instantly without a full page refresh?**
*   **What to look for**: Global state management (Zustand/Context). Mapping roles to navigation permissions and action buttons.

**Q8: Explain your approach to building a Progress Stepper that groups multiple backend states into a single logical UI step (e.g., Officer + Manager reviews into "Credit Checks").**
*   **What to look for**: "Mapping" logic—creating an abstraction layer that translates tech statuses into UX milestones.

---

## 5. Practical "FinTech" Scenarios
**Q9: A user reports they approved a loan, but the status didn't move. How do you debug this across the stack?**
*   **What to look for**: Systematic debugging: Network tab, API Logs, State Machine transitions, and checking the "Operation Log" implementation.

**Q10: We need to export flattened CSV reports from nested objects (Applicant -> Loan -> References). What are the performance considerations for 100k+ records?**
*   **What to look for**: Streaming responses, backend-side CSV generation, and database indexing for filtered exports.