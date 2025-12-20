import { db } from "@my-better-t-app/db";

/**
 * Get user's role within an organization
 * @param userId - The user's ID
 * @param organizationId - The organization's ID
 * @returns The user's role (defaults to "receptionist" if not found)
 */
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<string> {
  const member = await db.member.findFirst({
    where: {
      userId,
      organizationId,
    },
  });
  return member?.role || "receptionist";
}

/**
 * Check if a role is an admin role (admin or doctor)
 * @param role - The role to check
 * @returns True if the role is admin or doctor
 */
export function isAdmin(role: string): boolean {
  return role === "admin" || role === "doctor";
}

/**
 * Get the first organization a user is a member of
 * @param userId - The user's ID
 * @returns The organization ID or null if not found
 */
export async function getUserOrganization(userId: string): Promise<string | null> {
  const firstMembership = await db.member.findFirst({
    where: {
      userId,
    },
    include: {
      organization: true,
    },
  });
  
  return firstMembership?.organizationId || null;
}
