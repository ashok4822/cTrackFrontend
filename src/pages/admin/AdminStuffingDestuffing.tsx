import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, Calendar } from "lucide-react";
import type { ContainerRequest } from "@/types";
import { adminNavItems } from "@/config/navigation";
import { containerRequestService } from "@/services/containerRequestService";



const AdminStuffingDestuffing = () => {
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await containerRequestService.getAllRequests();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching stuffing/destuffing requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const pendingCount = requests.filter(
    (op) => op.status === "pending",
  ).length;
  const inProgressCount = requests.filter(
    (op) => op.status === "in-progress",
  ).length;
  const completedCount = requests.filter(
    (op) => op.status === "completed",
  ).length;

  const columns: Column<ContainerRequest>[] = [
    {
      key: "containerNumber",
      header: "Container",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || "N/A"}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (item) => (
        <Badge
          variant={item.type === "stuffing" ? "default" : "secondary"}
          className="capitalize"
        >
          {item.type}
        </Badge>
      ),
    },

    {
      key: "preferredDate",
      header: "Preferred Date",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{new Date(item.preferredDate).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Operation Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Container</p>
                  <p className="font-mono font-medium">
                    {item.containerNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="capitalize font-medium">{item.type}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{item.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={item.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Preferred Date
                  </p>
                  <p>{new Date(item.preferredDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p>{item.cargoDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p>{item.cargoWeight} kg</p>
                </div>
                {item.containerSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Size/Type</p>
                    <p>{item.containerSize} / {item.containerType}</p>
                  </div>
                )}
              </div>
              {item.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-sm">{item.remarks}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={adminNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Stuffing / Destuffing
            </h1>
            <p className="text-muted-foreground">
              Container stuffing and destuffing operations
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operations Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Operations</TabsTrigger>
                <TabsTrigger value="stuffing">Stuffing</TabsTrigger>
                <TabsTrigger value="destuffing">Destuffing</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <DataTable
                  data={requests}
                  columns={columns}
                  searchable
                  isLoading={loading}
                  searchPlaceholder="Search by container number..."
                />
              </TabsContent>
              <TabsContent value="stuffing">
                <DataTable
                  data={requests.filter(
                    (op) => op.type === "stuffing",
                  )}
                  columns={columns}
                  searchable
                  isLoading={loading}
                  searchPlaceholder="Search stuffing operations..."
                />
              </TabsContent>
              <TabsContent value="destuffing">
                <DataTable
                  data={requests.filter(
                    (op) => op.type === "destuffing",
                  )}
                  columns={columns}
                  searchable
                  isLoading={loading}
                  searchPlaceholder="Search destuffing operations..."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStuffingDestuffing;
