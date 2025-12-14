Clinicore Authentication & Organization Flow
Overview

This flow captures how users sign up, create organizations, start paid trials, and log in. It reflects the Better Auth + Polar plugin integration and seat-based limits.

1. Signup Flow (Admin Only)

Step 1: Admin fills signup form

Inputs:

Email

Password

Clinic/organization name

Step 2: Client calls Better Auth

authClient.signUp.email({ email, password })

Creates the admin user

Step 3: Organization creation

authClient.organization.createOrganization({ name: clinicName })

Admin becomes the organization owner

Organization ID returned

Step 4: Start Polar checkout

authClient.checkout({ slug: "starter", referenceId: org.data.id })

Payment info collected upfront

3-day trial starts automatically

Seats (doctors + receptionists) are enforced

Step 5: Redirect to app

Success URL (from Polar config) → app

Admin sees “Trial Started” banner

Can invite staff up to included seats

2. Staff Invitation Flow

Step 1: Admin invites a staff member

authClient.organization.inviteMember({ email, role: "doctor" | "receptionist" })

Step 2: Seat enforcement

Check against subscription.seatsAvailable (Polar) + included seats

If no seats → block invite

Step 3: Staff accepts invite

Account created if first-time

Role assigned automatically

Membership tied to org

Seat counted against total

3. Sign-In Flow (Existing Users)

Step 1: User fills login form

Email + password

Step 2: Validate with Better Auth

authClient.signIn.email({ email, password })

Step 3: Check organization

If user has no org → show error: “Ask admin for invite”

Step 4: Session established

Roles inferred automatically

Access granted according to org membership

Seat enforcement applies if staff role consumes a seat

4. Trial / Subscription Awareness

Subscription states (Polar):

trialing → full access

active → full access

past_due → restricted mode, admin notified

canceled → locked, export allowed

Usage enforcement:

Seats (doctors/receptionists)

Plan limits (patients, emails, storage)

All state synced via Polar plugin; Better Auth manages identity & org membership

5. Summary Flow Diagram (Conceptual)
[Admin Signup] 
      |
      v
[Create User via authClient.signUp]
      |
      v
[Create Org via authClient.organization.createOrganization]
      |
      v
[Trigger Polar Checkout via authClient.checkout]
      |
      v
[Trial Starts - 3 Days Paid]
      |
      v
[Redirect to App - Admin Dashboard]
      |
      v
[Invite Staff] --> [Seat Enforcement] --> [Staff Accepts Invite]
      |
      v
[Staff Can Access App - Seat Count Updated]


All user roles are derived automatically

Seats limit number of doctors/receptionists per org

Trial is paid and subscription-backed, handled by Polar

This auth-flow.md now provides a definitive developer reference for how authentication, organization creation, and trial subscriptions operate in Clinicore.