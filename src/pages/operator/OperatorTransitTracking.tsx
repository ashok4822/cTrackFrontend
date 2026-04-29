import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { KPICard } from "@/components/common/KPICard";
import { Truck, Clock, CheckCircle, Navigation, Eye } from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import type { ContainerRequest } from "@/types";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { UI_MESSAGES } from "@/constants/messages";

export default function OperatorTransitTracking() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("in-transit");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddCheckpointDialog, setShowAddCheckpointDialog] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState({
    location: "",
    remarks: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await containerRequestService.getAllRequests();
      setRequests(data);
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.TRANSIT.FETCH_FAILED,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inTransitCount = requests.filter(
    (c) => c.status === "in-transit",
  ).length;
  const readyCount = requests.filter(
    (c) => c.status === "ready-for-dispatch",
  ).length;
  const atFactoryCount = requests.filter(
    (c) => c.status === "at-factory",
  ).length;
  const completedCount = requests.filter(
    (c) => c.status === "completed",
  ).length;

  const filteredRequests = requests.filter((c) => {
    const isRelevantStatus = [
      "ready-for-dispatch",
      "in-transit",
      "at-factory",
      "completed",
    ].includes(c.status);
    if (!isRelevantStatus) return false;
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const handleAddCheckpoint = async () => {
    if (!selectedRequestId || !newCheckpoint.location) return;

    try {
      const currentRequest = requests.find((r) => r.id === selectedRequestId);
      const existingCheckpoints = currentRequest?.checkpoints || [];

      const updatedCheckpoints = [
        ...existingCheckpoints,
        {
          location: newCheckpoint.location,
          timestamp: new Date().toISOString(),
          status: "passed",
          remarks: newCheckpoint.remarks,
        },
      ];

      await containerRequestService.updateRequest(selectedRequestId, {
        checkpoints: updatedCheckpoints,
      });

      toast({
        title: UI_MESSAGES.TRANSIT.CHECKPOINT_ADDED,
        description: UI_MESSAGES.TRANSIT.CHECKPOINT_UPDATED_DESC(currentRequest?.containerNumber || selectedRequestId),
      });

      setShowAddCheckpointDialog(false);
      setNewCheckpoint({ location: "", remarks: "" });
      fetchData();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.TRANSIT.ADD_CHECKPOINT_FAILED,
        variant: "destructive",
      });
    }
  };

  const handleMarkAtFactory = async (id: string) => {
    try {
      const currentRequest = requests.find((r) => r.id === id);
      const existingCheckpoints = currentRequest?.checkpoints || [];

      await containerRequestService.updateRequest(id, {
        status: "at-factory",
        checkpoints: [
          ...existingCheckpoints,
          {
            location: UI_MESSAGES.TITLES.AT_FACTORY,
            timestamp: new Date().toISOString(),
            status: "reached",
            remarks: UI_MESSAGES.TRANSIT.MARK_AT_FACTORY_SUCCESS,
          },
        ],
      });
      toast({
        title: UI_MESSAGES.TITLES.SUCCESS,
        description: UI_MESSAGES.TRANSIT.MARK_AT_FACTORY_SUCCESS,
      });
      fetchData();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.DESTUFFING.UPDATE_STATUS_FAILED,
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (id: string, containerNumber?: string) => {
    try {
      const currentRequest = requests.find((r) => r.id === id);
      const existingCheckpoints = currentRequest?.checkpoints || [];

      await containerRequestService.updateRequest(id, {
        status: "completed",
        checkpoints: [
          ...existingCheckpoints,
          {
            location: UI_MESSAGES.TRANSIT.OPERATION_FINALIZED,
            timestamp: new Date().toISOString(),
            status: "completed",
            remarks: UI_MESSAGES.TRANSIT.STUFFING_FINALIZED,
          },
        ],
      });
      toast({
        title: UI_MESSAGES.TRANSIT.OPERATION_COMPLETED,
        description: UI_MESSAGES.TRANSIT.OPERATION_COMPLETED_DESC(containerNumber || id),
      });
      fetchData();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.TRANSIT.COMPLETE_OPERATION_FAILED,
        variant: "destructive",
      });
    }
  };

  const columns: Column<ContainerRequest>[] = [
    {
      key: "containerNumber",
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || UI_MESSAGES.TABLE.NEW_REQUEST_UPPER}
        </span>
      ),
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.OPERATION,
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => {
        return (
          <Badge
            variant={item.status === "at-factory" ? "secondary" : "default"}
          >
            {item.status.replace(/-/g, " ")}
          </Badge>
        );
      },
    },
    {
      key: "checkpoints",
      header: UI_MESSAGES.TABLE.CHECKPOINTS,
      render: (item) => (
        <span className="text-muted-foreground">
          {UI_MESSAGES.TABLE.PASSED_CHECKPOINTS(item.checkpoints?.length || 0)}
        </span>
      ),
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRequestId(item.id);
              setShowDetailsDialog(true);
            }}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            {UI_MESSAGES.TABLE.TRACK}
          </Button>
          {item.status === "in-transit" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequestId(item.id);
                setShowAddCheckpointDialog(true);
              }}
            >
              {UI_MESSAGES.TRANSIT.ADD_NEW_CHECKPOINT}
            </Button>
          )}
          {item.status === "in-transit" && (
            <Button size="sm" onClick={() => handleMarkAtFactory(item.id)}>
              {UI_MESSAGES.TITLES.AT_FACTORY}
            </Button>
          )}
          {item.status === "at-factory" && (
            <Button
              size="sm"
              className="bg-success hover:bg-success/90"
              onClick={() => handleComplete(item.id, item.containerNumber)}
            >
              {UI_MESSAGES.TABLE.COMPLETE}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle={UI_MESSAGES.TITLES.TRANSIT_TRACKING}>
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.IN_TRANSIT}
          value={inTransitCount}
          icon={Truck}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.KPI.PENDING_DISPATCH}
          value={readyCount}
          icon={Clock}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.TITLES.AT_FACTORY}
          value={atFactoryCount}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard title={UI_MESSAGES.KPI.DELIVERED} value={completedCount} icon={CheckCircle} />
      </div>

      {/* Container List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{UI_MESSAGES.TABLE.SHIPMENT_TRACKING}</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={UI_MESSAGES.TABLE.FILTER_BY_STATUS} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{UI_MESSAGES.TABLE.ALL_TRACKING}</SelectItem>
              <SelectItem value="in-transit">{UI_MESSAGES.KPI.IN_TRANSIT}</SelectItem>
              <SelectItem value="ready-for-dispatch">
                {UI_MESSAGES.KPI.PENDING_DISPATCH}
              </SelectItem>
              <SelectItem value="at-factory">{UI_MESSAGES.TITLES.AT_FACTORY}</SelectItem>
              <SelectItem value="completed">{UI_MESSAGES.KPI.DELIVERED}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CONTAINERS}
            emptyMessage={UI_MESSAGES.TABLE.NO_SHIPMENTS_FILTERED}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {/* Transit Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {UI_MESSAGES.DIALOG.TRANSIT_DETAILS}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Container Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.CONTAINER}</p>
                  <p className="font-mono font-medium text-lg">
                    {selectedRequest.containerNumber || "NEW REQUEST"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.STATUS}</p>
                  <Badge
                    variant={
                      selectedRequest.status === "at-factory"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {selectedRequest.status.replace(/-/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                {(() => {
                  const checkpoints = selectedRequest.checkpoints || [];
                  const allEvents = [...checkpoints];

                  // Always ensure there's a "Request Created" event at the start
                  const hasCreationEvent = allEvents.some(cp =>
                    cp.status === UI_MESSAGES.TRANSIT.REQUEST_CREATED ||
                    cp.remarks?.toLowerCase().includes("submitted")
                  );

                  if (!hasCreationEvent) {
                    allEvents.push({
                      status: UI_MESSAGES.TRANSIT.REQUEST_CREATED,
                      location: UI_MESSAGES.TRANSIT.CUSTOMER_PORTAL,
                      timestamp: selectedRequest.createdAt || new Date().toISOString(),
                      remarks: UI_MESSAGES.TRANSIT.INITIAL_REQUEST_SUBMITTED(selectedRequest.type),
                    });
                  }

                  const sortedEvents = allEvents.sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  );

                  return (
                    <div className="space-y-6">
                      {sortedEvents.map((checkpoint, index) => (
                        <div key={index} className="relative pl-10">
                          <div
                            className="absolute left-2 top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-primary border-primary"
                          >
                            <CheckCircle className="h-3 w-3 text-primary-foreground" />
                          </div>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold capitalize">
                                    {(checkpoint.status || UI_MESSAGES.TITLES.UPDATE).replace(/-/g, " ")}
                                  </h4>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-sm font-medium">
                                      {checkpoint.location}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(checkpoint.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {checkpoint.remarks && (
                                <p className="mt-2 text-sm text-muted-foreground border-t pt-2 italic">
                                  {checkpoint.remarks}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Checkpoint Dialog */}
      <Dialog
        open={showAddCheckpointDialog}
        onOpenChange={setShowAddCheckpointDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.TRANSIT.ADD_NEW_CHECKPOINT}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">{UI_MESSAGES.TRANSIT.LOCATION_NAME}</Label>
              <Input
                id="location"
                placeholder={UI_MESSAGES.TRANSIT.LOCATION_PLACEHOLDER}
                value={newCheckpoint.location}
                onChange={(e) =>
                  setNewCheckpoint((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">{UI_MESSAGES.TRANSIT.OBSERVATIONS_PLACEHOLDER}</Label>
              <Input
                id="remarks"
                placeholder={UI_MESSAGES.TRANSIT.OBSERVATIONS_PLACEHOLDER}
                value={newCheckpoint.remarks}
                onChange={(e) =>
                  setNewCheckpoint((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCheckpointDialog(false)}
            >
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              onClick={handleAddCheckpoint}
              disabled={!newCheckpoint.location}
            >
              {UI_MESSAGES.TRANSIT.ADD_NEW_CHECKPOINT}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
