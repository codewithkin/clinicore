export type PlanId = "starter" | "small_clinic" | "growing_clinic";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  perAdditionalSeat: number;
  productId: string;
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
    description: "For one doctor starting out",
    price: 29.99,
    perAdditionalSeat: 15,
    productId: process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID || "",
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
    description: "For small clinics with a few doctors",
    price: 49.99,
    perAdditionalSeat: 15,
    productId: process.env.NEXT_PUBLIC_POLAR_SMALL_CLINIC_PRODUCT_ID || "",
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
    description: "For larger clinics with many doctors",
    price: 99.99,
    perAdditionalSeat: 15,
    productId: process.env.NEXT_PUBLIC_POLAR_GROWING_CLINIC_PRODUCT_ID || "",
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
