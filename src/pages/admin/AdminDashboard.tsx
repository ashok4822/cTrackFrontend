import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchKPIData,
  updateKPIOptimistically,
} from "@/store/slices/dashboardSlice";
import { fetchBlocks } from "@/store/slices/yardSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { adminNavItems } from "@/config/navigation";
import { Container, Truck, DoorOpen, BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsPanel } from "@/components/common/AlertsPanel";
import { ActivityFeed } from "@/components/common/ActivityFeed";
import { useSocket } from "@/hooks/useSocket";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(217, 91%, 35%)",
  "hsl(199, 89%, 48%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 68%, 60%)",
];

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { kpiData, isLoading: kpiLoading } = useAppSelector(
    (state) => state.dashboard,
  );
  const { blocks, isLoading: blocksLoading } = useAppSelector(
    (state) => state.yard,
  );

  const handleSocketEvent = useCallback(
    (event: string, data: any) => {
      console.log(`[Socket] Event Received in Dashboard: ${event}`, data);

      switch (event) {
        case "kpi_update":
          console.log("[Socket] Processing kpi_update", data.type);
          // Apply optimistic update for immediate feedback
          if (data.type === "GATE_OPERATION") {
            console.log("[Socket] Triggering optimistic update for GATE_OPERATION");
            dispatch(
              updateKPIOptimistically({
                eventType: "GATE_OPERATION",
                data: data.data,
              }),
            );
          } else if (data.type === "YARD_UPDATE") {
            // Handle yard changes optimistically if data available
            if (data.action === "UPDATE" && data.data.name) {
              // Potentially refresh blocks or update state
            }
          }

          // Trigger full refresh after a small delay to ensure backend consistency
          console.log("[Socket] Scheduling full data refresh in 1s");
          setTimeout(() => {
            dispatch(fetchKPIData());
            dispatch(fetchBlocks());
          }, 1000);
          break;

        case "new_activity":
          console.log("[Socket] Processing new_activity");
          dispatch(fetchKPIData());
          break;
          
        case "new_alert":
          console.log("[Socket] Processing new_alert");
          dispatch(fetchKPIData());
          break;

        default:
          break;
      }
    },
    [dispatch],
  );

  useSocket(handleSocketEvent);

  useEffect(() => {
    dispatch(fetchKPIData());
    dispatch(fetchBlocks());
  }, [dispatch]);

  const isLoading = kpiLoading || blocksLoading;

  // Only show full-page loader on initial load (when kpiData is missing)
  if (!kpiData) {
    return (
      <DashboardLayout navItems={adminNavItems} pageTitle="Admin Dashboard">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle={
        <div className="flex items-center gap-2">
          Admin Dashboard
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      }
    >
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

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Gate Movements Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Daily Gate Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiData.gateMovements}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="gateIn"
                    name="Gate In"
                    fill="hsl(142, 76%, 36%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="gateOut"
                    name="Gate Out"
                    fill="hsl(217, 91%, 35%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dwell Time Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Container Dwell Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiData.dwellTimeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {kpiData.dwellTimeDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yard Capacity */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Yard Capacity by Block
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {blocks.map((block) => {
              const percentage = Math.round(
                (block.occupied / block.capacity) * 100,
              );
              return (
                <div key={block.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      {block.name}
                    </span>
                    <span
                      className={`text-sm font-medium ${percentage > 80 ? "text-destructive" : percentage > 60 ? "text-warning" : "text-success"}`}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${percentage > 80 ? "bg-destructive" : percentage > 60 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{block.occupied} occupied</span>
                    <span>{block.capacity} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel
          alerts={kpiData?.recentAlerts || []}
          onAlertClick={(alert) =>
            alert.link && (window.location.href = alert.link)
          }
        />
        <ActivityFeed
          activities={(kpiData?.recentActivities || []).map((a) => ({
            ...a,
            time: formatTimeAgo(a.time),
          }))}
        />
      </div>
    </DashboardLayout>
  );
}
