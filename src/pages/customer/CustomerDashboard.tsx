import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchKPIData } from "@/store/slices/dashboardSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import { KPICard } from "@/components/common/KPICard";
import { CustomerActiveRequests } from "@/components/customer/CustomerActiveRequests";
import { CustomerContainerSummary } from "@/components/customer/CustomerContainerSummary";
import {
  Factory,
  Plus,
  CreditCard,
  History,
  HelpCircle,
  Loader2,
  Container,
  ClipboardList,
  Wallet,
  Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CustomerDashboard() {
  const dispatch = useAppDispatch();
  const { kpiData, isLoading } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchKPIData());
  }, [dispatch]);

  if (isLoading || !kpiData) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Customer Dashboard">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="Customer Dashboard">
      {/* Organization Header */}
      <div className="mb-6 rounded-2xl border bg-gradient-to-r from-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Factory className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Welcome back,</p>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                {user?.companyName || user?.name || "Customer Entity"}
              </h2>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="text-right mr-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">System Status</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Containers in Yard"
          value={kpiData.totalContainersInYard}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title="Active Requests"
          value={kpiData.activeTasks?.length || 0}
          icon={ClipboardList}
          variant="default"
        />
        <KPICard
          title="PDA Balance"
          value={`$${(kpiData.pdaBalance || 0).toLocaleString()}`}
          icon={Wallet}
          variant="success"
        />
        <KPICard
          title="Unpaid Amount"
          value={`$${(kpiData.unpaidBillsAmount || 0).toLocaleString()}`}
          icon={Receipt}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Operational Column */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerActiveRequests requests={kpiData.activeTasks as any || []} />

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Recent History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  {(kpiData.recentActivities || []).slice(0, 4).map((activity) => (
                    <div key={activity.id} className="text-xs border-l-2 border-primary/20 pl-3 py-0.5">
                      <p className="font-bold">{activity.action}</p>
                      <p className="text-muted-foreground truncate">{activity.description}</p>
                    </div>
                  ))}
                  {(!kpiData.recentActivities || kpiData.recentActivities.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent history</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <CustomerContainerSummary
              totalInYard={kpiData.totalContainersInYard}
              inTransit={kpiData.containersInTransit}
              damaged={kpiData.recentAlerts?.filter(a => a.id.startsWith('damaged')).length || 0}
            />
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground shadow-xl border-none">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 border-white/20" variant="outline">
                <Link to="/customer/request-container">
                  <Plus className="h-4 w-4" /> New Cargo Request
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 border-white/20" variant="outline">
                <Link to="/customer/pda">
                  <CreditCard className="h-4 w-4" /> Recharge PDA
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 border-white/20" variant="outline">
                <Link to="/customer/bills">
                  <Receipt className="h-4 w-4" /> Pay Outstanding Bills
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Support Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 text-xs">
                <p className="font-bold mb-1">Need Terminal Assistance?</p>
                <p className="text-muted-foreground mb-2">Our operations team is available 24/7 for critical queries.</p>
                <Button size="sm" variant="link" className="p-0 h-auto text-primary font-bold">Contact Ground Ops →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
