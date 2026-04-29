import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { customerNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { pdaService } from "@/services/pdaService";
import type { PreDepositAccount, PDATransaction } from "@/types";
import type { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";
import axios from "axios";
import { UI_MESSAGES } from "@/constants/messages";

export default function CustomerPDA() {
  const [pda, setPDA] = useState<PreDepositAccount | null>(null);
  const [transactions, setTransactions] = useState<PDATransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    fetchPDA();
  }, []);

  const fetchPDA = async () => {
    try {
      setLoading(true);
      const data = await pdaService.getPDA();
      if (data) {
        setPDA(data);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      toast.error(UI_MESSAGES.PDA.FETCH_FAILED);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(UI_MESSAGES.PDA.INVALID_AMOUNT);
      return;
    }

    setDepositing(true);

    try {
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
        toast.error(UI_MESSAGES.PDA.SDK_LOAD_FAILED);
        setDepositing(false);
        return;
      }

      // 2. Create Order
      const order = await pdaService.createPDAOrder(amount);

      // 3. Open Razorpay Checkout
      const options: RazorpayOptions = {
        key:
          import.meta.env.VITE_RAZOR_KEY_ID ||
          "rzp_test_KDYrLJHnu3O9Ip",
        amount: order.amount,
        currency: order.currency,
        name: "cTrack Logistics",
        description: `PDA Deposit for ${pda?.customer}`,
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            setDepositing(true);
            const verifiedTx = await pdaService.verifyPDAPayment(amount, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifiedTx) {
              toast.success(UI_MESSAGES.PDA.DEPOSIT_SUCCESS(amount));
              setDepositAmount("");
              fetchPDA(); // Refresh data
            }
          } catch (error) {
            let message = UI_MESSAGES.PDA.VERIFY_FAILED;
            if (axios.isAxiosError(error)) {
              message = error.response?.data?.message || message;
            }
            toast.error(message);
          } finally {
            setDepositing(false);
          }
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function () {
            setDepositing(false);
          },
        },
      };

      setIsDialogOpen(false);
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      let message = UI_MESSAGES.PDA.INIT_FAILED;
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error(message);
      setDepositing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle={UI_MESSAGES.COMMON.PDA_FULL}>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pda) return null;

  const monthlySpending = transactions
    .filter(tx => tx.type === 'debit' && new Date(tx.timestamp).getMonth() === new Date().getMonth() && new Date(tx.timestamp).getFullYear() === new Date().getFullYear())
    .reduce((sum, tx) => sum + tx.amount, 0);

  const lastActivity = transactions.length > 0 ? transactions[0] : null;

  return (
    <DashboardLayout
      navItems={customerNavItems}
      pageTitle={UI_MESSAGES.COMMON.PDA_FULL}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={UI_MESSAGES.KPI.ACCOUNT_STATUS}
          value={`${UI_MESSAGES.COMMON.CURRENCY_SYMBOL}${pda.balance.toLocaleString()}`}
          icon={Wallet}
          variant={pda.balance < (pda.lowBalanceThreshold || 0) ? "danger" : "success"}
          subtitle={
            pda.balance < (pda.lowBalanceThreshold || 0) ? (
              <span className="text-destructive font-semibold">{UI_MESSAGES.PDA.LOW_BALANCE_ALERT}</span>
            ) : UI_MESSAGES.PDA.AVAILABLE_FUNDS
          }
        />
        <KPICard
          title={UI_MESSAGES.KPI.SPENT_THIS_MONTH}
          value={`${UI_MESSAGES.COMMON.CURRENCY_SYMBOL}${monthlySpending.toLocaleString()}`}
          icon={TrendingUp}
          variant="warning"
          subtitle={UI_MESSAGES.KPI.SPENT_THIS_MONTH}
        />
        <KPICard
          title={UI_MESSAGES.PDA.LAST_UPDATE}
          value={lastActivity ? `${lastActivity.type === 'credit' ? '+' : '-'}${UI_MESSAGES.COMMON.CURRENCY_SYMBOL}${lastActivity.amount.toLocaleString()}` : UI_MESSAGES.PDA.NO_ACTIVITY}
          icon={lastActivity?.type === 'credit' ? ArrowUpCircle : ArrowDownCircle}
          variant="primary"
          subtitle={lastActivity ? lastActivity.description.replace(/\(.*\)/, '').trim() : UI_MESSAGES.PDA.NO_TRANSACTIONS_DESC}
        />
        <KPICard 
          title={UI_MESSAGES.KPI.ACCOUNT_STATUS} 
          value={UI_MESSAGES.KPI.ACTIVE} 
          icon={CheckCircle2} 
          variant="success" 
          subtitle={UI_MESSAGES.KPI.PDA_STATUS}
        />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{UI_MESSAGES.PDA.RECENT_TRANSACTIONS}</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> {UI_MESSAGES.PDA.DEPOSIT_FUNDS}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{UI_MESSAGES.PDA.DEPOSIT_FUNDS}</DialogTitle>
                  <DialogDescription>
                    {UI_MESSAGES.PDA.ADD_FUNDS_DESC}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{UI_MESSAGES.BILLING.AMOUNT} (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder={UI_MESSAGES.PDA.ENTER_AMOUNT}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={depositing}
                  >
                    {UI_MESSAGES.COMMON.CANCEL}
                  </Button>
                  <Button onClick={handleDeposit} disabled={depositing}>
                    {depositing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {UI_MESSAGES.PDA.CONFIRM_DEPOSIT}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${tx.type === "credit" ? "bg-success/10" : "bg-destructive/10"}`}
                    >
                      {tx.type === "credit" ? (
                        <ArrowUpCircle className="h-6 w-6 text-success" />
                      ) : (
                        <ArrowDownCircle className="h-6 w-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${tx.type === "credit" ? "text-success" : "text-destructive"}`}
                    >
                      {tx.type === "credit" ? "+" : "-"}{UI_MESSAGES.COMMON.CURRENCY_SYMBOL}
                      {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {UI_MESSAGES.PDA.BALANCE_AFTER} {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{tx.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {UI_MESSAGES.PDA.NO_TRANSACTIONS}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{UI_MESSAGES.PDA.ACCOUNT_DETAILS}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {UI_MESSAGES.PDA.ACCOUNT_HOLDER}
              </p>
              <p className="font-semibold text-lg">{pda.customer}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {UI_MESSAGES.PDA.ACCOUNT_ID}
              </p>
              <p className="font-semibold text-lg">
                PDA-{pda.id.substring(pda.id.length - 4).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {UI_MESSAGES.PDA.LAST_UPDATE}
              </p>
              <p className="font-semibold">
                {new Date(pda.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
