import { useState } from "react";
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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await containerRequestService.getAllRequests();
      setRequests(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch transit data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        title: "Checkpoint Added",
        description: `Status updated for ${currentRequest?.containerNumber || selectedRequestId}`,
      });

      setShowAddCheckpointDialog(false);
      setNewCheckpoint({ location: "", remarks: "" });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add checkpoint.",
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
            location: "At Factory",
            timestamp: new Date().toISOString(),
            status: "reached",
            remarks: "Shipment reached factory destination.",
          },
        ],
      });
      toast({
        title: "Success",
        description: "Container marked as Arrived at Factory.",
      });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update status.",
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
            location: "Operation Finalized",
            timestamp: new Date().toISOString(),
            status: "completed",
            remarks: "Stuffing/Destuffing operation finalized.",
          },
        ],
      });
      toast({
        title: "Operation Completed",
        description: `Request ${containerNumber || id} has been marked as completed.`,
      });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to complete operation.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<ContainerRequest>[] = [
    {
      key: "containerNumber",
      header: "Container No.",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || "NEW"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Operation",
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    {
      key: "status",
      header: "Status",
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
      header: "Checkpoints",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.checkpoints?.length || 0} passed
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
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
            Track
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
              Add Checkpoint
            </Button>
          )}
          {item.status === "in-transit" && (
            <Button size="sm" onClick={() => handleMarkAtFactory(item.id)}>
              At Factory
            </Button>
          )}
          {item.status === "at-factory" && (
            <Button
              size="sm"
              className="bg-success hover:bg-success/90"
              onClick={() => handleComplete(item.id, item.containerNumber)}
            >
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Transit Tracking">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="In Transit"
          value={inTransitCount}
          icon={Truck}
          variant="warning"
        />
        <KPICard
          title="Ready for Dispatch"
          value={readyCount}
          icon={Clock}
          variant="primary"
        />
        <KPICard
          title="At Factory"
          value={atFactoryCount}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard title="Completed" value={completedCount} icon={CheckCircle} />
      </div>

      {/* Container List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shipment Tracking</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracking</SelectItem>
              <SelectItem value="in-transit">In Transit</SelectItem>
              <SelectItem value="ready-for-dispatch">
                Ready for Dispatch
              </SelectItem>
              <SelectItem value="at-factory">At Factory</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRequests}
            columns={columns}
            searchable
            searchPlaceholder="Search containers..."
            emptyMessage="No shipments found with selected status"
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
              Transit Checkpoints
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Container Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Container</p>
                  <p className="font-mono font-medium text-lg">
                    {selectedRequest.containerNumber || "NEW REQUEST"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
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
                    cp.status === "pending" ||
                    cp.status === "Request Created" ||
                    cp.remarks?.toLowerCase().includes("submitted")
                  );

                  if (!hasCreationEvent) {
                    allEvents.push({
                      status: "Request Created",
                      location: "Customer Portal",
                      timestamp: (selectedRequest as any).createdAt || new Date().toISOString(),
                      remarks: `Initial ${selectedRequest.type} request submitted`,
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
                                    {(checkpoint.status || "Update").replace(/-/g, " ")}
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
            <DialogTitle>Add New Checkpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location Name</Label>
              <Input
                id="location"
                placeholder="e.g. Highway Toll Plaza"
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
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input
                id="remarks"
                placeholder="Any observations..."
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
              Cancel
            </Button>
            <Button
              onClick={handleAddCheckpoint}
              disabled={!newCheckpoint.location}
            >
              Add Checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
