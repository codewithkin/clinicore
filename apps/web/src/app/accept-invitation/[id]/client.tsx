"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";

type Props = {
    invitationId: string;
};

export default function AcceptInvitationClient({ invitationId }: Props) {
    const router = useRouter();
    const sessionQuery = authClient.useSession();
    const session = sessionQuery?.data;
    const sessionPending = sessionQuery?.isPending ?? false;

    const [status, setStatus] = useState<"pending" | "success" | "error" | "auth">("pending");
    const [message, setMessage] = useState<string>("Checking your session...");

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
        if (sessionPending) return;
        void accept();
    }, [invitationId, sessionPending, session?.user]);

    const goToSignIn = () => {
        const redirect = `/accept-invitation/${invitationId ?? ""}`;
        router.push(`/auth/signin?redirect=${encodeURIComponent(redirect)}`);
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 p-8 shadow-sm bg-white">
                <div className="flex flex-col items-center text-center gap-4">
                    {status === "pending" && <Loader2 className="h-10 w-10 text-green-500 animate-spin" />}
                    {status === "success" && <CheckCircle className="h-10 w-10 text-green-500" />}
                    {status === "error" && <XCircle className="h-10 w-10 text-red-500" />}
                    {status === "auth" && <LogIn className="h-10 w-10 text-gray-700" />}

                    <h1 className="text-xl font-semibold">Accept invitation</h1>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>

                    {status === "error" && (
                        <div className="flex gap-2">
                            <Button onClick={accept}>Retry</Button>
                            <Button variant="ghost" onClick={() => router.push("/")}>Go home</Button>
                        </div>
                    )}

                    {status === "auth" && (
                        <div className="flex gap-2">
                            <Button onClick={goToSignIn}>Sign in</Button>
                            <Button variant="ghost" onClick={() => router.push("/")}>Go home</Button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
