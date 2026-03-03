import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { adminNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { KPICard } from "@/components/common/KPICard";
import {
  Truck,
  Clock,
  CheckCircle,
  Navigation,
  Eye,
} from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import type { ContainerRequest } from "@/types";

export default function AdminTransitTracking() {
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await containerRequestService.getAllRequests();
        // Filter for transit-related statuses
        const transitStatuses = ["ready-for-dispatch", "in-transit", "at-factory", "completed"];
        const filtered = data.filter((r: ContainerRequest) => transitStatuses.includes(r.status));
        setRequests(filtered);
      } catch (error) {
        console.error("Failed to fetch transit data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const inTransitCount = requests.filter((c) => c.status === "in-transit").length;
  const pendingCount = requests.filter((c) => c.status === "ready-for-dispatch").length;
  const atFactoryCount = requests.filter((c) => c.status === "at-factory").length;
  const completedCount = requests.filter((c) => c.status === "completed").length;

  const filteredRequests = requests.filter((c) => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const columns: Column<ContainerRequest>[] = [
    {
      key: "containerNumber",
      header: "Container No.",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || "NEW"}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Factory",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => {
        const variant = item.status === "at-factory" || item.status === "completed" ? ("secondary" as const) : ("default" as const);
        return <Badge variant={variant}>{item.status.replace(/-/g, " ")}</Badge>;
      },
    },
    {
      key: "checkpoints",
      header: "Checkpoints",
      render: (item) => (
        <span className="text-muted-foreground">{item.checkpoints?.length || 0} passed</span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedRequestId(item.id);
            setShowDetailsDialog(true);
          }}
          className="gap-1"
        >
          <Eye className="h-4 w-4" />
          Track
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle="Transit Tracking (Admin)"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="In Transit"
          value={inTransitCount}
          icon={Truck}
          variant="warning"
        />
        <KPICard
          title="Ready for Dispatch"
          value={pendingCount}
          icon={Clock}
          variant="primary"
        />
        <KPICard
          title="At Factory"
          value={atFactoryCount}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Completed"
          value={completedCount}
          icon={CheckCircle}
        />
      </div>

      {/* Container List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Global Transit Overview</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in-transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            isLoading={loading}
            searchPlaceholder="Search all containers..."
            emptyMessage="No shipments found in transit"
          />
        </CardContent>
      </Card>

      {/* Transit Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Transit Checkpoints
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Container Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Container</p>
                  <p className="font-mono font-medium text-lg">
                    {selectedRequest.containerNumber || "NEW REQUEST"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedRequest.status === "at-factory" || selectedRequest.status === "completed" ? "secondary" : "default"}>
                    {selectedRequest.status.replace(/-/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {selectedRequest.checkpoints && selectedRequest.checkpoints.length > 0 ? (
                  <div className="space-y-6">
                    {([...selectedRequest.checkpoints].reverse()).map((checkpoint, index) => (
                      <div key={index} className="relative pl-10">
                        <div
                          className={`absolute left-2 top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-primary border-primary`}
                        >
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        </div>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {checkpoint.location}
                                </h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(checkpoint.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {checkpoint.remarks && (
                              <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
                                {checkpoint.remarks}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pl-10 py-8 text-center text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No checkpoint data available yet.</p>
                    <p className="text-sm">
                      Tracking will begin once the container is gated out.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
