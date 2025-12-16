"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Responsible for rendering the sign up page
 * - Creates a normal user account (no organization)
 * - Establishes a session
 * - Redirects user to onboarding
 */
export default function SignUpPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signupMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await authClient.signUp.email({
                name,
                email,
                password,
                callbackURL: "/onboarding",
            });

            if (error || !data) {
                throw new Error(error?.message || "Failed to create account");
            }

            return data;
        },

        onSuccess: () => {
            toast.success("Account created. Redirecting…");
            router.replace("/onboarding");
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
                        Create your account
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Start by creating an admin account
                    </p>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="Kin Zinzombe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
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
                            ? "Creating account..."
                            : "Continue"}
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