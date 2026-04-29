import { useEffect, useCallback } from "react";
import { UI_MESSAGES } from "@/constants/messages";
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
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return UI_MESSAGES.TABLE.JUST_NOW;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

interface SocketEventPayload {
  type?: string;
  action?: string;
  data?: {
    type?: string;
    name?: string;
    [key: string]: unknown;
  };
}

const isSocketEventPayload = (d: unknown): d is SocketEventPayload =>
  typeof d === "object" && d !== null;

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { kpiData, isLoading: kpiLoading } = useAppSelector(
    (state) => state.dashboard,
  );
  const { blocks, isLoading: blocksLoading } = useAppSelector(
    (state) => state.yard,
  );

  const handleSocketEvent = useCallback(
    (event: string, data: unknown) => {
      const payload = isSocketEventPayload(data) ? data : {};

      switch (event) {
        case "kpi_update":
          // Apply optimistic update for immediate feedback
          if (payload.type === "GATE_OPERATION" && payload.data) {
            dispatch(
              updateKPIOptimistically({
                eventType: "GATE_OPERATION",
                data: payload.data,
              }),
            );
          } else if (payload.type === "YARD_UPDATE") {
            // Handle yard changes optimistically if data available
            if (payload.action === "UPDATE" && payload.data?.name) {
              // Potentially refresh blocks or update state
            }
          }

          // Trigger full refresh after a small delay to ensure backend consistency
          setTimeout(() => {
            dispatch(fetchKPIData());
            dispatch(fetchBlocks());
          }, 1000);
          break;

        case "new_activity":
          dispatch(fetchKPIData());
          break;

        case "new_alert":
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
      <DashboardLayout navItems={adminNavItems} pageTitle={UI_MESSAGES.TITLES.HOME_PAGE}>
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
          {UI_MESSAGES.TITLES.HOME_PAGE}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.CONTAINERS_IN_YARD}
          value={kpiData.totalContainersInYard}
          icon={Container}
          variant="primary"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.IN_TRANSIT}
          value={kpiData.containersInTransit}
          icon={Truck}
          variant="default"
        />
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.GATE_IN_TODAY}
          value={kpiData.gateInToday}
          icon={DoorOpen}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.GATE_OUT_TODAY}
          value={kpiData.gateOutToday}
          icon={DoorOpen}
          variant="default"
        />
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.YARD_UTILIZATION}
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
              {UI_MESSAGES.DASHBOARD.CHARTS.DAILY_GATE_MOVEMENTS}
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
                    name={UI_MESSAGES.DASHBOARD.CHARTS.GATE_IN}
                    fill="hsl(var(--success))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="gateOut"
                    name={UI_MESSAGES.DASHBOARD.CHARTS.GATE_OUT}
                    fill="hsl(var(--primary))"
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
              {UI_MESSAGES.DASHBOARD.CHARTS.DWELL_TIME}
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
            {UI_MESSAGES.DASHBOARD.CHARTS.YARD_CAPACITY_BLOCK}
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
                    <span>{block.occupied} {UI_MESSAGES.YARD.OCCUPIED}</span>
                    <span>{block.capacity} {UI_MESSAGES.YARD.TOTAL_CAPACITY}</span>
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
