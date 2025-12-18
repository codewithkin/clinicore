import { NextRequest, NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";
import prisma from "@my-better-t-app/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { plan, planName } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      );
    }

    // Update user's wanted_plan in database (will be set to plan after payment verification)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { wanted_plan: plan },
    });

    return NextResponse.json({
      success: true,
      plan,
      planName,
    });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
