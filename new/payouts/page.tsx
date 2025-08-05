
import MainLayout from "@/components/layouts/main-layout";
import { PayoutForm } from "@/components/listings/payout-form";

export default function PayoutsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="space-y-2 px-4 md:px-0 max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Connect to Stripe
                    </h1>
                    <p className="text-muted-foreground">
                        We use Stripe to make sure you get paid securely and quickly.
                    </p>
                </div>
                <PayoutForm />
            </div>
        </MainLayout>
    );
}
