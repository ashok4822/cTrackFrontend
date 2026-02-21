import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DoorOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
} from "lucide-react";
import { fetchShippingLines } from "@/store/slices/shippingLineSlice";
import type { GateOperation } from "@/types";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchGateOperations,
  createGateOperation,
} from "@/store/slices/gateOperationSlice";
import { toast } from "sonner";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import { GateInDialog } from "@/components/gate/GateInDialog";
import { GateOutDialog } from "@/components/gate/GateOutDialog";

export default function OperatorGateOperations() {
  const dispatch = useAppDispatch();
  const {
    operations,
    loading,
    error: reduxError,
  } = useAppSelector((state) => state.gateOperations);
  const { lines: shippingLines } = useAppSelector(
    (state) => state.shippingLine,
  );

  const [isGateInDialogOpen, setIsGateInDialogOpen] = useState(false);
  const [isGateOutDialogOpen, setIsGateOutDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchGateOperations({}));
    dispatch(fetchShippingLines());
  }, [dispatch]);

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
    }
  }, [reduxError]);

  const handleGateOperationSubmit = async (data: CreateGateOperationData) => {
    try {
      await dispatch(createGateOperation(data)).unwrap();
      toast.success(
        `Gate-${data.type === "gate-in" ? "In" : "Out"} recorded successfully`,
      );
      if (data.type === "gate-in") {
        setIsGateInDialogOpen(false);
      } else {
        setIsGateOutDialogOpen(false);
      }
    } catch (err: any) {
      // Re-throw so the dialog's onFormSubmit can catch and show field-specific errors
      throw err;
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const containerOperations = operations.filter(
    (op) => op.containerNumber && op.containerNumber.trim() !== "",
  );

  const gateIns = containerOperations.filter((op) => op.type === "gate-in");
  const gateOuts = containerOperations.filter((op) => op.type === "gate-out");

  const gateInsToday = gateIns.filter(
    (op) => new Date(op.timestamp) >= today,
  ).length;
  const gateOutsToday = gateOuts.filter(
    (op) => new Date(op.timestamp) >= today,
  ).length;
  const totalOperationsToday = containerOperations.filter(
    (op) => new Date(op.timestamp) >= today,
  ).length;

  const columns: Column<GateOperation>[] = [
    { key: "containerNumber", header: "Container No.", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.type === "gate-in" ? (
            <ArrowDownToLine className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpFromLine className="h-4 w-4 text-primary" />
          )}
          <span className="capitalize">{item.type.replace("-", " ")}</span>
        </div>
      ),
    },
    { key: "vehicleNumber", header: "Vehicle", sortable: true },
    { key: "driverName", header: "Driver" },
    {
      key: "purpose",
      header: "Purpose",
      render: (item) => (
        <span className="capitalize">
          {item.type === "gate-in" ? "From " : "To "}
          {item.purpose}
        </span>
      ),
    },
    {
      key: "timestamp",
      header: "Time",
      render: (item) => new Date(item.timestamp).toLocaleString(),
    },
  ];

  return (
    <DashboardLayout
      navItems={operatorNavItems}
      pageTitle="Container Gate Operations"
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Gate-Ins Today"
          value={gateInsToday}
          icon={ArrowDownToLine}
          variant="success"
        />
        <KPICard
          title="Gate-Outs Today"
          value={gateOutsToday}
          icon={ArrowUpFromLine}
          variant="primary"
        />
        <KPICard
          title="Total Today"
          value={totalOperationsToday}
          icon={DoorOpen}
          variant="default"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={() => setIsGateInDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Gate-In
        </Button>

        <Button variant="outline" onClick={() => setIsGateOutDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Gate-Out
        </Button>

        <GateInDialog
          open={isGateInDialogOpen}
          onOpenChange={setIsGateInDialogOpen}
          onSubmit={handleGateOperationSubmit}
          loading={loading}
          shippingLines={shippingLines}
        />

        <GateOutDialog
          open={isGateOutDialogOpen}
          onOpenChange={setIsGateOutDialogOpen}
          onSubmit={handleGateOperationSubmit}
          loading={loading}
          isContainerRequired={true}
        />
      </div>

      {/* Gate Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Container Gate Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({containerOperations.length})
              </TabsTrigger>
              <TabsTrigger value="gate-in">
                Gate-In ({gateIns.length})
              </TabsTrigger>
              <TabsTrigger value="gate-out">
                Gate-Out ({gateOuts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={containerOperations}
                columns={columns}
                isLoading={loading}
                searchable
                searchPlaceholder="Search..."
              />
            </TabsContent>
            <TabsContent value="gate-in">
              <DataTable
                data={gateIns}
                columns={columns}
                isLoading={loading}
                searchable
              />
            </TabsContent>
            <TabsContent value="gate-out">
              <DataTable
                data={gateOuts}
                columns={columns}
                isLoading={loading}
                searchable
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
