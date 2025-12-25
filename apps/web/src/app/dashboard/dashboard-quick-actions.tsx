"use client";

import QuickActionsClient from "@/components/quick-actions-client";
import { useRouter } from "next/navigation";

type Props = {
    isAdmin: boolean;
    organizationId?: string;
};

export default function DashboardQuickActions({ isAdmin, organizationId }: Props) {
    const router = useRouter();

    const handleRefresh = () => {
        // Refresh the page to update all data
        router.refresh();
    };

    return (
        <QuickActionsClient
            isAdmin={isAdmin}
            organizationId={organizationId}
            onRefresh={handleRefresh}
        />
    );
}