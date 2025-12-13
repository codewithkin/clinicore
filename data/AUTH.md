# Clinicore Authentication Requirements

## 1. Goals

- Secure, reliable authentication for clinics (organizations)
- Role-based access: Admins, Doctors, Receptionists
- Seamless integration with payments and subscriptions
- MVP simplicity: minimal friction, instant value

---

## 2. Auth System

- Use **Better Auth** as the authentication framework
- Database: PostgreSQL (via Prisma adapter)
- Auth methods:
  - Email & password
  - (Optional future) OAuth for Google/Apple sign-in

---

## 3. Organizations

- Each clinic/hospital is an **organization**
- Users are associated with exactly one organization
- Roles:
  - **Admin**: can invite/manage users, manage plan
  - **Doctor**: can manage patients and appointments
  - **Receptionist**: can manage appointments and patient intake
- Signup workflow:
  1. Admin creates an organization via `/auth/signup` and pays immediately
  2. Regular users can only join via invite from an Admin
  3. Role is inferred automatically from organization and invitation
- Invite-only flow prevents spam and ensures paid onboarding

---

## 4. Payments Integration

- Integrate **Polar** for subscription management
- Admins pay immediately when creating an organization
- Subscription maps to **plan tiers** and defines **usage limits**
- Features:
  - Checkout page on signup
  - Customer portal for subscription management
  - Plan enforcement based on limits

---

## 5. Session & Cookies

- Use `nextCookies()` for session handling in Next.js
- Sessions are organization-aware
- Ensure proper handling of logged-in user context across pages

---

## 6. Roles & Permissions

- Permissions are inferred automatically based on role:
  - Admin: full access
  - Doctor: patient records, appointments, notes, billing for own patients
  - Receptionist: appointment management, patient intake, limited visibility to records
- No explicit role selection in login; system knows based on org context

---

## 7. Security Considerations

- Enforce HTTPS and trusted origins
- Require invite for non-admin users
- Validate email on signup
- Store passwords securely using Better Auth defaults
- Optional: Rate-limit login attempts to prevent brute-force attacks

---

## 8. Limit Enforcement (Integration with Auth)

- Limit number of:
  - Doctors per organization
  - Receptionists per organization
  - Patients per plan
  - Monthly emails
  - Storage usage
- Limits tied to **plan tiers**
- Hard enforcement at backend API/service layer
- Upgrade or overage billing flow triggered when limits exceeded

---

## 9. Future Enhancements

- OAuth login for faster onboarding
- SSO support for hospitals
- Multi-org support for admins who manage multiple clinics
- SMS / WhatsApp notifications with usage limits

---

## 10. Summary

- Admins create orgs + pay immediately  
- Regular users join via invite only  
- Roles automatically inferred  
- Payment and plan limits integrated with auth  
- Usage limits enforced in backend  
- Security and session handling handled via Better Auth + Next.js