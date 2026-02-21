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
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles } from "@/store/slices/vehicleSlice";
import { fetchEquipment, updateEquipment } from "@/store/slices/equipmentSlice";

export default function OperatorEquipmentVehicles() {
  const { toast } = useToast();
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
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Task Assigned",
      description: `Task assigned to ${selectedEquipment.name} for container ${taskForm.containerId}.`,
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
      toast({
        title: "Missing Information",
        description: "Please select a status.",
        variant: "destructive",
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

      toast({
        title: "Status Updated",
        description: `Status updated successfully to ${statusForm.status}.`,
      });
      setUpdateStatusOpen(false);
      setSelectedItemForStatus(null);
      setStatusForm({
        status: "",
        notes: "",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
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
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
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
          remarks: "Vehicle entry",
        }),
      ).unwrap();

      await dispatch(fetchVehicles()).unwrap();

      toast({
        title: "Vehicle Gate-In Successful",
        description: `${newVehicleForm.vehicleNumber} has entered the terminal.`,
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
        err instanceof Error ? err.message : "Failed to record vehicle gate-in";
      toast({
        title: "Gate-In Failed",
        description: message,
        variant: "destructive",
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
      toast({
        title: "Vehicle Gated Out",
        description: `${data.vehicleNumber} has left the terminal.`,
      });
      setGateOutOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const vehicleColumns: Column<Vehicle>[] = [
    { key: "vehicleNumber", header: "Vehicle No.", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    { key: "driverName", header: "Driver" },
    { key: "driverPhone", header: "Phone" },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <StatusBadge
          status={item.status === "in-yard" ? "gate-in" : "gate-out"}
        />
      ),
    },
    {
      key: "gpsDeviceId",
      header: "GPS Device",
      render: (item) => item.gpsDeviceId || "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          {item.status === "in-yard" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openGateOut(item)}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Gate Out
            </Button>
          )}
          <VehicleDetailsDialog vehicle={item} />
        </div>
      ),
    },
  ];

  const equipmentColumns: Column<Equipment>[] = [
    { key: "name", header: "Equipment", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <span className="capitalize">{item.type.replace("-", " ")}</span>
      ),
    },
    { key: "operator", header: "Operator" },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "lastMaintenance",
      header: "Last Maintenance",
      render: (item) =>
        item.lastMaintenance
          ? new Date(item.lastMaintenance).toLocaleDateString()
          : "N/A",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openUpdateStatus(item)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Update Status
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle="Equipment & Vehicles"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Vehicles in Yard"
          value={vehiclesInTerminal.length}
          icon={Truck}
          variant="success"
        />
        <KPICard
          title="Total Equipment"
          value={equipment.length}
          icon={Forklift}
          variant="primary"
        />
        <KPICard
          title="Operational Equipment"
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
                Vehicles ({vehicles.length})
              </TabsTrigger>
              <TabsTrigger value="equipment">
                Equipment ({equipment.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vehicles">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setNewVehicleGateInOpen(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Vehicle Gate-In
                </Button>
              </div>
              <DataTable
                data={vehicles}
                columns={vehicleColumns}
                isLoading={isVehiclesLoading}
                searchPlaceholder="Search vehicles..."
              />
            </TabsContent>
            <TabsContent value="equipment">
              <DataTable
                data={equipment}
                columns={equipmentColumns}
                isLoading={isEquipmentLoading}
                searchPlaceholder="Search equipment..."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Task Dialog */}
      <Dialog open={assignTaskOpen} onOpenChange={setAssignTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task to Equipment</DialogTitle>
            <DialogDescription>
              {selectedEquipment?.name} -{" "}
              {selectedEquipment?.type.replace("-", " ")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Type *</Label>
              <Select
                value={taskForm.taskType}
                onValueChange={(v) =>
                  setTaskForm((prev) => ({ ...prev, taskType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move">Shift Container</SelectItem>
                  <SelectItem value="stack">Stack Container</SelectItem>
                  <SelectItem value="load">Load to Truck</SelectItem>
                  <SelectItem value="unload">Unload from Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Container ID *</Label>
              <Input
                placeholder="e.g., MSKU1234567"
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
                <Label>From Location</Label>
                <Input
                  placeholder="e.g., A"
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
                <Label>To Location</Label>
                <Input
                  placeholder="e.g., B"
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
              <Label>Priority</Label>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional instructions..."
                value={taskForm.notes}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTask}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Equipment Status</DialogTitle>
            <DialogDescription>
              {selectedItemForStatus?.name} - Current:{" "}
              <span className="capitalize">
                {selectedItemForStatus?.status}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status *</Label>
              <Select
                value={statusForm.status}
                onValueChange={(v) =>
                  setStatusForm((prev) => ({ ...prev, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Reason for status change..."
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
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus}>Update Status</Button>
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
              Vehicle Gate-In
            </DialogTitle>
            <DialogDescription>
              Enter vehicle and driver details to process gate-in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-vehicle-number">Vehicle Number *</Label>
              <Input
                id="new-vehicle-number"
                placeholder="e.g., TN-01-AB-1234"
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
              <Label htmlFor="new-driver-name">Driver Name *</Label>
              <Input
                id="new-driver-name"
                placeholder="Enter driver name"
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
              <Label htmlFor="new-driver-phone">Driver Mobile Number *</Label>
              <Input
                id="new-driver-phone"
                placeholder="e.g., +91 98765 43210"
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
              <Label htmlFor="new-vehicle-type">Vehicle Type *</Label>
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
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="chassis">Chassis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpsDeviceId">GPS Device ID (Optional)</Label>
              <Input
                id="gpsDeviceId"
                placeholder="Enter GPS device ID"
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
              Cancel
            </Button>
            <Button onClick={handleNewVehicleGateIn} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Confirm Gate-In"}
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
