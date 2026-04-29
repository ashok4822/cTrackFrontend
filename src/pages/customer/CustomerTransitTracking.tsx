import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { KPICard } from "@/components/common/KPICard";
import {
  Truck,
  Clock,
  CheckCircle,
  Container,
  Navigation,
  Eye,
} from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import type { ContainerRequest } from "@/types";
import { useToast } from "@/hooks/useToast";
import { useOverdueStatus } from "@/hooks/useOverdueStatus";
import { OverdueBlocker } from "@/components/common/OverdueBlocker";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_MESSAGES } from "@/constants/messages";


export default function CustomerTransitTracking() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { hasOverdueBills, loading: checkingOverdue } = useOverdueStatus();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await containerRequestService.getMyRequests();
      setRequests(data);
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.TRANSIT.FETCH_FAILED,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!hasOverdueBills && !checkingOverdue) {
      fetchData();
    }
  }, [hasOverdueBills, checkingOverdue, fetchData]);

  if (checkingOverdue) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Transit Tracking">
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasOverdueBills) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Transit Tracking">
        <OverdueBlocker />
      </DashboardLayout>
    );
  }

  const relevantStatuses = UI_MESSAGES.TRANSIT.RELEVANT_STATUSES;

  const filteredRequests = requests.filter((r) => {
    const isRelevant = relevantStatuses.includes(r.status);
    if (!isRelevant) return false;
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const inTransitCount = requests.filter((c) => c.status === "in-transit").length;
  const deliveredCount = requests.filter((c) => c.status === "completed").length;
  const pendingCount = requests.filter((c) => c.status === "ready-for-dispatch").length;

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const columns: Column<ContainerRequest>[] = [
    {
      key: "containerNumber",
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || UI_MESSAGES.COMMON.NA}
        </span>
      ),
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      render: (item) => <span className="capitalize">{item.type}</span>
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "checkpoints",
      header: UI_MESSAGES.TABLE.CHECKPOINTS,
      render: (item) => (
        <span className="text-muted-foreground">{UI_MESSAGES.TABLE.PASSED_CHECKPOINTS(item.checkpoints?.length || 0)}</span>
      ),
    },
    {
      key: "preferredDate",
      header: UI_MESSAGES.TABLE.PLANNED_DATE,
      render: (item) => new Date(item.preferredDate).toLocaleDateString(),
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
      navItems={customerNavItems}
      pageTitle={UI_MESSAGES.TABLE.TRACK}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.TOTAL_SHIPMENTS}
          value={requests.filter(r => relevantStatuses.includes(r.status)).length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.IN_TRANSIT}
          value={inTransitCount}
          icon={Truck}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.KPI.DELIVERED}
          value={deliveredCount}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard title={UI_MESSAGES.KPI.PENDING_DISPATCH} value={pendingCount} icon={Clock} />
      </div>

      {/* Container List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{UI_MESSAGES.TABLE.SHIPMENT_TRACKING}</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={UI_MESSAGES.TABLE.FILTER_BY_STATUS} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{UI_MESSAGES.TABLE.ALL_STATUSES}</SelectItem>
               <SelectItem value="ready-for-dispatch">{UI_MESSAGES.KPI.PENDING_DISPATCH}</SelectItem>
              <SelectItem value="in-transit">{UI_MESSAGES.KPI.IN_TRANSIT}</SelectItem>
              <SelectItem value="at-factory">{UI_MESSAGES.TITLES.AT_FACTORY}</SelectItem>
              <SelectItem value="completed">{UI_MESSAGES.KPI.COMPLETED}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CONTAINERS}
            emptyMessage={UI_MESSAGES.TABLE.NO_SHIPMENTS_FOUND}
            isLoading={loading}
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
                    {selectedRequest.containerNumber || UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.STATUS}</p>
                  <Badge
                    variant={
                      selectedRequest.status === "completed"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {selectedRequest.status.replace(/-/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {(() => {
                  const checkpoints = selectedRequest.checkpoints || [];
                  const allEvents = [...checkpoints];

                  // Always ensure there's a "Request Created" event at the start
                  const hasCreationEvent = allEvents.some(cp =>
                    cp.status === "pending" ||
                    cp.status === "Request Created" ||
                    cp.remarks?.toLowerCase().includes("submitted")
                  );

                  if (!hasCreationEvent) {
                    allEvents.push({
                      status: UI_MESSAGES.TRANSIT.REQUEST_CREATED,
                      location: UI_MESSAGES.TRANSIT.CUSTOMER_PORTAL,
                      timestamp: selectedRequest.createdAt || new Date().toISOString(),
                      remarks: UI_MESSAGES.TRANSIT.INITIAL_REQUEST_SUBMITTED(selectedRequest.type),
                    });
                  }

                  const sortedEvents = allEvents.sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );

                  return (
                    <div className="space-y-6">
                      {sortedEvents.map((checkpoint, index) => (
                        <div key={index} className="relative pl-10">
                          <div
                            className="absolute left-2 top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-primary border-primary"
                          >
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          </div>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold capitalize">
                                    {(checkpoint.status || UI_MESSAGES.TITLES.UPDATE).replace(/-/g, " ")}
                                  </h4>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-sm font-medium">
                                      {checkpoint.location}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(checkpoint.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {checkpoint.remarks && (
                                <p className="mt-2 text-sm text-muted-foreground border-t pt-2 italic">
                                  {checkpoint.remarks}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
