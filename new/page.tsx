import MainLayout from "@/components/layouts/main-layout";
import { CreateListingForm } from "@/components/listings/create-listing-form";

export default function NewListingPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="space-y-2 px-4 md:px-0">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Create a New Listing
                    </h1>
                    <p className="text-muted-foreground">
                        Fill out the form below to share your resource with the community.
                    </p>
                </div>
                <CreateListingForm />
            </div>
        </MainLayout>
    );
}
