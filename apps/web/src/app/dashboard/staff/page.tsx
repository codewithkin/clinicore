import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";

export default async function StaffPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	// Check if user is admin
	const isAdmin = session.user.role === "admin" || session.user.role === "owner";

	if (!isAdmin) {
		redirect("/dashboard");
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Staff Management</h1>
			<p className="text-muted-foreground mt-2">
				View, invite, and manage staff members and their roles.
			</p>
		</div>
	);
}
