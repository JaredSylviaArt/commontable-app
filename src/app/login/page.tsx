import AuthLayout from "@/components/layouts/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            description="Enter your credentials to access your account."
        >
            <LoginForm />
        </AuthLayout>
    );
}
