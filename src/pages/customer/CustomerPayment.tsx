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
  Loader2,
} from "lucide-react";
import { billingService, type BillRecord } from "@/services/billingService";
import { pdaService } from "@/services/pdaService";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CustomerPayment() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>("pda");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmPDA, setShowConfirmPDA] = useState(false);
  const [bill, setBill] = useState<BillRecord | null>(null);
  const [pdaBalance, setPdaBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!billId) return;
    setLoading(true);
    try {
      const [billData, pdaData] = await Promise.all([
        billingService.fetchBillById(billId),
        pdaService.getPDA(),
      ]);
      setBill(billData);
      setPdaBalance(pdaData.balance);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load payment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [billId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasSufficientBalance = pdaBalance >= (bill?.totalAmount || 0);

  if (loading) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Payment">
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </DashboardLayout>
    );
  }

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

    try {
      if (paymentMethod === "pda") {
        setShowConfirmPDA(true);
        setIsProcessing(false);
        return;
      } else {
        if (!billId || !bill) throw new Error("Bill information is missing");

        // 1. Load Razorpay script
        const loadScript = (src: string) => {
          return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const isScriptLoaded = await loadScript(
          "https://checkout.razorpay.com/v1/checkout.js",
        );

        if (!isScriptLoaded) {
          toast({
            title: "Error",
            description: "Razorpay SDK failed to load. Are you online?",
            variant: "destructive",
          });
          return;
        }

        // 2. Create Order
        const order = await billingService.createRazorpayOrder(billId);

        // 3. Open Razorpay Checkout
        const options = {
          key:
            (import.meta as any).env.VITE_RAZOR_KEY_ID ||
            "rzp_test_KDYrLJHnu3O9Ip",
          amount: order.amount,
          currency: order.currency,
          name: "cTrack Logistics",
          description: `Payment for Bill ${bill.billNumber}`,
          order_id: order.id,
          handler: async function (response: any) {
            try {
              setIsProcessing(true);
              const verificationResult =
                await billingService.verifyRazorpayPayment(billId, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

              if (verificationResult) {
                toast({
                  title: "Payment Successful",
                  description: "Your payment has been verified successfully.",
                });
                navigate(
                  `/customer/payment-confirmation/${billId}?status=success&method=${paymentMethod}`,
                );
              }
            } catch (error: any) {
              toast({
                title: "Verification Failed",
                description:
                  error.response?.data?.message ||
                  "Payment verification failed. Please contact support.",
                variant: "destructive",
              });
              navigate(
                `/customer/payment-confirmation/${billId}?status=failure&method=online`
              );
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: "", // Will be filled by customer if available
            email: "",
            contact: "",
          },
          theme: {
            color: "#0f172a",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);

        rzp.on("payment.failed", function (response: any) {
          console.error("Payment failed:", response.error);
          setIsProcessing(false);
          navigate(
            `/customer/payment-confirmation/${billId}?status=failure&method=online`,
            { replace: true }
          );
        });

        rzp.open();
        return; // SDK handler will take over
      }

      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });

      // Navigate to confirmation page
      navigate(
        `/customer/payment-confirmation/${billId}?status=success&method=${paymentMethod}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processPDAPayment = async () => {
    if (!billId) return;
    setIsProcessing(true);
    setShowConfirmPDA(false);
    try {
      await billingService.payBill(billId);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      navigate(
        `/customer/payment-confirmation/${billId}?status=success&method=pda`
      );
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description:
          error.response?.data?.message ||
          "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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
                {bill.lineItems.map((activity, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{activity.activityName}</TableCell>
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
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <p className="text-sm font-medium">
                  Secure Payment via Razorpay
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You will be redirected to the secure Razorpay payment gateway
                  to complete your transaction.
                </p>
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

      <AlertDialog open={showConfirmPDA} onOpenChange={setShowConfirmPDA}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm PDA Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pay ₹{bill.totalAmount.toLocaleString()} using your Pre-Deposit Account?
              This amount will be deducted from your current balance of ₹{pdaBalance.toLocaleString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700"
              onClick={processPDAPayment}
            >
              Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
