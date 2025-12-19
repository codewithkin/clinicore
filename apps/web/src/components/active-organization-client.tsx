"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function ActiveOrganizationClient() {
    const { data: activeOrganization } = authClient.useActiveOrganization();

    useEffect(() => {
        console.log("Client: active organization:", activeOrganization);
    }, [activeOrganization]);

    return activeOrganization ? <p>{activeOrganization.name}</p> : null;
}
