import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { adminNavItems } from "@/config/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GateOperation } from "@/types";
import { ArrowDownToLine, ArrowUpFromLine, DoorOpen } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGateOperations, createGateOperation, clearError } from "@/store/slices/gateOperationSlice";
import { fetchShippingLines } from "@/store/slices/shippingLineSlice";
import { Button } from "@/components/ui/button";
import { GateInDialog } from "@/components/gate/GateInDialog";
import { GateOutDialog } from "@/components/gate/GateOutDialog";
import { KPICard } from "@/components/common/KPICard";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import { toast } from "sonner";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { UI_MESSAGES } from "@/constants/messages";

const columns: Column<GateOperation>[] = [
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
    key: "type",
    header: UI_MESSAGES.TABLE.TYPE,
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
  {
    key: "vehicleNumber",
    header: UI_MESSAGES.TABLE.VEHICLE_NO,
    sortable: true,
  },
  {
    key: "driverName",
    header: UI_MESSAGES.TABLE.DRIVER,
  },
  {
    key: "purpose",
    header: UI_MESSAGES.TITLES.GATE_PURPOSE || "Purpose",
    render: (item) => (
      <span className="capitalize">
        {item.type === "gate-in" ? "From " : "To "}
        {item.purpose}
      </span>
    ),
  },
  {
    key: "timestamp",
    header: UI_MESSAGES.TABLE.TIMESTAMP || "Time",
    render: (item) => new Date(item.timestamp).toLocaleString(),
  },
];

export default function GateOperations() {
  const dispatch = useAppDispatch();
  const { operations, loading, error } = useAppSelector(
    (state) => state.gateOperations,
  );
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
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleGateOperationSubmit = async (data: CreateGateOperationData) => {
    await dispatch(createGateOperation(data)).unwrap();
    toast.success(
      `Gate ${data.type === "gate-in" ? "In" : "Out"} recorded successfully`,
    );
    if (data.type === "gate-in") {
      setIsGateInDialogOpen(false);
    } else {
      setIsGateOutDialogOpen(false);
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
  const totalToday = containerOperations.filter(
    (op) => new Date(op.timestamp) >= today,
  ).length;

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle={UI_MESSAGES.TITLES.GATE_OPERATIONS}
      pageActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsGateInDialogOpen(true)}
          >
            <ArrowDownToLine className="h-4 w-4" />
            {UI_MESSAGES.TITLES.NEW_GATE_IN || "Gate-In"}
          </Button>
          <Button
            className="gap-2"
            onClick={() => setIsGateOutDialogOpen(true)}
          >
            <ArrowUpFromLine className="h-4 w-4" />
            {UI_MESSAGES.TITLES.NEW_GATE_OUT || "Gate-Out"}
          </Button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.GATE_IN_TODAY}
          value={gateInsToday}
          icon={ArrowDownToLine}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.DASHBOARD.KPI.GATE_OUT_TODAY}
          value={gateOutsToday}
          icon={ArrowUpFromLine}
          variant="primary"
        />
        <KPICard
          title={UI_MESSAGES.KPI.TOTAL_TODAY}
          value={totalToday}
          icon={DoorOpen}
          variant="default"
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
                {UI_MESSAGES.COMMON.ALL} ({containerOperations.length})
              </TabsTrigger>
              <TabsTrigger value="gate-in">
                {UI_MESSAGES.TITLES.NEW_GATE_IN || "Gate-In"} ({gateIns.length})
              </TabsTrigger>
              <TabsTrigger value="gate-out">
                {UI_MESSAGES.TITLES.NEW_GATE_OUT || "Gate-Out"} ({gateOuts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={containerOperations}
                columns={columns}
                isLoading={loading}
                searchable
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_OPERATIONS}
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
    </DashboardLayout>
  );
}
