import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KPICard } from "@/components/common/KPICard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Package, Clock, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { containerRequestService } from "@/services/containerRequestService";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { useOverdueStatus } from "@/hooks/useOverdueStatus";
import { OverdueBlocker } from "@/components/common/OverdueBlocker";
import { Skeleton } from "@/components/ui/skeleton";

interface ContainerRequest {
  id: string;
  _id?: string;
  customerId: string;
  type: "stuffing" | "destuffing";
  status: "pending" | "approved" | "rejected" | "completed" | "ready-for-dispatch" | "in-transit" | "at-factory" | "operation-completed" | "cancelled";
  containerSize?: string;
  containerType?: string;
  cargoDescription?: string;
  cargoWeight?: number;
  preferredDate?: string;
  specialInstructions?: string;
  isHazardous?: boolean;
  hazardClass?: string;
  containerNumber?: string;
  remarks?: string;
  createdAt?: string;
  cargoCategoryName?: string;
}

export default function CustomerStuffingDestuffing() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<ContainerRequest | null>(null);
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { hasOverdueBills, loading: checkingOverdue } = useOverdueStatus();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await containerRequestService.getMyRequests();
      const formattedData = data.map((r: ContainerRequest) => ({
        ...r,
        id: r._id || r.id,
      }));
      setRequests(formattedData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch container requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!hasOverdueBills && !checkingOverdue) {
      fetchRequests();
    }
  }, [fetchRequests, hasOverdueBills, checkingOverdue]);

  const pendingOps = requests.filter((op) => op.status === "pending").length;
  const inProgressOps = requests.filter((op) =>
    ["approved", "ready-for-dispatch", "in-transit", "at-factory"].includes(op.status)
  ).length;
  const completedOps = requests.filter((op) =>
    ["completed", "operation-completed"].includes(op.status)
  ).length;

  const handleViewDetails = (operation: ContainerRequest) => {
    setSelectedOperation(operation);
    setShowDetailsDialog(true);
  };



  const handleMarkAsComplete = async (requestId: string) => {
    try {
      await containerRequestService.updateRequest(requestId, {
        status: "completed",
      });

      toast({
        title: "Success",
        description: "Operation marked as complete.",
      });

      fetchRequests();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark as complete",
        variant: "destructive",
      });
    }
  };

  const columns: Column<ContainerRequest>[] = [
    {
      key: "id",
      header: "Request No.",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-primary">
          REQ-{(item.id || "").slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: "containerNumber",
      header: "Container No.",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || "Not allocated"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (item) => (
        <span className="capitalize font-medium">{item.type}</span>
      ),
    },

    {
      key: "preferredDate",
      header: "Scheduled Date",
      sortable: true,
      render: (item) => item.preferredDate ? new Date(item.preferredDate).toLocaleDateString() : "N/A",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "createdAt",
      header: "Requested On",
      render: (item) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : "-",
    },
    {
      key: "cargoCategoryName",
      header: "Category",
      sortable: true,
      render: (item) => (
        <span className="capitalize">{item.cargoCategoryName || "N/A"}</span>
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
            onClick={() => handleViewDetails(item)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          {item.status === "at-factory" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMarkAsComplete(item.id)}
              className="gap-1 h-8 bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (hasOverdueBills) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Stuffing / Destuffing">
        <OverdueBlocker />
      </DashboardLayout>
    );
  }

  if (checkingOverdue || (isLoading && requests.length === 0)) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Stuffing / Destuffing">
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navItems={customerNavItems}
      pageTitle="Stuffing / Destuffing"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Operations"
          value={requests.length}
          icon={Package}
          variant="primary"
        />
        <KPICard
          title="Pending"
          value={pendingOps}
          icon={Clock}
          variant="warning"
        />
        <KPICard title="In Progress" value={inProgressOps} icon={Package} />
        <KPICard
          title="Completed"
          value={completedOps}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Operations Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="stuffing">Stuffing</TabsTrigger>
              <TabsTrigger value="destuffing">Destuffing</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={requests}
                columns={columns}
                searchable
                searchPlaceholder="Search operations..."
                emptyMessage="No operations found"
              />
            </TabsContent>

            <TabsContent value="stuffing">
              <DataTable
                data={requests.filter((op) => op.type === "stuffing")}
                columns={columns}
                searchable
                searchPlaceholder="Search stuffing operations..."
                emptyMessage="No stuffing operations found"
              />
            </TabsContent>

            <TabsContent value="destuffing">
              <DataTable
                data={requests.filter((op) => op.type === "destuffing")}
                columns={columns}
                searchable
                searchPlaceholder="Search destuffing operations..."
                emptyMessage="No destuffing operations found"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
          </DialogHeader>
          {selectedOperation && (
            <div className="space-y-4">
              {/* Operation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Container</p>
                  <p className="font-mono font-medium">
                    {selectedOperation.containerNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="capitalize font-medium">
                    {selectedOperation.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Status
                  </p>
                  <StatusBadge status={selectedOperation.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Scheduled Date
                  </p>
                  <p>
                    {selectedOperation.preferredDate ? new Date(selectedOperation.preferredDate).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Requested On
                  </p>
                  <p>
                    {selectedOperation.createdAt ? new Date(selectedOperation.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Cargo Category
                  </p>
                  <p className="capitalize font-medium">
                    {selectedOperation.cargoCategoryName || "N/A"}
                  </p>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Cargo Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedOperation.cargoDescription || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{selectedOperation.cargoWeight ? `${selectedOperation.cargoWeight} kg` : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hazardous</p>
                    {selectedOperation.isHazardous ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Yes ({selectedOperation.hazardClass})</span>
                      </div>
                    ) : (
                      <p className="font-medium">No</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedOperation.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="text-sm">{selectedOperation.remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
