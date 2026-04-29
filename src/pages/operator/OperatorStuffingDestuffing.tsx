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
  DialogClose,
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
import { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { UI_MESSAGES } from "@/constants/messages";
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

  const fetchData = useCallback(async () => {
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


      setRequests(activeRequests);
      setEquipment(equipData);
    } catch (error) {
      console.error("fetchData Error:", error);
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.CONTAINER.FETCH_FAILED,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        title: UI_MESSAGES.PDA.MISSING_INFO,
        description: UI_MESSAGES.DESTUFFING.SELECT_EQUIPMENT,
        variant: "destructive",
      });
      return;
    }

    try {
      await containerRequestService.updateRequest(selectedRequest.id, {
        status: "ready-for-dispatch",
        equipmentId: dispatchForm.equipmentId,
      });

      toast({
        title: UI_MESSAGES.DESTUFFING.DISPATCH_SUCCESS,
        description: UI_MESSAGES.DESTUFFING.DISPATCH_SUCCESS_DESC(selectedRequest.containerNumber || selectedRequest.id),
      });

      setDispatchDialogOpen(false);
      setSelectedRequest(null);
      setDispatchForm({ equipmentId: "" });
      fetchData(); // Refresh data
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.UPDATE_STATUS_FAILED,
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
        title: UI_MESSAGES.TRANSIT.OPERATION_COMPLETED,
        description: UI_MESSAGES.TRANSIT.OPERATION_COMPLETED_DESC(containerNumber || id),
      });
      fetchData();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.TRANSIT.COMPLETE_OPERATION_FAILED,
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
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) =>
        item.containerNumber || (
          <span className="text-muted-foreground italic">{UI_MESSAGES.TABLE.NEW_REQUEST_ITALIC}</span>
        ),
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
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
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => {
        // Map backend "approved" to frontend "pending" for the operator's view
        const displayStatus =
          item.status === "approved" ? "pending" : item.status;
        return <StatusBadge status={displayStatus} />;
      },
    },
    {
      key: "preferredDate",
      header: UI_MESSAGES.TABLE.PREFERRED_DATE,
      render: (item) =>
        item.preferredDate
          ? new Date(item.preferredDate).toLocaleDateString()
          : "N/A",
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex gap-2">
          {item.status === "approved" && (
            <Button size="sm" onClick={() => openDispatchDialog(item)}>
              {UI_MESSAGES.TABLE.DISPATCH}
            </Button>
          )}
          {item.status === "at-factory" && (
            <Button
              size="sm"
              variant="default"
              className="bg-success hover:bg-success/90"
              onClick={() => handleComplete(item.id, item.containerNumber)}
            >
              {UI_MESSAGES.TABLE.COMPLETE}
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRequest(item)}
              >
                {UI_MESSAGES.TABLE.VIEW}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {item.type === "stuffing" ? UI_MESSAGES.DESTUFFING.STUFFING_OPERATION : UI_MESSAGES.DESTUFFING.DESTUFFING_OPERATION}
                </DialogTitle>
                <DialogDescription>
                  {item.containerNumber || UI_MESSAGES.DESTUFFING.NEW_CONTAINER} -{" "}
                  {item.status === "approved" ? UI_MESSAGES.KPI.PENDING : item.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.CONTAINER}</Label>
                    <p className="font-medium">{item.containerNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</Label>
                    <p className="font-medium capitalize">{item.type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.CARGO_DESC}</Label>
                    <p className="font-medium text-sm">
                      {item.cargoDescription || UI_MESSAGES.COMMON.NO_DATA}
                    </p>
                  </div>
                </div>
                {item.remarks && (
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.STUFFING.NOTES}</Label>
                    <p className="text-sm">{item.remarks}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{UI_MESSAGES.COMMON.CANCEL}</Button>
                </DialogClose>
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
          title={UI_MESSAGES.KPI.PENDING}
          value={counts.pending}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.KPI.PENDING_DISPATCH}
          value={counts.ready}
          icon={Package}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.IN_TRANSIT}
          value={counts.transit}
          icon={PackagePlus}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.KPI.DELIVERED}
          value={counts.completed}
          icon={PackageMinus}
        />
      </div>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>{UI_MESSAGES.TABLE.OPERATIONS}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={requests}
            columns={columns}
            searchable
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_OPERATIONS}
          />
        </CardContent>
      </Card>

      {/* Dispatch Dialog */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.DESTUFFING.DISPATCH_CONTAINER}</DialogTitle>
            <DialogDescription>
              {UI_MESSAGES.DESTUFFING.DISPATCH_CONTAINER_DESC(selectedRequest?.containerNumber || UI_MESSAGES.DESTUFFING.NEW_CONTAINER)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{UI_MESSAGES.DESTUFFING.SELECT_EQUIPMENT}</Label>
              <Select
                value={dispatchForm.equipmentId}
                onValueChange={(v) =>
                  setDispatchForm((prev) => ({ ...prev, equipmentId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={UI_MESSAGES.DESTUFFING.CHOOSE_EQUIPMENT} />
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
                      {UI_MESSAGES.DESTUFFING.NO_EQUIPMENT_AVAILABLE}
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
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button onClick={handleDispatch}>
              <Truck className="h-4 w-4 mr-2" />
              {UI_MESSAGES.DESTUFFING.CONFIRM_DISPATCH}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Approval Dialog */}
    </DashboardLayout>
  );
}
