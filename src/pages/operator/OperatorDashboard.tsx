import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchKPIData } from "@/store/slices/dashboardSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { operatorNavItems } from "@/config/navigation";
import { DoorOpen, Container, Truck, Loader2 } from "lucide-react";

export default function OperatorDashboard() {
  const dispatch = useAppDispatch();
  const { kpiData, isLoading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchKPIData());
  }, [dispatch]);

  if (isLoading || !kpiData) {
    return (
      <DashboardLayout navItems={operatorNavItems} pageTitle="Operator Dashboard">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-warning" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Operator Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard
          title="Yard Occupancy"
          value={`${kpiData.yardUtilization}%`}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title="Gate Movements"
          value={(kpiData.gateInToday || 0) + (kpiData.gateOutToday || 0)}
          icon={DoorOpen}
          variant="success"
        />
        <KPICard
          title="Pending Approvals"
          value={kpiData.pendingApprovals || 0}
          icon={Truck}
          variant="warning"
        />
        <KPICard
          title="Tasks Today"
          value={kpiData.tasksToday || 0}
          icon={Loader2}
          variant="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Welcome to Operator Dashboard</h3>
          <p className="text-muted-foreground">New operational features are coming soon. Stay tuned!</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
