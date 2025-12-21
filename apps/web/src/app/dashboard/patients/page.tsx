import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { getUserOrganization } from "@/lib/dashboard-helpers";
import PatientsClient from "./patients-client";

export default async function PatientsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	const organizationId = await getUserOrganization(session.user.id);

	// Fetch initial patients
	const { db } = await import("@my-better-t-app/db");
	const patients = organizationId ? await db.patient.findMany({
		where: { organizationId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
			dateOfBirth: true,
			createdAt: true,
		}
	}) : [];

	return <PatientsClient initialPatients={patients} organizationId={organizationId || undefined} />;
}
