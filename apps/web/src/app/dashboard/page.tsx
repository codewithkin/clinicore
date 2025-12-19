import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { authClient } from "@/lib/auth-client";
import ActiveOrganizationClient from "@/components/active-organization-client";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	// Fetch active organization server-side (if available) and log it
	try {
		// some SDKs return { data, error } shape, others return data directly
		const orgResult: any = await authClient.organization.getFullOrganization?.({
			fetchOptions: {
				headers: await headers(),
			},
		});

		const orgData = orgResult?.data ?? orgResult;
		const org = orgData?.organization ?? orgData?.organization?.id ? orgData.organization : orgData;
		console.log("Server: active organization:", org);
	} catch (err) {
		console.error("Failed to load organization server-side", err);
	}

	const { data: customerState } = await authClient.customer.state({
		fetchOptions: {
			headers: await headers(),
		},
	});

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session.user.name}</p>
			<ActiveOrganizationClient />
		</div>
	);
}
