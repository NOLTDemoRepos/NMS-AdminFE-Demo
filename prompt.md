# System Replication Prompt: Auth & Team Management

Use the following requirements to build a high-fidelity administrative module for a financial platform.

## 1. Visual & UI Guidelines
- **Theme**: Sophisticated dark-mode aesthetic. Primary background: `#081016`. Surface components: `#111d26`.
- **Typography**: Use 'Manrope'. Heavy weights (800/900) for headers. Uppercase tracking for labels.
- **Auth Screen**: Must include a high-contrast button/link "Go To Customer Portal" in the footer area with a `person_outline` icon.

## 2. Authentication System (AuthView)
- **Mode Toggle**: Login and Signup states.
- **Login Pipeline**: 
    1. **Credentials**: Email/Password.
    2. **Binding**: QR code simulation for Microsoft Authenticator.
    3. **2FA Verification**: 6-digit TOTP input.
- **Signup Pipeline**: Details -> 4-digit OTP -> Success state with Tracking ID (REQ-XXXXX).

## 3. Form Designer (FormBuilderView)
Build a dynamic form configuration tool:
- **Header Config**: 
    - Type selection (Loan/Investment).
    - **Dependent Category Dropdown**: 
        - Loan -> Business, Niche, Employee.
        - Investment -> Rise, Vault.
- **Field Registry**: Support for `text`, `number`, `select`, `date`, `file`, `textarea`, `toggle` (switch), `radio` (multi-choice), `divider` (heading + line), and `breakpoint` (visual page separator).
- **Property Panel**: 
    - Real-time label/placeholder editing.
    - Options management for Select/Radio types.
    - Conditional property visibility (e.g., hide placeholder for Dividers).

## 4. Team & Role Management (UsersView)
- **User Table**: Searchable table with Administrator Profile, Dynamic Role editing, and Hierarchy Management ("Reports To").
- **Security**: "Revoke Access" / "Activate Account" toggles and referral code regeneration.

# System Replication Prompt: Preview Role Functionality

## 1. UI Implementation
- **Location**: Bottom of sidebar.
- **Behavior**: Global user state update upon role change.
- **View Masking**: 
    - **Super Admin**: Global.
    - **Sales Manager**: No system settings.
    - **Credit Roles**: Hide Investment module.
    - **Finance**: Show only payout-ready or approved records.
- **Tiering**: Officer pass -> `Credit Review`. Manager pass -> `Internal Audit`.