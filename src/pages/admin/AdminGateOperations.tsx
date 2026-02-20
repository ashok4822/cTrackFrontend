import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { adminNavItems } from "@/config/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GateOperation } from "@/types";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchGateOperations,
  createGateOperation,
} from "@/store/slices/gateOperationSlice";
import { Button } from "@/components/ui/button";
import { AddGateOperationDialog } from "@/components/gate/AddGateOperationDialog";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import { toast } from "sonner";

const columns: Column<GateOperation>[] = [
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
  {
    key: "vehicleNumber",
    header: "Vehicle",
    sortable: true,
  },
  {
    key: "driverName",
    header: "Driver",
  },
  {
    key: "purpose",
    header: "Purpose",
    render: (item) => <span className="capitalize">{item.purpose}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "timestamp",
    header: "Time",
    render: (item) => new Date(item.timestamp).toLocaleString(),
  },
];

export default function GateOperations() {
  const dispatch = useAppDispatch();
  const { operations, loading, error } = useAppSelector(
    (state) => state.gateOperations,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"gate-in" | "gate-out">(
    "gate-in",
  );

  useEffect(() => {
    dispatch(fetchGateOperations({}));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAddOperation = async (data: CreateGateOperationData) => {
    try {
      await dispatch(createGateOperation(data)).unwrap();
      toast.success(
        `Gate ${data.type === "gate-in" ? "In" : "Out"} recorded successfully`,
      );
      setIsAddDialogOpen(false);
    } catch (err: unknown) {
      toast.error(
        typeof err === "string" ? err : "Failed to record gate operation",
      );
    }
  };

  const gateIns = operations.filter((op) => op.type === "gate-in");
  const gateOuts = operations.filter((op) => op.type === "gate-out");

  const openAddDialog = (type: "gate-in" | "gate-out") => {
    setDefaultType(type);
    setIsAddDialogOpen(true);
  };

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle="Gate Operations"
      pageActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => openAddDialog("gate-in")}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Gate-In
          </Button>
          <Button className="gap-2" onClick={() => openAddDialog("gate-out")}>
            <ArrowUpFromLine className="h-4 w-4" />
            Gate-Out
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ArrowDownToLine className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {gateIns.length}
                </p>
                <p className="text-sm text-muted-foreground">Gate-Ins Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowUpFromLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {gateOuts.length}
                </p>
                <p className="text-sm text-muted-foreground">Gate-Outs Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Operations</TabsTrigger>
          <TabsTrigger value="gate-in">Gate-In</TabsTrigger>
          <TabsTrigger value="gate-out">Gate-Out</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={operations}
            isLoading={loading}
            columns={columns}
            searchPlaceholder="Search gate operations..."
          />
        </TabsContent>

        <TabsContent value="gate-in">
          <DataTable
            data={gateIns}
            isLoading={loading}
            columns={columns}
            searchPlaceholder="Search gate-in operations..."
          />
        </TabsContent>

        <TabsContent value="gate-out">
          <DataTable
            data={gateOuts}
            isLoading={loading}
            columns={columns}
            searchPlaceholder="Search gate-out operations..."
          />
        </TabsContent>
      </Tabs>

      <AddGateOperationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddOperation}
        defaultType={defaultType}
      />
    </DashboardLayout>
  );
}
