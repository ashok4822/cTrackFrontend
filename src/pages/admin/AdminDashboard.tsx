import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchKPIData } from "@/store/slices/dashboardSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { adminNavItems } from "@/config/navigation";
import { Container, Truck, DoorOpen, BarChart3, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { kpiData, isLoading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchKPIData());
  }, [dispatch]);

  if (isLoading || !kpiData) {
    return (
      <DashboardLayout navItems={adminNavItems} pageTitle="Admin Dashboard">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems} pageTitle="Admin Dashboard">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Containers in Yard"
          value={kpiData.totalContainersInYard}
          icon={Container}
          variant="primary"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="In Transit"
          value={kpiData.containersInTransit}
          icon={Truck}
          variant="default"
        />
        <KPICard
          title="Gate-In Today"
          value={kpiData.gateInToday}
          icon={DoorOpen}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Gate-Out Today"
          value={kpiData.gateOutToday}
          icon={DoorOpen}
          variant="default"
        />
        <KPICard
          title="Yard Utilization"
          value={`${kpiData.yardUtilization}%`}
          icon={BarChart3}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold mb-2">
            Welcome to Admin Dashboard
          </h3>
          <p className="text-muted-foreground">
            New operational features are coming soon. Stay tuned!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
