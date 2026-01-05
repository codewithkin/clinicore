import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { getUserOrganization, getUserRole, isAdmin as checkIsAdmin } from "@/lib/dashboard-helpers";

export default async function BillingPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	// Get user's organization and role
	const organizationId = await getUserOrganization(session.user.id);
	if (!organizationId) {
		redirect("/auth/onboarding");
	}

	const userRole = await getUserRole(session.user.id, organizationId);
	const isAdminUser = checkIsAdmin(userRole);

	if (!isAdminUser) {
		redirect("/dashboard");
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Billing</h1>
			<p className="text-muted-foreground mt-2">
				Manage subscriptions, payment methods, and invoices.
			</p>
		</div>
	);
}
