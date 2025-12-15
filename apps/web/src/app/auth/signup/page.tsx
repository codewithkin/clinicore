"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

/**
 * Responsible for rendering the sign up page
 * - Collects initial organization and admin credentials
 * - Creates a new organization with the admin user
 * - Immediately redirects the user to Polar checkout
 */
export default function SignUpPage() {
    const [orgName, setOrgName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signupMutation = useMutation({
        mutationFn: async () => {
            /**
             * 1. Create organization + admin user
             */
            const { data: org, error: orgError } =
                await authClient.organization.create({
                    name: orgName,
                    email,
                    password,
                });

            if (orgError || !org) {
                throw new Error(
                    orgError?.message || "Failed to create organization"
                );
            }

            /**
             * 2. Immediately start Polar checkout
             * Polar will handle:
             * - Trial start
             * - Payment method collection
             * - Subscription activation
             */
            const { error: checkoutError } = await authClient.polar.checkout({
                productSlug: "starter",
                callbackURL: "/dashboard",
            });

            if (checkoutError) {
                throw new Error(
                    checkoutError.message || "Failed to start checkout"
                );
            }
        },

        onSuccess: () => {
            toast.success("Clinic created. Redirecting to checkout…");
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return (
        <section className="min-h-screen flex items-center justify-center px-4">
            <article className="w-full max-w-md flex flex-col gap-10">
                {/* Branding */}
                <div className="text-center">
                    <h2 className="text-green-500 font-medium text-sm">
                        Clinicore
                    </h2>
                    <h1 className="text-2xl font-medium mt-2">
                        Register your clinic
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Create your organization to get started
                    </p>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="org">Clinic / Hospital Name</Label>
                        <Input
                            id="org"
                            placeholder="Clinicore Health"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Admin Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@clinicore.space"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        size="lg"
                        disabled={signupMutation.isPending}
                        onClick={() => signupMutation.mutate()}
                    >
                        {signupMutation.isPending
                            ? "Creating clinic..."
                            : "Create clinic"}
                    </Button>

                    <p className="text-sm text-gray-500 text-center">
                        Already have an account?{" "}
                        <Link
                            href="/auth/signin"
                            className="font-medium text-green-400 hover:text-green-600 transition"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </article>
        </section>
    );
}