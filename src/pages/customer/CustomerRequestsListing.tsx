import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KPICard } from "@/components/common/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Container,
  AlertTriangle,
  History,
  Navigation,
} from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { useOverdueStatus } from "@/hooks/useOverdueStatus";
import { OverdueBlocker } from "@/components/common/OverdueBlocker";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_MESSAGES } from "@/constants/messages";


interface Checkpoint {
  location: string;
  timestamp: string;
  status: string;
  remarks?: string;
}

interface ContainerRequest {
  id: string;
  _id?: string;
  type: "stuffing" | "destuffing";
  status: string;
  containerSize?: string;
  containerType?: string;
  containerNumber?: string;
  containerId?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  hazardClass?: string;
  isHazardous?: boolean;
  preferredDate?: string;
  specialInstructions?: string;
  remarks?: string;
  customerName?: string;
  createdAt?: string;
  checkpoints?: Checkpoint[];
}

export default function CustomerRequestsListing() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] =
    useState<ContainerRequest | null>(null);
  const [selectedHistoryRequest, setSelectedHistoryRequest] =
    useState<ContainerRequest | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const { hasOverdueBills, loading: checkingOverdue } = useOverdueStatus();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true); // Set loading to true before fetching
    try {
      const data = await containerRequestService.getMyRequests();
      const formattedData = data.map(
        (r: ContainerRequest & { _id?: string }) => ({
          ...r,
          id: r._id || r.id,
        }),
      );
      setRequests(formattedData);
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.CONTAINER.SUBMIT_FAILED,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Set loading to false after fetching (or error)
    }
  }, [toast]);

  useEffect(() => {
    if (!hasOverdueBills && !checkingOverdue) {
      fetchRequests();
    } else if (hasOverdueBills) {
      // If overdue, ensure loading is false and requests are cleared if needed
      setIsLoading(false);
      setRequests([]); // Optionally clear requests if overdue
    }
  }, [fetchRequests, hasOverdueBills, checkingOverdue]);

  if (checkingOverdue || (isLoading && requests.length === 0)) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle={`${UI_MESSAGES.COMMON.MY_CONTAINER_REQUESTS} ${UI_MESSAGES.COMMON.LISTING}`}>
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasOverdueBills) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle={`${UI_MESSAGES.COMMON.MY_CONTAINER_REQUESTS} ${UI_MESSAGES.COMMON.LISTING}`}>
        <OverdueBlocker />
      </DashboardLayout>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const approvedRequests = requests.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedRequests = requests.filter(
    (r) => r.status === "rejected",
  ).length;

  const filteredRequests = statusFilter === "all"
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  const columns: Column<ContainerRequest>[] = [
    {
      key: "id",
      header: UI_MESSAGES.TABLE.REQUEST_NO,
      sortable: true,
      render: (item) => {
        const idString = item.id || "";
        return (
          <span className="font-mono font-medium text-primary">
            REQ-{idString.slice(-6).toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      sortable: true,
      render: (item) => (
        <Badge
          variant={item.type === "stuffing" ? "default" : "secondary"}
          className="capitalize"
        >
          {item.type === "stuffing" ? UI_MESSAGES.COMMON.STUFFING : UI_MESSAGES.COMMON.DESTUFFING}
        </Badge>
      ),
    },
    {
      key: "containerSpecs",
      header: UI_MESSAGES.TABLE.REQ_CONTAINER,
      render: (item) =>
        item.containerSize && item.containerType ? (
          <span className="text-sm whitespace-nowrap">
            {item.containerSize} •{" "}
            <span className="capitalize">{item.containerType}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">{UI_MESSAGES.COMMON.NA}</span>
        ),
    },
    {
      key: "cargoDescription",
      header: UI_MESSAGES.TABLE.CARGO_DESC,
      render: (item) => (
        <div className="max-w-[200px] truncate" title={item.cargoDescription}>
          {item.cargoDescription}
        </div>
      ),
    },
    {
      key: "cargoWeight",
      header: UI_MESSAGES.TABLE.WEIGHT_KG,
      sortable: true,
      render: (item) => (
        <span className="font-medium">
          {item.cargoWeight != null ? item.cargoWeight.toLocaleString() : UI_MESSAGES.COMMON.NA}
        </span>
      ),
    },
    {
      key: "isHazardous",
      header: UI_MESSAGES.TABLE.HAZARDOUS,
      render: (item) =>
        item.isHazardous ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {UI_MESSAGES.COMMON.YES}
          </Badge>
        ) : (
          <span className="text-muted-foreground">{UI_MESSAGES.COMMON.NO}</span>
        ),
    },
    {
      key: "containerNumber",
      header: UI_MESSAGES.TABLE.ALLOCATED_CONTAINER,
      render: (item) =>
        item.containerNumber ? (
          <div className="flex items-center gap-2">
            <Container className="h-4 w-4 text-success" />
            <span className="font-mono text-sm">{item.containerNumber}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">{UI_MESSAGES.DESTUFFING.NOT_ALLOCATED}</span>
        ),
    },
    {
      key: "preferredDate",
      header: UI_MESSAGES.TABLE.PREFERRED_DATE,
      sortable: true,
      render: (item) =>
        item.preferredDate
          ? new Date(item.preferredDate).toLocaleDateString()
          : UI_MESSAGES.COMMON.NA,
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRequest(item);
            }}
            title={UI_MESSAGES.TABLE.VIEW_DETAILS}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHistoryRequest(item);
              setShowHistoryDialog(true);
            }}
            title={UI_MESSAGES.TABLE.VIEW_HISTORY}
          >
            <History className="h-4 w-4 text-blue-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={customerNavItems}
      pageTitle={`${UI_MESSAGES.COMMON.MY_CONTAINER_REQUESTS} ${UI_MESSAGES.COMMON.LISTING}`}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.TOTAL_REQUESTS}
          value={requests.length}
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.PENDING}
          value={pendingRequests}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.KPI.APPROVED}
          value={approvedRequests}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.KPI.REJECTED}
          value={rejectedRequests}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{UI_MESSAGES.COMMON.MY_CONTAINER_REQUESTS}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{UI_MESSAGES.TABLE.FILTER_BY_STATUS}:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={UI_MESSAGES.TABLE.FILTER_BY_STATUS} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{UI_MESSAGES.TABLE.ALL_STATUSES}</SelectItem>
                <SelectItem value="pending">{UI_MESSAGES.KPI.PENDING} ({pendingRequests})</SelectItem>
                <SelectItem value="approved">{UI_MESSAGES.KPI.APPROVED} ({approvedRequests})</SelectItem>
                <SelectItem value="rejected">{UI_MESSAGES.KPI.REJECTED} ({rejectedRequests})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CARGO_DESC}
            onRowClick={setSelectedRequest}
            emptyMessage={
              statusFilter === "all"
                ? UI_MESSAGES.TABLE.NO_REQUESTS_FOUND
                : UI_MESSAGES.COMMON.NO_REQUESTS_FOUND_FILTER(statusFilter)
            }
          />
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="max-w-lg">
        <DialogHeader>
            <DialogTitle>{UI_MESSAGES.DIALOG.REQUEST_DETAILS}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.REQUEST_ID}</p>
                  <p className="font-mono font-medium text-primary">
                    REQ-{(selectedRequest.id || "").slice(-6).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.STATUS}</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</p>
                  <Badge
                    variant={
                      selectedRequest.type === "stuffing"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {selectedRequest.type === "stuffing" ? UI_MESSAGES.COMMON.STUFFING : UI_MESSAGES.COMMON.DESTUFFING}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.PREFERRED_DATE}
                  </p>
                  <p className="font-medium">
                    {selectedRequest.preferredDate
                      ? new Date(
                        selectedRequest.preferredDate,
                      ).toLocaleDateString()
                      : UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">{UI_MESSAGES.COMMON.CARGO_DETAILS}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.DESCRIPTION}</p>
                    <p className="font-medium">
                      {selectedRequest.cargoDescription}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.WEIGHT}</p>
                    <p className="font-medium">
                      {selectedRequest.cargoWeight != null
                        ? `${selectedRequest.cargoWeight.toLocaleString()} ${UI_MESSAGES.COMMON.KG}`
                        : UI_MESSAGES.COMMON.NA}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.HAZARDOUS}</p>
                    {selectedRequest.isHazardous ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {UI_MESSAGES.COMMON.YES} - {selectedRequest.hazardClass}
                      </Badge>
                    ) : (
                      <p className="font-medium">{UI_MESSAGES.COMMON.NO}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequest.containerNumber && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">{UI_MESSAGES.CONTAINER.CONTAINER_ALLOCATION}</h4>
                  <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                    <Container className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-mono font-medium">
                        {selectedRequest.containerNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.containerSize} •{" "}
                        {selectedRequest.containerType}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.REQUESTED_ON}</p>
                <p className="font-medium">
                  {selectedRequest.createdAt
                    ? new Date(selectedRequest.createdAt).toLocaleString()
                    : UI_MESSAGES.COMMON.NA}
                </p>
              </div>

              {selectedRequest.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.REMARKS}</p>
                  <p className="font-medium">{selectedRequest.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Request History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {UI_MESSAGES.DIALOG.REQUEST_HISTORY}
            </DialogTitle>
          </DialogHeader>

          {selectedHistoryRequest && (
            <div className="space-y-6">
              {/* Request Info Summary */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.REQUEST_ID}</p>
                  <p className="font-mono font-medium text-lg text-primary">
                    REQ-{(selectedHistoryRequest.id || "").slice(-6).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.CURRENT_STATUS}</p>
                  <StatusBadge status={selectedHistoryRequest.status} />
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {(() => {
                  const checkpoints = selectedHistoryRequest.checkpoints || [];
                  const allEvents = [...checkpoints];

                  // Always ensure there's a "Request Created" event at the start
                  // Check if we already have a creation-like event from the backend
                  const hasCreationEvent = allEvents.some(cp =>
                    cp.status === "pending" ||
                    cp.status === "Request Created" ||
                    cp.remarks?.toLowerCase().includes("submitted")
                  );

                  if (!hasCreationEvent) {
                    allEvents.push({
                      status: UI_MESSAGES.AUDIT.ACTIONS.REQUEST_CREATED,
                      location: UI_MESSAGES.AUTH.CUSTOMER_PORTAL,
                      timestamp: selectedHistoryRequest.createdAt || new Date().toISOString(),
                      remarks: UI_MESSAGES.TRANSIT.INITIAL_REQUEST_SUBMITTED(selectedHistoryRequest.type),
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
                                    {(checkpoint.status || UI_MESSAGES.COMMON.UPDATE).replace(/-/g, " ")}
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
                                  "{checkpoint.remarks}"
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
