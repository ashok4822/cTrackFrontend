import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { dummyBills, dummyPDAs } from "@/data/dummyData";
import { toast } from "@/hooks/use-toast";

export default function CustomerPayment() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>("pda");
  const [isProcessing, setIsProcessing] = useState(false);

  // Find the bill
  const bill = dummyBills.find((b) => b.id === billId);

  // Get PDA balance (using first PDA for demo)
  const pdaAccount = dummyPDAs[0];
  const pdaBalance = pdaAccount?.balance || 0;
  const hasSufficientBalance = pdaBalance >= (bill?.totalAmount || 0);

  if (!bill) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Payment">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bill Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The bill you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/customer/bills")}>
              Back to Bills
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (bill.status === "paid") {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Payment">
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bill Already Paid</h2>
            <p className="text-muted-foreground mb-4">
              This bill has already been paid.
            </p>
            <Button onClick={() => navigate("/customer/bills")}>
              Back to Bills
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const handlePayment = async () => {
    if (paymentMethod === "pda" && !hasSufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Your PDA balance is insufficient for this payment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Navigate to confirmation page
    navigate(
      `/customer/payment-confirmation/${billId}?status=success&method=${paymentMethod}`,
    );
  };

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="Payment">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/customer/bills")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Bills
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bill Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
            <CardDescription>
              Bill Number:{" "}
              <span className="font-mono font-medium text-foreground">
                {bill.billNumber}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Container</p>
                <p className="font-mono font-medium">{bill.containerNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.name}</TableCell>
                    <TableCell className="text-right">
                      {activity.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{activity.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{activity.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total Amount
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    ₹{bill.totalAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Select your preferred payment option
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {/* PDA Option */}
              <div
                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === "pda"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value="pda" id="pda" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="pda"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Wallet className="h-5 w-5" />
                    <span className="font-medium">
                      Pre-Deposit Account (PDA)
                    </span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available Balance:{" "}
                    <span
                      className={
                        hasSufficientBalance
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      ₹{pdaBalance.toLocaleString()}
                    </span>
                  </p>
                  {!hasSufficientBalance && (
                    <p className="text-xs text-destructive mt-1">
                      Insufficient balance
                    </p>
                  )}
                </div>
              </div>

              {/* Online Payment Option */}
              <div
                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === "online"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value="online" id="online" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="online"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Online Payment</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Credit/Debit Card, UPI, Net Banking
                  </p>
                </div>
              </div>
            </RadioGroup>

            {paymentMethod === "online" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input placeholder="123" type="password" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cardholder Name</Label>
                  <Input placeholder="Name on card" />
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Amount to Pay</span>
                <span className="text-2xl font-bold">
                  ₹{bill.totalAmount.toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={
                  isProcessing ||
                  (paymentMethod === "pda" && !hasSufficientBalance)
                }
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    {paymentMethod === "pda" ? (
                      <Wallet className="h-4 w-4 mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Pay ₹{bill.totalAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
