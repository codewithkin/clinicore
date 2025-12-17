"use client";

import { authClient } from "@/lib/auth-client";

function Onboarding() {
    const session = authClient.useSession();

    console.log("Onboarding session:", session);

    return (
        <div>

        </div>
    )
}

export default Onboarding;