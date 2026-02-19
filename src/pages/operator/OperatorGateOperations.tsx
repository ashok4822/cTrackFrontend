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
  Send,
} from "lucide-react";
import {
  dummyGateOperations,
  dummyKPIData,
  dummyShippingLines,
} from "@/data/dummyData";
import type { GateOperation } from "@/types";
import { useState } from "react";

export default function OperatorGateOperations() {
  const [selectedOperation, setSelectedOperation] =
    useState<GateOperation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDamage, setHasDamage] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");

  const gateIns = dummyGateOperations.filter((op) => op.type === "gate-in");
  const gateOuts = dummyGateOperations.filter((op) => op.type === "gate-out");
  const pending = dummyGateOperations.filter((op) => op.status === "pending");

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedOperation(item)}
            >
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
          value={dummyKPIData.gateInToday}
          icon={ArrowDownToLine}
          variant="success"
        />
        <KPICard
          title="Gate-Outs Today"
          value={dummyKPIData.gateOutToday}
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
        <Dialog>
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
                  <Input id="container" placeholder="e.g., MSCU1234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Container Size</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft">20ft</SelectItem>
                      <SelectItem value="40ft">40ft</SelectItem>
                      <SelectItem value="45ft">45ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="containerType">Container Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="reefer">Reefer</SelectItem>
                      <SelectItem value="tank">Tank</SelectItem>
                      <SelectItem value="open-top">Open Top</SelectItem>
                      <SelectItem value="flat-rack">Flat Rack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="movementType">Movement Type</Label>
                  <Select>
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping line" />
                    </SelectTrigger>
                    <SelectContent>
                      {dummyShippingLines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name}
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
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Number</Label>
                  <Input id="vehicle" placeholder="e.g., TN01AB1234" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Driver Name</Label>
                  <Input id="driver" placeholder="Enter driver name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select>
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
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="seal">Seal Number</Label>
                <Input id="seal" placeholder="Enter seal number" />
              </div>
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireApproval"
                    checked={requiresApproval}
                    onCheckedChange={(checked) =>
                      setRequiresApproval(checked === true)
                    }
                  />
                  <Label
                    htmlFor="requireApproval"
                    className="cursor-pointer text-primary font-medium"
                  >
                    <Send className="h-3 w-3 inline mr-1" />
                    Request Manager Approval
                  </Label>
                </div>
                {requiresApproval && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="approvalReason">
                      Reason for Approval *
                    </Label>
                    <Textarea
                      id="approvalReason"
                      placeholder="Explain why manager approval is needed..."
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button onClick={() => {}}>
                {requiresApproval ? "Submit for Approval" : "Process Gate-In"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
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
                  <Input id="lookup" placeholder="Search container..." />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="out-vehicle">Vehicle Number</Label>
                <Input id="out-vehicle" placeholder="e.g., TN01AB1234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="out-driver">Driver Name</Label>
                <Input id="out-driver" placeholder="Enter driver name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Select>
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
              <Button variant="outline">Cancel</Button>
              <Button>Process Gate-Out</Button>
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
              <TabsTrigger value="all">
                All ({dummyGateOperations.length})
              </TabsTrigger>
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
                data={dummyGateOperations}
                columns={columns}
                searchable
                searchPlaceholder="Search operations..."
              />
            </TabsContent>
            <TabsContent value="gate-in">
              <DataTable data={gateIns} columns={columns} searchable />
            </TabsContent>
            <TabsContent value="gate-out">
              <DataTable data={gateOuts} columns={columns} searchable />
            </TabsContent>
            <TabsContent value="pending">
              <DataTable
                data={pending}
                columns={columns}
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
