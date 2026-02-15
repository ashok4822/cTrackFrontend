import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { customerNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
// import { SupportChatbot } from "@/components/customer/SupportChatbot";
import {
  Container,
  Truck,
  MapPin,
  Factory,
  FileText,
  ArrowRight,
  // Plus,
} from "lucide-react";
import {
  dummyContainers,
  dummyCustomerRequests,
  dummyStuffingOperations,
} from "@/data/dummyData";
import { Link } from "react-router-dom";

export default function CustomerDashboard() {
  // Filter containers for this customer (ABC Manufacturing in demo)
  const myContainers = dummyContainers.filter(
    (c) => c.customer === "ABC Manufacturing",
  );
  const inYard = myContainers.filter((c) => c.status === "in-yard").length;
  const inTransit = myContainers.filter(
    (c) => c.status === "in-transit",
  ).length;
  const atFactory = myContainers.filter(
    (c) => c.status === "at-factory",
  ).length;
  const myRequests = dummyCustomerRequests.filter(
    (r) => r.customerName === "ABC Manufacturing",
  );
  const pendingRequests = myRequests.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="Customer Dashboard">
      {/* Organization Info */}
      <div className="mb-6 rounded-lg border bg-success/5 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
            <Factory className="h-7 w-7 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              ABC Manufacturing
            </h2>
            <p className="text-muted-foreground">
              {myContainers.length} containers linked to your account
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Containers"
          value={myContainers.length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title="At Factory"
          value={atFactory}
          icon={Factory}
          variant="success"
        />
        <KPICard title="In Transit" value={inTransit} icon={Truck} />
        <KPICard
          title="In Yard"
          value={inYard}
          icon={MapPin}
          variant="warning"
        />
        <KPICard
          title="Pending Requests"
          value={pendingRequests}
          icon={FileText}
        />
      </div>

      {/* Summary Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ongoing Operations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Ongoing Operations
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/customer/stuffing">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dummyStuffingOperations.slice(0, 3).map((op) => (
                <div
                  key={op.id}
                  className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Container className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {op.containerNumber}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {op.type} at {op.location}
                    </p>
                  </div>
                  <StatusBadge status={op.status} />
                </div>
              ))}
              {dummyStuffingOperations.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No ongoing operations
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Containers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              My Containers
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/customer/containers">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myContainers.slice(0, 4).map((container) => (
                <div
                  key={container.id}
                  className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Container className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {container.containerNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {container.size} • {container.type}
                    </p>
                  </div>
                  <StatusBadge status={container.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Recent Requests
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customer/requests">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myRequests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground capitalize">
                    {request.type} Request - {request.containerNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Preferred:{" "}
                    {new Date(request.preferredDate).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support Chatbot */}
      {/* <SupportChatbot /> */}
    </DashboardLayout>
  );
}
