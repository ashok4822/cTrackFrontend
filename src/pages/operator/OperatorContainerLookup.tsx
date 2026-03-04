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
  Container,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  History as HistoryIcon,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContainers, fetchContainerHistory } from "@/store/slices/containerSlice";
import type { Container as ContainerType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function OperatorContainerLookup() {
  const dispatch = useAppDispatch();
  const { containers, currentHistory: history, isLoading, error } = useAppSelector(
    (state) => state.container,
  );

  const [selectedContainer, setSelectedContainer] =
    useState<ContainerType | null>(null);

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
        <DataTable
          data={containers}
          isLoading={isLoading}
          columns={columns}
          searchPlaceholder="Search containers..."
          onRowClick={(item) => setSelectedContainer(item)}
        />
      )}
    </DashboardLayout>
  );
}
