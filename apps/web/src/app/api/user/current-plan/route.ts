import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import prisma from "@my-better-t-app/db";
import plans from "@/data/plans";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user?.plan) {
      return NextResponse.json({ error: "No active plan" }, { status: 404 });
    }

    const planMeta = plans.find((p) => p.id === user.plan);

    return NextResponse.json({
      plan: user.plan,
      planName: planMeta?.name ?? user.plan,
    });
  } catch (error) {
    console.error("Current plan error:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
