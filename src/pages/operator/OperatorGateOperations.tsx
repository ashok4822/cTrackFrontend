import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DoorOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Search,
  Clock,
} from "lucide-react";
import { fetchShippingLines } from "@/store/slices/shippingLineSlice";
import type {
  GateOperation,
  ContainerSize,
  ContainerType,
  MovementType,
} from "@/types";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchGateOperations,
  createGateOperation,
} from "@/store/slices/gateOperationSlice";
import { fetchKPIData } from "@/store/slices/dashboardSlice";
import { toast } from "sonner";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import api from "@/services/api";

export default function OperatorGateOperations() {
  const dispatch = useAppDispatch();
  const {
    operations,
    loading,
    error: reduxError,
  } = useAppSelector((state) => state.gateOperations);
  const { kpiData } = useAppSelector((state) => state.dashboard);
  const { lines: shippingLines } = useAppSelector((state) => state.shippingLine);

  const [isGateInDialogOpen, setIsGateInDialogOpen] = useState(false);
  const [isGateOutDialogOpen, setIsGateOutDialogOpen] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDamage, setHasDamage] = useState(false);

  const initialGateInData = {
    containerNumber: "",
    size: "40ft" as ContainerSize,
    type: "standard" as ContainerType,
    shippingLine: "",
    vehicleNumber: "",
    driverName: "",
    purpose: "port" as GateOperation["purpose"],
    sealNumber: "",
    weight: "",
    cargoWeight: "",
    remarks: "",
    movementType: "import" as MovementType,
  };

  const [gateInData, setGateInData] = useState(initialGateInData);

  const initialGateOutData = {
    containerNumber: "",
    vehicleNumber: "",
    driverName: "",
    purpose: "port" as GateOperation["purpose"],
    remarks: "",
  };

  const [gateOutData, setGateOutData] = useState(initialGateOutData);

  useEffect(() => {
    dispatch(fetchGateOperations({}));
    dispatch(fetchKPIData());
    dispatch(fetchShippingLines());
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
    }
  }, [reduxError]);

  const handleContainerLookup = async () => {
    if (!gateOutData.containerNumber) {
      toast.error("Please enter a container number");
      return;
    }

    setIsLookupLoading(true);
    try {
      const response = await api.get(
        `/containers?containerNumber=${gateOutData.containerNumber}`
      );
      const containers = response.data;
      if (containers && containers.length > 0) {
        setLookupResult(containers[0]);
        toast.success("Container found in yard");
      } else {
        setLookupResult(null);
        toast.error("Container not found in yard");
      }
    } catch (err) {
      toast.error("Failed to lookup container");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleGateInSubmit = async () => {
    try {
      const payload: CreateGateOperationData = {
        type: "gate-in",
        containerNumber: gateInData.containerNumber,
        vehicleNumber: gateInData.vehicleNumber,
        driverName: gateInData.driverName,
        purpose: gateInData.purpose,
        remarks: gateInData.remarks,
        size: gateInData.size,
        containerType: gateInData.type,
        shippingLine: gateInData.shippingLine,
        weight: gateInData.weight ? Number(gateInData.weight) : undefined,
        cargoWeight: gateInData.cargoWeight
          ? Number(gateInData.cargoWeight)
          : undefined,
        sealNumber: gateInData.sealNumber,
        empty: !isLoaded,
        movementType: gateInData.movementType,
      };
      await dispatch(createGateOperation(payload)).unwrap();
      toast.success("Gate-In recorded successfully");
      setIsGateInDialogOpen(false);
      setGateInData(initialGateInData);
      setIsLoaded(false);
      setHasDamage(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to record Gate-In");
    }
  };

  const handleGateOutSubmit = async () => {
    try {
      const payload: CreateGateOperationData = {
        type: "gate-out",
        containerNumber: gateOutData.containerNumber,
        vehicleNumber: gateOutData.vehicleNumber,
        driverName: gateOutData.driverName,
        purpose: gateOutData.purpose,
        remarks: gateOutData.remarks,
      };
      await dispatch(createGateOperation(payload)).unwrap();
      toast.success("Gate-Out recorded successfully");
      setIsGateOutDialogOpen(false);
      setGateOutData(initialGateOutData);
      setLookupResult(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to record Gate-Out");
    }
  };

  const gateIns = operations.filter((op) => op.type === "gate-in");
  const gateOuts = operations.filter((op) => op.type === "gate-out");
  const pending = operations.filter((op) => op.status === "pending");

  const columns: Column<GateOperation>[] = [
    { key: "containerNumber", header: "Container No.", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.type === "gate-in" ? (
            <ArrowDownToLine className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpFromLine className="h-4 w-4 text-primary" />
          )}
          <span className="capitalize">{item.type.replace("-", " ")}</span>
        </div>
      ),
    },
    { key: "vehicleNumber", header: "Vehicle", sortable: true },
    { key: "driverName", header: "Driver" },
    {
      key: "purpose",
      header: "Purpose",
      render: (item) => <span className="capitalize">{item.purpose}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "timestamp",
      header: "Time",
      render: (item) => new Date(item.timestamp).toLocaleString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Process
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Gate Operation</DialogTitle>
              <DialogDescription>
                {item.type === "gate-in" ? "Gate-In" : "Gate-Out"} for{" "}
                {item.containerNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Container</Label>
                  <p className="font-medium">{item.containerNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">{item.vehicleNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Driver</Label>
                  <p className="font-medium">{item.driverName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Purpose</Label>
                  <p className="font-medium capitalize">{item.purpose}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seal">Seal Number</Label>
                <Input id="seal" placeholder="Enter seal number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" placeholder="Add any remarks..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>
                Complete {item.type === "gate-in" ? "Gate-In" : "Gate-Out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle="Container Gate Operations"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Gate-Ins Today"
          value={kpiData?.gateInToday || 0}
          icon={ArrowDownToLine}
          variant="success"
        />
        <KPICard
          title="Gate-Outs Today"
          value={kpiData?.gateOutToday || 0}
          icon={ArrowUpFromLine}
          variant="primary"
        />
        <KPICard
          title="Pending Operations"
          value={pending.length}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Total Processed"
          value={gateIns.length + gateOuts.length}
          icon={DoorOpen}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Dialog open={isGateInDialogOpen} onOpenChange={setIsGateInDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Gate-In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Gate-In</DialogTitle>
              <DialogDescription>
                Record a new container gate-in
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="container">Container Number</Label>
                  <Input
                    id="container"
                    placeholder="e.g., MSCU1234567"
                    value={gateInData.containerNumber}
                    onChange={(e) =>
                      setGateInData({
                        ...gateInData,
                        containerNumber: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Container Size</Label>
                  <Select
                    value={gateInData.size}
                    onValueChange={(value) =>
                      setGateInData({
                        ...gateInData,
                        size: value as ContainerSize,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft">20ft</SelectItem>
                      <SelectItem value="40ft">40ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="containerType">Container Type</Label>
                  <Select
                    value={gateInData.type}
                    onValueChange={(value) =>
                      setGateInData({
                        ...gateInData,
                        type: value as ContainerType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="reefer">Reefer</SelectItem>
                      <SelectItem value="tank">Tank</SelectItem>
                      <SelectItem value="open-top">Open Top</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="movementType">Movement Type</Label>
                  <Select
                    value={gateInData.movementType}
                    onValueChange={(value) =>
                      setGateInData({
                        ...gateInData,
                        movementType: value as MovementType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="import">Import</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                      <SelectItem value="domestic">Domestic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingLine">Shipping Line</Label>
                  <Select
                    value={gateInData.shippingLine}
                    onValueChange={(value) =>
                      setGateInData({ ...gateInData, shippingLine: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping line" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingLines.map((line) => (
                        <SelectItem key={line.id} value={line.shipping_line_name}>
                          {line.shipping_line_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tareWeight">Tare Weight (kg)</Label>
                  <Input
                    id="tareWeight"
                    type="number"
                    placeholder="e.g., 2200"
                    value={gateInData.weight}
                    onChange={(e) => setGateInData({ ...gateInData, weight: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Number</Label>
                  <Input
                    id="vehicle"
                    placeholder="e.g., TN01AB1234"
                    value={gateInData.vehicleNumber}
                    onChange={(e) =>
                      setGateInData({
                        ...gateInData,
                        vehicleNumber: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Driver Name</Label>
                  <Input
                    id="driver"
                    placeholder="Enter driver name"
                    value={gateInData.driverName}
                    onChange={(e) =>
                      setGateInData({
                        ...gateInData,
                        driverName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  value={gateInData.purpose}
                  onValueChange={(value) =>
                    setGateInData({
                      ...gateInData,
                      purpose: value as GateOperation["purpose"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="port">From Port</SelectItem>
                    <SelectItem value="factory">From Factory</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="loaded"
                    checked={isLoaded}
                    onCheckedChange={(checked) => setIsLoaded(checked === true)}
                  />
                  <Label htmlFor="loaded" className="cursor-pointer">
                    Loaded Container
                  </Label>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="damage"
                    checked={hasDamage}
                    onCheckedChange={(checked) =>
                      setHasDamage(checked === true)
                    }
                  />
                  <Label
                    htmlFor="damage"
                    className="cursor-pointer text-destructive"
                  >
                    Has Damage
                  </Label>
                </div>
              </div>
              {isLoaded && (
                <div className="space-y-2">
                  <Label htmlFor="cargoWeight">Cargo Weight (kg)</Label>
                  <Input
                    id="cargoWeight"
                    type="number"
                    placeholder="e.g., 18000"
                    value={gateInData.cargoWeight}
                    onChange={(e) => setGateInData({ ...gateInData, cargoWeight: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="seal">Seal Number</Label>
                <Input
                  id="seal"
                  placeholder="Enter seal number"
                  value={gateInData.sealNumber}
                  onChange={(e) =>
                    setGateInData({ ...gateInData, sealNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleGateInSubmit} disabled={loading}>
                {loading ? "Processing..." : "Process Gate-In"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isGateOutDialogOpen} onOpenChange={setIsGateOutDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Gate-Out
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Gate-Out</DialogTitle>
              <DialogDescription>
                Process a container gate-out
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lookup">Container Lookup</Label>
                <div className="flex gap-2">
                  <Input
                    id="lookup"
                    placeholder="Search container..."
                    value={gateOutData.containerNumber}
                    onChange={(e) =>
                      setGateOutData({
                        ...gateOutData,
                        containerNumber: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleContainerLookup}
                    disabled={isLookupLoading}
                  >
                    <Search className={`h-4 w-4 ${isLookupLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              {lookupResult && (
                <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                  <p><span className="font-medium">Shipping Line:</span> {lookupResult.shippingLine}</p>
                  <p><span className="font-medium">Type:</span> {lookupResult.size} {lookupResult.type}</p>
                  <p><span className="font-medium">Status:</span> {lookupResult.status}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="out-vehicle">Vehicle Number</Label>
                <Input
                  id="out-vehicle"
                  placeholder="e.g., TN01AB1234"
                  value={gateOutData.vehicleNumber}
                  onChange={(e) =>
                    setGateOutData({
                      ...gateOutData,
                      vehicleNumber: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="out-driver">Driver Name</Label>
                <Input
                  id="out-driver"
                  placeholder="Enter driver name"
                  value={gateOutData.driverName}
                  onChange={(e) =>
                    setGateOutData({
                      ...gateOutData,
                      driverName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Select
                  value={gateOutData.purpose}
                  onValueChange={(value) =>
                    setGateOutData({
                      ...gateOutData,
                      purpose: value as GateOperation["purpose"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="port">To Port</SelectItem>
                    <SelectItem value="factory">To Factory</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGateOutDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleGateOutSubmit}
                disabled={loading || !lookupResult}
              >
                {loading ? "Processing..." : "Process Gate-Out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gate Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Container Gate Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({operations.length})</TabsTrigger>
              <TabsTrigger value="gate-in">
                Gate-In ({gateIns.length})
              </TabsTrigger>
              <TabsTrigger value="gate-out">
                Gate-Out ({gateOuts.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pending.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={operations}
                columns={columns}
                isLoading={loading}
                searchable
                searchPlaceholder="Search operations..."
              />
            </TabsContent>
            <TabsContent value="gate-in">
              <DataTable
                data={gateIns}
                columns={columns}
                isLoading={loading}
                searchable
              />
            </TabsContent>
            <TabsContent value="gate-out">
              <DataTable
                data={gateOuts}
                columns={columns}
                isLoading={loading}
                searchable
              />
            </TabsContent>
            <TabsContent value="pending">
              <DataTable
                data={pending}
                columns={columns}
                isLoading={loading}
                searchable
                emptyMessage="No pending operations"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
