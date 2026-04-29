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
import { UI_MESSAGES } from "@/constants/messages";

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
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || UI_MESSAGES.DESTUFFING.NEW_CONTAINER}
        </span>
      ),
    },
    {
      key: "customerName",
      header: UI_MESSAGES.TABLE.CUSTOMER,
      sortable: true,
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => {
        const variant = item.status === "at-factory" || item.status === "completed" ? ("secondary" as const) : ("default" as const);
        return <Badge variant={variant}>{item.status.replace(/-/g, " ")}</Badge>;
      },
    },
    {
      key: "checkpoints",
      header: UI_MESSAGES.TABLE.CHECKPOINTS,
      render: (item) => (
        <span className="text-muted-foreground">{UI_MESSAGES.TABLE.PASSED_CHECKPOINTS(item.checkpoints?.length || 0)}</span>
      ),
    },

    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
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
          {UI_MESSAGES.TABLE.TRACK}
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle={UI_MESSAGES.BILLING.TRANSIT_ADMIN_TITLE}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.IN_TRANSIT}
          value={inTransitCount}
          icon={Truck}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.KPI.PENDING_DISPATCH}
          value={pendingCount}
          icon={Clock}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.AT_FACTORY}
          value={atFactoryCount}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.KPI.DELIVERED}
          value={completedCount}
          icon={CheckCircle}
        />
      </div>

      {/* Container List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{UI_MESSAGES.BILLING.TRANSIT_OVERVIEW}</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={UI_MESSAGES.TABLE.FILTER_BY_STATUS} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{UI_MESSAGES.TABLE.ALL_STATUSES}</SelectItem>
              <SelectItem value="in-transit">{UI_MESSAGES.KPI.IN_TRANSIT}</SelectItem>
              <SelectItem value="delivered">{UI_MESSAGES.KPI.DELIVERED}</SelectItem>
              <SelectItem value="pending">{UI_MESSAGES.KPI.PENDING}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            isLoading={loading}
            searchPlaceholder={UI_MESSAGES.BILLING.SEARCH_ALL_CONTAINERS}
            emptyMessage={UI_MESSAGES.BILLING.NO_TRANSIT_FOUND}
          />
        </CardContent>
      </Card>

      {/* Transit Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {UI_MESSAGES.DIALOG.TRANSIT_DETAILS}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Container Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.CONTAINER}</p>
                  <p className="font-mono font-medium text-lg">
                    {selectedRequest.containerNumber || UI_MESSAGES.DESTUFFING.NEW_CONTAINER}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.STATUS}</p>
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
                    <p>{UI_MESSAGES.BILLING.NO_CHECKPOINTS}</p>
                    <p className="text-sm">
                      {UI_MESSAGES.BILLING.TRACKING_START_DESC}
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
