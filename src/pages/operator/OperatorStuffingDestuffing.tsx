import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, PackagePlus, PackageMinus, Clock } from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import { equipmentService } from "@/services/equipmentService";
import type { ContainerRequest, Equipment } from "@/types";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

export default function OperatorStuffingDestuffing() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<ContainerRequest | null>(null);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    equipmentId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, equipData] = await Promise.all([
        containerRequestService.getAllRequests(),
        equipmentService.getEquipment({ status: "operational" }),
      ]);

      // Map backend "approved" to "pending" implicitly in UI
      const activeRequests = reqData.filter((req: ContainerRequest) =>
        [
          "approved",
          "ready-for-dispatch",
          "in-transit",
          "at-factory",
          "operation-completed",
          "completed",
        ].includes(req.status),
      );

      console.log("Raw API Response:", reqData);
      console.log("Active Requests Filtered:", activeRequests);

      setRequests(activeRequests);
      setEquipment(equipData);
    } catch (error) {
      console.error("fetchData Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch necessary data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const counts = useMemo(() => {
    return {
      pending: requests.filter((op) => op.status === "approved").length,
      ready: requests.filter((op) => op.status === "ready-for-dispatch").length,
      transit: requests.filter(
        (op) => op.status === "in-transit" || op.status === "at-factory",
      ).length,
      completed: requests.filter((op) => op.status === "completed").length,
    };
  }, [requests]);

  const handleDispatch = async () => {
    if (!selectedRequest || !dispatchForm.equipmentId) {
      toast({
        title: "Missing Information",
        description: "Please select equipment.",
        variant: "destructive",
      });
      return;
    }

    try {
      await containerRequestService.updateRequest(selectedRequest.id, {
        status: "ready-for-dispatch",
      });

      toast({
        title: "Operation Dispatched",
        description: `Container ${selectedRequest.containerNumber || selectedRequest.id} is now ready for dispatch.`,
      });

      setDispatchDialogOpen(false);
      setSelectedRequest(null);
      setDispatchForm({ equipmentId: "" });
      fetchData(); // Refresh data
    } catch {
      toast({
        title: "Error",
        description: "Failed to update operation status.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (id: string, containerNumber?: string) => {
    try {
      await containerRequestService.updateRequest(id, {
        status: "completed",
      });
      toast({
        title: "Operation Completed",
        description: `Request ${containerNumber || id} has been marked as completed.`,
      });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to complete operation.",
        variant: "destructive",
      });
    }
  };

  const openDispatchDialog = (req: ContainerRequest) => {
    setSelectedRequest(req);
    setDispatchForm({ equipmentId: "" });
    setDispatchDialogOpen(true);
  };

  const columns: Column<ContainerRequest>[] = [
    {
      key: "containerNumber",
      header: "Container No.",
      sortable: true,
      render: (item) =>
        item.containerNumber || (
          <span className="text-muted-foreground italic">New Request</span>
        ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.type === "stuffing" ? (
            <PackagePlus className="h-4 w-4 text-success" />
          ) : (
            <PackageMinus className="h-4 w-4 text-primary" />
          )}
          <span className="capitalize">{item.type}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        // Map backend "approved" to frontend "pending" for the operator's view
        const displayStatus =
          item.status === "approved" ? "pending" : item.status;
        return <StatusBadge status={displayStatus} />;
      },
    },
    {
      key: "preferredDate",
      header: "Preferred Date",
      render: (item) =>
        item.preferredDate
          ? new Date(item.preferredDate).toLocaleDateString()
          : "N/A",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          {item.status === "approved" && (
            <Button size="sm" onClick={() => openDispatchDialog(item)}>
              Dispatch
            </Button>
          )}
          {item.status === "at-factory" && (
            <Button
              size="sm"
              variant="default"
              className="bg-success hover:bg-success/90"
              onClick={() => handleComplete(item.id, item.containerNumber)}
            >
              Complete
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRequest(item)}
              >
                View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {item.type === "stuffing" ? "Stuffing" : "Destuffing"}{" "}
                  Operation
                </DialogTitle>
                <DialogDescription>
                  {item.containerNumber || "New Container"} -{" "}
                  {item.status === "approved" ? "Pending" : item.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Container</Label>
                    <p className="font-medium">{item.containerNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium capitalize">{item.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cargo</Label>
                    <p className="font-medium text-sm">
                      {item.cargoDescription || "N/A"}
                    </p>
                  </div>
                </div>
                {item.remarks && (
                  <div>
                    <Label className="text-muted-foreground">Remarks</Label>
                    <p className="text-sm">{item.remarks}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        navItems={operatorNavItems}
        pageTitle="Stuffing / Destuffing"
      >
        <div className="flex h-[400px] items-center justify-center">
          <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle="Stuffing / Destuffing"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Pending"
          value={counts.pending}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Ready for Dispatch"
          value={counts.ready}
          icon={Package}
          variant="primary"
        />
        <KPICard
          title="In Transit"
          value={counts.transit}
          icon={PackagePlus}
          variant="success"
        />
        <KPICard
          title="Completed"
          value={counts.completed}
          icon={PackageMinus}
        />
      </div>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={requests}
            columns={columns}
            searchable
            searchPlaceholder="Search operations..."
          />
        </CardContent>
      </Card>

      {/* Dispatch Dialog */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch Container</DialogTitle>
            <DialogDescription>
              Select equipment to load container{" "}
              {selectedRequest?.containerNumber || "New Request"} for dispatch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Equipment</Label>
              <Select
                value={dispatchForm.equipmentId}
                onValueChange={(v) =>
                  setDispatchForm((prev) => ({ ...prev, equipmentId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.length > 0 ? (
                    equipment.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.type})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground italic">
                      No operational equipment available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDispatchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDispatch}>
              <Truck className="h-4 w-4 mr-2" />
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Approval Dialog */}
    </DashboardLayout>
  );
}
