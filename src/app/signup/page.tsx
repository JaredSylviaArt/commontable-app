import AuthLayout from "@/components/layouts/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
    return (
        <AuthLayout
            title="Create an account"
            description="Join the CommonTable community to share and find resources."
        >
            <SignupForm />
        </AuthLayout>
    );
}
