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
import { useToast } from "@/hooks/useToast";
import { generateBillPDF } from "@/utils/pdfGenerator";
import { UI_MESSAGES } from "@/constants/messages";

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

interface ApiUser {
  id?: string;
  _id?: string;
  role?: string;
  companyName?: string;
  name?: string;
  email?: string;
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
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.BILLING.FETCH_FAILED,
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
        (u: ApiUser) => u.role?.toLowerCase() === "customer",
      );
      setCustomers(
        customerUsers.map((u: ApiUser) => ({
          id: u.id || u._id,
          name: u.companyName || u.name || u.email || UI_MESSAGES.COMMON.NA,
        })),
      );
    } catch (error) {
      console.error(UI_MESSAGES.ACTIVITY.FETCH_FAILED, error);
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
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.BILLING.MANDATORY_FIELDS,
        variant: "destructive",
      });
      return;
    }

    if (lineItems.some((item) => !item.description || item.unitPrice < 0)) {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.BILLING.INVALID_LINE_ITEMS,
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        customer: miscForm.customer, // This is now an ID
        containerNumber: miscForm.containerNumber,
        shippingLine: miscForm.shippingLine || UI_MESSAGES.COMMON.NA,
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
        title: UI_MESSAGES.TITLES.BILL_GENERATED,
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
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.BILLING.GENERATE_FAILED,
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async (bill: BillRecord) => {
    try {
      await billingService.markBillPaid(bill.id);
      toast({
        title: UI_MESSAGES.TITLES.BILL_PAID,
        description: `Bill ${bill.billNumber} marked as paid`,
      });
      fetchBills();
    } catch {
      toast({
        title: UI_MESSAGES.TITLES.ERROR,
        description: UI_MESSAGES.BILLING.MARK_PAID_FAILED,
        variant: "destructive",
      });
    }
  };

  const columns: Column<BillRecord>[] = [
    { key: "billNumber", header: UI_MESSAGES.BILLING.BILL_NO, sortable: true },
    { key: "containerNumber", header: UI_MESSAGES.TABLE.CONTAINER, sortable: true },
    { key: "shippingLine", header: UI_MESSAGES.TABLE.SHIPPING_LINE },
    {
      key: "customer",
      header: UI_MESSAGES.TABLE.CUSTOMER,
      render: (item) => (
        <span>{item.customerName || item.customer || UI_MESSAGES.COMMON.NA}</span>
      ),
    },
    {
      key: "totalAmount",
      header: UI_MESSAGES.TABLE.AMOUNT,
      render: (item) => (
        <span className="font-medium">
          {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{item.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: UI_MESSAGES.TABLE.STATUS,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "dueDate",
      header: UI_MESSAGES.BILLING.DUE_DATE,
      render: (item) => new Date(item.dueDate).toLocaleDateString(),
    },
    {
      key: "paidAt",
      header: UI_MESSAGES.BILLING.PAID_DATE,
      render: (item) => item.paidAt ? new Date(item.paidAt).toLocaleDateString() : UI_MESSAGES.COMMON.NA,
    },
    {
      key: "actions",
      header: UI_MESSAGES.TABLE.ACTIONS,
      render: (item) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              {UI_MESSAGES.TABLE.VIEW}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{UI_MESSAGES.BILLING.BILL_DETAILS}</DialogTitle>
              <DialogDescription>{item.billNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{UI_MESSAGES.BILLING.BILL_NUMBER}</p>
                  <p className="font-bold text-lg">{item.billNumber}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.CONTAINER}</Label>
                  <p className="font-medium">{item.containerNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.SHIPPING_LINE}</Label>
                  <p className="font-medium">{item.shippingLine}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{UI_MESSAGES.TABLE.CUSTOMER}</Label>
                  <p className="font-medium">
                    {item.customerName || item.customer || UI_MESSAGES.COMMON.NA}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{UI_MESSAGES.BILLING.DUE_DATE}</Label>
                  <p className="font-medium">
                    {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
                {item.status === "paid" && item.paidAt && (
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.BILLING.PAID_DATE}</Label>
                    <p className="font-medium">
                      {new Date(item.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  {UI_MESSAGES.BILLING.CHARGES}
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
              {item.remarks && item.remarks.replace(/\s*\|?\s*REQ-[a-f0-9]+/gi, "").trim() && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">{UI_MESSAGES.STUFFING.NOTES}</Label>
                    <p className="text-sm">{item.remarks.replace(/\s*\|?\s*REQ-[a-f0-9]+/gi, "").trim()}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">{UI_MESSAGES.BILLING.TOTAL_AMOUNT}</span>
                <span className="text-xl font-bold">
                  {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{item.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => generateBillPDF(item)}
              >
                <Printer className="mr-2 h-4 w-4" />
                {UI_MESSAGES.BILLING.DOWNLOAD_PDF}
              </Button>
              {item.status === "pending" && (
                <Button onClick={() => handleMarkPaid(item)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {UI_MESSAGES.BILLING.MARK_AS_PAID}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle={UI_MESSAGES.TITLES.BILLING}>
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title={UI_MESSAGES.BILLING.TOTAL_BILLS} value={bills.length} icon={Receipt} />
        <KPICard
          title={UI_MESSAGES.BILLING.PENDING_AMOUNT}
          value={`₹${totalPending.toLocaleString()}`}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title={UI_MESSAGES.BILLING.TOTAL_COLLECTED}
          value={`${UI_MESSAGES.COMMON.CURRENCY_SYMBOL}${totalCollected.toLocaleString()}`}
          icon={IndianRupee}
          variant="success"
        />
        <KPICard
          title={UI_MESSAGES.BILLING.OVERDUE_BILLS}
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
          {UI_MESSAGES.COMMON.REFRESH}
        </Button>
        <Dialog open={miscBillOpen} onOpenChange={setMiscBillOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {UI_MESSAGES.BILLING.GENERATE_MISC}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{UI_MESSAGES.BILLING.GENERATE_MISC}</DialogTitle>
              <DialogDescription>
                {UI_MESSAGES.BILLING.MISC_BILL_DESC}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Bill Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{UI_MESSAGES.TABLE.CUSTOMER} <span className="text-destructive">*</span></Label>
                  <Select
                    value={miscForm.customer}
                    onValueChange={(value) =>
                      setMiscForm({ ...miscForm, customer: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={UI_MESSAGES.COMMON.SELECT_CUSTOMER} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {UI_MESSAGES.COMMON.NO_DATA}
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
                  <Label>{UI_MESSAGES.TABLE.CONTAINER_NO} <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder={UI_MESSAGES.COMMON.PLACEHOLDERS.CONTAINER_NO_EG}
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
                  <Label>{UI_MESSAGES.TABLE.SHIPPING_LINE}</Label>
                  <Input
                    placeholder={UI_MESSAGES.BILLING.AUTO_FETCH_SHIP_LINE}
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
                  <Label className="text-base font-semibold">{UI_MESSAGES.BILLING.LINE_ITEMS}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {UI_MESSAGES.BILLING.ADD_ITEM}
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
                            {UI_MESSAGES.BILLING.DESCRIPTION}
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
                            <SelectValue placeholder={UI_MESSAGES.BILLING.SELECT_ACTIVITY} />
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
                            {UI_MESSAGES.BILLING.QUANTITY_SHORT}
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
                            {UI_MESSAGES.BILLING.UNIT_PRICE}
                          </Label>
                        )}
                        <Input
                          type="number"
                          min="0"
                          placeholder={`${UI_MESSAGES.COMMON.CURRENCY_SYMBOL}0`}
                          value={item.unitPrice || 0}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            {UI_MESSAGES.BILLING.AMOUNT}
                          </Label>
                        )}
                        <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                          {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{item.amount.toLocaleString()}
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
                <span className="font-semibold">{UI_MESSAGES.BILLING.TOTAL_AMOUNT}</span>
                <span className="text-2xl font-bold">
                  {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{getTotalAmount().toLocaleString()}
                </span>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>{UI_MESSAGES.STUFFING.NOTES}</Label>
                <Textarea
                  placeholder={UI_MESSAGES.STUFFING.NOTES_PLACEHOLDER}
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
                {UI_MESSAGES.COMMON.CANCEL}
              </Button>
              <Button onClick={handleGenerateMiscBill}>
                <FileText className="mr-2 h-4 w-4" />
                {UI_MESSAGES.BILLING.GENERATE_BILL}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>{UI_MESSAGES.BILLING.BILLS}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">{UI_MESSAGES.KPI.ALL} ({bills.length})</TabsTrigger>
              <TabsTrigger value="pending">
                {UI_MESSAGES.KPI.PENDING} ({pendingBills.length})
              </TabsTrigger>
              <TabsTrigger value="paid">{UI_MESSAGES.TITLES.PAID} ({paidBills.length})</TabsTrigger>
              <TabsTrigger value="overdue">
                {UI_MESSAGES.TITLES.OVERDUE} ({overdueBills.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DataTable
                data={bills}
                columns={columns}
                searchable
                searchPlaceholder={UI_MESSAGES.BILLING.SEARCH_BILLS}
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
                emptyMessage={UI_MESSAGES.BILLING.NO_OVERDUE_BILLS}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
