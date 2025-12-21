export const QUERY_KEYS = {
  patients: (organizationId?: string) => ["patients", organizationId || ""] as const,
  appointments: (organizationId?: string) => ["appointments", organizationId || ""] as const,
};
