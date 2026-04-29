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
import { UI_MESSAGES } from "@/constants/messages";

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
        // customerName is populated by the backend aggregate; fall back gracefully
        customerName: r.customerName || r.name || UI_MESSAGES.COMMON.NO_DATA,
      }));
      setRequests(formattedData);
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.FETCH_REQUESTS_FAILED,
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
        console.error(UI_MESSAGES.ACTIVITY.FETCH_FAILED, error);
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
          title: UI_MESSAGES.TITLES.ERROR,
          description: UI_MESSAGES.DESTUFFING.FETCH_CONTAINERS_FAILED,
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
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.SELECT_LABEL,
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
        title: UI_MESSAGES.DESTUFFING.REQUEST_APPROVED,
        description: UI_MESSAGES.DESTUFFING.REQUEST_APPROVED_DESC(updatePayload.containerNumber || ""),
      });

      setAllocationDialogOpen(false);
      setSelectedRequest(null);
      setSelectedContainer("");
      setSelectedCargoCategoryId("none");
      fetchRequests();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.ALLOCATE_FAILED,
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.PROVIDE_REASON,
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
        title: UI_MESSAGES.DESTUFFING.REQUEST_REJECTED,
        description: UI_MESSAGES.DESTUFFING.REQUEST_REJECTED_DESC(selectedRequest.id),
        variant: "destructive",
      });

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests(); // Refresh data
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.REJECT_FAILED,
        variant: "destructive",
      });
    }
  };

  const columns: Column<CargoRequest>[] = [
    {
      key: "id",
      header: UI_MESSAGES.TABLE.REQUEST_ID,
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
      header: UI_MESSAGES.TABLE.TYPE,
      render: (item) => (
        <Badge
          variant={item.type === "stuffing" ? "default" : "secondary"}
          className="capitalize"
        >
          {item.type === "stuffing" ? UI_MESSAGES.COMMON.STUFFING : UI_MESSAGES.COMMON.DESTUFFING}
        </Badge>
      ),
    },
    { key: "customerName", header: UI_MESSAGES.TABLE.CUSTOMER, sortable: true },
    {
      key: "containerSpecs",
      header: UI_MESSAGES.DESTUFFING.REQ_CONTAINER,
      render: (item) =>
        item.containerSize && item.containerType ? (
          <span className="text-sm whitespace-nowrap">
            {item.containerSize} •{" "}
            <span className="capitalize">{item.containerType}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">{UI_MESSAGES.COMMON.NO_DATA}</span>
        ),
    },
    {
      key: "cargoDescription",
      header: UI_MESSAGES.TABLE.CARGO,
      render: (item) => (
        <div className="max-w-[200px] truncate" title={item.cargoDescription}>
          {item.cargoDescription}
        </div>
      ),
    },
    {
      key: "cargoWeight",
      header: UI_MESSAGES.TABLE.WEIGHT,
      render: (item) =>
        item.cargoWeight != null
          ? `${item.cargoWeight.toLocaleString()} ${UI_MESSAGES.COMMON.KG}`
          : UI_MESSAGES.COMMON.NO_DATA,
    },
    {
      key: "cargoCategoryName",
      header: UI_MESSAGES.TABLE.CATEGORY,
      render: (item) => (
        <Badge variant="outline" className="capitalize">
          {item.cargoCategoryName || UI_MESSAGES.COMMON.NO_DATA}
        </Badge>
      ),
    },
    {
      key: "containerNumber",
      header: UI_MESSAGES.DESTUFFING.ALLOCATED_CONTAINER,
      render: (item) =>
        item.containerNumber ? (
          <span className="font-mono">{item.containerNumber}</span>
        ) : (
          <span className="text-muted-foreground">{UI_MESSAGES.DESTUFFING.NOT_ALLOCATED}</span>
        ),
    },
    {
      key: "isHazardous",
      header: UI_MESSAGES.DESTUFFING.HAZARDOUS,
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
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
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
                {UI_MESSAGES.DESTUFFING.ALLOCATE}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedRequest(item);
                  setRejectDialogOpen(true);
                }}
              >
                {UI_MESSAGES.DESTUFFING.REJECT}
              </Button>
            </>
          )}
          {item.status === "rejected" && (
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <XCircle className="h-4 w-4" /> {UI_MESSAGES.DESTUFFING.REJECTED}
            </span>
          )}
          {item.status === "approved" && (
            <span className="text-success text-sm flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> {UI_MESSAGES.DESTUFFING.ALLOCATED}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle={UI_MESSAGES.TITLES.CARGO_REQUESTS}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KPICard
          title={UI_MESSAGES.DESTUFFING.PENDING_REQUESTS}
          value={pendingRequests.length}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.DESTUFFING.ALLOCATED_APPROVED}
          value={approvedRequests.length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.DESTUFFING.REJECTED}
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
            {UI_MESSAGES.DESTUFFING.CUSTOMER_CARGO_REQUESTS}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                {UI_MESSAGES.KPI.PENDING} ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                {UI_MESSAGES.TITLES.APPROVED} ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                {UI_MESSAGES.TITLES.REJECTED} ({rejectedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="all">{UI_MESSAGES.KPI.ALL_REQUESTS}</TabsTrigger>
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
            <DialogTitle>{UI_MESSAGES.DESTUFFING.ALLOCATE_CONTAINER}</DialogTitle>
            <DialogDescription>
              {UI_MESSAGES.DESTUFFING.SELECT_CONTAINER_DESC(selectedRequest?.type || "")}
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
                      <p className="text-muted-foreground text-xs">{UI_MESSAGES.TABLE.CUSTOMER}</p>
                      <p className="font-medium">
                        {selectedRequest.customerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{UI_MESSAGES.TABLE.TYPE}</p>
                      <p className="font-medium capitalize">
                        {selectedRequest.type === "stuffing" ? UI_MESSAGES.COMMON.STUFFING : UI_MESSAGES.COMMON.DESTUFFING}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {UI_MESSAGES.DESTUFFING.CARGO_WEIGHT}
                      </p>
                      <p className="font-medium">
                        {selectedRequest.cargoWeight != null
                          ? `${selectedRequest.cargoWeight.toLocaleString()} ${UI_MESSAGES.COMMON.KG}`
                          : UI_MESSAGES.COMMON.NO_DATA}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {UI_MESSAGES.TABLE.PREFERRED_DATE}
                      </p>
                      <p className="font-medium">
                        {selectedRequest.preferredDate
                          ? new Date(
                            selectedRequest.preferredDate,
                          ).toLocaleDateString()
                          : UI_MESSAGES.COMMON.NO_DATA}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    {UI_MESSAGES.DESTUFFING.CARGO_DESC}
                  </p>
                  <p className="text-sm">{selectedRequest.cargoDescription}</p>
                </div>
                {selectedRequest.isHazardous && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {UI_MESSAGES.DESTUFFING.HAZARDOUS}: {selectedRequest.hazardClass} - UN{" "}
                    {selectedRequest.unNumber}
                  </Badge>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/10">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">{UI_MESSAGES.DESTUFFING.INITIAL_CATEGORY}</p>
                    <p className="font-medium">
                      {selectedRequest.cargoCategoryName || UI_MESSAGES.COMMON.NO_DATA}
                    </p>
                  </div>
                </div>
              </div>

              {/* Container Selection */}
              <div className="space-y-2">
                {selectedRequest.type === "destuffing" ? (
                  // Destuffing: container is already known — show it as read-only
                  <>
                    <Label>{UI_MESSAGES.TABLE.CONTAINER}</Label>
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
                        {UI_MESSAGES.DESTUFFING.CUSTOMERS_CONTAINER}
                      </span>
                    </div>
                  </>
                ) : (
                  // Stuffing: operator picks an empty container
                  <>
                    <Label>{UI_MESSAGES.DESTUFFING.SELECT_LABEL}</Label>
                    <Select
                      value={selectedContainer}
                      onValueChange={setSelectedContainer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={UI_MESSAGES.DESTUFFING.CHOOSE_CONTAINER} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingContainers ? (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            {UI_MESSAGES.BILLING.LOADING}
                          </div>
                        ) : availableContainers.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            {UI_MESSAGES.DESTUFFING.NO_MATCHING_CONTAINERS}
                          </div>
                        ) : (
                          availableContainers
                            .filter(
                              (container: AvailableContainer) =>
                                !!(container._id || container.id),
                            )
                            .map((container: AvailableContainer) => {
                              const cId = (container._id || container.id) as string;
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
                            })
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.containerSize &&
                        selectedRequest.containerType
                        ? UI_MESSAGES.DESTUFFING.SHOWING_MATCHING_CONTAINERS(selectedRequest.containerSize, selectedRequest.containerType)
                        : UI_MESSAGES.DESTUFFING.SHOWING_ALL_EMPTY}
                    </p>
                  </>
                )}
              </div>

              {/* Cargo Category Adjustment */}
              <div className="space-y-2">
                <Label htmlFor="category">{UI_MESSAGES.DESTUFFING.CHANGE_CATEGORY_OPT}</Label>
                <Select
                  value={selectedCargoCategoryId}
                  onValueChange={setSelectedCargoCategoryId}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={UI_MESSAGES.STUFFING.SELECT_TASK_TYPE} />
                  </SelectTrigger>
                  <SelectContent>
                    {cargoCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id || ""}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {UI_MESSAGES.DESTUFFING.CHANGE_CATEGORY_OPT}
                </p>
                {selectedCargoCategoryId !== "none" && selectedCargoCategoryId !== "" && (
                  <div className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">{UI_MESSAGES.DESTUFFING.CALCULATED_CHARGE}</span>
                      <span className="text-primary font-bold">
                        {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{(((selectedRequest?.cargoWeight || 0) / 1000) *
                          (cargoCategories.find(c => c.id === selectedCargoCategoryId)?.chargePerTon || 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">
                      {UI_MESSAGES.DESTUFFING.CHARGE_BASIS(
                        ((selectedRequest?.cargoWeight || 0) / 1000).toFixed(3),
                        cargoCategories.find(c => c.id === selectedCargoCategoryId)?.chargePerTon || 0
                      )}
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
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              onClick={handleAllocate}
              disabled={
                selectedRequest?.type !== "destuffing" && !selectedContainer
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {UI_MESSAGES.DESTUFFING.ALLOCATE_CONTAINER}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.DESTUFFING.REJECT_REQUEST}</DialogTitle>
            <DialogDescription>
              {UI_MESSAGES.DESTUFFING.REJECT_REASON_DESC}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{UI_MESSAGES.DESTUFFING.REJECT_REASON_LABEL}</Label>
              <Textarea
                placeholder={UI_MESSAGES.DESTUFFING.REJECT_REASON_PLACEHOLDER}
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
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              {UI_MESSAGES.DESTUFFING.REJECT_REQUEST}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
