import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { adminNavItems } from "@/config/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GateOutDialog } from "@/components/gate/GateOutDialog";
import { createGateOperation } from "@/store/slices/gateOperationSlice";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle, Equipment } from "@/types";
import {
  Truck,
  Wrench,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  LogOut,
  ArrowDownToLine,
} from "lucide-react";
import { VehicleDetailsDialog } from "@/components/vehicles/VehicleDetailsDialog";
import { EquipmentDetailsDialog } from "@/components/equipment/EquipmentDetailsDialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchVehicles,
  updateVehicle,
  deleteVehicle,
} from "@/store/slices/vehicleSlice";
import {
  fetchEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
} from "@/store/slices/equipmentSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UI_MESSAGES } from "@/constants/messages";

export default function VehiclesEquipment() {
  // const { toast } = useToast(); // Switching to sonner
  const dispatch = useAppDispatch();
  const { vehicles, isLoading: vehiclesLoading } = useAppSelector(
    (state) => state.vehicle,
  );
  const { equipment, isLoading: equipmentLoading } = useAppSelector(
    (state) => state.equipment,
  );
  const [activeTab, setActiveTab] = useState("vehicles");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Vehicle | Equipment | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "vehicle" | "equipment";
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchEquipment());
  }, [dispatch]);

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    type: "truck" as "truck" | "trailer" | "chassis",
    status: "in-yard" as "in-yard" | "out-of-yard",
    gpsDeviceId: "",
  });

  const [gateOutOpen, setGateOutOpen] = useState(false);
  const [selectedVehicleForGateOut, setSelectedVehicleForGateOut] =
    useState<Vehicle | null>(null);

  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    type: "reach-stacker" as "reach-stacker" | "forklift" | "crane",
    status: "operational" as "operational" | "maintenance" | "down" | "idle",
    operator: "",
  });

  const operationalEquipment = equipment.filter(
    (e) => e.status === "operational",
  ).length;

  const vehiclesInYard = vehicles.filter((v) => v.status === "in-yard").length;
  // const vehiclesOutOfYard = vehicles.filter(
  //   (v) => v.status === "out-of-yard",
  // ).length;

  const vehicleColumns: Column<Vehicle>[] = [
    {
      key: "vehicleNumber",
      header: UI_MESSAGES.TABLE.VEHICLE_NO,
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">
          {item.vehicleNumber}
        </span>
      ),
    },
    {
      key: "driverName",
      header: UI_MESSAGES.TABLE.DRIVER,
      sortable: true,
    },
    {
      key: "driverPhone",
      header: UI_MESSAGES.TABLE.PHONE,
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
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
              className="h-8"
              onClick={() => handleOpenGateOut(item)}
            >
              <LogOut className="h-3 w-3 mr-1 text-blue-600" />
              {UI_MESSAGES.TABLE.GATE_OUT}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenEditVehicle(item)}>
                <Edit className="mr-2 h-4 w-4" />
                {UI_MESSAGES.COMMON.EDIT}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleOpenDelete("vehicle", item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {UI_MESSAGES.COMMON.DELETE}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <VehicleDetailsDialog vehicle={item} />
        </div>
      ),
    },
  ];

  const equipmentColumns: Column<Equipment>[] = [
    {
      key: "name",
      header: UI_MESSAGES.EQUIPMENT.EQUIPMENT_ID,
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">{item.name}</span>
      ),
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      render: (item) => (
        <span className="capitalize">{item.type.replace("-", " ")}</span>
      ),
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "operator",
      header: UI_MESSAGES.TABLE.OPERATOR,
      render: (item) => item.operator || UI_MESSAGES.COMMON.NA,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenEditEquipment(item)}>
                <Edit className="mr-2 h-4 w-4" />
                {UI_MESSAGES.COMMON.EDIT}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleOpenDelete("equipment", item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {UI_MESSAGES.COMMON.DELETE}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <EquipmentDetailsDialog equipment={item} />
        </div>
      ),
    },
  ];

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setIsEditMode(true);
    setSelectedItem(vehicle);
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      type: vehicle.type,
      status: vehicle.status,
      gpsDeviceId: vehicle.gpsDeviceId || "",
    });
    setActiveTab("vehicles");
    setAddDialogOpen(true);
  };

  const handleOpenEditEquipment = (equipment: Equipment) => {
    setIsEditMode(true);
    setSelectedItem(equipment);
    setEquipmentForm({
      name: equipment.name,
      type: equipment.type,
      status: equipment.status,
      operator: equipment.operator || "",
    });
    setActiveTab("equipment");
    setAddDialogOpen(true);
  };

  const handleOpenDelete = (type: "vehicle" | "equipment", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleOpenGateOut = (vehicle: Vehicle) => {
    setSelectedVehicleForGateOut(vehicle);
    setGateOutOpen(true);
  };

  const handleGateOutSubmit = async (data: CreateGateOperationData) => {
    try {
      setIsProcessing(true);
      await dispatch(createGateOperation(data)).unwrap();
      await dispatch(fetchVehicles()).unwrap(); // Refresh vehicle list
      toast.success(UI_MESSAGES.PDA.GATE_OUT_SUCCESS, {
        description: UI_MESSAGES.PDA.GATE_OUT_SUCCESS_DESC(data.vehicleNumber),
      });
      setGateOutOpen(false);
    } catch (err) {
      console.error("Gate-out error:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : UI_MESSAGES.GATE.RECORD_GATE_OUT_FAILED;
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "vehicle") {
        await dispatch(deleteVehicle(itemToDelete.id)).unwrap();
        toast.success(UI_MESSAGES.VEHICLE.DELETE_SUCCESS, {
          description: UI_MESSAGES.VEHICLE.DELETE_SUCCESS_DESC,
        });
      } else {
        await dispatch(deleteEquipment(itemToDelete.id)).unwrap();
        toast.success(UI_MESSAGES.EQUIPMENT.DELETE_SUCCESS, {
          description: UI_MESSAGES.EQUIPMENT.DELETE_SUCCESS_DESC,
        });
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : UI_MESSAGES.VEHICLE.DELETE_FAILED;
      toast.error(message);
    }
  };

  const handleSaveVehicle = async () => {
    try {
      if (isEditMode && selectedItem) {
        await dispatch(
          updateVehicle({
            id: selectedItem.id,
            data: vehicleForm,
          }),
        ).unwrap();
        toast.success(UI_MESSAGES.VEHICLE.UPDATE_SUCCESS, {
          description: UI_MESSAGES.VEHICLE.UPDATE_SUCCESS_DESC(vehicleForm.vehicleNumber),
        });
      } else {
        await dispatch(
          createGateOperation({
            type: "gate-in",
            vehicleNumber: vehicleForm.vehicleNumber,
            driverName: vehicleForm.driverName,
            driverPhone: vehicleForm.driverPhone,
            vehicleType: vehicleForm.type,
            purpose: "port",
          }),
        ).unwrap();
        await dispatch(fetchVehicles()).unwrap();
        toast.success(UI_MESSAGES.PDA.GATE_IN_SUCCESS, {
          description: UI_MESSAGES.VEHICLE.GATE_IN_SUCCESS_DESC(vehicleForm.vehicleNumber),
        });
      }
      setAddDialogOpen(false);
      resetForms();
    } catch (error) {
      console.error("Save vehicle error:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : UI_MESSAGES.VEHICLE.ADD_FAILED;
      toast.error(message);
    }
  };

  const handleSaveEquipment = async () => {
    try {
      if (isEditMode && selectedItem) {
        await dispatch(
          updateEquipment({
            id: selectedItem.id,
            data: equipmentForm,
          }),
        ).unwrap();
        toast.success(UI_MESSAGES.EQUIPMENT.UPDATE_SUCCESS, {
          description: UI_MESSAGES.EQUIPMENT.UPDATE_SUCCESS_DESC(equipmentForm.name),
        });
      } else {
        await dispatch(
          addEquipment({
            ...equipmentForm,
          }),
        ).unwrap();
        toast.success(UI_MESSAGES.EQUIPMENT.ADD_SUCCESS, {
          description: UI_MESSAGES.EQUIPMENT.ADD_SUCCESS_DESC(equipmentForm.name),
        });
      }
      setAddDialogOpen(false);
      resetForms();
    } catch (error) {
      console.error("Save equipment error:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : UI_MESSAGES.EQUIPMENT.ADD_FAILED;
      toast.error(message);
    }
  };

  const resetForms = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    setVehicleForm({
      vehicleNumber: "",
      driverName: "",
      driverPhone: "",
      type: "truck",
      status: "in-yard",
      gpsDeviceId: "",
    });
    setEquipmentForm({
      name: "",
      type: "reach-stacker",
      status: "operational",
      operator: "",
    });
  };

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle={UI_MESSAGES.TITLES.VEHICLES_EQUIPMENT}
      pageActions={
        <Button
          className="gap-2"
          onClick={() => {
            resetForms();
            setAddDialogOpen(true);
          }}
        >
          {activeTab === "vehicles" ? (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              {UI_MESSAGES.TITLES.VEHICLE_GATE_IN}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              {UI_MESSAGES.TITLES.ADD_NEW}
            </>
          )}
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Truck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {vehiclesInYard}
                </p>
                <p className="text-sm text-muted-foreground">
                  {UI_MESSAGES.KPI.VEHICLES_IN_YARD}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/20">
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {vehiclesOutOfYard}
                </p>
                <p className="text-sm text-muted-foreground">Out of Yard</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {equipment.length}
                </p>
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.KPI.TOTAL_EQUIPMENT}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Wrench className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {operationalEquipment}
                </p>
                <p className="text-sm text-muted-foreground">{UI_MESSAGES.KPI.OPERATIONAL_EQUIPMENT}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="vehicles">{UI_MESSAGES.TABLE.VEHICLES(vehicles.length)}</TabsTrigger>
          <TabsTrigger value="equipment">{UI_MESSAGES.TABLE.EQUIPMENT_TAB(equipment.length)}</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <DataTable
            data={vehicles}
            columns={vehicleColumns}
            isLoading={vehiclesLoading}
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_VEHICLES}
          />
        </TabsContent>

        <TabsContent value="equipment">
          <DataTable
            data={equipment}
            columns={equipmentColumns}
            isLoading={equipmentLoading}
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_EQUIPMENT}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetForms();
        }}
      >
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? (
                <Edit className="h-5 w-5" />
              ) : activeTab === "vehicles" ? (
                <ArrowDownToLine className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {isEditMode
                ? (activeTab === "vehicles" ? UI_MESSAGES.TITLES.EDIT_VEHICLE : UI_MESSAGES.TITLES.EDIT_EQUIPMENT)
                : activeTab === "vehicles"
                  ? UI_MESSAGES.TITLES.VEHICLE_GATE_IN
                  : UI_MESSAGES.TITLES.ADD_NEW_EQUIPMENT}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {activeTab === "vehicles" ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">{UI_MESSAGES.TABLE.VEHICLE_NUMBER_REQ}</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.VEHICLE_NO_EG}
                    value={vehicleForm.vehicleNumber}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        vehicleNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverName">{UI_MESSAGES.TABLE.DRIVER_NAME_REQ}</Label>
                  <Input
                    id="driverName"
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.DRIVER_NAME}
                    value={vehicleForm.driverName}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        driverName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverPhone">{UI_MESSAGES.TABLE.DRIVER_PHONE_REQ}</Label>
                  <Input
                    id="driverPhone"
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.PHONE_EG}
                    value={vehicleForm.driverPhone}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        driverPhone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">{UI_MESSAGES.TABLE.VEHICLE_TYPE_REQ}</Label>
                  <Select
                    value={vehicleForm.type}
                    onValueChange={(value: "truck" | "trailer" | "chassis") =>
                      setVehicleForm({ ...vehicleForm, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    value={vehicleForm.gpsDeviceId}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        gpsDeviceId: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentName">{UI_MESSAGES.EQUIPMENT.EQUIPMENT_ID} *</Label>
                  <Input
                    id="equipmentName"
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.EQUIPMENT_ID_EG}
                    value={equipmentForm.name}
                    onChange={(e) =>
                      setEquipmentForm({
                        ...equipmentForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">{UI_MESSAGES.TABLE.TYPE}</Label>
                  <Select
                    value={equipmentForm.type}
                    onValueChange={(
                      value: "reach-stacker" | "forklift" | "crane",
                    ) => setEquipmentForm({ ...equipmentForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reach-stacker">
                        {UI_MESSAGES.EQUIPMENT.REACH_STACKER}
                      </SelectItem>
                      <SelectItem value="forklift">{UI_MESSAGES.EQUIPMENT.FORKLIFT}</SelectItem>
                      <SelectItem value="crane">{UI_MESSAGES.EQUIPMENT.CRANE}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator">{UI_MESSAGES.TABLE.OPERATOR} ({UI_MESSAGES.COMMON.INFO})</Label>
                  <Input
                    id="operator"
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.OPERATOR_NAME}
                    value={equipmentForm.operator}
                    onChange={(e) =>
                      setEquipmentForm({
                        ...equipmentForm,
                        operator: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentStatus">{UI_MESSAGES.TABLE.STATUS}</Label>
                  <Select
                    value={equipmentForm.status}
                    onValueChange={(
                      value: "operational" | "maintenance" | "down" | "idle",
                    ) => setEquipmentForm({ ...equipmentForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">{UI_MESSAGES.TABLE.OPERATIONAL}</SelectItem>
                      <SelectItem value="maintenance">{UI_MESSAGES.TABLE.MAINTENANCE}</SelectItem>
                      <SelectItem value="down">{UI_MESSAGES.EQUIPMENT.DOWN}</SelectItem>
                      <SelectItem value="idle">{UI_MESSAGES.TABLE.IDLE}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                resetForms();
              }}
            >
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              onClick={
                activeTab === "vehicles"
                  ? handleSaveVehicle
                  : handleSaveEquipment
              }
              disabled={
                activeTab === "vehicles"
                  ? !vehicleForm.vehicleNumber ||
                    !vehicleForm.driverName ||
                    !vehicleForm.driverPhone
                  : !equipmentForm.name
              }
            >
              {activeTab === "vehicles" ? (
                <>
                  {vehiclesLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? UI_MESSAGES.TITLES.UPDATE_VEHICLE : UI_MESSAGES.TITLES.ADD_VEHICLE}
                </>
              ) : (
                <>
                  {equipmentLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? UI_MESSAGES.TITLES.UPDATE_EQUIPMENT : UI_MESSAGES.TITLES.ADD_EQUIPMENT}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {itemToDelete?.type} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Gate Out Dialog */}
      <GateOutDialog
        open={gateOutOpen}
        onOpenChange={setGateOutOpen}
        onSubmit={handleGateOutSubmit}
        loading={isProcessing}
        vehicle={selectedVehicleForGateOut}
        isContainerRequired={false}
      />
    </DashboardLayout>
  );
}
