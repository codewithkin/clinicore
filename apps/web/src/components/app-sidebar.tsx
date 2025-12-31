"use client";

import {
	LayoutDashboard,
	Users,
	UserCog,
	CreditCard,
	BarChart3,
	Settings,
	ChevronUp,
	Building2,
	Sparkles,
	LogOut,
	CalendarDays,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { Plan } from "@/data/plans";

// Navigation items for all users
const coreNavItems = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Appointments",
		url: "/dashboard/appointments",
		icon: CalendarDays,
	},
	{
		title: "Patients",
		url: "/dashboard/patients",
		icon: Users,
	},
	{
		title: "Reports",
		url: "/dashboard/reports",
		icon: BarChart3,
	},
];

// Admin-only navigation items
const adminNavItems = [
	{
		title: "Staff",
		url: "/dashboard/staff",
		icon: UserCog,
	},
	{
		title: "Billing",
		url: "/dashboard/billing",
		icon: CreditCard,
	},
	{
		title: "Organisation",
		url: "/dashboard/settings",
		icon: Building2,
	},
];

// Admin-only clinic settings
const clinicNavItem = {
	title: "Clinic",
	url: "/dashboard/clinic",
	icon: Building2,
};

// Settings navigation item
const settingsNavItem = {
	title: "Settings",
	url: "/dashboard/settings",
	icon: Settings,
};

export function AppSidebar({
	user,
	isAdmin,
	organization,
	currentPlan,
}: {
	user: any;
	isAdmin: boolean;
	organization: { id: string; name: string; logo: string | null; slug: string } | null;
	currentPlan: Plan;
}) {
	const router = useRouter();
	const pathname = usePathname();

	const handleSignOut = async () => {
		await authClient.signOut();
		router.push("/auth/signin");
	};

	// Get user initials for avatar fallback
	const userInitials = user?.name
		? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
		: "U";

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="/dashboard">
								{organization?.logo ? (
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
										<img
											src={organization.logo}
											alt={organization.name}
											className="size-8 object-cover"
										/>
									</div>
								) : (
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
										<span className="text-sm font-semibold">
											{organization?.name?.charAt(0).toUpperCase() || "C"}
										</span>
									</div>
								)}
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold text-sidebar-foreground">
										{organization?.name || "Clinicore"}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{currentPlan.name} Plan
									</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{/* Core Navigation */}
				<SidebarGroup>
					<SidebarGroupLabel>Overview</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{coreNavItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
										tooltip={item.title}
									>
										<a href={item.url}>
											<item.icon className="size-4" />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Admin Navigation */}
				{isAdmin && (
					<SidebarGroup>
						<SidebarGroupLabel>Management</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{adminNavItems.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={pathname === item.url}
											tooltip={item.title}
										>
											<a href={item.url}>
												<item.icon className="size-4" />
												<span>{item.title}</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname === clinicNavItem.url}
										tooltip={clinicNavItem.title}
									>
										<a href={clinicNavItem.url}>
											<clinicNavItem.icon className="size-4" />
											<span>{clinicNavItem.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				{/* Settings Navigation */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname === settingsNavItem.url}
									tooltip={settingsNavItem.title}
								>
									<a href={settingsNavItem.url}>
										<settingsNavItem.icon className="size-4" />
										<span>{settingsNavItem.title}</span>
									</a>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Plan upgrade prompt for admins */}
				{isAdmin && currentPlan.id !== "growing_clinic" && (
					<>
						<SidebarSeparator />
						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton
											asChild
											tooltip="Upgrade Plan"
											className="bg-linear-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 border border-teal-200"
										>
											<a href="/dashboard/billing">
												<Sparkles className="size-4 text-teal-600" />
												<span className="text-teal-700 font-medium">Upgrade Plan</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</>
				)}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="size-8 rounded-lg">
										<AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
										<AvatarFallback className="rounded-lg bg-teal-100 text-teal-700 text-xs font-medium">
											{userInitials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{user?.name || "User"}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{user?.email}
										</span>
									</div>
									<ChevronUp className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								side="bottom"
								align="end"
								sideOffset={4}
							>
								<DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
									<Settings className="mr-2 size-4" />
									Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
									<LogOut className="mr-2 size-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
