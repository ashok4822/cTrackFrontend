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
import { UI_MESSAGES } from "@/constants/messages";


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
  const [selectedOperation, setSelectedOperation] = useState<ContainerRequest | null>(null);
  const [requests, setRequests] = useState<ContainerRequest[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
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
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.CONTAINER.SUBMIT_FAILED,
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



  const handleMarkAsComplete = async () => {
    if (!pendingRequestId) return;
    
    setIsUpdating(true);
    try {
      await containerRequestService.updateRequest(pendingRequestId, {
        status: "completed",
      });

      toast({
        title: UI_MESSAGES.TITLES.SUCCESS,
        description: UI_MESSAGES.TRANSIT.OPERATION_COMPLETED,
      });

      setShowConfirmDialog(false);
      setPendingRequestId(null);
      fetchRequests();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.TRANSIT.COMPLETE_OPERATION_FAILED,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<ContainerRequest>[] = [
    {
      key: "id",
      header: UI_MESSAGES.TABLE.REQUEST_NO,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-primary">
          REQ-{(item.id || "").slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: "containerNumber",
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
          {item.containerNumber || UI_MESSAGES.DESTUFFING.NOT_ALLOCATED}
        </span>
      ),
    },
    {
      key: "type",
      header: UI_MESSAGES.TABLE.TYPE,
      sortable: true,
      render: (item) => (
        <span className="capitalize font-medium">{item.type}</span>
      ),
    },

    {
      key: "preferredDate",
      header: UI_MESSAGES.TABLE.SCHEDULED_DATE,
      sortable: true,
      render: (item) => item.preferredDate ? new Date(item.preferredDate).toLocaleDateString() : UI_MESSAGES.COMMON.NA,
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "createdAt",
      header: UI_MESSAGES.COMMON.REQUESTED_ON,
      render: (item) =>
        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : UI_MESSAGES.COMMON.NA,
    },
    {
      key: "cargoCategoryName",
      header: UI_MESSAGES.TABLE.CATEGORY,
      sortable: true,
      render: (item) => (
        <span className="capitalize">{item.cargoCategoryName || UI_MESSAGES.COMMON.NA}</span>
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
            onClick={() => handleViewDetails(item)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            {UI_MESSAGES.TABLE.VIEW}
          </Button>
          {item.status === "at-factory" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setPendingRequestId(item.id);
                setShowConfirmDialog(true);
              }}
              className="gap-1 h-8 bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {UI_MESSAGES.TABLE.COMPLETE}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (hasOverdueBills) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle={UI_MESSAGES.TITLES.STUFFING_DESTUFFING}>
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
      pageTitle={UI_MESSAGES.TITLES.STUFFING_DESTUFFING}
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.TOTAL_OPERATIONS}
          value={requests.length}
          icon={Package}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.PENDING}
          value={pendingOps}
          icon={Clock}
          variant="warning"
        />
        <KPICard title={UI_MESSAGES.KPI.IN_PROGRESS} value={inProgressOps} icon={Package} />
        <KPICard
          title={UI_MESSAGES.KPI.DELIVERED}
          value={completedOps}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Operations Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{UI_MESSAGES.KPI.OPERATIONS}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">{UI_MESSAGES.COMMON.ALL}</TabsTrigger>
              <TabsTrigger value="stuffing">{UI_MESSAGES.COMMON.STUFFING}</TabsTrigger>
              <TabsTrigger value="destuffing">{UI_MESSAGES.COMMON.DESTUFFING}</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={requests}
                columns={columns}
                searchable
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_OPERATIONS}
                emptyMessage={UI_MESSAGES.TABLE.NO_OPERATIONS_FOUND}
              />
            </TabsContent>

            <TabsContent value="stuffing">
              <DataTable
                data={requests.filter((op) => op.type === "stuffing")}
                columns={columns}
                searchable
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_OPERATIONS}
                emptyMessage={UI_MESSAGES.TABLE.NO_OPERATIONS_FOUND}
              />
            </TabsContent>

            <TabsContent value="destuffing">
              <DataTable
                data={requests.filter((op) => op.type === "destuffing")}
                columns={columns}
                searchable
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_OPERATIONS}
                emptyMessage={UI_MESSAGES.TABLE.NO_OPERATIONS_FOUND}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.DIALOG.OPERATION_DETAILS}</DialogTitle>
          </DialogHeader>
          {selectedOperation && (
            <div className="space-y-4">
              {/* Operation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.CONTAINER}</p>
                  <p className="font-mono font-medium">
                    {selectedOperation.containerNumber || UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</p>
                  <p className="capitalize font-medium">
                    {selectedOperation.type || UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.STATUS}
                  </p>
                  <StatusBadge status={selectedOperation.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.SCHEDULED_DATE}
                  </p>
                  <p>
                    {selectedOperation.preferredDate ? new Date(selectedOperation.preferredDate).toLocaleString() : UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.COMMON.REQUESTED_ON}
                  </p>
                  <p>
                    {selectedOperation.createdAt ? new Date(selectedOperation.createdAt).toLocaleString() : UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.TABLE.CATEGORY}
                  </p>
                  <p className="capitalize font-medium">
                    {selectedOperation.cargoCategoryName || UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
              </div>

              {/* Cargo Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">{UI_MESSAGES.COMMON.CARGO_DETAILS}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.DESCRIPTION}</p>
                    <p className="font-medium">{selectedOperation.cargoDescription || UI_MESSAGES.COMMON.NA}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.WEIGHT}</p>
                    <p className="font-medium">{selectedOperation.cargoWeight ? `${selectedOperation.cargoWeight} ${UI_MESSAGES.COMMON.KG}` : UI_MESSAGES.COMMON.NA}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.HAZARDOUS}</p>
                    {selectedOperation.isHazardous ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">{UI_MESSAGES.COMMON.YES} ({selectedOperation.hazardClass})</span>
                      </div>
                    ) : (
                      <p className="font-medium">{UI_MESSAGES.COMMON.NO}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedOperation.remarks && (
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.REMARKS}</p>
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
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI_MESSAGES.TRANSIT.CONFIRM_COMPLETE}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {UI_MESSAGES.TRANSIT.CONFIRM_COMPLETE_DESC}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingRequestId(null);
              }}
              disabled={isUpdating}
            >
              {UI_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              variant="default"
              onClick={handleMarkAsComplete}
              disabled={isUpdating}
              className="bg-success hover:bg-success/90"
            >
              {isUpdating ? UI_MESSAGES.COMMON.LOADING : UI_MESSAGES.COMMON.SUBMIT}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
