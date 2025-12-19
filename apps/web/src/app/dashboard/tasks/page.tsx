import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";

export default async function TasksPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Tasks</h1>
			<p className="text-muted-foreground mt-2">
				Track and manage clinic-related tasks.
			</p>
		</div>
	);
}
