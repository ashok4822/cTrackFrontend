import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { GateOutDialog } from "@/components/gate/GateOutDialog";
import { VehicleDetailsDialog } from "@/components/vehicles/VehicleDetailsDialog";
import { EquipmentDetailsDialog } from "@/components/equipment/EquipmentDetailsDialog";
import { createGateOperation } from "@/store/slices/gateOperationSlice";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Forklift, RefreshCw, LogIn, LogOut } from "lucide-react";
import type { Vehicle, Equipment } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles } from "@/store/slices/vehicleSlice";
import { fetchEquipment, updateEquipment } from "@/store/slices/equipmentSlice";
import { UI_MESSAGES } from "@/constants/messages";

export default function OperatorEquipmentVehicles() {
  const dispatch = useAppDispatch();

  const { vehicles, isLoading: isVehiclesLoading } = useAppSelector(
    (state) => state.vehicle,
  );
  const { equipment, isLoading: isEquipmentLoading } = useAppSelector(
    (state) => state.equipment,
  );

  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [selectedItemForStatus, setSelectedItemForStatus] =
    useState<Equipment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newVehicleGateInOpen, setNewVehicleGateInOpen] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    type: "truck" as Vehicle["type"],
    gpsDeviceId: "",
  });

  const [gateOutOpen, setGateOutOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [taskForm, setTaskForm] = useState({
    taskType: "",
    containerId: "",
    fromLocation: "",
    toLocation: "",
    priority: "normal",
    notes: "",
  });

  const [statusForm, setStatusForm] = useState({
    status: "",
    notes: "",
  });

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchEquipment());
  }, [dispatch]);

  const activeEquipment = equipment.filter((e) => e.status === "operational");
  const vehiclesInTerminal = vehicles.filter((v) => v.status === "in-yard");

  const handleAssignTask = () => {
    if (!selectedEquipment || !taskForm.taskType || !taskForm.containerId) {
      toast.error(UI_MESSAGES.PDA.MISSING_INFO, {
        description: UI_MESSAGES.PDA.FILL_REQUIRED_FIELDS,
      });
      return;
    }

    toast.success(UI_MESSAGES.PDA.TASK_ASSIGNED, {
      description: UI_MESSAGES.PDA.TASK_ASSIGNED_DESC(selectedEquipment.name, taskForm.containerId),
    });
    setAssignTaskOpen(false);
    setSelectedEquipment(null);
    setTaskForm({
      taskType: "",
      containerId: "",
      fromLocation: "",
      toLocation: "",
      priority: "normal",
      notes: "",
    });
  };

  const handleUpdateStatus = async () => {
    if (!selectedItemForStatus || !statusForm.status) {
      toast.error(UI_MESSAGES.PDA.MISSING_INFO, {
        description: UI_MESSAGES.PDA.SELECT_STATUS,
      });
      return;
    }

    try {
      await dispatch(
        updateEquipment({
          id: selectedItemForStatus.id,
          data: { status: statusForm.status as Equipment["status"] },
        }),
      ).unwrap();

      toast.success(UI_MESSAGES.PDA.STATUS_UPDATED, {
        description: UI_MESSAGES.PDA.STATUS_UPDATED_DESC(statusForm.status),
      });
      setUpdateStatusOpen(false);
      setSelectedItemForStatus(null);
      setStatusForm({
        status: "",
        notes: "",
      });
    } catch (err: unknown) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : UI_MESSAGES.EQUIPMENT.UPDATE_STATUS_FAILED;
      toast.error(UI_MESSAGES.TITLES.ERROR, {
        description: message,
      });
    }
  };

  const openUpdateStatus = (item: Equipment) => {
    setSelectedItemForStatus(item);
    setStatusForm({ status: item.status, notes: "" });
    setUpdateStatusOpen(true);
  };

  const openGateOut = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setGateOutOpen(true);
  };

  const handleNewVehicleGateIn = async () => {
    if (
      !newVehicleForm.vehicleNumber ||
      !newVehicleForm.driverName ||
      !newVehicleForm.driverPhone
    ) {
      toast.error(UI_MESSAGES.PDA.MISSING_INFO, {
        description: UI_MESSAGES.PDA.FILL_REQUIRED_FIELDS,
      });
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(
        createGateOperation({
          type: "gate-in",
          vehicleNumber: newVehicleForm.vehicleNumber,
          driverName: newVehicleForm.driverName,
          driverPhone: newVehicleForm.driverPhone,
          vehicleType: newVehicleForm.type,
          purpose: "port",
          remarks: UI_MESSAGES.DIALOG.VEHICLE_GATE_IN,
        }),
      ).unwrap();

      await dispatch(fetchVehicles()).unwrap();

      toast.success(UI_MESSAGES.PDA.GATE_IN_SUCCESS, {
        description: UI_MESSAGES.PDA.GATE_IN_SUCCESS_DESC(newVehicleForm.vehicleNumber),
      });
      setNewVehicleGateInOpen(false);
      setNewVehicleForm({
        vehicleNumber: "",
        driverName: "",
        driverPhone: "",
        type: "truck",
        gpsDeviceId: "",
      });
    } catch (err: unknown) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : UI_MESSAGES.GATE.RECORD_GATE_IN_FAILED;
      toast.error(UI_MESSAGES.GATE.GATE_IN_FAILED, {
        description: message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGateOutSubmit = async (data: CreateGateOperationData) => {
    try {
      setIsProcessing(true);
      await dispatch(createGateOperation(data)).unwrap();
      await dispatch(fetchVehicles()).unwrap(); // Refresh vehicle list to show "out-of-yard"
      toast.success(UI_MESSAGES.PDA.GATE_OUT_SUCCESS, {
        description: UI_MESSAGES.PDA.GATE_OUT_SUCCESS_DESC(data.vehicleNumber),
      });
      setGateOutOpen(false);
    } catch (err: unknown) {
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : UI_MESSAGES.GATE.RECORD_GATE_OUT_FAILED;
      toast.error(UI_MESSAGES.GATE.GATE_OUT_FAILED, {
        description: message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const vehicleColumns: Column<Vehicle>[] = [
    { key: "vehicleNumber", header: UI_MESSAGES.TABLE.VEHICLE_NO, sortable: true },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    { key: "driverName", header: UI_MESSAGES.TABLE.DRIVER },
    { key: "driverPhone", header: UI_MESSAGES.TABLE.PHONE },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => (
        <StatusBadge
          status={item.status === "in-yard" ? "gate-in" : "gate-out"}
        />
      ),
    },
    {
      key: "gpsDeviceId",
      header: UI_MESSAGES.TABLE.GPS_DEVICE,
      render: (item) => item.gpsDeviceId || UI_MESSAGES.COMMON.NA,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex gap-2">
          {item.status === "in-yard" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openGateOut(item)}
            >
              <LogOut className="h-3 w-3 mr-1" />
              {UI_MESSAGES.TABLE.GATE_OUT}
            </Button>
          )}
          <VehicleDetailsDialog vehicle={item} />
        </div>
      ),
    },
  ];

  const equipmentColumns: Column<Equipment>[] = [
    { key: "name", header: UI_MESSAGES.TABLE.EQUIPMENT, sortable: true },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      render: (item) => (
        <span className="capitalize">{item.type.replace("-", " ")}</span>
      ),
    },
    { key: "operator", header: UI_MESSAGES.TABLE.OPERATOR },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "lastMaintenance",
      header: UI_MESSAGES.TABLE.LAST_MAINTENANCE,
      render: (item) =>
        item.lastMaintenance
          ? new Date(item.lastMaintenance).toLocaleDateString()
          : UI_MESSAGES.COMMON.NA,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openUpdateStatus(item)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {UI_MESSAGES.TABLE.UPDATE_STATUS}
          </Button>
          <EquipmentDetailsDialog equipment={item} />
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle={UI_MESSAGES.TITLES.VEHICLES_EQUIPMENT}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title={UI_MESSAGES.KPI.VEHICLES_IN_YARD}
          value={vehiclesInTerminal.length}
          icon={Truck}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.KPI.TOTAL_EQUIPMENT}
          value={equipment.length}
          icon={Forklift}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.OPERATIONAL_EQUIPMENT}
          value={activeEquipment.length}
          icon={Forklift}
          variant="default"
        />
      </div>

      {/* Tabs for Vehicles and Equipment */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="vehicles">
            <TabsList className="mb-4">
              <TabsTrigger value="vehicles">
                {UI_MESSAGES.TABLE.VEHICLES(vehicles.length)}
              </TabsTrigger>
              <TabsTrigger value="equipment">
                {UI_MESSAGES.TABLE.EQUIPMENT_TAB(equipment.length)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vehicles">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setNewVehicleGateInOpen(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {UI_MESSAGES.DIALOG.VEHICLE_GATE_IN}
                </Button>
              </div>
              <DataTable
                data={vehicles}
                columns={vehicleColumns}
                isLoading={isVehiclesLoading}
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_VEHICLES}
              />
            </TabsContent>
            <TabsContent value="equipment">
              <DataTable
                data={equipment}
                columns={equipmentColumns}
                isLoading={isEquipmentLoading}
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_EQUIPMENT}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Task Dialog */}
      <Dialog open={assignTaskOpen} onOpenChange={setAssignTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.DIALOG.ASSIGN_TASK}</DialogTitle>
            <DialogDescription>
              {selectedEquipment?.name} -{" "}
              {selectedEquipment?.type.replace("-", " ")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{UI_MESSAGES.STUFFING.TASK_TYPE}</Label>
              <Select
                value={taskForm.taskType}
                onValueChange={(v) =>
                  setTaskForm((prev) => ({ ...prev, taskType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={UI_MESSAGES.STUFFING.SELECT_TASK_TYPE} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move">{UI_MESSAGES.STUFFING.SHIFT_CONTAINER}</SelectItem>
                  <SelectItem value="stack">{UI_MESSAGES.STUFFING.STACK_CONTAINER}</SelectItem>
                  <SelectItem value="load">{UI_MESSAGES.STUFFING.LOAD_TO_TRUCK}</SelectItem>
                  <SelectItem value="unload">{UI_MESSAGES.STUFFING.UNLOAD_FROM_TRUCK}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{UI_MESSAGES.STUFFING.CONTAINER_ID_REQ}</Label>
              <Input
                placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.CONTAINER_NO_EG}
                value={taskForm.containerId}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    containerId: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{UI_MESSAGES.STUFFING.FROM_LOCATION}</Label>
                <Input
                  placeholder={UI_MESSAGES.TABLE.EG_A}
                  value={taskForm.fromLocation}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      fromLocation: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{UI_MESSAGES.STUFFING.TO_LOCATION}</Label>
                <Input
                  placeholder={UI_MESSAGES.TABLE.EG_B}
                  value={taskForm.toLocation}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      toLocation: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{UI_MESSAGES.STUFFING.PRIORITY}</Label>
              <Select
                value={taskForm.priority}
                onValueChange={(v) =>
                  setTaskForm((prev) => ({ ...prev, priority: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{UI_MESSAGES.STUFFING.LOW}</SelectItem>
                  <SelectItem value="normal">{UI_MESSAGES.STUFFING.NORMAL}</SelectItem>
                  <SelectItem value="high">{UI_MESSAGES.STUFFING.HIGH}</SelectItem>
                  <SelectItem value="urgent">{UI_MESSAGES.STUFFING.URGENT}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{UI_MESSAGES.STUFFING.NOTES}</Label>
              <Textarea
                placeholder={UI_MESSAGES.STUFFING.NOTES_PLACEHOLDER}
                value={taskForm.notes}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTaskOpen(false)}>
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button onClick={handleAssignTask}>{UI_MESSAGES.DIALOG.ASSIGN_TASK}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.DIALOG.UPDATE_EQUIPMENT_STATUS}</DialogTitle>
            <DialogDescription>
              {selectedItemForStatus?.name} - {UI_MESSAGES.TABLE.STATUS}:{" "}
              <span className="capitalize">
                {selectedItemForStatus?.status}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{UI_MESSAGES.TABLE.NEW_STATUS}</Label>
              <Select
                value={statusForm.status}
                onValueChange={(v) =>
                  setStatusForm((prev) => ({ ...prev, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={UI_MESSAGES.TABLE.ALL_STATUSES} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">{UI_MESSAGES.TABLE.OPERATIONAL}</SelectItem>
                  <SelectItem value="maintenance">{UI_MESSAGES.TABLE.MAINTENANCE}</SelectItem>
                  <SelectItem value="idle">{UI_MESSAGES.TABLE.IDLE}</SelectItem>
                  <SelectItem value="breakdown">{UI_MESSAGES.TABLE.BREAKDOWN}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{UI_MESSAGES.STUFFING.NOTES}</Label>
              <Textarea
                placeholder={UI_MESSAGES.DIALOG.REASON_STATUS_CHANGE}
                value={statusForm.notes}
                onChange={(e) =>
                  setStatusForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateStatusOpen(false)}
            >
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button onClick={handleUpdateStatus}>{UI_MESSAGES.TABLE.UPDATE_STATUS}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Vehicle Gate-In Dialog */}
      <Dialog
        open={newVehicleGateInOpen}
        onOpenChange={setNewVehicleGateInOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-success" />
              {UI_MESSAGES.DIALOG.VEHICLE_GATE_IN}
            </DialogTitle>
            <DialogDescription>
              {UI_MESSAGES.DIALOG.VEHICLE_GATE_IN_DESC}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-vehicle-number">{UI_MESSAGES.TABLE.VEHICLE_NUMBER_REQ}</Label>
              <Input
                id="new-vehicle-number"
                placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.VEHICLE_NO_EG}
                value={newVehicleForm.vehicleNumber}
                onChange={(e) =>
                  setNewVehicleForm((prev) => ({
                    ...prev,
                    vehicleNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-driver-name">{UI_MESSAGES.TABLE.DRIVER_NAME_REQ}</Label>
              <Input
                id="new-driver-name"
                placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.DRIVER_NAME}
                value={newVehicleForm.driverName}
                onChange={(e) =>
                  setNewVehicleForm((prev) => ({
                    ...prev,
                    driverName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-driver-phone">{UI_MESSAGES.TABLE.DRIVER_PHONE_REQ}</Label>
              <Input
                id="new-driver-phone"
                placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.PHONE_EG}
                value={newVehicleForm.driverPhone}
                onChange={(e) =>
                  setNewVehicleForm((prev) => ({
                    ...prev,
                    driverPhone: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-vehicle-type">{UI_MESSAGES.TABLE.VEHICLE_TYPE_REQ}</Label>
              <Select
                value={newVehicleForm.type}
                onValueChange={(v) =>
                  setNewVehicleForm((prev) => ({
                    ...prev,
                    type: v as Vehicle["type"],
                  }))
                }
              >
                <SelectTrigger id="new-vehicle-type">
                  <SelectValue placeholder={UI_MESSAGES.VEHICLE.SELECT_VEHICLE_TYPE} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">{UI_MESSAGES.TABLE.TRUCK}</SelectItem>
                  <SelectItem value="trailer">{UI_MESSAGES.TABLE.TRAILER}</SelectItem>
                  <SelectItem value="chassis">{UI_MESSAGES.TABLE.CHASSIS}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpsDeviceId">{UI_MESSAGES.TABLE.GPS_DEVICE_ID_OPT}</Label>
              <Input
                id="gpsDeviceId"
                placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.GPS_DEVICE_ID}
                value={newVehicleForm.gpsDeviceId}
                onChange={(e) =>
                  setNewVehicleForm((prev) => ({
                    ...prev,
                    gpsDeviceId: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewVehicleGateInOpen(false)}
              disabled={isProcessing}
            >
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button onClick={handleNewVehicleGateIn} disabled={isProcessing}>
              {isProcessing ? UI_MESSAGES.BILLING.PROCESSING : UI_MESSAGES.AUTH.VERIFY_CREATE}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GateOutDialog
        open={gateOutOpen}
        onOpenChange={setGateOutOpen}
        onSubmit={handleGateOutSubmit}
        loading={isProcessing}
        vehicle={selectedVehicle}
        isContainerRequired={false}
      />
    </DashboardLayout>
  );
}
