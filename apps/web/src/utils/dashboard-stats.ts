import { db } from "@my-better-t-app/db";
import { getStartOfToday, getStartOfTomorrow, getMonthsAgo, getWeeksAgo, getStartOfMonth, getEndOfMonth } from "./date-helpers";

/**
 * Calculate monthly revenue from completed appointments
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Total revenue for the current month
 */
export async function getMonthlyRevenue(organizationId?: string | null): Promise<number> {
  const startOfMonth = getStartOfMonth();
  const endOfMonth = getEndOfMonth();
  
  // Count completed appointments for the month
  const completedAppointments = await db.appointment.count({
    where: {
      status: "completed",
      time: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      ...(organizationId && {
        patient: {
          organizationId,
        },
      }),
    },
  });
  
  // Calculate revenue (assuming $150 per appointment - this can be made configurable)
  const APPOINTMENT_RATE = 150;
  return completedAppointments * APPOINTMENT_RATE;
}

/**
 * Get total patient count
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Total number of patients
 */
export async function getTotalPatients(organizationId?: string | null): Promise<number> {
  return await db.patient.count({
    where: organizationId ? { organizationId } : undefined,
  });
}

/**
 * Get patient count from N months ago
 * @param monthsAgo - Number of months to go back
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Patient count from N months ago
 */
export async function getPatientsFromMonthsAgo(
  monthsAgo: number,
  organizationId?: string | null
): Promise<number> {
  const dateThreshold = getMonthsAgo(monthsAgo);
  
  return await db.patient.count({
    where: {
      createdAt: {
        lt: dateThreshold,
      },
      ...(organizationId && { organizationId }),
    },
  });
}

/**
 * Get patients registered in the last N weeks
 * @param weeksAgo - Number of weeks to look back
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Number of patients registered in the time period
 */
export async function getRecentPatients(
  weeksAgo: number,
  organizationId?: string | null
): Promise<number> {
  const dateThreshold = getWeeksAgo(weeksAgo);
  
  return await db.patient.count({
    where: {
      createdAt: {
        gte: dateThreshold,
      },
      ...(organizationId && { organizationId }),
    },
  });
}

/**
 * Get today's appointment count
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Number of appointments today
 */
export async function getTodayAppointmentsCount(organizationId?: string | null): Promise<number> {
  const today = getStartOfToday();
  const tomorrow = getStartOfTomorrow();
  
  return await db.appointment.count({
    where: {
      time: {
        gte: today,
        lt: tomorrow,
      },
      ...(organizationId && {
        patient: {
          organizationId,
        },
      }),
    },
  });
}

/**
 * Get pending appointments count for today
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Number of pending appointments
 */
export async function getPendingAppointmentsCount(organizationId?: string | null): Promise<number> {
  const today = getStartOfToday();
  const tomorrow = getStartOfTomorrow();
  
  return await db.appointment.count({
    where: {
      time: {
        gte: today,
        lt: tomorrow,
      },
      status: "scheduled",
      ...(organizationId && {
        patient: {
          organizationId,
        },
      }),
    },
  });
}

/**
 * Get pending check-ins (scheduled appointments that should have started)
 * @param organizationId - The organization ID to filter by (optional)
 * @returns Number of appointments waiting for check-in
 */
export async function getPendingCheckIns(organizationId?: string | null): Promise<number> {
  const today = getStartOfToday();
  const now = new Date();
  
  return await db.appointment.count({
    where: {
      time: {
        gte: today,
        lt: now,
      },
      status: "scheduled",
      ...(organizationId && {
        patient: {
          organizationId,
        },
      }),
    },
  });
}

/**
 * Get staff count for an organization
 * @param organizationId - The organization ID
 * @returns Number of staff members
 */
export async function getStaffCount(organizationId: string): Promise<number> {
  return await db.member.count({
    where: {
      organizationId,
    },
  });
}

/**
 * Get today's appointments with patient details
 * @param organizationId - The organization ID to filter by (optional)
 * @param limit - Maximum number of appointments to return
 * @returns Array of appointments with patient data
 */
export async function getTodayAppointments(
  organizationId?: string | null,
  limit: number = 10
) {
  const today = getStartOfToday();
  const tomorrow = getStartOfTomorrow();
  
  return await db.appointment.findMany({
    where: {
      time: {
        gte: today,
        lt: tomorrow,
      },
      ...(organizationId && {
        patient: {
          organizationId,
        },
      }),
    },
    include: {
      patient: true,
    },
    orderBy: {
      time: "asc",
    },
    take: limit,
  });
}

/**
 * Calculate patient growth percentage
 * @param currentTotal - Current total number of patients
 * @param previousTotal - Previous total number of patients
 * @returns Growth percentage as a string
 */
export function calculateGrowthPercentage(
  currentTotal: number,
  previousTotal: number
): string {
  if (previousTotal === 0) return "0";
  return ((currentTotal - previousTotal) / previousTotal * 100).toFixed(0);
}
