"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/dashboard";
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signInMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await authClient.signIn.email(
                {
                    email,
                    password,
                    callbackURL: redirect,
                    rememberMe: true,
                },
                {
                    onError: (ctx) => {
                        // Email not verified
                        if (ctx.error.status === 403) {
                            throw new Error(
                                "Please verify your email address. A verification link has been sent to your inbox."
                            );
                        }

                        throw new Error(ctx.error.message);
                    },
                }
            );

            if (!data) {
                throw new Error("Failed to sign in");
            }

            return data;
        },

        onSuccess: () => {
            toast.success("Signed in successfully");
            router.replace(redirect || "/dashboard");
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
                    <h2 className="text-green-500 font-medium text-sm">Clinicore</h2>
                    <h1 className="text-2xl font-medium mt-2">Let's get back to it</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Enter your details to sign in to your account
                    </p>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="kin@clinicore.space"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm font-medium text-green-400 hover:text-green-600 transition"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <Eye />
                            </Button>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        disabled={signInMutation.isPending}
                        onClick={() => signInMutation.mutate()}
                    >
                        {signInMutation.isPending ? "Signing in..." : "Login"}
                    </Button>

                    <p className="text-sm text-gray-500 text-center">
                        Want to register your clinic?{" "}
                        <Link
                            href="/auth/signup"
                            className="font-medium text-green-400 hover:text-green-600 transition"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </article>
        </section>
    );
}
