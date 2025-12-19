"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, LogIn, ShieldAlert } from "lucide-react";

type Props = {
    invitationId: string;
};

export default function AcceptInvitationClient({ invitationId }: Props) {
    const router = useRouter();
    const sessionQuery = authClient.useSession();
    const session = sessionQuery?.data;
    const sessionPending = sessionQuery?.isPending ?? false;

    const [status, setStatus] = useState<"pending" | "success" | "error" | "auth" | "verify" | "mismatch">("pending");
    const [message, setMessage] = useState<string>("Checking your invitation...");
    const [inviteEmail, setInviteEmail] = useState<string | null>(null);

    const accept = async () => {
        if (!invitationId) {
            setStatus("error");
            setMessage("Missing invitation id.");
            return;
        }

        if (!session?.user) {
            setStatus("auth");
            setMessage("Please sign in to accept your invitation.");
            return;
        }

        if (inviteEmail && session.user.email.toLowerCase() !== inviteEmail.toLowerCase()) {
            setStatus("mismatch");
            setMessage(`You are signed in as ${session.user.email}, but this invitation is for ${inviteEmail}. Please sign out and sign in with the invited email.`);
            return;
        }

        setStatus("pending");
        setMessage("Accepting your invitation...");

        try {
            const result: any = await (authClient as any).organization?.acceptInvitation?.({ invitationId });
            const error = result?.error;
            if (error) {
                throw new Error(error.message || "Failed to accept invitation");
            }

            setStatus("success");
            setMessage("Invitation accepted! Redirecting to your dashboard...");
            setTimeout(() => router.push("/dashboard"), 1000);
        } catch (err: any) {
            setStatus("error");
            setMessage(err?.message || "Failed to accept invitation. Please try again.");
        }
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!invitationId) return;
            try {
                const res = await fetch(`/api/invitations/${invitationId}`);
                if (!res.ok) {
                    throw new Error("Invitation not found or expired.");
                }
                const json = await res.json();
                if (cancelled) return;

                setInviteEmail(json.invitation?.email ?? null);

                // Decide next action once session state is known
                if (json.user?.exists && json.user?.emailVerified === false) {
                    setStatus("verify");
                    setMessage("Please verify your email before accepting this invitation. Check your inbox for the verification link.");
                    return;
                }

                if (!sessionPending) {
                    // If user exists, verified, and we have a session with matching email, accept now
                    if (json.user?.exists && json.user?.emailVerified && session?.user?.email && session.user.email.toLowerCase() === (json.invitation?.email ?? "").toLowerCase()) {
                        void accept();
                        return;
                    }

                    // If user exists and verified but not signed in, prompt sign-in
                    if (json.user?.exists && json.user?.emailVerified && !session?.user) {
                        setStatus("auth");
                        setMessage("Please sign in with your invited email to accept the invitation.");
                        return;
                    }

                    // If user not created (unexpected), prompt to check email then sign in
                    if (!json.user?.exists) {
                        setStatus("auth");
                        setMessage("We created your account and sent you a temporary password. Please check your email, verify your account, then sign in to accept the invitation.");
                        return;
                    }
                }
            } catch (err: any) {
                if (cancelled) return;
                setStatus("error");
                setMessage(err?.message || "Unable to load invitation.");
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [invitationId, sessionPending, session?.user]);

    const goToSignIn = () => {
        const redirect = `/accept-invitation/${invitationId ?? ""}`;
        router.push(`/auth/signin?redirect=${encodeURIComponent(redirect)}`);
    };

    const goToHome = () => router.push("/");

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm bg-white">
                <div className="flex flex-col items-center text-center gap-4">
                    {status === "pending" && <Loader2 className="h-10 w-10 text-green-500 animate-spin" />}
                    {status === "success" && <CheckCircle className="h-10 w-10 text-green-500" />}
                    {status === "error" && <XCircle className="h-10 w-10 text-red-500" />}
                    {status === "auth" && <LogIn className="h-10 w-10 text-gray-700" />}
                    {status === "verify" && <ShieldAlert className="h-10 w-10 text-amber-500" />}
                    {status === "mismatch" && <ShieldAlert className="h-10 w-10 text-red-500" />}

                    <h1 className="text-xl font-semibold">Accept invitation</h1>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>

                    {status === "error" && (
                        <div className="flex gap-2">
                            <Button onClick={accept}>Retry</Button>
                            <Button variant="ghost" onClick={goToHome}>Go home</Button>
                        </div>
                    )}

                    {status === "auth" && (
                        <div className="flex gap-2">
                            <Button onClick={goToSignIn}>Sign in</Button>
                            <Button variant="ghost" onClick={goToHome}>Go home</Button>
                        </div>
                    )}

                    {status === "verify" && (
                        <div className="flex gap-2">
                            <Button onClick={goToHome} variant="ghost">Go home</Button>
                            <Button onClick={goToSignIn}>I verified, sign me in</Button>
                        </div>
                    )}

                    {status === "mismatch" && (
                        <div className="flex gap-2">
                            <Button onClick={() => router.push("/auth/signin")}>Switch account</Button>
                            <Button variant="ghost" onClick={goToHome}>Go home</Button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
