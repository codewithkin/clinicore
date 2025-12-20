import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getUserOrganization, getUserRole, isAdmin as checkIsAdmin } from "@/lib/dashboard-helpers";
import { db } from "@my-better-t-app/db";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	// Get user's organization and role
	const organizationId = await getUserOrganization(session.user.id);
	const userRole = organizationId
		? await getUserRole(session.user.id, organizationId)
		: "receptionist";
	const isAdmin = checkIsAdmin(userRole);

	// Fetch organization data for branding
	let organization = null;
	if (organizationId) {
		organization = await db.organization.findUnique({
			where: { id: organizationId },
			select: { id: true, name: true, logo: true, slug: true },
		});
	}

	return (
		<SidebarProvider>
			<AppSidebar user={session.user} isAdmin={isAdmin} organization={organization} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="flex-1" />
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
