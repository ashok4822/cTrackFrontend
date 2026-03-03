import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { customerNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  DollarSign,
  Clock,
  Printer,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { billingService, type BillRecord } from "@/services/billingService";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerBills() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { toast } = useToast();

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingService.fetchBills();
      setBills(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load your bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const pendingBills = bills.filter((b) => b.status === "pending");
  const paidBills = bills.filter((b) => b.status === "paid");
  const overdueBills = bills.filter((b) => b.status === "overdue");

  const totalPending = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + b.totalAmount, 0);

  const handleSimulatePayment = async (billId: string) => {
    setPaymentProcessing(true);
    try {
      // Simulate gateway delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Reusing markBillPaid instead of a real gateway for now
      await billingService.markBillPaid(billId);

      toast({
        title: "Payment Successful",
        description: `Your payment has been processed.`,
      });
      setSelectedBill(null);
      fetchBills();
    } catch {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const columns: Column<BillRecord>[] = [
    { key: "billNumber", header: "Bill No.", sortable: true },
    { key: "containerNumber", header: "Container", sortable: true },
    {
      key: "totalAmount",
      header: "Amount",
      render: (item) => (
        <span className="font-medium">
          ₹{item.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (item) => new Date(item.dueDate).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Dialog open={selectedBill?.id === item.id} onOpenChange={(open) => setSelectedBill(open ? item : null)}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedBill(item)}
            >
              View
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bill Details</DialogTitle>
              <DialogDescription>{item.billNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bill Number</p>
                  <p className="font-bold text-lg">{item.billNumber}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Container</Label>
                  <p className="font-medium">{item.containerNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date Issued</Label>
                  <p className="font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">
                    {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Billed To</Label>
                  <p className="font-medium">{item.customerName || "You"}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Charges
                </Label>
                <div className="space-y-2">
                  {item.lineItems.map((li, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{li.activityName} </span>
                      <span className="text-muted-foreground">
                        {li.quantity} × ₹{li.unitPrice} = ₹
                        {li.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {item.remarks && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Remarks</Label>
                    <p className="text-sm">{item.remarks}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Due</span>
                <span className="text-xl font-bold">
                  ₹{item.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {item.status !== "paid" && (
                <Button
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleSimulatePayment(item.id)}
                  disabled={paymentProcessing}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {paymentProcessing ? "Processing..." : "Pay Now"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="My Bills">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Bills" value={bills.length} icon={Receipt} />
        <KPICard
          title="Outstanding Balance"
          value={`₹${totalPending.toLocaleString()}`}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Total Paid"
          value={`₹${totalPaid.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Overdue"
          value={overdueBills.length}
          icon={Receipt}
          variant="danger"
        />
      </div>

      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={fetchBills} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({bills.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingBills.length})
              </TabsTrigger>
              <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={bills}
                columns={columns}
                searchable
                searchPlaceholder="Search invoices..."
              />
            </TabsContent>
            <TabsContent value="pending">
              <DataTable
                data={pendingBills}
                columns={columns}
                searchable
                emptyMessage="No pending bills"
              />
            </TabsContent>
            <TabsContent value="paid">
              <DataTable
                data={paidBills}
                columns={columns}
                searchable
                emptyMessage="No paid bills"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
