import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";

export default async function ReportsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Reports</h1>
			<p className="text-muted-foreground mt-2">
				Access analytics and performance insights for your clinic.
			</p>
		</div>
	);
}
