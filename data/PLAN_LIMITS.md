# Clinicore Plan Limits (TypeScript)

```ts
export type PlanId = "starter" | "small_clinic" | "growing_clinic";

export type PlanLimitKey =
  | "doctors"
  | "receptionists"
  | "patients"
  | "emailsPerMonth"
  | "storageGB";

export const PLAN_LIMITS: Record<PlanId, Record<PlanLimitKey, number>> = {
  starter: {
    doctors: 1,
    receptionists: 1,
    patients: 300,
    emailsPerMonth: 500,
    storageGB: 1,
  },
  small_clinic: {
    doctors: 3,
    receptionists: 3,
    patients: 1500,
    emailsPerMonth: 2000,
    storageGB: 5,
  },
  growing_clinic: {
    doctors: 7,
    receptionists: 7,
    patients: 5000,
    emailsPerMonth: 6000,
    storageGB: 20,
  },
};

export const OVERAGE_PRICING = {
  staffSeatMonthlyUSD: 20,
};

// Helper functions
export function getPlanLimits(plan: PlanId) {
  return PLAN_LIMITS[plan];
}

export function isLimitReached(current: number, limit: number): boolean {
  return current >= limit;
}