import SignInForm from "@/components/sign-in-form";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <SignInForm onSwitchToSignUp={() => window.location.href = "/auth/signup"} />
        </div>
    );
}
