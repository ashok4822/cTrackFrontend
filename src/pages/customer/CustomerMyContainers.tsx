import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KPICard } from "@/components/common/KPICard";
import { Button } from "@/components/ui/button";
import { Container, MapPin, Truck, Factory, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import type { Container as ContainerType } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerContainers } from "@/store/slices/containerSlice";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerMyContainers() {
  const dispatch = useAppDispatch();
  const { containers, isLoading } = useAppSelector((state) => state.container);

  const [selectedContainer, setSelectedContainer] =
    useState<ContainerType | null>(null);

  useEffect(() => {
    dispatch(fetchCustomerContainers());
  }, [dispatch]);

  const inYard = containers.filter((c) => c.status === "in-yard").length;
  const inTransit = containers.filter(
    (c) => c.status === "in-transit",
  ).length;
  const atFactory = containers.filter(
    (c) => c.status === "at-factory",
  ).length;

  const columns: Column<ContainerType>[] = [
    {
      key: "containerNumber",
      header: "Container No.",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
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
      header: "Load Status",
      sortable: true,
      render: (item) => (
        <span>{item.empty ? "Empty" : "Loaded"}</span>
      ),
    },
    {
      key: "shippingLine",
      header: "Shipping Line",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "yardLocation",
      header: "Location",
      render: (item) => (item.yardLocation ? item.yardLocation.block : "-"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedContainer(item);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="My Containers">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Containers"
          value={isLoading ? "..." : containers.length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title="At Factory"
          value={isLoading ? "..." : atFactory}
          icon={Factory}
          variant="success"
        />
        <KPICard
          title="In Transit"
          value={isLoading ? "..." : inTransit}
          icon={Truck}
        />
        <KPICard
          title="In Yard"
          value={isLoading ? "..." : inYard}
          icon={MapPin}
          variant="warning"
        />
      </div>

      {/* Container Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <DataTable
          data={containers}
          columns={columns}
          searchable
          searchPlaceholder="Search containers..."
          onRowClick={setSelectedContainer}
          emptyMessage="No containers found"
        />
      )}

      {/* Container Details Dialog */}
      <Dialog
        open={!!selectedContainer}
        onOpenChange={() => setSelectedContainer(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Container Details</DialogTitle>
            <DialogDescription>
              Detailed information about container {selectedContainer?.containerNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedContainer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Container Number
                  </p>
                  <p className="font-mono font-medium">
                    {selectedContainer.containerNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedContainer.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium">{selectedContainer.size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {selectedContainer.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Line</p>
                  <p className="font-medium">
                    {selectedContainer.shippingLine}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Movement Type</p>
                  <p className="font-medium capitalize">
                    {selectedContainer.movementType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Load Status</p>
                  <p className="font-medium">
                    {selectedContainer.empty ? "Empty" : "Loaded"}
                  </p>
                </div>
                {selectedContainer.yardLocation && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Yard Location
                    </p>
                    <p className="font-medium">
                      Block {selectedContainer.yardLocation.block}
                    </p>
                  </div>
                )}
                {selectedContainer.gateInTime && (
                  <div>
                    <p className="text-sm text-muted-foreground">Gate In</p>
                    <p className="font-medium">
                      {new Date(selectedContainer.gateInTime).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedContainer.dwellTime && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dwell Time</p>
                    <p className="font-medium">
                      {selectedContainer.dwellTime} days
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
