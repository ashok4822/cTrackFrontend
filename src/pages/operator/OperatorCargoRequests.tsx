import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Package,
  Container,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Weight,
} from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import { containerService } from "@/services/containerService";
import { billingService, type CargoCategory } from "@/services/billingService";
import { useToast } from "@/hooks/useToast";

interface CargoRequest {
  id: string;
  _id?: string;
  type: "stuffing" | "destuffing";
  status: "pending" | "approved" | "rejected" | "completed";
  customerName?: string;
  customerId?: string;
  name?: string;
  containerSize?: string;
  containerType?: string;
  containerNumber?: string;
  containerId?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  cargoCategoryId?: string;
  cargoCategoryName?: string;
  isHazardous?: boolean;
  hazardClass?: string;
  unNumber?: string;
  packingGroup?: string;
  preferredDate?: string;
  specialInstructions?: string;
  remarks?: string;
  cargoCharge?: number;
  createdAt?: string;
}

interface AvailableContainer {
  _id?: string;
  id?: string;
  containerNumber: string;
  size: string;
  type: string;
  status: string;
  yardLocation?: { block: string };
}

export default function OperatorCargoRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CargoRequest[]>([]);
  const [cargoCategories, setCargoCategories] = useState<CargoCategory[]>([]);
  const [selectedCargoCategoryId, setSelectedCargoCategoryId] = useState<string>("none");
  const [selectedRequest, setSelectedRequest] = useState<CargoRequest | null>(
    null,
  );
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState("");
  const [availableContainers, setAvailableContainers] = useState<
    AvailableContainer[]
  >([]);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await containerRequestService.getAllRequests();
      const formattedData = data.map((r: CargoRequest & { _id?: string }) => ({
        ...r,
        id: r._id || r.id,
        customerName: r.customerName || r.name || r.customerId || "Unknown",
      }));
      setRequests(formattedData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch container requests",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const init = async () => {
      await fetchRequests();
      try {
        const categories = await billingService.fetchCargoCategories();
        setCargoCategories(categories.filter(c => c.active));
      } catch (error) {
        console.error("Failed to fetch cargo categories:", error);
      }
    };
    init();
  }, [fetchRequests]);

  // Fetch containers that match the request's size/type and are available in-yard
  // Also filter out containers already allocated to other active requests
  const fetchAvailableContainers = useCallback(
    async (request: CargoRequest) => {
      try {
        setLoadingContainers(true);
        const containers = await containerService.getContainers({
          status: "in-yard",
          ...(request.containerSize ? { size: request.containerSize } : {}),
          ...(request.containerType ? { type: request.containerType } : {}),
        });

        // Filter out containers already allocated to other active requests
        const allocatedContainerIds = requests
          .filter(r =>
            r.id !== request.id && // exclude current request
            r.containerId &&
            !["completed", "rejected", "cancelled"].includes(r.status)
          )
          .map(r => r.containerId);

        const filteredContainers = containers.filter(
          c => !allocatedContainerIds.includes(c._id || c.id)
        );

        setAvailableContainers(filteredContainers);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch available containers",
          variant: "destructive",
        });
        setAvailableContainers([]);
      } finally {
        setLoadingContainers(false);
      }
    },
    [toast, requests],
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const handleAllocate = async () => {
    if (!selectedRequest) return;

    const isDestuffing = selectedRequest.type === "destuffing";

    // For stuffing, a container must be selected from the dropdown
    if (!isDestuffing && !selectedContainer) {
      toast({
        title: "Error",
        description: "Please select a container to allocate",
        variant: "destructive",
      });
      return;
    }

    try {
      const category = cargoCategories.find(c => c.id === selectedCargoCategoryId);
      const chargePerTon = category?.chargePerTon || 0;
      const weightInTons = (selectedRequest.cargoWeight || 0) / 1000;
      const calculatedCharge = weightInTons * chargePerTon;

      let updatePayload: Partial<CargoRequest> = {
        status: "approved",
        cargoCategoryId: selectedCargoCategoryId === "none" ? undefined : selectedCargoCategoryId,
        cargoCharge: calculatedCharge
      };

      if (isDestuffing) {
        // Container is already known from the request itself
        updatePayload = {
          ...updatePayload,
          containerId: selectedRequest.containerId,
          containerNumber: selectedRequest.containerNumber,
        };
      } else {
        const container = availableContainers.find(
          (c: AvailableContainer) => (c._id || c.id) === selectedContainer,
        );
        updatePayload = {
          ...updatePayload,
          containerId: selectedContainer,
          containerNumber: container?.containerNumber,
          containerSize: container?.size,
          containerType: container?.type,
        };
      }

      await containerRequestService.updateRequest(
        selectedRequest.id,
        updatePayload,
      );

      toast({
        title: "Request Approved",
        description: `Container ${updatePayload.containerNumber} approved for request`,
      });

      setAllocationDialogOpen(false);
      setSelectedRequest(null);
      setSelectedContainer("");
      setSelectedCargoCategoryId("none");
      fetchRequests();
    } catch {
      toast({
        title: "Error",
        description: "Failed to allocate container",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    try {
      await containerRequestService.updateRequest(selectedRequest.id, {
        status: "rejected",
        remarks: rejectionReason,
      });

      toast({
        title: "Request Rejected",
        description: `Request ${selectedRequest.id} has been rejected`,
        variant: "destructive",
      });

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests(); // Refresh data
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const columns: Column<CargoRequest>[] = [
    {
      key: "id",
      header: "Request ID",
      render: (item) => {
        const idString = item.id || "";
        return (
          <span className="font-mono text-xs">
            REQ-{idString.slice(-6).toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <Badge
          variant={item.type === "stuffing" ? "default" : "secondary"}
          className="capitalize"
        >
          {item.type}
        </Badge>
      ),
    },
    { key: "customerName", header: "Customer", sortable: true },
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
      header: "Cargo",
      render: (item) => (
        <div className="max-w-[200px] truncate" title={item.cargoDescription}>
          {item.cargoDescription}
        </div>
      ),
    },
    {
      key: "cargoWeight",
      header: "Weight",
      render: (item) =>
        item.cargoWeight != null
          ? `${item.cargoWeight.toLocaleString()} kg`
          : "N/A",
    },
    {
      key: "cargoCategoryName",
      header: "Category",
      render: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.cargoCategoryName || "General / Default"}
        </Badge>
      ),
    },
    {
      key: "containerNumber",
      header: "Allocated Container",
      render: (item) =>
        item.containerNumber ? (
          <span className="font-mono">{item.containerNumber}</span>
        ) : (
          <span className="text-muted-foreground">Not allocated</span>
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
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          {item.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedContainer("");
                  
                  // Pre-select category based on ID or Name fallback
                  let categoryId = item.cargoCategoryId;
                  if (!categoryId && item.cargoCategoryName) {
                    const matchedCategory = cargoCategories.find(
                      (cat) => cat.name === item.cargoCategoryName
                    );
                    if (matchedCategory) {
                      categoryId = matchedCategory.id;
                    }
                  }
                  setSelectedCargoCategoryId(categoryId || "none");
                  
                  fetchAvailableContainers(item);
                  setAllocationDialogOpen(true);
                }}
              >
                Allocate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedRequest(item);
                  setRejectDialogOpen(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
          {item.status === "rejected" && (
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <XCircle className="h-4 w-4" /> Rejected
            </span>
          )}
          {item.status === "approved" && (
            <span className="text-success text-sm flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Allocated
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle="Cargo Requests & Allocation"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KPICard
          title="Pending Requests"
          value={pendingRequests.length}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Allocated (Approved)"
          value={approvedRequests.length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title="Rejected"
          value={rejectedRequests.length}
          icon={XCircle}
          variant="danger"
        />
      </div>

      {/* Requests Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customer Cargo Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <DataTable columns={columns} data={pendingRequests} />
            </TabsContent>

            <TabsContent value="approved">
              <DataTable columns={columns} data={approvedRequests} />
            </TabsContent>

            <TabsContent value="rejected">
              <DataTable columns={columns} data={rejectedRequests} />
            </TabsContent>

            <TabsContent value="all">
              <DataTable columns={columns} data={requests} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Allocation Dialog */}
      <Dialog
        open={allocationDialogOpen}
        onOpenChange={setAllocationDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Allocate Container</DialogTitle>
            <DialogDescription>
              Select a container to allocate to this {selectedRequest?.type}{" "}
              request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Customer</p>
                      <p className="font-medium">
                        {selectedRequest.customerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <p className="font-medium capitalize">
                        {selectedRequest.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Cargo Weight
                      </p>
                      <p className="font-medium">
                        {selectedRequest.cargoWeight != null
                          ? `${selectedRequest.cargoWeight.toLocaleString()} kg`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">
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
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Cargo Description
                  </p>
                  <p className="text-sm">{selectedRequest.cargoDescription}</p>
                </div>
                {selectedRequest.isHazardous && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Hazardous: {selectedRequest.hazardClass} - UN{" "}
                    {selectedRequest.unNumber}
                  </Badge>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/10">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Initial Cargo Category</p>
                    <p className="font-medium">
                      {selectedRequest.cargoCategoryName || "General / Default"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Container Selection */}
              <div className="space-y-2">
                {selectedRequest.type === "destuffing" ? (
                  // Destuffing: container is already known — show it as read-only
                  <>
                    <Label>Container</Label>
                    <div className="flex items-center gap-3 rounded-md border border-input bg-muted/50 px-3 py-2">
                      <span className="font-mono font-semibold text-sm">
                        {selectedRequest.containerNumber}
                      </span>
                      {selectedRequest.containerSize &&
                        selectedRequest.containerType && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {selectedRequest.containerSize} •{" "}
                            {selectedRequest.containerType}
                          </span>
                        )}
                      <span className="ml-auto text-xs text-muted-foreground italic">
                        Customer's loaded container
                      </span>
                    </div>
                  </>
                ) : (
                  // Stuffing: operator picks an empty container
                  <>
                    <Label>Select Container</Label>
                    <Select
                      value={selectedContainer}
                      onValueChange={setSelectedContainer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a container" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingContainers ? (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            Loading containers...
                          </div>
                        ) : availableContainers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            No matching containers available
                          </div>
                        ) : (
                          availableContainers.map(
                            (container: AvailableContainer) => {
                              const cId = container._id || container.id || "";
                              return (
                                <SelectItem key={cId} value={cId}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">
                                      {container.containerNumber}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {container.size} • {container.type}
                                    </span>
                                    {container.yardLocation && (
                                      <span className="text-muted-foreground text-xs">
                                        @ {container.yardLocation.block}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            },
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.containerSize &&
                        selectedRequest.containerType
                        ? `Showing ${selectedRequest.containerSize} ${selectedRequest.containerType} containers available in yard`
                        : "Showing all empty containers available in yard"}
                    </p>
                  </>
                )}
              </div>

              {/* Cargo Category Adjustment */}
              <div className="space-y-2">
                <Label htmlFor="category">Change Cargo Category (Optional)</Label>
                <Select
                  value={selectedCargoCategoryId}
                  onValueChange={setSelectedCargoCategoryId}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General / Default</SelectItem>
                    {cargoCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id || ""}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  You can change the category here to apply different charge rates during allocation if needed.
                </p>
                {selectedCargoCategoryId !== "none" && (
                  <div className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Calculated Cargo Charge:</span>
                      <span className="text-primary font-bold">
                        ₹{(((selectedRequest?.cargoWeight || 0) / 1000) *
                          (cargoCategories.find(c => c.id === selectedCargoCategoryId)?.chargePerTon || 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">
                      Based on {((selectedRequest?.cargoWeight || 0) / 1000).toFixed(3)} tons @ ₹{cargoCategories.find(c => c.id === selectedCargoCategoryId)?.chargePerTon || 0}/ton
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAllocationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAllocate}
              disabled={
                selectedRequest?.type !== "destuffing" && !selectedContainer
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Allocate Container
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
