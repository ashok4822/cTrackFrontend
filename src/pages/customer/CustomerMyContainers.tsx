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
import { useOverdueStatus } from "@/hooks/useOverdueStatus";
import { OverdueBlocker } from "@/components/common/OverdueBlocker";
import { UI_MESSAGES } from "@/constants/messages";

export default function CustomerMyContainers() {
  const dispatch = useAppDispatch();
  const { containers, isLoading } = useAppSelector((state) => state.container);

  const [selectedContainer, setSelectedContainer] =
    useState<ContainerType | null>(null);

  const { hasOverdueBills, loading: checkingOverdue } = useOverdueStatus();

  useEffect(() => {
    if (!hasOverdueBills && !checkingOverdue) {
      dispatch(fetchCustomerContainers());
    }
  }, [dispatch, hasOverdueBills, checkingOverdue]);

  if (checkingOverdue || (isLoading && containers.length === 0)) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle={UI_MESSAGES.TITLES.MY_CONTAINERS}>
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasOverdueBills) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle={UI_MESSAGES.TITLES.MY_CONTAINERS}>
        <OverdueBlocker />
      </DashboardLayout>
    );
  }

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
      header: UI_MESSAGES.TABLE.CONTAINER_NO,
      sortable: true,
      render: (item) => (
        <span className="font-mono font-medium text-foreground">
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
      header: UI_MESSAGES.CONTAINER_DETAILS.LOAD_STATUS,
      sortable: true,
      render: (item) => (
        <span>{item.empty ? UI_MESSAGES.CONTAINER_DETAILS.EMPTY : UI_MESSAGES.CONTAINER_DETAILS.LOADED}</span>
      ),
    },
    {
      key: "shippingLine",
      header: UI_MESSAGES.TITLES.SHIPPING_LINE,
      sortable: true,
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "yardLocation",
      header: UI_MESSAGES.CONTAINER_DETAILS.LOCATION,
      render: (item) => (item.yardLocation ? item.yardLocation.block : "-"),
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
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
    <DashboardLayout navItems={customerNavItems} pageTitle={UI_MESSAGES.TITLES.MY_CONTAINERS}>
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.TOTAL_CONTAINERS}
          value={isLoading ? "..." : containers.length}
          icon={Container}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.TITLES.AT_FACTORY}
          value={isLoading ? "..." : atFactory}
          icon={Factory}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.KPI.IN_TRANSIT}
          value={isLoading ? "..." : inTransit}
          icon={Truck}
        />
        <KPICard
          title={UI_MESSAGES.KPI.CONTAINERS_IN_YARD}
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
          searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CONTAINERS}
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
            <DialogTitle>{UI_MESSAGES.CONTAINER_DETAILS.TITLE}</DialogTitle>
            <DialogDescription>
              Detailed information about container {selectedContainer?.containerNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedContainer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {UI_MESSAGES.CONTAINER_DETAILS.NUMBER_LABEL}
                  </p>
                  <p className="font-mono font-medium">
                    {selectedContainer.containerNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.STATUS_LABEL}</p>
                  <StatusBadge status={selectedContainer.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.COMMON.SIZE}</p>
                  <p className="font-medium">{selectedContainer.size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TABLE.TYPE}</p>
                  <p className="font-medium capitalize">
                    {selectedContainer.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.TITLES.SHIPPING_LINE}</p>
                  <p className="font-medium">
                    {selectedContainer.shippingLine}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.MOVEMENT_TYPE}</p>
                  <p className="font-medium capitalize">
                    {selectedContainer.movementType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.LOAD_STATUS}</p>
                  <p className="font-medium">
                    {selectedContainer.empty ? UI_MESSAGES.CONTAINER_DETAILS.EMPTY : UI_MESSAGES.CONTAINER_DETAILS.LOADED}
                  </p>
                </div>
                {selectedContainer.yardLocation && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      {UI_MESSAGES.CONTAINER_DETAILS.YARD_LOCATION_LABEL}
                    </p>
                    <p className="font-medium">
                      {UI_MESSAGES.YARD.BLOCK} {selectedContainer.yardLocation.block}
                    </p>
                  </div>
                )}
                {selectedContainer.gateInTime && (
                  <div>
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.GATE.GATE_IN_TIME}</p>
                    <p className="font-medium">
                      {new Date(selectedContainer.gateInTime).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedContainer.dwellTime !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">{UI_MESSAGES.CONTAINER_DETAILS.DWELL_TIME}</p>
                    <p className="font-medium">
                      {selectedContainer.dwellTime} {UI_MESSAGES.COMMON.DAYS}
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
