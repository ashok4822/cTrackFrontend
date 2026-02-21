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
import { AxiosError } from "axios";
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
} from "lucide-react";
import { VehicleDetailsDialog } from "@/components/vehicles/VehicleDetailsDialog";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/store/slices/vehicleSlice";
import {
  fetchEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment,
} from "@/store/slices/equipmentSlice";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function VehiclesEquipment() {
  const { toast } = useToast();
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
    status: "out-of-yard" as "in-yard" | "out-of-yard",
    gpsDeviceId: "",
  });

  const [gateOutOpen, setGateOutOpen] = useState(false);
  const [selectedVehicleForGateOut, setSelectedVehicleForGateOut] = useState<Vehicle | null>(null);

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
  const vehiclesOutOfYard = vehicles.filter((v) => v.status === "out-of-yard").length;

  const vehicleColumns: Column<Vehicle>[] = [
    {
      key: "vehicleNumber",
      header: "Vehicle No.",
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">
          {item.vehicleNumber}
        </span>
      ),
    },
    {
      key: "driverName",
      header: "Driver",
      sortable: true,
    },
    {
      key: "driverPhone",
      header: "Phone",
    },
    {
      key: "type",
      header: "Type",
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status === 'in-yard' ? 'gate-in' : 'gate-out'} />,
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
              className="h-8"
              onClick={() => handleOpenGateOut(item)}
            >
              <LogOut className="h-3 w-3 mr-1 text-blue-600" />
              Gate Out
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleOpenDelete("vehicle", item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
      header: "Equipment ID",
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">{item.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <span className="capitalize">{item.type.replace("-", " ")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "operator",
      header: "Operator",
      render: (item) => item.operator || "-",
    },
    {
      key: "lastMaintenance",
      header: "Last Maintenance",
      render: (item) =>
        item.lastMaintenance
          ? new Date(item.lastMaintenance).toLocaleDateString()
          : "-",
    },
    {
      key: "nextMaintenance",
      header: "Next Maintenance",
      render: (item) =>
        item.nextMaintenance
          ? new Date(item.nextMaintenance).toLocaleDateString()
          : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenEditEquipment(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleOpenDelete("equipment", item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      toast({
        title: "Vehicle Gated Out",
        description: `${data.vehicleNumber} has left the terminal.`,
      });
      setGateOutOpen(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || "Failed to process gate-out");
      }
      throw err; // GateOutDialog will handle showing the error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "vehicle") {
        await dispatch(deleteVehicle(itemToDelete.id)).unwrap();
        toast({
          title: "Vehicle Deleted",
          description: "Vehicle removed successfully",
        });
      } else {
        await dispatch(deleteEquipment(itemToDelete.id)).unwrap();
        toast({
          title: "Equipment Deleted",
          description: "Equipment removed successfully",
        });
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as string) || "Failed to delete item",
        variant: "destructive",
      });
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
        toast({
          title: "Vehicle Updated",
          description: `Vehicle ${vehicleForm.vehicleNumber} updated successfully.`,
        });
      } else {
        await dispatch(
          addVehicle({
            ...vehicleForm,
          }),
        ).unwrap();
        toast({
          title: "Vehicle Added",
          description: `Vehicle ${vehicleForm.vehicleNumber} added successfully.`,
        });
      }
      setAddDialogOpen(false);
      resetForms();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as string) || "Failed to save vehicle",
        variant: "destructive",
      });
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
        toast({
          title: "Equipment Updated",
          description: `Equipment ${equipmentForm.name} updated successfully.`,
        });
      } else {
        await dispatch(
          addEquipment({
            ...equipmentForm,
          }),
        ).unwrap();
        toast({
          title: "Equipment Added",
          description: `Equipment ${equipmentForm.name} added successfully.`,
        });
      }
      setAddDialogOpen(false);
      resetForms();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as string) || "Failed to save equipment",
        variant: "destructive",
      });
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
      status: "out-of-yard",
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
      pageTitle="Vehicles & Equipment"
      pageActions={
        <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add New
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
                <p className="text-sm text-muted-foreground">In Yard</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
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
        </Card>
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
                <p className="text-sm text-muted-foreground">Total Equipment</p>
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
                <p className="text-sm text-muted-foreground">Operational</p>
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
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          {vehiclesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <DataTable
              data={vehicles}
              columns={vehicleColumns}
              searchPlaceholder="Search vehicles..."
            />
          )}
        </TabsContent>

        <TabsContent value="equipment">
          {equipmentLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <DataTable
              data={equipment}
              columns={equipmentColumns}
              searchPlaceholder="Search equipment..."
            />
          )}
        </TabsContent>
      </Tabs >

      {/* Add/Edit Dialog */}
      < Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetForms();
        }
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? (
                <Edit className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {isEditMode ? "Edit" : "Add New"}{" "}
              {activeTab === "vehicles" ? "Vehicle" : "Equipment"}
            </DialogTitle>
          </DialogHeader>

          {activeTab === "vehicles" ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., TRK-001"
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
                <Label htmlFor="driverName">Driver Name *</Label>
                <Input
                  id="driverName"
                  placeholder="Enter driver name"
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
                <Label htmlFor="driverPhone">Driver Phone *</Label>
                <Input
                  id="driverPhone"
                  placeholder="Enter phone number"
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
                <Label htmlFor="vehicleType">Vehicle Type</Label>
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
                <Label htmlFor="equipmentName">Equipment ID/Name *</Label>
                <Input
                  id="equipmentName"
                  placeholder="e.g., RS-001"
                  value={equipmentForm.name}
                  onChange={(e) =>
                    setEquipmentForm({ ...equipmentForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipmentType">Equipment Type</Label>
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
                    <SelectItem value="reach-stacker">Reach Stacker</SelectItem>
                    <SelectItem value="forklift">Forklift</SelectItem>
                    <SelectItem value="crane">Crane</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operator">Assigned Operator (Optional)</Label>
                <Input
                  id="operator"
                  placeholder="Enter operator name"
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
                <Label htmlFor="equipmentStatus">Status</Label>
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
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                resetForms();
              }}
            >
              Cancel
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
                  {isEditMode ? "Update Vehicle" : "Add Vehicle"}
                </>
              ) : (
                <>
                  {equipmentLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Equipment" : "Add Equipment"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Delete Confirmation */}
      < AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} >
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
      </AlertDialog >
      {/* Gate Out Dialog */}
      < GateOutDialog
        open={gateOutOpen}
        onOpenChange={setGateOutOpen}
        onSubmit={handleGateOutSubmit}
        loading={isProcessing}
        vehicle={selectedVehicleForGateOut}
        isContainerRequired={false}
      />
    </DashboardLayout >
  );
}
