import MainLayout from "@/components/layouts/main-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { tab: string | undefined };
}) {
  const activeTab = searchParams.tab;
  const title = activeTab === 'profile' ? 'Settings' : 'Dashboard';

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'profile' 
                ? 'Manage your account settings and preferences' 
                : 'Welcome back! Here\'s what\'s happening with your listings.'
              }
            </p>
          </div>
        </div>
        
        <div className="space-y-8">
          {activeTab === 'profile' ? (
            <>
              <DashboardClient activeTab={activeTab} />
              <DashboardStats />
            </>
          ) : (
            <>
              <DashboardStats />
              <DashboardClient activeTab={activeTab} />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
