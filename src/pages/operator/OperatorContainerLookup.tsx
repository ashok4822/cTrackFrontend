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
import { fetchContainers, fetchContainerHistory, clearContainerError } from "@/store/slices/containerSlice";
import type { Container as ContainerType, ContainerStatus, ContainerSize, ContainerType as ContainerTypeEnum } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UI_MESSAGES } from "@/constants/messages";

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
      dispatch(clearContainerError());
    }
  }, [error, dispatch]);

  const handleBack = () => {
    setSelectedContainer(null);
  };

  const columns: Column<ContainerType>[] = [
    {
      key: "containerNumber",
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) => (
        <span className="font-medium text-foreground">
          {item.containerNumber}
        </span>
      ),
    },
    {
      key: "size",
      header: UI_MESSAGES.COMMON.SIZE,
      sortable: true,
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      sortable: true,
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    {
      key: "empty",
      header: UI_MESSAGES.CONTAINER_DETAILS.LOAD,
      sortable: true,
      render: (item) => (
        <Badge variant="secondary">
          {item.empty ? UI_MESSAGES.CONTAINER_DETAILS.EMPTY : UI_MESSAGES.CONTAINER_DETAILS.LOADED}
        </Badge>
      ),
    },
    {
      key: "hazardousClassification",
      header: UI_MESSAGES.TABLE.HAZARDOUS,
      sortable: true,
      render: (item) => (
        <Badge variant={item.hazardousClassification ? "destructive" : "secondary"}>
          {item.hazardousClassification ? UI_MESSAGES.COMMON.YES : UI_MESSAGES.COMMON.NO}
        </Badge>
      ),
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "shippingLine",
      header: UI_MESSAGES.TITLES.SHIPPING_LINE,
      sortable: true,
    },
    {
      key: "yardLocation",
      header: UI_MESSAGES.TABLE.LOCATION,
      render: (item) => (item.yardLocation ? item.yardLocation.block : UI_MESSAGES.COMMON.NA),
    },
    {
      key: "dwellTime",
      header: `${UI_MESSAGES.CONTAINER_DETAILS.DWELL_TIME} (${UI_MESSAGES.COMMON.DAYS})`,
      sortable: true,
      render: (item) => item.dwellTime ?? UI_MESSAGES.COMMON.NA,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
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
            {UI_MESSAGES.TABLE.VIEW}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle={UI_MESSAGES.TITLES.CONTAINER_LOOKUP}>
      {/* Container Details */}
      {selectedContainer ? (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {UI_MESSAGES.CONTAINER_DETAILS.BACK_TO_LIST}
          </Button>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">{UI_MESSAGES.TABLE.DETAILS}</TabsTrigger>
              <TabsTrigger value="history">{UI_MESSAGES.TABLE.VIEW_HISTORY}</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Container className="h-5 w-5" />
                      {UI_MESSAGES.CONTAINER_DETAILS.TITLE}
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
                        <Label className="text-muted-foreground">{UI_MESSAGES.COMMON.SIZE}</Label>
                        <p className="font-medium">{selectedContainer.size}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</Label>
                        <p className="font-medium capitalize">
                          {selectedContainer.type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.MOVEMENT_TYPE}</Label>
                        <p className="font-medium capitalize">
                          {selectedContainer.movementType}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.COMMON.WEIGHT}</Label>
                        <p className="font-medium">
                          {selectedContainer.weight
                            ? `${selectedContainer.weight} ${UI_MESSAGES.COMMON.KG}`
                            : UI_MESSAGES.COMMON.NA}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.TITLES.SHIPPING_LINE}</Label>
                        <p className="font-medium">
                          {selectedContainer.shippingLine}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.CUSTOMER}</Label>
                        <p className="font-medium">
                          {selectedContainer.customerName || selectedContainer.customer || UI_MESSAGES.COMMON.NA}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.SEAL_NUMBER}</Label>
                        <p className="font-medium">
                          {selectedContainer.sealNumber || UI_MESSAGES.COMMON.NA}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.DAMAGED}</Label>
                        <p className="font-medium">
                          {selectedContainer.damaged ? UI_MESSAGES.COMMON.YES : UI_MESSAGES.COMMON.NO}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.HAZARDOUS}</Label>
                        <p className="font-medium">
                          {selectedContainer.hazardousClassification ? UI_MESSAGES.COMMON.YES : UI_MESSAGES.COMMON.NO}
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
                      {UI_MESSAGES.CONTAINER_DETAILS.LOCATION_TIMING}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <Label className="text-muted-foreground">
                        {UI_MESSAGES.CONTAINER_DETAILS.LOCATION}
                      </Label>
                      {selectedContainer.yardLocation ? (
                        <p className="text-xl font-bold mt-1">
                          {selectedContainer.yardLocation.block}
                        </p>
                      ) : (
                        <p className="text-xl font-bold mt-1 text-muted-foreground">
                          {UI_MESSAGES.CONTAINER_DETAILS.NOT_IN_YARD}
                        </p>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">
                            {UI_MESSAGES.GATE.GATE_IN_TIME}
                          </Label>
                          <p className="font-medium">
                            {selectedContainer.gateInTime
                              ? new Date(selectedContainer.gateInTime).toLocaleString()
                              : UI_MESSAGES.COMMON.NA}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">
                            {UI_MESSAGES.GATE.GATE_OUT_TIME}
                          </Label>
                          <p className="font-medium">
                            {selectedContainer.gateOutTime
                              ? new Date(selectedContainer.gateOutTime).toLocaleString()
                              : UI_MESSAGES.COMMON.NA}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 col-span-2">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <Label className="text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.DWELL_TIME}</Label>
                          <p className="font-medium">
                            {selectedContainer.dwellTime
                              ? `${selectedContainer.dwellTime} ${UI_MESSAGES.COMMON.DAYS}`
                              : UI_MESSAGES.COMMON.NA}
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
                    {UI_MESSAGES.CONTAINER_DETAILS.HISTORY}
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
                        <p>{UI_MESSAGES.CONTAINER_DETAILS.NO_HISTORY}</p>
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
              <Label className="text-xs text-muted-foreground">{UI_MESSAGES.TABLE.STATUS}</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContainerStatus | "all")}>
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder={UI_MESSAGES.TABLE.ALL_STATUSES} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{UI_MESSAGES.TABLE.ALL_STATUSES}</SelectItem>
                  <SelectItem value="in-yard">{UI_MESSAGES.TABLE.CONTAINERS_IN_YARD}</SelectItem>
                  <SelectItem value="in-transit">{UI_MESSAGES.KPI.IN_TRANSIT}</SelectItem>
                  <SelectItem value="at-port">At Port</SelectItem>
                  <SelectItem value="at-factory">{UI_MESSAGES.TITLES.AT_FACTORY}</SelectItem>
                  <SelectItem value="gate-in">{UI_MESSAGES.GATE.NEW_GATE_IN || "Gate In"}</SelectItem>
                  <SelectItem value="gate-out">{UI_MESSAGES.GATE.NEW_GATE_OUT || "Gate Out"}</SelectItem>
                  <SelectItem value="damaged">{UI_MESSAGES.CONTAINER_DETAILS.DAMAGED}</SelectItem>
                  <SelectItem value="pending">{UI_MESSAGES.KPI.PENDING}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContainerTypeEnum | "all")}>
                <SelectTrigger className="h-8 w-[130px]">
                  <SelectValue placeholder={UI_MESSAGES.TABLE.ALL_TYPES} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{UI_MESSAGES.TABLE.ALL_TYPES}</SelectItem>
                  <SelectItem value="standard">{UI_MESSAGES.CONTAINER.STANDARD}</SelectItem>
                  <SelectItem value="reefer">{UI_MESSAGES.CONTAINER.REEFER}</SelectItem>
                  <SelectItem value="tank">{UI_MESSAGES.CONTAINER.TANK}</SelectItem>
                  <SelectItem value="open-top">{UI_MESSAGES.CONTAINER.OPEN_TOP}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{UI_MESSAGES.COMMON.SIZE}</Label>
              <Select value={sizeFilter} onValueChange={(v) => setSizeFilter(v as ContainerSize | "all")}>
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue placeholder={UI_MESSAGES.COMMON.ALL_SIZES} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{UI_MESSAGES.COMMON.ALL_SIZES}</SelectItem>
                  <SelectItem value="20ft">20ft</SelectItem>
                  <SelectItem value="40ft">40ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Load */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.LOAD}</Label>
              <Select value={loadFilter} onValueChange={(v) => setLoadFilter(v as LoadFilter)}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder={UI_MESSAGES.COMMON.ALL} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{UI_MESSAGES.COMMON.ALL}</SelectItem>
                  <SelectItem value="empty">{UI_MESSAGES.CONTAINER_DETAILS.EMPTY}</SelectItem>
                  <SelectItem value="loaded">{UI_MESSAGES.CONTAINER_DETAILS.LOADED}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hazardous */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{UI_MESSAGES.TABLE.HAZARDOUS}</Label>
              <Select value={hazardousFilter} onValueChange={(v) => setHazardousFilter(v as HazardousFilter)}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder={UI_MESSAGES.COMMON.ALL} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{UI_MESSAGES.COMMON.ALL}</SelectItem>
                  <SelectItem value="yes">{UI_MESSAGES.COMMON.YES}</SelectItem>
                  <SelectItem value="no">{UI_MESSAGES.COMMON.NO}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                {UI_MESSAGES.COMMON.RESET}
              </Button>
            )}

            {hasActiveFilters && (
              <span className="ml-auto text-sm text-muted-foreground self-end pb-1">
                {filteredContainers.length} {UI_MESSAGES.REPORTS.TO_LABEL} {containers.length} {UI_MESSAGES.TABLE.CONTAINERS.toLowerCase()}
              </span>
            )}
          </div>

          <DataTable
            data={filteredContainers}
            isLoading={isLoading}
            columns={columns}
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CONTAINERS}
            onRowClick={(item) => setSelectedContainer(item)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
