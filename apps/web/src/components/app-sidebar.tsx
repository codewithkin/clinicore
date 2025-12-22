"use client";

import {
	LayoutDashboard,
	Users,
	ClipboardList,
	UserCog,
	CreditCard,
	BarChart3,
	Settings,
	ChevronUp,
	User2,
	Building2,
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
	useSidebar,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Navigation items for all users
const coreNavItems = [
	{
		title: "Dashboard",
		url: "/dashboard",
		icon: LayoutDashboard,
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
	organization
}: {
	user: any;
	isAdmin: boolean;
	organization: { id: string; name: string; logo: string | null; slug: string } | null;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { open } = useSidebar();

	const handleSignOut = async () => {
		await authClient.signOut();
		router.push("/auth/signin");
	};

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
										<span className="text-sm font-bold">
											{organization?.name?.charAt(0).toUpperCase() || "C"}
										</span>
									</div>
								)}
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{organization?.name || "Clinicore"}</span>
									<span className="truncate text-xs text-muted-foreground">Clinicore</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{/* Core Navigation */}
				<SidebarGroup>
					<SidebarGroupLabel>Main</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{coreNavItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.url}
										tooltip={item.title}
										className={pathname === item.url ? "text-white font-semibold" : "text-gray-600"}
									>
										<a href={item.url}>
											<item.icon />
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
											className={pathname === item.url ? "text-white font-semibold" : "text-gray-600"}
										>
											<a href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				{/* Clinic Settings (Admin Only) */}
				{isAdmin && (
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={pathname === clinicNavItem.url}
										tooltip={clinicNavItem.title}
										className={pathname === clinicNavItem.url ? "text-white font-semibold" : "text-gray-600"}
									>
										<a href={clinicNavItem.url}>
											<clinicNavItem.icon />
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
									className={pathname === settingsNavItem.url ? "text-white font-semibold" : "text-gray-600"}
								>
									<a href={settingsNavItem.url}>
										<settingsNavItem.icon />
										<span>{settingsNavItem.title}</span>
									</a>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
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
									<User2 className="size-8 rounded-lg" />
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{user?.name || "User"}
										</span>
										<span className="truncate text-xs">{user?.email}</span>
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
								<DropdownMenuItem onClick={handleSignOut}>
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
