Clinicore — Planning Decisions, Mental Models, and Design Rationale

This document captures the thinking behind Clinicore, not the implementation details.
It explains why decisions were made, how mental models evolved, and how future development must be approached.

This is the highest-level source of truth for the product.

1. Foundational Philosophy

Clinicore is designed as a serious B2B healthcare operations system, not a casual SaaS.

Key beliefs:

Clinics are organizations, not users

Payment precedes usage

Growth must scale revenue proportionally

Complexity is hidden from users, not from the system

Every architectural and product decision flows from these beliefs.

2. Organization-First Mental Model
Why Organizations Come First

Clinics, not individuals, pay for software

Data ownership belongs to the clinic

Staff turnover should not affect system continuity

Therefore:

Every user belongs to exactly one organization

Organizations own:

Users

Subscriptions

Seats

Limits

Data

There is no concept of a “personal account.”

3. Admin-First Onboarding
Why Only Admins Can Sign Up

Prevents spam

Prevents orphaned organizations

Mirrors real-world clinic authority structures

Admins:

Create the organization

Control billing

Invite staff

Manage limits and seats

Staff never self-register.

4. Paid Trial Decision (Critical Shift)
Original Thought

Free trial without card

Let users “try it out”

Final Decision

Paid trial with payment info upfront

3-day trial started and managed by Polar

Why This Change Was Made

Free trials attract low-intent users

Infrastructure costs are real (DB, email, storage)

Clinics are businesses, not consumers

This aligns Clinicore with:

Enterprise SaaS norms

High-signal onboarding

Predictable revenue

5. Polar as the Source of Truth for Billing
Clear Separation of Concerns

Better Auth:

Identity

Sessions

Organizations

Roles

Polar:

Trials

Subscriptions

Seats

Billing state

No duplicated logic.
No shadow billing rules.

6. Seat-Based Pricing as the Scaling Mechanism
Why Seats Were Introduced

Clinics scale primarily through staff

Staff count directly correlates with value derived

Flat pricing fails for growing clinics

Seats:

Are consumed by doctors and receptionists

Do not apply to admins

Are enforced even during trial

Are billed via Polar

This avoids artificial caps and supports linear growth.

7. Tiered Plans Without Feature Gating
Intentional Design Choice

All users get access to all features

Plans define capacity, not capability

Limits include:

Patients

Emails

Storage

Included seats

Why:

Feature gating increases cognitive load

Capacity limits are easier to explain

Clinics understand usage-based constraints intuitively

8. Pricing Recalibration (Value-Based)
Key Insight

If Twitter charges ~$20/month for attention,
a system that:

Saves time

Reduces errors

Improves clinic operations

…is underpriced at the same level.

Prices were:

Intentionally doubled

Benchmarked against patient visit revenue

Designed so 1–2 visits cover software cost

This reframed pricing as ROI-driven, not cost-driven.

9. Addition of Receptionists as First-Class Users

Initially overlooked, receptionists were later added as:

Operationally critical users

Seat-consuming roles (same as doctors)

This reinforced:

The seat-based model

Realistic clinic workflows

Non-clinical operational needs

10. No Role Selection UX (Hidden Complexity)

Users never choose roles manually.

Why:

Roles are contextual, not personal

Admins already know who is who

Reduces onboarding friction and errors

Roles are:

Assigned at invite time

Derived from organization membership

Enforced automatically

The system “just knows.”

11. Introduction of Flows as a Mandatory Planning Tool (New)
Major Process Change

A new rule was established:

Every major feature must have a documented flow before implementation.

This led to the creation of:

auth-flow.md (the first canonical flow)

Why Flows Matter

Prevents ad-hoc logic

Aligns frontend, backend, and billing

Makes Copilot more reliable

Acts as shared mental model for future contributors

Flows describe:

User actions

System reactions

Decision points

Enforcement rules

They are not code, but they guide all code.

12. Auth Flow as the Reference Standard

The authentication flow established the template:

Step-by-step progression

Clear ownership of responsibilities

Explicit enforcement points (seats, billing, org membership)

Future flows (patients, billing, emails, etc.) must:

Follow the same structure

Be created before coding

Reference the same mental models

13. MVP Scope Discipline

Throughout planning, we intentionally:

Avoided premature enterprise features

Avoided free plans

Avoided complex role hierarchies

Avoided feature toggles

The MVP is:

Narrow

Opinionated

Monetized

Scalable without refactor

14. Guiding Principles Going Forward

Organizations over users

Payment before usage

Seats scale revenue

Limits over feature gating

Flows before code

Polar owns billing truth

Better Auth owns identity truth

Simplicity beats flexibility (for MVP)

15. Final Mental Model (Canonical)

A clinic is a paid organization with a subscription and seats; users are members with derived roles; trials are paid and enforced; capacity scales via seats; every feature follows a documented flow.

This principle should be preserved as Clinicore evolves.