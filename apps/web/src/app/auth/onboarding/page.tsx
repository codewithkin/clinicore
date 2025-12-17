"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Upload, ArrowLeft, Camera } from "lucide-react";
import { uploadLogo } from "@/lib/s3Client";
import plans, { type PlanId } from "@/data/plans";

/* ---------------------------------------------
   Component
---------------------------------------------- */

export default function Onboarding() {
    const { data: session } = authClient.useSession();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const s = searchParams.get("step");
        if (s) {
            const n = parseInt(s, 10);
            if (n >= 1 && n <= 3) setStep(n as 1 | 2 | 3);
        }
    }, [searchParams]);

    const progressValue = Math.round((step / 3) * 100);

    // Org state
    const [orgName, setOrgName] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [creatingOrg, setCreatingOrg] = useState(false);

    // Plan state
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

    // Invite state (step 3)
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"doctor" | "receptionist">("doctor");
    const [invites, setInvites] = useState<Array<{ email: string; role: string }>>([]);
    const [sendingInvites, setSendingInvites] = useState(false);

    /* ---------------------------------------------
       Logo upload (S3)
    ---------------------------------------------- */

    async function handleLogoUpload(file: File) {
        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error("Logo must be smaller than 2MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        setUploadingLogo(true);

        try {
            const { url } = await uploadLogo(file, session?.user?.id);
            setLogoUrl(url);
            toast.success("Logo uploaded successfully!");
        } catch (error) {
            console.error('Logo upload error:', error);
            toast.error("Failed to upload logo. Please try again.");
        } finally {
            setUploadingLogo(false);
        }
    }

    /* ---------------------------------------------
       Step 1: Create Organization
    ---------------------------------------------- */

    async function createOrganization() {
        if (!session?.user) return;

        setCreatingOrg(true);

        const slug = orgName.split(" ").join("-").toLowerCase();

        const { error } = await authClient.organization.create({
            name: orgName,
            slug,
            logo: logoUrl ?? undefined,
            userId: session.user.id,
            keepCurrentActiveOrganization: false,
        });

        setCreatingOrg(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        setStep(2);
    }

    /* ---------------------------------------------
       Step 2: Select Plan (proceed to step 3)
    ---------------------------------------------- */

    function proceedToInvites() {
        if (!selectedPlan) return;
        setStep(3);
    }

    /* ---------------------------------------------
       Step 3: Complete Setup and Checkout
    ---------------------------------------------- */

    async function finishSetup() {
        if (!selectedPlan) return;

        const productMap: Record<PlanId, string> = {
            starter: process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID!,
            small_clinic: process.env.NEXT_PUBLIC_POLAR_SMALL_CLINIC_PRODUCT_ID!,
            growing_clinic: process.env.NEXT_PUBLIC_POLAR_GROWING_CLINIC_PRODUCT_ID!,
        };

        // Send invites if any
        if (invites.length > 0) {
            await sendInvites();
        }

        // Proceed to checkout
        const { data, error } = await authClient.checkout({
            products: [productMap[selectedPlan]],
        });

        if (error || !data?.url) {
            toast.error("Failed to start checkout");
            return;
        }

        window.location.href = data.url;
    }

    async function skipInvites() {
        await finishSetup();
    }

    /* ---------------------------------------------
       Invite helpers (Step 3)
    ---------------------------------------------- */

    async function addInvite() {
        if (!inviteEmail || !inviteEmail.includes("@")) {
            toast.error("Enter a valid email");
            return;
        }

        setInvites((s) => [...s, { email: inviteEmail.trim(), role: inviteRole }]);
        setInviteEmail("");
    }

    function removeInvite(index: number) {
        setInvites((s) => s.filter((_, i) => i !== index));
    }

    async function sendInvites() {
        if (invites.length === 0) {
            toast.error("No invites to send");
            return;
        }

        setSendingInvites(true);
        try {
            for (const inv of invites) {
                try {
                    // prefer inviteMember if available
                    // @ts-ignore
                    if (authClient.organization.inviteMember) {
                        // @ts-ignore
                        await authClient.organization.inviteMember({ email: inv.email, role: inv.role });
                        toast.success(`Invited ${inv.email}`);
                        continue;
                    }

                    // @ts-ignore
                    if (authClient.organization.createTeamInvitation) {
                        // @ts-ignore
                        await authClient.organization.createTeamInvitation({ email: inv.email, role: inv.role });
                        toast.success(`Invited ${inv.email}`);
                        continue;
                    }

                    // @ts-ignore
                    if (authClient.organization.invite) {
                        // @ts-ignore
                        await authClient.organization.invite({ email: inv.email, role: inv.role });
                        toast.success(`Invited ${inv.email}`);
                        continue;
                    }

                    toast.error(`No invite API available for ${inv.email}`);
                } catch (e: any) {
                    console.error('Invite error', e);
                    toast.error(`Failed to invite ${inv.email}`);
                }
            }
            setInvites([]);
        } finally {
            setSendingInvites(false);
        }
    }

    /* ---------------------------------------------
       Render
    ---------------------------------------------- */

    return (
        <section className="min-h-screen flex items-center justify-center px-4">
            <article className="w-full max-w-xl flex flex-col gap-10">
                {/* Progress Indicator */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    {/* Step indicators */}
                    <div className="flex items-center justify-between mb-3">
                        <motion.div
                            className="flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                        >
                            <motion.div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                animate={{ scale: step === 1 ? [1, 1.08, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {step > 1 ? '✓' : '1'}
                            </motion.div>
                            <span className={`text-xs font-medium ${step === 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                                Create hospital
                            </span>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <motion.div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                animate={{ scale: step === 2 ? [1, 1.08, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {step > 2 ? '✓' : '2'}
                            </motion.div>
                            <span className={`text-xs font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                                Choose plan
                            </span>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            <motion.div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                animate={{ scale: step === 3 ? [1, 1.08, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {step > 3 ? '✓' : '3'}
                            </motion.div>
                            <span className={`text-xs font-medium ${step === 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                                Invite team
                            </span>
                        </motion.div>
                    </div>

                    {/* Progress bar */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                        style={{ transformOrigin: "left" }}
                    >
                        <Progress value={progressValue} className="h-2" />
                    </motion.div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                        >
                            <h1 className="text-2xl font-medium mb-2">
                                Create your hospital
                            </h1>
                            <p className="text-sm text-gray-500 mb-6">
                                Set up your hospital to continue
                            </p>


                            <div className="flex flex-col items-center gap-4">
                                <Label className="self-start">Logo (optional)</Label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) =>
                                            e.target.files &&
                                            handleLogoUpload(e.target.files[0])
                                        }
                                        disabled={uploadingLogo}
                                    />
                                    <div className={`w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center transition-all hover:border-gray-400 hover:bg-gray-50 ${uploadingLogo ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                        {uploadingLogo ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                                        ) : logoUrl ? (
                                            <img
                                                src={logoUrl}
                                                alt="Logo"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <Camera className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mb-4">
                                    {logoUrl ? 'Click to change logo' : 'Click to upload logo'}
                                    <br />PNG, JPG up to 2MB
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label>Hospital name</Label>
                                    <Input
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                    />
                                </div>

                                <Button
                                    disabled={!orgName || creatingOrg}
                                    onClick={createOrganization}
                                >
                                    {creatingOrg ? "Creating..." : "Next"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                        >
                            <h1 className="text-2xl font-medium mb-6">
                                Choose a plan
                            </h1>

                            <div className="grid gap-4">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`border rounded-xl p-5 text-left transition-all ${selectedPlan === plan.id
                                            ? "border-green-500 bg-green-50/50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-lg">
                                                        {plan.name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {plan.description}
                                                </p>
                                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                    <span>{plan.limits.doctors} {plan.limits.doctors === 1 ? 'doctor' : 'doctors'}</span>
                                                    <span>•</span>
                                                    <span>{plan.limits.patients} patients</span>
                                                    <span>•</span>
                                                    <span>{plan.limits.storageGB}GB storage</span>
                                                </div>
                                            </div>
                                            {selectedPlan === plan.id && (
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <Button
                                className="mt-6"
                                disabled={!selectedPlan}
                                onClick={proceedToInvites}
                            >
                                Next
                            </Button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step-3"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                        >
                            <h1 className="text-2xl font-medium mb-2">
                                Invite your team
                            </h1>
                            <p className="text-sm text-gray-500 mb-6">
                                Add team members to collaborate (optional)
                            </p>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="email"
                                                placeholder="colleague@example.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && addInvite()}
                                            />
                                        </div>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as "doctor" | "receptionist")}
                                            className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                                        >
                                            <option value="doctor">Doctor</option>
                                            <option value="receptionist">Receptionist</option>
                                        </select>
                                        <Button onClick={addInvite} variant="outline">
                                            Add
                                        </Button>
                                    </div>

                                    {invites.length > 0 && (
                                        <div className="border rounded-lg divide-y">
                                            {invites.map((inv, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3">
                                                    <div>
                                                        <p className="text-sm font-medium">{inv.email}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{inv.role}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeInvite(idx)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        disabled={sendingInvites}
                                        onClick={finishSetup}
                                    >
                                        {sendingInvites ? "Sending invites..." : "Finish setup"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={skipInvites}
                                        disabled={sendingInvites}
                                    >
                                        Skip
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </article>
        </section>
    );
}