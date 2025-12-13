import type { auth } from "@my-better-t-app/auth";
import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
	plugins: [polarClient()],
});
