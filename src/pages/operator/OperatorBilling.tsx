import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import { KPICard } from "@/components/common/KPICard";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { operatorNavItems } from "@/config/navigation";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Receipt,
  IndianRupee,
  Clock,
  CheckCircle,
  FileText,
  Printer,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { billingService, type BillRecord, type Charge } from "@/services/billingService";
import { containerService } from "@/services/containerService";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateBillPDF } from "@/utils/pdfGenerator";

interface MiscLineItem {
  id: string;
  description: string;
  activityCode: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface CustomerOption {
  id: string;
  name: string;
}



export default function OperatorBilling() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [miscBillOpen, setMiscBillOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const { toast } = useToast();

  // Miscellaneous bill form state
  const [miscForm, setMiscForm] = useState({
    customer: "",
    containerNumber: "",
    shippingLine: "",
    remarks: "",
  });
  const [lineItems, setLineItems] = useState<MiscLineItem[]>([
    { id: "1", description: "", activityCode: "MISC", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingService.fetchBills();
      setBills(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      const data = Array.isArray(response.data) ? response.data :
        (response.data?.users && Array.isArray(response.data.users)) ? response.data.users : [];

      const customerUsers = data.filter(
        (u: any) => u.role?.toLowerCase() === "customer",
      );
      setCustomers(
        customerUsers.map((u: any) => ({
          id: u.id || u._id,
          name: u.companyName || u.name || u.email || "Unknown",
        })),
      );
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  }, []);

  const fetchCharges = useCallback(async () => {
    try {
      const data = await billingService.fetchCharges();
      setCharges(data.filter((c) => c.active).map(c => ({
        ...c,
        id: c.id || c.activityId // Ensure every charge has an id
      })));
    } catch (error) {
      console.error("Failed to fetch charges:", error);
    }
  }, []);

  useEffect(() => {
    fetchBills();
    fetchCustomers();
    fetchCharges();
  }, [fetchBills, fetchCustomers, fetchCharges]);

  // Auto-fetch container details (shipping line) when container number is entered
  useEffect(() => {
    const fetchContainerDetails = async () => {
      if (miscForm.containerNumber.length === 11) {
        try {
          const containers = await containerService.getContainers({
            containerNumber: miscForm.containerNumber,
          });
          if (containers && containers.length > 0) {
            setMiscForm((prev) => ({
              ...prev,
              shippingLine: containers[0].shippingLine,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch container details:", error);
        }
      }
    };
    fetchContainerDetails();
  }, [miscForm.containerNumber]);

  const pendingBills = bills.filter((b) => b.status === "pending");
  const paidBills = bills.filter((b) => b.status === "paid");
  const overdueBills = bills.filter((b) => b.status === "overdue");

  const totalPending = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCollected = paidBills.reduce((sum, b) => sum + b.totalAmount, 0);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: "",
        activityCode: "MISC",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (
    id: string,
    field: keyof MiscLineItem,
    value: string | number,
  ) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          let updated = { ...item, [field]: value };
          if (field === "description") {
            // Find the charge to get the price
            const selectedCharge = charges.find((c) => c.id === value);
            if (selectedCharge) {
              updated = {
                ...updated,
                description: `${selectedCharge.activityName} - ${selectedCharge.containerSize} (${selectedCharge.containerType})`,
                activityCode: selectedCharge.activityId, // Or selectedCharge.activityCode if available in Charge
                unitPrice: selectedCharge.rate,
                amount: item.quantity * selectedCharge.rate,
              };
            }
          }
          if (field === "quantity" || field === "unitPrice") {
            updated.amount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const getTotalAmount = () =>
    lineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleGenerateMiscBill = async () => {
    if (!miscForm.customer || miscForm.customer === "none" || !miscForm.containerNumber) {
      toast({
        title: "Error",
        description: "Customer and Container Number are mandatory",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.some((item) => !item.description || item.unitPrice < 0)) {
      toast({
        title: "Error",
        description: "Please fill all line items with valid amounts",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        customer: miscForm.customer, // This is now an ID
        containerNumber: miscForm.containerNumber,
        shippingLine: miscForm.shippingLine || "N/A",
        remarks: miscForm.remarks,
        lineItems: lineItems.map((item) => ({
          activityCode: item.activityCode || "MISC",
          activityName: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        totalAmount: getTotalAmount(),
      };

      await billingService.createBill(payload);

      toast({
        title: "Miscellaneous Bill Generated",
        description: `Bill created for ₹${getTotalAmount().toLocaleString()}`,
      });

      // Reset form
      setMiscForm({
        customer: "",
        containerNumber: "",
        shippingLine: "",
        remarks: "",
      });
      setLineItems([
        { id: "1", description: "", activityCode: "MISC", quantity: 1, unitPrice: 0, amount: 0 },
      ]);
      setMiscBillOpen(false);
      fetchBills();
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate miscellaneous bill",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async (bill: BillRecord) => {
    try {
      await billingService.markBillPaid(bill.id);
      toast({
        title: "Bill paid",
        description: `Bill ${bill.billNumber} marked as paid`,
      });
      fetchBills();
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark bill as paid",
        variant: "destructive",
      });
    }
  };

  const columns: Column<BillRecord>[] = [
    { key: "billNumber", header: "Bill No.", sortable: true },
    { key: "containerNumber", header: "Container", sortable: true },
    { key: "shippingLine", header: "Shipping Line" },
    {
      key: "customer",
      header: "Customer",
      render: (item) => (
        <span>{item.customerName || item.customer || "N/A"}</span>
      ),
    },
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
      key: "paidAt",
      header: "Paid Date",
      render: (item) => item.paidAt ? new Date(item.paidAt).toLocaleDateString() : "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
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
                  <Label className="text-muted-foreground">Shipping Line</Label>
                  <p className="font-medium">{item.shippingLine}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">
                    {item.customerName || item.customer || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">
                    {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
                {item.status === "paid" && item.paidAt && (
                  <div>
                    <Label className="text-muted-foreground">Paid Date</Label>
                    <p className="font-medium">
                      {new Date(item.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
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
                      <span>
                        {li.activityName}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({li.activityCode})
                        </span>
                      </span>
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
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold">
                  ₹{item.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => generateBillPDF(item)}
              >
                <Printer className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {item.status === "pending" && (
                <Button onClick={() => handleMarkPaid(item)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Billing">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Bills" value={bills.length} icon={Receipt} />
        <KPICard
          title="Pending Amount"
          value={`₹${totalPending.toLocaleString()}`}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Collected (Paid)"
          value={`₹${totalCollected.toLocaleString()}`}
          icon={IndianRupee}
          variant="success"
        />
        <KPICard
          title="Overdue Bills"
          value={overdueBills.length}
          icon={Receipt}
          variant="danger"
        />
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end gap-2">
        <Button variant="outline" onClick={fetchBills} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        <Dialog open={miscBillOpen} onOpenChange={setMiscBillOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Miscellaneous Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Miscellaneous Bill</DialogTitle>
              <DialogDescription>
                Create a bill for miscellaneous charges not linked to standard
                activities
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer <span className="text-destructive">*</span></Label>
                  <Select
                    value={miscForm.customer}
                    onValueChange={(value) =>
                      setMiscForm({ ...miscForm, customer: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No customers found
                        </SelectItem>
                      ) : (
                        customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Container Number <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g., MSCU1234567"
                    value={miscForm.containerNumber}
                    onChange={(e) =>
                      setMiscForm({
                        ...miscForm,
                        containerNumber: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Line</Label>
                  <Input
                    placeholder="Auto-fetched or enter manually"
                    value={miscForm.shippingLine}
                    onChange={(e) =>
                      setMiscForm({
                        ...miscForm,
                        shippingLine: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Line Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-5 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Description
                          </Label>
                        )}
                        <Select
                          value={charges.some(c => `${c.activityName} - ${c.containerSize} (${c.containerType})` === item.description)
                            ? charges.find(c => `${c.activityName} - ${c.containerSize} (${c.containerType})` === item.description)?.id
                            : ""}
                          onValueChange={(value) =>
                            updateLineItem(item.id, "description", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent>
                            {charges.map((c) => (
                              <SelectItem key={c.id} value={c.id!}>
                                {c.activityName} - {c.containerSize} ({c.containerType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Qty
                          </Label>
                        )}
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Unit Price
                          </Label>
                        )}
                        <Input
                          type="number"
                          min="0"
                          placeholder="₹0"
                          value={item.unitPrice || 0}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Amount
                          </Label>
                        )}
                        <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                          ₹{item.amount.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                          className="h-10 w-10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                <span className="font-semibold">Total Amount</span>
                <span className="text-2xl font-bold">
                  ₹{getTotalAmount().toLocaleString()}
                </span>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Textarea
                  placeholder="Any additional notes or remarks..."
                  value={miscForm.remarks}
                  onChange={(e) =>
                    setMiscForm({ ...miscForm, remarks: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMiscBillOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateMiscBill}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({bills.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingBills.length})
              </TabsTrigger>
              <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue ({overdueBills.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={bills}
                columns={columns}
                searchable
                searchPlaceholder="Search bills..."
              />
            </TabsContent>
            <TabsContent value="pending">
              <DataTable data={pendingBills} columns={columns} searchable />
            </TabsContent>
            <TabsContent value="paid">
              <DataTable data={paidBills} columns={columns} searchable />
            </TabsContent>
            <TabsContent value="overdue">
              <DataTable
                data={overdueBills}
                columns={columns}
                searchable
                emptyMessage="No overdue bills"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
