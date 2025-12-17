export type PlanId = "starter" | "small_clinic" | "growing_clinic";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  limits: {
    doctors: number;
    receptionists: number;
    patients: number;
    emailsPerMonth: number;
    storageGB: number;
  };
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for solo practitioners just getting started",
    limits: {
      doctors: 1,
      receptionists: 1,
      patients: 300,
      emailsPerMonth: 500,
      storageGB: 1,
    },
  },
  {
    id: "small_clinic",
    name: "Small Clinic",
    description: "Ideal for small practices with a growing patient base",
    limits: {
      doctors: 3,
      receptionists: 3,
      patients: 1500,
      emailsPerMonth: 2000,
      storageGB: 5,
    },
  },
  {
    id: "growing_clinic",
    name: "Growing Clinic",
    description: "Built for larger practices with extensive needs",
    limits: {
      doctors: 7,
      receptionists: 7,
      patients: 5000,
      emailsPerMonth: 6000,
      storageGB: 20,
    },
  },
];

export default plans;
