import Link from "next/link";
import { Logo } from "@/components/icons";

interface AuthLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function AuthLayout({ title, description, children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center text-center mb-8">
                    <Link href="/" className="mb-4">
                        <Logo className="w-10 h-10 text-primary" />
                    </Link>
                    <h1 className="text-3xl font-headline font-bold">{title}</h1>
                    <p className="text-muted-foreground mt-2">{description}</p>
                </div>
                {children}
            </div>
        </div>
    );
}
