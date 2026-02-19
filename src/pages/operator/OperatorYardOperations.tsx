import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Progress } from "@/components/ui/progress";
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
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Container,
  ArrowRightLeft,
  Search,
  Plus,
  Grid3X3,
} from "lucide-react";
import type { Container as ContainerType } from "@/types";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBlocks } from "@/store/slices/yardSlice";
import {
  fetchContainers,
  updateContainer,
} from "@/store/slices/containerSlice";
import { toast } from "sonner";

export default function OperatorYardOperations() {
  const dispatch = useAppDispatch();
  const { blocks, isLoading: yardLoading } = useAppSelector(
    (state) => state.yard,
  );
  const { containers, isLoading: containerLoading } = useAppSelector(
    (state) => state.container,
  );

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [containerSearch, setContainerSearch] = useState("");
  const debouncedSearch = useDebounce(containerSearch, 400);

  const [sizeFilter, setSizeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");

  // Filter labels/options
  const sizes = ["20ft", "40ft"];
  const types = ["Standard", "Reefer", "Tank", "Open-Top"];

  // Form states for assign
  const [assignForm, setAssignForm] = useState({
    containerNumber: "",
    block: "",
  });

  // Form states for shift
  const [shiftForm, setShiftForm] = useState({
    id: "",
    containerNumber: "",
    fromBlock: "",
    toBlock: "",
    equipment: "",
  });

  useEffect(() => {
    dispatch(fetchBlocks());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchContainers({
        containerNumber: debouncedSearch,
        size: sizeFilter === "all" ? undefined : sizeFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
        block: blockFilter === "all" ? undefined : blockFilter,
        status: "in-yard",
      }),
    );
  }, [dispatch, debouncedSearch, sizeFilter, typeFilter, blockFilter]);

  const inYardContainers = containers.filter((c) => c.status === "in-yard");

  // Calculate occupancy mapping
  const blockOccupancy = containers.reduce(
    (acc, container) => {
      const blockName = container.yardLocation?.block;
      if (blockName) {
        acc[blockName] = (acc[blockName] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  // Stats
  const totalCapacity = blocks.reduce((sum, b) => sum + b.capacity, 0);
  const totalOccupied = Object.values(blockOccupancy).reduce(
    (acc, count) => acc + count,
    0,
  );
  const freeSlots = totalCapacity - totalOccupied;
  const yardUtilization =
    totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const handleAssignContainer = async () => {
    if (!assignForm.containerNumber || !assignForm.block) {
      toast.error("Please fill in all fields");
      return;
    }

    const container = containers.find(
      (c) => c.containerNumber === assignForm.containerNumber,
    );
    if (!container) {
      toast.error("Container not found");
      return;
    }

    try {
      await dispatch(
        updateContainer({
          id: container.id,
          data: { yardLocation: { block: assignForm.block } },
        }),
      ).unwrap();
      toast.success("Container assigned successfully");
      setAssignDialogOpen(false);
      setAssignForm({ containerNumber: "", block: "" });
      dispatch(fetchBlocks()); // Refresh blocks for updated occupancy
      dispatch(
        fetchContainers({
          containerNumber: containerSearch,
          size: sizeFilter === "all" ? undefined : sizeFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
          block: blockFilter === "all" ? undefined : blockFilter,
          status: "in-yard",
        }),
      );
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to assign container",
      );
    }
  };

  const handleShiftContainer = async () => {
    if (!shiftForm.id || !shiftForm.toBlock) {
      toast.error("Please select a target block");
      return;
    }

    try {
      await dispatch(
        updateContainer({
          id: shiftForm.id,
          data: { yardLocation: { block: shiftForm.toBlock } },
        }),
      ).unwrap();
      toast.success("Container shifted successfully");
      setShiftDialogOpen(false);
      setShiftForm({
        id: "",
        containerNumber: "",
        fromBlock: "",
        toBlock: "",
        equipment: "",
      });
      dispatch(fetchBlocks());
      dispatch(fetchContainers());
    } catch (error) {
      toast.error(
        typeof error === "string" ? error : "Failed to shift container",
      );
    }
  };

  const columns: Column<ContainerType>[] = [
    { key: "containerNumber", header: "Container No.", sortable: true },
    { key: "size", header: "Size" },
    {
      key: "type",
      header: "Type",
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    { key: "shippingLine", header: "Shipping Line" },
    {
      key: "yardLocation",
      header: "Block",
      render: (item) => item.yardLocation?.block || "N/A",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "dwellTime",
      header: "Dwell Time",
      render: (item) => (item.dwellTime ? `${item.dwellTime} days` : "N/A"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShiftForm({
                id: item.id,
                containerNumber: item.containerNumber,
                fromBlock: item.yardLocation?.block || "",
                toBlock: "",
                equipment: "",
              });
              setShiftDialogOpen(true);
            }}
          >
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            Shift
          </Button>
        </div>
      ),
    },
  ];

  const isLoading = yardLoading || containerLoading;

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Yard Operations">
      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Container to Block
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Container to Yard Block</DialogTitle>
              <DialogDescription>
                Assign a container to a specific yard block
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Container Number</Label>
                <Input
                  placeholder="e.g., MSCU1234567"
                  value={assignForm.containerNumber}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      containerNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Block</Label>
                <Select
                  value={assignForm.block}
                  onValueChange={(v) =>
                    setAssignForm({ ...assignForm, block: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Block" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((block) => (
                      <SelectItem key={block.id} value={block.name}>
                        {block.name} ({block.capacity - block.occupied} free)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignContainer}>Assign Container</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Shift Container
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Shift Container Between Blocks</DialogTitle>
              <DialogDescription>
                Move a container from one yard block to another
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Container Number</Label>
                <Input disabled value={shiftForm.containerNumber} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Block</Label>
                  <Input disabled value={shiftForm.fromBlock || "N/A"} />
                </div>

                <div className="space-y-2">
                  <Label>To Block</Label>
                  <Select
                    value={shiftForm.toBlock}
                    onValueChange={(v) =>
                      setShiftForm({ ...shiftForm, toBlock: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Target Block" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((block) => (
                        <SelectItem key={block.id} value={block.name}>
                          {block.name} ({block.capacity - block.occupied} free)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Equipment (Optional)</Label>
                <Select
                  value={shiftForm.equipment}
                  onValueChange={(v) =>
                    setShiftForm({ ...shiftForm, equipment: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment for move" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rs-001">Reach Stacker RS-001</SelectItem>
                    <SelectItem value="rs-002">Reach Stacker RS-002</SelectItem>
                    <SelectItem value="fl-001">Forklift FL-001</SelectItem>
                    <SelectItem value="sc-001">
                      Straddle Carrier SC-001
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShiftDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleShiftContainer}>Confirm Shift</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Containers in Yard"
          value={inYardContainers.length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title="Yard Utilization"
          value={`${yardUtilization}%`}
          icon={MapPin}
          variant="success"
        />
        <KPICard
          title="Open Requests"
          value={containers.filter((c) => c.status === "pending").length}
          icon={ArrowRightLeft}
        />
        <KPICard
          title="Available Slots"
          value={freeSlots}
          icon={Grid3X3}
          variant="success"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="blocks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocks">Block Overview</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
        </TabsList>

        {/* Block Overview Tab */}
        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yard Block Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {blocks.map((block) => {
                  const occupied = blockOccupancy[block.name] || 0;
                  const utilization =
                    block.capacity > 0
                      ? Math.round((occupied / block.capacity) * 100)
                      : 0;
                  return (
                    <div
                      key={block.id}
                      className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{block.name}</h4>
                        <Badge
                          variant={
                            utilization > 80
                              ? "destructive"
                              : utilization > 60
                                ? "secondary"
                                : "default"
                          }
                        >
                          {utilization}%
                        </Badge>
                      </div>
                      <Progress value={utilization} className="mb-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{occupied} occupied</span>
                        <span>{block.capacity - occupied} free</span>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Total Capacity: {block.capacity} containers
                        </p>
                      </div>
                    </div>
                  );
                })}
                {blocks.length === 0 && !isLoading && (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No yard blocks configured.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Containers Tab */}
        <TabsContent value="containers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle>Containers in Yard</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search No..."
                      className="w-40 pl-9"
                      value={containerSearch}
                      onChange={(e) => setContainerSearch(e.target.value)}
                    />
                  </div>
                  <Select value={sizeFilter} onValueChange={setSizeFilter}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {sizes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={blockFilter} onValueChange={setBlockFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Blocks</SelectItem>
                      {blocks.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(containerSearch ||
                    sizeFilter !== "all" ||
                    typeFilter !== "all" ||
                    blockFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setContainerSearch("");
                          setSizeFilter("all");
                          setTypeFilter("all");
                          setBlockFilter("all");
                        }}
                      >
                        Reset
                      </Button>
                    )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={containers}
                isLoading={isLoading}
                searchable={false}
                showFilters={false}
                emptyMessage={
                  containerSearch ||
                    sizeFilter !== "all" ||
                    typeFilter !== "all" ||
                    blockFilter !== "all"
                    ? "No containers match your filters"
                    : "No containers in yard"
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
