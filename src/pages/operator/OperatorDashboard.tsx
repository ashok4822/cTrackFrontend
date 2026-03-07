import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchKPIData } from "@/store/slices/dashboardSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { operatorNavItems } from "@/config/navigation";
import { DoorOpen, Container, Truck, Loader2, BarChart3, Plus, Search, AlertCircle, ListChecks } from "lucide-react";
import { ActiveOperationsTable } from "@/components/operator/ActiveOperationsTable";
import { JobQueueBoard } from "@/components/operator/JobQueueBoard";
import { EquipmentStatusGrid } from "@/components/operator/EquipmentStatusGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveOperationsTable operations={kpiData.liveQueue || []} />
          <EquipmentStatusGrid equipment={kpiData.equipmentStatusSummary || []} />

          {/* Active Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Operational Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(kpiData.recentAlerts || []).slice(0, 3).map((alert) => (
                  <div key={alert.id} className="text-xs p-3 rounded-lg border bg-muted/20">
                    <p className="font-bold mb-1">{alert.title}</p>
                    <p className="text-muted-foreground leading-tight">{alert.message}</p>
                  </div>
                ))}
                {(!kpiData.recentAlerts || kpiData.recentAlerts.length === 0) && (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    No active alerts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/operator/gate">
                  <Plus className="h-4 w-4" /> Start Gate-In
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/operator/gate">
                  <Plus className="h-4 w-4" /> Start Gate-Out
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/operator/lookup">
                  <Search className="h-4 w-4" /> Locate Container
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2" variant="outline">
                <Link to="/operator/cargo-requests">
                  <ListChecks className="h-4 w-4" /> Process Requests
                </Link>
              </Button>
            </CardContent>
          </Card>

          <JobQueueBoard tasks={kpiData.activeTasks || []} />

        </div>
      </div>
    </DashboardLayout>
  );
}
