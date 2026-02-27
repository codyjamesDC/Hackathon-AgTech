import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricsRow } from "@/components/MetricsRow";
import { MasterSchedule } from "@/components/MasterSchedule";
import { SmsFeed } from "@/components/SmsFeed";

const Index = () => {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div>
            <h1 className="text-2xl font-bold">Command Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time cooperative equipment management
            </p>
          </div>
          <MetricsRow />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <MasterSchedule />
            </div>
            <div className="lg:col-span-1">
              <SmsFeed />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
