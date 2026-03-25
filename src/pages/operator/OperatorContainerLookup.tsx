import DashboardLayout from "@/components/layout/DashboardLayout";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Container,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  History as HistoryIcon,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContainers, fetchContainerHistory } from "@/store/slices/containerSlice";
import type { Container as ContainerType, ContainerStatus, ContainerSize, ContainerType as ContainerTypeEnum } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type LoadFilter = "all" | "empty" | "loaded";
type HazardousFilter = "all" | "yes" | "no";

const ALL = "all";

export default function OperatorContainerLookup() {
  const dispatch = useAppDispatch();
  const { containers, currentHistory: history, isLoading, error } = useAppSelector(
    (state) => state.container,
  );

  const [selectedContainer, setSelectedContainer] =
    useState<ContainerType | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ContainerStatus | "all">(ALL);
  const [typeFilter, setTypeFilter] = useState<ContainerTypeEnum | "all">(ALL);
  const [sizeFilter, setSizeFilter] = useState<ContainerSize | "all">(ALL);
  const [loadFilter, setLoadFilter] = useState<LoadFilter>(ALL);
  const [hazardousFilter, setHazardousFilter] = useState<HazardousFilter>(ALL);

  const hasActiveFilters =
    statusFilter !== ALL ||
    typeFilter !== ALL ||
    sizeFilter !== ALL ||
    loadFilter !== ALL ||
    hazardousFilter !== ALL;

  const resetFilters = () => {
    setStatusFilter(ALL);
    setTypeFilter(ALL);
    setSizeFilter(ALL);
    setLoadFilter(ALL);
    setHazardousFilter(ALL);
  };

  const filteredContainers = useMemo(() => {
    return containers.filter((c) => {
      if (statusFilter !== ALL && c.status !== statusFilter) return false;
      if (typeFilter !== ALL && c.type !== typeFilter) return false;
      if (sizeFilter !== ALL && c.size !== sizeFilter) return false;
      if (loadFilter === "empty" && !c.empty) return false;
      if (loadFilter === "loaded" && c.empty) return false;
      if (hazardousFilter === "yes" && !c.hazardousClassification) return false;
      if (hazardousFilter === "no" && c.hazardousClassification) return false;
      return true;
    });
  }, [containers, statusFilter, typeFilter, sizeFilter, loadFilter, hazardousFilter]);

  useEffect(() => {
    dispatch(fetchContainers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContainer?.id) {
      dispatch(fetchContainerHistory(selectedContainer.id));
    }
  }, [selectedContainer, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleBack = () => {
    setSelectedContainer(null);
  };

  const columns: Column<ContainerType>[] = [
    {
      key: "containerNumber",
      header: "Container No.",
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">
          {item.containerNumber}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    {
      key: "empty",
      header: "Load",
      sortable: true,
      render: (item) => (
        <Badge variant="secondary">
          {item.empty ? "Empty" : "Loaded"}
        </Badge>
      ),
    },
    {
      key: "hazardousClassification",
      header: "Hazardous",
      sortable: true,
      render: (item) => (
        <Badge variant={item.hazardousClassification ? "destructive" : "secondary"}>
          {item.hazardousClassification ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "shippingLine",
      header: "Shipping Line",
      sortable: true,
    },
    {
      key: "yardLocation",
      header: "Location",
      render: (item) => (item.yardLocation ? item.yardLocation.block : "-"),
    },
    {
      key: "dwellTime",
      header: "Dwell (days)",
      sortable: true,
      render: (item) => item.dwellTime ?? "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedContainer(item)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Container Lookup">
      {/* Container Details */}
      {selectedContainer ? (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Container className="h-5 w-5" />
                      Container Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {selectedContainer.containerNumber}
                      </span>
                      <StatusBadge status={selectedContainer.status} />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Size</Label>
                        <p className="font-medium">{selectedContainer.size}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">
                          {selectedContainer.type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Movement Type</Label>
                        <p className="font-medium capitalize">
                          {selectedContainer.movementType}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Weight</Label>
                        <p className="font-medium">
                          {selectedContainer.weight
                            ? `${selectedContainer.weight} kg`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Shipping Line</Label>
                        <p className="font-medium">
                          {selectedContainer.shippingLine}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Customer</Label>
                        <p className="font-medium">
                          {selectedContainer.customerName || selectedContainer.customer || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Seal Number</Label>
                        <p className="font-medium">
                          {selectedContainer.sealNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Damaged</Label>
                        <p className="font-medium">
                          {selectedContainer.damaged ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Hazardous</Label>
                        <p className="font-medium">
                          {selectedContainer.hazardousClassification ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location & Timing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location & Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <Label className="text-muted-foreground">
                        Current Yard Location
                      </Label>
                      {selectedContainer.yardLocation ? (
                        <p className="text-xl font-bold mt-1">
                          {selectedContainer.yardLocation.block}
                        </p>
                      ) : (
                        <p className="text-xl font-bold mt-1 text-muted-foreground">
                          Not in Yard
                        </p>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">
                            Gate-In Time
                          </Label>
                          <p className="font-medium">
                            {selectedContainer.gateInTime
                              ? new Date(
                                selectedContainer.gateInTime,
                              ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">
                            Gate-Out Time
                          </Label>
                          <p className="font-medium">
                            {selectedContainer.gateOutTime
                              ? new Date(
                                selectedContainer.gateOutTime,
                              ).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 col-span-2">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">Dwell Time</Label>
                          <p className="font-medium">
                            {selectedContainer.dwellTime
                              ? `${selectedContainer.dwellTime} days`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5" />
                    Container History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {history && history.length > 0 ? (
                      <div className="relative pl-6 border-l-2 border-muted space-y-8">
                        {history.map((item, index) => (
                          <div key={item.id || index} className="relative">
                            <div className="absolute -left-[31px] mt-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-lg">
                                  {item.activity}
                                </h4>
                                <p className="text-muted-foreground">
                                  {item.details}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-2 shrink-0 self-start sm:self-center">
                                <Clock className="h-3 w-3" />
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No activity history recorded for this container.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContainerStatus | "all")}>
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in-yard">In Yard</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="at-port">At Port</SelectItem>
                  <SelectItem value="at-factory">At Factory</SelectItem>
                  <SelectItem value="gate-in">Gate In</SelectItem>
                  <SelectItem value="gate-out">Gate Out</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContainerTypeEnum | "all")}>
                <SelectTrigger className="h-8 w-[130px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="tank">Tank</SelectItem>
                  <SelectItem value="open-top">Open Top</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <Select value={sizeFilter} onValueChange={(v) => setSizeFilter(v as ContainerSize | "all")}>
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="20ft">20ft</SelectItem>
                  <SelectItem value="40ft">40ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Load */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Load</Label>
              <Select value={loadFilter} onValueChange={(v) => setLoadFilter(v as LoadFilter)}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="empty">Empty</SelectItem>
                  <SelectItem value="loaded">Loaded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hazardous */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Hazardous</Label>
              <Select value={hazardousFilter} onValueChange={(v) => setHazardousFilter(v as HazardousFilter)}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}

            {hasActiveFilters && (
              <span className="ml-auto text-sm text-muted-foreground self-end pb-1">
                {filteredContainers.length} of {containers.length} containers
              </span>
            )}
          </div>

          <DataTable
            data={filteredContainers}
            isLoading={isLoading}
            columns={columns}
            searchPlaceholder="Search containers..."
            onRowClick={(item) => setSelectedContainer(item)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
