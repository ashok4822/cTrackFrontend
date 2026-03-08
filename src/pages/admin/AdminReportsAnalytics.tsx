import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavItems } from "@/config/navigation";
import { KPICard } from "@/components/common/KPICard";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  BarChart3,
  AlertCircle,
  Clock,
  TrendingUp,
  DoorOpen,
  Container,
  FileText,
  Loader2,
  Search,
  Download,
  FilterX,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { billingService, type BillRecord } from "@/services/billingService";
import { gateOperationService } from "@/services/gateOperationService";
import { containerRequestService } from "@/services/containerRequestService";
import { dashboardService } from "@/services/dashboardService";
import type { GateOperation, ContainerRequest, KPIData } from "@/types";

// ─── Colour Palette ───────────────────────────────────────────────────────────
const CHART_COLORS = {
  primary: "hsl(217, 91%, 45%)",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 55%)",
  purple: "hsl(280, 68%, 60%)",
  teal: "hsl(199, 89%, 48%)",
  slate: "hsl(220, 14%, 55%)",
};

const STATUS_COLORS: Record<string, string> = {
  paid: CHART_COLORS.success,
  pending: CHART_COLORS.warning,
  overdue: CHART_COLORS.danger,
  approved: CHART_COLORS.success,
  rejected: CHART_COLORS.danger,
  completed: CHART_COLORS.teal,
  "in-progress": CHART_COLORS.primary,
  cancelled: CHART_COLORS.slate,
  "ready-for-dispatch": CHART_COLORS.purple,
  "operation-completed": CHART_COLORS.success,
  "in-transit": CHART_COLORS.primary,
  "at-factory": CHART_COLORS.purple,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

const formatCurrencyForPDF = (val: number) =>
  `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val)}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-40 flex-col items-center justify-center text-center">
    <FilterX className="h-10 w-10 text-muted-foreground/30 mb-2" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

// ─── Date Range Filter ────────────────────────────────────────────────────────
type DateRange = "7d" | "30d" | "90d" | "all";

const dateRangeOptions: { label: string; value: DateRange }[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

function isWithinRange(dateStr: string, range: DateRange): boolean {
  if (range === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= cutoff;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminReportsAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [gateOps, setGateOps] = useState<GateOperation[]>([]);
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Table search & pagination states
  const [billSearch, setBillSearch] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("all");
  const [billPage, setBillPage] = useState(1);
  const [gateSearch, setGateSearch] = useState("");
  const [gateTypeFilter, setGateTypeFilter] = useState("all");
  const [gatePage, setGatePage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setBillPage(1);
    setGatePage(1);
  }, [dateRange, billSearch, billStatusFilter, gateSearch, gateTypeFilter]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [billData, gateData, requestData, kpi] = await Promise.all([
          billingService.fetchBills(),
          gateOperationService.getGateOperations(),
          containerRequestService.getAllRequests(),
          dashboardService.getKPIData(),
        ]);
        setBills(billData);
        setGateOps(gateData);
        setRequests(requestData);
        setKpiData(kpi);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Filtered data by date range ───────────────────────────────────────────
  const filteredBills = useMemo(
    () => bills.filter((b) => isWithinRange(b.createdAt, dateRange)),
    [bills, dateRange],
  );
  const filteredGateOps = useMemo(
    () => gateOps.filter((g) => isWithinRange(g.timestamp, dateRange)),
    [gateOps, dateRange],
  );
  const filteredRequests = useMemo(
    () => requests.filter((r) => isWithinRange(r.createdAt, dateRange)),
    [requests, dateRange],
  );

  // ─── Revenue Metrics ───────────────────────────────────────────────────────
  const revMetrics = useMemo(() => {
    const paid = filteredBills.filter((b) => b.status === "paid");
    const pending = filteredBills.filter((b) => b.status === "pending");
    const overdue = filteredBills.filter((b) => b.status === "overdue");
    const totalRevenue = paid.reduce((s, b) => s + b.totalAmount, 0);
    const outstanding = [...pending, ...overdue].reduce(
      (s, b) => s + b.totalAmount,
      0,
    );
    const avgBill = filteredBills.length
      ? filteredBills.reduce((s, b) => s + b.totalAmount, 0) /
        filteredBills.length
      : 0;
    return {
      totalRevenue,
      outstanding,
      overdueCount: overdue.length,
      avgBill,
      paid,
      pending,
      overdue,
    };
  }, [filteredBills]);

  // Revenue trend by month
  const revenueTrend = useMemo(() => {
    const monthly: Record<string, { billed: number; collected: number }> = {};
    filteredBills.forEach((b) => {
      const key = new Date(b.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      if (!monthly[key]) monthly[key] = { billed: 0, collected: 0 };
      monthly[key].billed += b.totalAmount;
      if (b.status === "paid") monthly[key].collected += b.totalAmount;
    });
    return Object.entries(monthly)
      .map(([name, v]) => ({ name, ...v }))
      .slice(-8);
  }, [filteredBills]);

  // Bill status pie
  const billStatusData = useMemo(
    () =>
      [
        {
          name: "Paid",
          value: revMetrics.paid.length,
          color: STATUS_COLORS.paid,
        },
        {
          name: "Pending",
          value: revMetrics.pending.length,
          color: STATUS_COLORS.pending,
        },
        {
          name: "Overdue",
          value: revMetrics.overdue.length,
          color: STATUS_COLORS.overdue,
        },
      ].filter((d) => d.value > 0),
    [revMetrics],
  );

  // Top customers
  const topCustomers = useMemo(() => {
    const byCustomer: Record<string, number> = {};
    revMetrics.paid.forEach((b) => {
      const name = b.customerName || b.customer || "Unknown";
      byCustomer[name] = (byCustomer[name] || 0) + b.totalAmount;
    });
    return Object.entries(byCustomer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount }));
  }, [revMetrics.paid]);

  // ─── Operational Metrics ───────────────────────────────────────────────────
  const opMetrics = useMemo(() => {
    const gateIn = filteredGateOps.filter((g) => g.type === "gate-in").length;
    const gateOut = filteredGateOps.filter((g) => g.type === "gate-out").length;
    const pending = filteredRequests.filter(
      (r) => r.status === "pending",
    ).length;
    return { gateIn, gateOut, pending };
  }, [filteredGateOps, filteredRequests]);

  // Daily gate movements
  const dailyGateMovements = useMemo(() => {
    const byDay: Record<
      string,
      { name: string; gateIn: number; gateOut: number }
    > = {};
    filteredGateOps.forEach((g) => {
      const key = new Date(g.timestamp).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
      if (!byDay[key]) byDay[key] = { name: key, gateIn: 0, gateOut: 0 };
      if (g.type === "gate-in") byDay[key].gateIn++;
      else byDay[key].gateOut++;
    });
    return Object.values(byDay).slice(-14);
  }, [filteredGateOps]);

  // Request status breakdown
  const requestStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRequests.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      color: STATUS_COLORS[name] || CHART_COLORS.slate,
    }));
  }, [filteredRequests]);

  // Movement type breakdown
  const movementTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGateOps.forEach((g) => {
      // purpose: port | factory | transfer
      const label = g.purpose.charAt(0).toUpperCase() + g.purpose.slice(1);
      counts[label] = (counts[label] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      Port: CHART_COLORS.primary,
      Factory: CHART_COLORS.success,
      Transfer: CHART_COLORS.warning,
    };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || CHART_COLORS.slate,
    }));
  }, [filteredGateOps]);

  // Equipment status
  const equipmentData = useMemo(() => {
    if (!kpiData?.equipmentStatusSummary) return [];
    const counts: Record<string, number> = {};
    kpiData.equipmentStatusSummary.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    const colorMap: Record<string, string> = {
      operational: CHART_COLORS.success,
      maintenance: CHART_COLORS.warning,
      down: CHART_COLORS.danger,
      idle: CHART_COLORS.slate,
    };
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colorMap[name] || CHART_COLORS.slate,
    }));
  }, [kpiData]);

  // ─── Filtered Tables ───────────────────────────────────────────────────────
  const filteredBillsTable = useMemo(
    () =>
      filteredBills.filter((b) => {
        const matchSearch =
          billSearch === "" ||
          b.billNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
          b.containerNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
          (b.customerName || b.customer || "")
            .toLowerCase()
            .includes(billSearch.toLowerCase());
        const matchStatus =
          billStatusFilter === "all" || b.status === billStatusFilter;
        return matchSearch && matchStatus;
      }),
    [filteredBills, billSearch, billStatusFilter],
  );

  const paginatedBills = useMemo(() => {
    const start = (billPage - 1) * itemsPerPage;
    return filteredBillsTable.slice(start, start + itemsPerPage);
  }, [filteredBillsTable, billPage]);

  const billTotalPages = Math.ceil(filteredBillsTable.length / itemsPerPage);

  const filteredGateOpsTable = useMemo(
    () =>
      filteredGateOps.filter((g) => {
        const matchSearch =
          gateSearch === "" ||
          (g.containerNumber || "")
            .toLowerCase()
            .includes(gateSearch.toLowerCase()) ||
          g.vehicleNumber.toLowerCase().includes(gateSearch.toLowerCase()) ||
          g.driverName.toLowerCase().includes(gateSearch.toLowerCase());
        const matchType = gateTypeFilter === "all" || g.type === gateTypeFilter;
        return matchSearch && matchType;
      }),
    [filteredGateOps, gateSearch, gateTypeFilter],
  );

  const paginatedGateOps = useMemo(() => {
    const start = (gatePage - 1) * itemsPerPage;
    return filteredGateOpsTable.slice(start, start + itemsPerPage);
  }, [filteredGateOpsTable, gatePage]);

  const gateTotalPages = Math.ceil(filteredGateOpsTable.length / itemsPerPage);

  // ─── PDF Export Functions ──────────────────────────────────────────────────
  const handleExportRevenuePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Revenue Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Time Range: ${dateRangeOptions.find((o) => o.value === dateRange)?.label}`,
      14,
      30,
    );
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        [
          "Total Revenue Collected",
          formatCurrencyForPDF(revMetrics.totalRevenue),
        ],
        ["Outstanding Amount", formatCurrencyForPDF(revMetrics.outstanding)],
        ["Overdue Bills", revMetrics.overdueCount.toString()],
        ["Average Bill Value", formatCurrencyForPDF(revMetrics.avgBill)],
      ],
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Bills Detail", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [
        ["Bill #", "Container", "Customer", "Amount", "Status", "Due Date"],
      ],
      body: filteredBillsTable.map((b) => [
        b.billNumber,
        b.containerNumber,
        b.customerName || b.customer || "—",
        formatCurrencyForPDF(b.totalAmount),
        b.status.toUpperCase(),
        formatDate(b.dueDate),
      ]),
      theme: "grid",
      headStyles: { fillColor: [52, 73, 94] },
    });

    doc.save(
      `Revenue_Report_${dateRange}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const handleExportOperationalPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Operational Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Time Range: ${dateRangeOptions.find((o) => o.value === dateRange)?.label}`,
      14,
      30,
    );
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        ["Gate-In Movements", opMetrics.gateIn.toString()],
        ["Gate-Out Movements", opMetrics.gateOut.toString()],
        [
          "Containers in Yard",
          kpiData?.totalContainersInYard?.toString() || "0",
        ],
        ["Pending Requests", opMetrics.pending.toString()],
      ],
      theme: "striped",
      headStyles: { fillColor: [39, 174, 96] },
    });

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(
      "Gate Operations Detail",
      14,
      (doc as any).lastAutoTable.finalY + 15,
    );

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [
        ["Type", "Container #", "Vehicle #", "Driver", "Purpose", "Timestamp"],
      ],
      body: filteredGateOpsTable.map((g) => [
        g.type.toUpperCase(),
        g.containerNumber || "—",
        g.vehicleNumber,
        g.driverName,
        g.purpose.toUpperCase(),
        formatDate(g.timestamp),
      ]),
      theme: "grid",
      headStyles: { fillColor: [44, 62, 80] },
    });

    doc.save(
      `Operational_Report_${dateRange}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout navItems={adminNavItems} pageTitle="Reports & Analytics">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems} pageTitle="Reports & Analytics">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
            Time Range:
          </span>
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as DateRange)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="h-10">
          <TabsTrigger value="revenue" className="gap-2">
            <IndianRupee className="h-4 w-4" />
            Revenue Reports
          </TabsTrigger>
          <TabsTrigger value="operational" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Operational Reports
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════
            REVENUE REPORTS TAB
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="revenue" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Revenue Collected"
              value={formatCurrency(revMetrics.totalRevenue)}
              icon={IndianRupee}
              variant="success"
              subtitle={`${revMetrics.paid.length} paid bills`}
            />
            <KPICard
              title="Outstanding Amount"
              value={formatCurrency(revMetrics.outstanding)}
              icon={Clock}
              variant="warning"
              subtitle={`${revMetrics.pending.length + revMetrics.overdue.length} unpaid bills`}
            />
            <KPICard
              title="Overdue Bills"
              value={revMetrics.overdueCount}
              icon={AlertCircle}
              variant="danger"
              subtitle="Requires immediate attention"
            />
            <KPICard
              title="Average Bill Value"
              value={formatCurrency(revMetrics.avgBill)}
              icon={TrendingUp}
              variant="primary"
              subtitle={`${filteredBills.length} total bills`}
            />
          </div>

          {/* Revenue Trend + Bill Status */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly billed vs collected amounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueTrend.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrend}>
                        <defs>
                          <linearGradient
                            id="colorBilled"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.primary}
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.primary}
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorCollected"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.success}
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.success}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis
                          className="text-xs"
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: any) => [
                            formatCurrency(Number(v || 0)),
                            "",
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="billed"
                          name="Billed"
                          stroke={CHART_COLORS.primary}
                          fill="url(#colorBilled)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="collected"
                          name="Collected"
                          stroke={CHART_COLORS.success}
                          fill="url(#colorCollected)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No billing data for this period" />
                )}
              </CardContent>
            </Card>

            {/* Bill Status Donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Bill Status
                </CardTitle>
                <CardDescription>Breakdown by payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {billStatusData.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={billStatusData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {billStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={ChartTooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No bills in range" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Top Customers by Revenue
              </CardTitle>
              <CardDescription>Based on paid bills only</CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCustomers}
                      layout="vertical"
                      margin={{ left: 80 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        className="text-xs"
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        className="text-xs"
                        width={80}
                      />
                      <Tooltip
                        contentStyle={ChartTooltipStyle}
                        formatter={(v: any) => [
                          formatCurrency(Number(v || 0)),
                          "Revenue",
                        ]}
                      />
                      <Bar
                        dataKey="amount"
                        name="Revenue"
                        fill={CHART_COLORS.primary}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No paid bills to show customer revenue" />
              )}
            </CardContent>
          </Card>

          {/* Bills Detail Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Bills Detail
                    </CardTitle>
                    <CardDescription>
                      All bills in the selected time period
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto flex items-center gap-2"
                    onClick={handleExportRevenuePDF}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bills…"
                      value={billSearch}
                      onChange={(e) => setBillSearch(e.target.value)}
                      className="pl-8 w-48"
                    />
                  </div>
                  <Select
                    value={billStatusFilter}
                    onValueChange={setBillStatusFilter}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  {(billSearch || billStatusFilter !== "all") && (
                    <button
                      onClick={() => {
                        setBillSearch("");
                        setBillStatusFilter("all");
                      }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FilterX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Bill #
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Container
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Paid At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBills.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No bills match the current filters
                        </td>
                      </tr>
                    ) : (
                      paginatedBills.map((bill) => (
                        <tr
                          key={bill.id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium text-primary">
                            {bill.billNumber}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {bill.containerNumber}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {bill.customerName || bill.customer || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(bill.totalAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={bill.status} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(bill.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {bill.paidAt ? (
                              formatDate(bill.paidAt)
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {billTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {(billPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      billPage * itemsPerPage,
                      filteredBillsTable.length,
                    )}{" "}
                    of {filteredBillsTable.length} records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBillPage((p) => Math.max(1, p - 1))}
                      disabled={billPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: billTotalPages },
                        (_, i) => i + 1,
                      ).map((p) => (
                        <Button
                          key={p}
                          variant={billPage === p ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setBillPage(p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setBillPage((p) => Math.min(billTotalPages, p + 1))
                      }
                      disabled={billPage === billTotalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            OPERATIONAL REPORTS TAB
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="operational" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Gate-Ins"
              value={opMetrics.gateIn}
              icon={DoorOpen}
              variant="success"
              subtitle="Container arrivals"
            />
            <KPICard
              title="Total Gate-Outs"
              value={opMetrics.gateOut}
              icon={DoorOpen}
              variant="primary"
              subtitle="Container departures"
            />
            <KPICard
              title="Containers in Yard"
              value={kpiData?.totalContainersInYard ?? "—"}
              icon={Container}
              variant="default"
              subtitle={`${kpiData?.yardUtilization ?? 0}% yard utilization`}
            />
            <KPICard
              title="Pending Requests"
              value={opMetrics.pending}
              icon={FileText}
              variant="warning"
              subtitle="Awaiting approval"
            />
          </div>

          {/* Gate Movements + Dwell Time */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Gate Movements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Daily Gate Movements
                </CardTitle>
                <CardDescription>Gate-In vs Gate-Out per day</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyGateMovements.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyGateMovements}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip contentStyle={ChartTooltipStyle} />
                        <Legend />
                        <Bar
                          dataKey="gateIn"
                          name="Gate In"
                          fill={CHART_COLORS.success}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="gateOut"
                          name="Gate Out"
                          fill={CHART_COLORS.primary}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No gate operations in this period" />
                )}
              </CardContent>
            </Card>

            {/* Container Dwell Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Dwell Time Distribution
                </CardTitle>
                <CardDescription>
                  How long containers stay in the yard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {kpiData?.dwellTimeDistribution &&
                kpiData.dwellTimeDistribution.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpiData.dwellTimeDistribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" allowDecimals={false} />
                        <Tooltip contentStyle={ChartTooltipStyle} />
                        <Bar
                          dataKey="value"
                          name="Containers"
                          radius={[4, 4, 0, 0]}
                        >
                          {kpiData.dwellTimeDistribution.map((_, i) => (
                            <Cell
                              key={i}
                              fill={Object.values(CHART_COLORS)[i % 5]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No dwell time data available" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Request Status + Movement Type + Equipment */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Request Status Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Request Status
                </CardTitle>
                <CardDescription>
                  All container requests breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestStatusData.length > 0 ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={requestStatusData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {requestStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={ChartTooltipStyle} />
                        <Legend
                          iconSize={10}
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No requests for this period" />
                )}
              </CardContent>
            </Card>

            {/* Movement Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Gate Purpose
                </CardTitle>
                <CardDescription>
                  Port / Factory / Transfer split
                </CardDescription>
              </CardHeader>
              <CardContent>
                {movementTypeData.length > 0 ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={movementTypeData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {movementTypeData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={ChartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No gate operations in this period" />
                )}
              </CardContent>
            </Card>

            {/* Equipment Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Equipment Status
                </CardTitle>
                <CardDescription>
                  Current fleet status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {equipmentData.length > 0 ? (
                  <>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={equipmentData}
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {equipmentData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={ChartTooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 space-y-2">
                      {equipmentData.map((e) => (
                        <div
                          key={e.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: e.color }}
                            />
                            <span className="text-muted-foreground">
                              {e.name}
                            </span>
                          </div>
                          <span className="font-semibold">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState message="No equipment data available" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Equipment List */}
          {kpiData?.equipmentStatusSummary &&
            kpiData.equipmentStatusSummary.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Equipment Summary
                  </CardTitle>
                  <CardDescription>
                    All equipment and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Equipment
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpiData.equipmentStatusSummary.map((eq) => (
                          <tr
                            key={eq.id}
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">{eq.name}</td>
                            <td className="px-4 py-3 text-muted-foreground capitalize">
                              {eq.type.replace(/-/g, " ")}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={eq.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Gate Operations Detail Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Gate Operations Detail
                    </CardTitle>
                    <CardDescription>
                      All gate-in and gate-out records in the selected period
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto flex items-center gap-2"
                    onClick={handleExportOperationalPDF}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search operations…"
                      value={gateSearch}
                      onChange={(e) => setGateSearch(e.target.value)}
                      className="pl-8 w-48"
                    />
                  </div>
                  <Select
                    value={gateTypeFilter}
                    onValueChange={setGateTypeFilter}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="gate-in">Gate In</SelectItem>
                      <SelectItem value="gate-out">Gate Out</SelectItem>
                    </SelectContent>
                  </Select>
                  {(gateSearch || gateTypeFilter !== "all") && (
                    <button
                      onClick={() => {
                        setGateSearch("");
                        setGateTypeFilter("all");
                      }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <FilterX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Container #
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Vehicle #
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Driver
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGateOps.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No records match the current filters
                        </td>
                      </tr>
                    ) : (
                      paginatedGateOps.map((op) => (
                        <tr
                          key={op.id}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                op.type === "gate-in"
                                  ? "border-success/30 bg-success/10 text-success"
                                  : "border-primary/30 bg-primary/10 text-primary"
                              }
                            >
                              {op.type === "gate-in"
                                ? "↓ Gate In"
                                : "↑ Gate Out"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-medium">
                            {op.containerNumber || (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {op.vehicleNumber}
                          </td>
                          <td className="px-4 py-3">{op.driverName}</td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">
                            {op.purpose}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {formatDate(op.timestamp)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {gateTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {(gatePage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      gatePage * itemsPerPage,
                      filteredGateOpsTable.length,
                    )}{" "}
                    of {filteredGateOpsTable.length} records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGatePage((p) => Math.max(1, p - 1))}
                      disabled={gatePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: gateTotalPages },
                        (_, i) => i + 1,
                      ).map((p) => (
                        <Button
                          key={p}
                          variant={gatePage === p ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setGatePage(p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setGatePage((p) => Math.min(gateTotalPages, p + 1))
                      }
                      disabled={gatePage === gateTotalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
