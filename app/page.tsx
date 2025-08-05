
import MainLayout from '@/components/layouts/main-layout';
import ListingGrid from '@/components/listings/listing-grid';
import { mockListings } from '@/lib/mock-data';

export default function HomePage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Browse Resources
          </h1>
        </div>
        <ListingGrid listings={mockListings} />
      </div>
    </MainLayout>
  );
}
