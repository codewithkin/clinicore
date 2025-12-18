"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Upload, ArrowLeft, Camera, Check, Stethoscope, Users, Database, Mail, X, Info, Trash } from "lucide-react";
import { uploadLogo } from "@/lib/s3Client";
import plans, { type PlanId, type Plan } from "@/data/plans";
import { Badge } from "@/components/ui/badge";

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
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>("starter");
    const [modalPlan, setModalPlan] = useState<Plan | null>(null);
    const [isYearly, setIsYearly] = useState(false);
    const [startingCheckout, setStartingCheckout] = useState(false);
    const [planLimits, setPlanLimits] = useState<Plan | null>(null);
    const [orgCounts, setOrgCounts] = useState<{ doctors: number; receptionists: number }>({ doctors: 0, receptionists: 0 });
    const [loadingStep3, setLoadingStep3] = useState(false);
    const [step3Error, setStep3Error] = useState<string | null>(null);

    const toggleYearly = () => {
        setIsYearly(!isYearly);
    };

    // Load current plan + org info when entering step 3
    useEffect(() => {
        if (step !== 3) return;

        let cancelled = false;
        const loadStep3Data = async () => {
            setLoadingStep3(true);
            setStep3Error(null);

            try {
                const planRes = await fetch("/api/user/current-plan");
                if (!planRes.ok) {
                    throw new Error("Unable to fetch current plan");
                }
                const planJson = await planRes.json();
                const currentPlan = plans.find((p) => p.id === planJson.plan) || null;
                if (!currentPlan) {
                    throw new Error("Unknown plan");
                }
                if (!cancelled) setPlanLimits(currentPlan);

                // get organization info (active org by default)
                const orgResult = await authClient.organization.getFullOrganization?.({});
                // some SDKs return { data, error }, others return directly; normalize
                const orgData: any = (orgResult as any)?.data ?? orgResult;
                const orgError: any = (orgResult as any)?.error;
                if (orgError) {
                    throw new Error(orgError.message || "Failed to load organization");
                }

                const members: Array<{ role?: string }> =
                    orgData?.organization?.members ?? orgData?.members ?? [];

                const doctors = members.filter((m) => m.role === "doctor").length;
                const receptionists = members.filter((m) => m.role === "receptionist").length;

                if (!cancelled) setOrgCounts({ doctors, receptionists });
            } catch (err: any) {
                if (!cancelled) setStep3Error(err?.message || "Failed to load step data");
            } finally {
                if (!cancelled) setLoadingStep3(false);
            }
        };

        loadStep3Data();
        return () => {
            cancelled = true;
        };
    }, [step]);

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

    async function proceedToInvites() {
        if (!selectedPlan) return;

        setStartingCheckout(true);

        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) {
            toast.error("Invalid plan selected");
            setStartingCheckout(false);
            return;
        }

        // determine product id for checkout depending on monthly/yearly selection
        let productId = "";
        if (isYearly) {
            if (plan.id === "starter") productId = process.env.NEXT_PUBLIC_POLAR_YEARLY_STARTER_PRODUCT_ID ?? "";
            if (plan.id === "small_clinic") productId = process.env.NEXT_PUBLIC_POLAR_YEARLY_SMALL_CLINIC_PRODUCT_ID ?? "";
            if (plan.id === "growing_clinic") productId = process.env.NEXT_PUBLIC_POLAR_YEARLY_GROWING_CLINIC_PRODUCT_ID ?? "";
        } else {
            if (plan.id === "starter") productId = process.env.NEXT_PUBLIC_POLAR_MONTHLY_STARTER_PRODUCT_ID ?? "";
            if (plan.id === "small_clinic") productId = process.env.NEXT_PUBLIC_POLAR_MONTHLY_SMALL_CLINIC_PRODUCT_ID ?? "";
            if (plan.id === "growing_clinic") productId = process.env.NEXT_PUBLIC_POLAR_MONTHLY_GROWING_CLINIC_PRODUCT_ID ?? "";
        }

        if (!productId) {
            toast.error("Invalid plan selected");
            setStartingCheckout(false);
            return;
        }

        try {
            // Update user's plan in database before checkout
            const response = await fetch('/api/user/update-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    planName: plan.name
                }),
            });

            if (!response.ok) {
                toast.error("Failed to update plan");
                setStartingCheckout(false);
                return;
            }
        } catch (err) {
            console.error('Plan update error:', err);
            toast.error("Failed to update plan");
            setStartingCheckout(false);
            return;
        }

        // Construct success URL with plan parameter as backup
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const successUrl = `${baseUrl}/payments?plan=${encodeURIComponent(plan.name)}`;

        // Initiate checkout
        try {
            const { data, error } = await authClient.checkout({
                products: [productId],
                successUrl: successUrl,
            });

            if (error || !data?.url) {
                toast.error("Failed to start checkout");
                setStartingCheckout(false);
                return;
            }

            // use Next.js router for redirect
            router.push(data.url);
        } catch (e) {
            console.error('Checkout error', e);
            toast.error('Failed to start checkout');
            setStartingCheckout(false);
        }
    }

    /* ---------------------------------------------
       Step 3: Complete Setup and Checkout
    ---------------------------------------------- */

    async function finishSetup() {
        // Send invites if any
        if (invites.length > 0) {
            await sendInvites();
        }

        // Redirect to dashboard
        router.push("/dashboard");
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

        // Enforce plan limits for doctors/receptionists using current org counts
        if (planLimits) {
            const pendingDoctors = invites.filter((i) => i.role === "doctor").length;
            const pendingReceptionists = invites.filter((i) => i.role === "receptionist").length;

            const maxDoctors = Math.max(0, planLimits.limits.doctors - orgCounts.doctors);
            const maxReceptionists = Math.max(0, planLimits.limits.receptionists - orgCounts.receptionists);

            if (inviteRole === "doctor" && pendingDoctors >= maxDoctors) {
                toast.error("Doctor limit reached for your plan");
                return;
            }

            if (inviteRole === "receptionist" && pendingReceptionists >= maxReceptionists) {
                toast.error("Receptionist limit reached for your plan");
                return;
            }
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
                                    className="w-full"
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

                            <div className="flex items-center space-x-2 mb-4">
                                <Switch
                                    id="yearly-pricing-toggle"
                                    checked={isYearly}
                                    onCheckedChange={setIsYearly}
                                />
                                <Label htmlFor="yearly-pricing-toggle">
                                    Yearly Pricing
                                </Label>
                            </div>

                            <div className="grid gap-4">
                                {plans.map((plan) => {
                                    const monthlyTotal = plan.price * 12;
                                    const savings = Math.max(0, monthlyTotal - plan.yearlyPrice);
                                    const percentOff = monthlyTotal > 0 ? Math.round((savings / monthlyTotal) * 100) : 0;

                                    return (
                                        <div
                                            key={plan.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            onDoubleClick={() => setModalPlan(plan)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    setSelectedPlan(plan.id);
                                                }
                                            }}
                                            className={`border rounded-xl p-5 text-left transition-all ${selectedPlan === plan.id
                                                ? "border-teal-500 bg-teal-50/50"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-lg">
                                                            {plan.name}
                                                        </span>
                                                        {isYearly && percentOff > 0 && (
                                                            <Badge className="ml-2">Save {percentOff}%</Badge>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setModalPlan(plan);
                                                            }}
                                                            className="text-gray-500 hover:text-gray-700 transition-colors ml-2"
                                                            aria-label={`More info about ${plan.name}`}
                                                        >
                                                            <Info className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="text-2xl font-bold text-green-400 mb-2">
                                                        ${isYearly ? plan.yearlyPrice.toFixed(2) : plan.price.toFixed(2)}<span className="text-sm font-normal text-gray-500">{isYearly ? '/year' : '/month'}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {plan.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <Stethoscope className="w-3.5 h-3.5" />
                                                            {plan.limits.doctors} {plan.limits.doctors === 1 ? 'doctor' : 'doctors'}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5" />
                                                            {plan.limits.patients} patients
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Database className="w-3.5 h-3.5" />
                                                            {plan.limits.storageGB}GB storage
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedPlan === plan.id && (
                                                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                                                        <Check className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Button
                                className="w-full mt-6"
                                disabled={!selectedPlan || startingCheckout}
                                onClick={proceedToInvites}
                            >
                                {startingCheckout ? 'Starting checkout...' : 'Start 3 day trial'}
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
                            {step3Error ? (
                                <div className="space-y-4">
                                    <h1 className="text-2xl font-medium">Setup issue</h1>
                                    <p className="text-sm text-red-600">{step3Error}</p>
                                    <Button onClick={() => window.location.reload()}>Retry</Button>
                                </div>
                            ) : (
                                <>
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
                                                        placeholder="kin@clinicore.space"
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && addInvite()}
                                                        disabled={loadingStep3}
                                                    />
                                                </div>
                                                <select
                                                    value={inviteRole}
                                                    onChange={(e) => setInviteRole(e.target.value as "doctor" | "receptionist")}
                                                    className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                                                    disabled={loadingStep3}
                                                >
                                                    <option value="doctor">Doctor</option>
                                                    <option value="receptionist">Receptionist</option>
                                                </select>
                                                <Button className="text-white" onClick={addInvite} variant="secondary" disabled={loadingStep3}>
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
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeInvite(idx)}
                                                            >
                                                                <Trash className="w-4 h-4 mr-1" />
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Button
                                                className="w-full"
                                                disabled={sendingInvites || loadingStep3}
                                                onClick={finishSetup}
                                            >
                                                {sendingInvites ? "Sending invites..." : "Finish setup"}
                                            </Button>
                                            <Button
                                                className="w-full"
                                                variant="ghost"
                                                onClick={skipInvites}
                                                disabled={sendingInvites || loadingStep3}
                                            >
                                                Skip
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Plan Details Modal */}
                <AnimatePresence>
                    {modalPlan && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 z-50"
                                onClick={() => setModalPlan(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
                            >
                                <button
                                    onClick={() => setModalPlan(null)}
                                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold mb-2">{modalPlan.name}</h2>
                                    <div className="text-3xl font-bold text-teal-600 mb-3">
                                        ${modalPlan.price}<span className="text-lg font-normal text-gray-500">/month</span>
                                    </div>
                                    <p className="text-gray-600">{modalPlan.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900">What's included:</h3>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                                <Stethoscope className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{modalPlan.limits.doctors} {modalPlan.limits.doctors === 1 ? 'Doctor' : 'Doctors'}</p>
                                                <p className="text-xs text-gray-500">Medical professionals</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{modalPlan.limits.receptionists} {modalPlan.limits.receptionists === 1 ? 'Receptionist' : 'Receptionists'}</p>
                                                <p className="text-xs text-gray-500">Front desk staff</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                                <Users className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{modalPlan.limits.patients.toLocaleString()} Patients</p>
                                                <p className="text-xs text-gray-500">Active patient records</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                                <Mail className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{modalPlan.limits.emailsPerMonth.toLocaleString()} Emails/month</p>
                                                <p className="text-xs text-gray-500">Automated notifications</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                                                <Database className="w-4 h-4 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{modalPlan.limits.storageGB}GB Storage</p>
                                                <p className="text-xs text-gray-500">Secure cloud storage</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-6"
                                    onClick={() => {
                                        setSelectedPlan(modalPlan.id);
                                        setModalPlan(null);
                                    }}
                                >
                                    Select and start free trial
                                </Button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </article>
        </section>
    );
}