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
} from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ContainerRequest {
  id: string;
  _id?: string;
  type: "stuffing" | "destuffing";
  status: "pending" | "approved" | "rejected" | "completed";
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
}

export default function CustomerRequestsListing() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] =
    useState<ContainerRequest | null>(null);
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchRequests = async () => {
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
          title: "Error",
          description: "Failed to fetch container requests",
          variant: "destructive",
        });
      }
    };

    fetchRequests();
  }, [toast]);

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
      header: "Request No.",
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
      key: "containerSpecs",
      header: "Req. Container",
      render: (item) =>
        item.containerSize && item.containerType ? (
          <span className="text-sm whitespace-nowrap">
            {item.containerSize} •{" "}
            <span className="capitalize">{item.containerType}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        ),
    },
    {
      key: "cargoDescription",
      header: "Cargo Description",
      render: (item) => (
        <div className="max-w-[200px] truncate" title={item.cargoDescription}>
          {item.cargoDescription}
        </div>
      ),
    },
    {
      key: "cargoWeight",
      header: "Weight (kg)",
      sortable: true,
      render: (item) => (
        <span className="font-medium">
          {item.cargoWeight != null ? item.cargoWeight.toLocaleString() : "N/A"}
        </span>
      ),
    },
    {
      key: "isHazardous",
      header: "Hazardous",
      render: (item) =>
        item.isHazardous ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground">No</span>
        ),
    },
    {
      key: "containerNumber",
      header: "Allocated Container",
      render: (item) =>
        item.containerNumber ? (
          <div className="flex items-center gap-2">
            <Container className="h-4 w-4 text-success" />
            <span className="font-mono text-sm">{item.containerNumber}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not allocated</span>
        ),
    },
    {
      key: "preferredDate",
      header: "Preferred Date",
      sortable: true,
      render: (item) =>
        item.preferredDate
          ? new Date(item.preferredDate).toLocaleDateString()
          : "N/A",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "View",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRequest(item);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={customerNavItems}
      pageTitle="Container Requests Listing"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <KPICard
          title="Total Requests"
          value={requests.length}
          icon={FileText}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={pendingRequests}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Approved"
          value={approvedRequests}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Rejected"
          value={rejectedRequests}
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>My Container Requests</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending ({pendingRequests})</SelectItem>
                <SelectItem value="approved">Approved ({approvedRequests})</SelectItem>
                <SelectItem value="rejected">Rejected ({rejectedRequests})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            searchPlaceholder="Search by cargo description..."
            onRowClick={setSelectedRequest}
            emptyMessage={
              statusFilter === "all"
                ? "No requests found"
                : `No ${statusFilter} requests found`
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
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Request ID</p>
                  <p className="font-mono font-medium text-primary">
                    REQ-{(selectedRequest.id || "").slice(-6).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge
                    variant={
                      selectedRequest.type === "stuffing"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {selectedRequest.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Preferred Date
                  </p>
                  <p className="font-medium">
                    {selectedRequest.preferredDate
                      ? new Date(
                        selectedRequest.preferredDate,
                      ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Cargo Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">
                      {selectedRequest.cargoDescription}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">
                      {selectedRequest.cargoWeight != null
                        ? `${selectedRequest.cargoWeight.toLocaleString()} kg`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hazardous</p>
                    {selectedRequest.isHazardous ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Yes - {selectedRequest.hazardClass}
                      </Badge>
                    ) : (
                      <p className="font-medium">No</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequest.containerNumber && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Container Allocation</h4>
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
                <p className="text-sm text-muted-foreground">Requested On</p>
                <p className="font-medium">
                  {selectedRequest.createdAt
                    ? new Date(selectedRequest.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              {selectedRequest.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="font-medium">{selectedRequest.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
