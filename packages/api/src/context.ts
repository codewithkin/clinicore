import type { NextRequest } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";

export async function createContext(req: NextRequest) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});
	return {
		session,
		db,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
