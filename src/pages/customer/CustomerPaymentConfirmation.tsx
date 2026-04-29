import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Receipt,
  ArrowRight,
  Download,
  Loader2,
} from "lucide-react";
import { billingService, type BillRecord } from "@/services/billingService";
import { generateBillPDF } from "@/utils/pdfGenerator";
import { UI_MESSAGES } from "@/constants/messages";


export default function CustomerPaymentConfirmation() {
  const { billId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get("status") || "success";
  const method = searchParams.get("method") || "pda";
  const isSuccess = status === "success";
  const [bill, setBill] = useState<BillRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Use lazy initializers to generate details once on mount without cascading renders
  const [transactionId] = useState(() => {
    return `TXN${Date.now()}`;
  });

  const [transactionDate] = useState(() => {
    return new Date().toLocaleString();
  });

  useEffect(() => {
    if (billId) {
      billingService.fetchBillById(billId)
        .then(setBill)
        .catch((error) => {
          console.error("Failed to fetch bill:", error);
        })
        .finally(() => setLoading(false));
    }
  }, [billId]);

  return (
    <DashboardLayout
      navItems={customerNavItems}
      pageTitle={isSuccess ? UI_MESSAGES.BILLING.PAYMENT_SUCCESSFUL : UI_MESSAGES.BILLING.PAYMENT_FAILED}
    >
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{UI_MESSAGES.BILLING.FETCHING_TRANSACTION}</p>
              </div>
            ) : isSuccess ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
                <h1 className="text-2xl font-bold text-success mb-2">
                  {UI_MESSAGES.BILLING.PAYMENT_SUCCESSFUL}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {UI_MESSAGES.BILLING.PAYMENT_SUCCESS_DESC}
                </p>

                {bill && (
                  <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      {UI_MESSAGES.DIALOG.TRANSACTION_HISTORY}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.BILLING.TRANSACTION_ID}</p>
                        <p className="font-mono font-medium">{transactionId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.BILLING.DATE_TIME}</p>
                        <p className="font-medium">{transactionDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.BILLING.BILL_NUMBER}</p>
                        <p className="font-mono font-medium">
                          {bill.billNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.TABLE.CONTAINER}</p>
                        <p className="font-mono font-medium">
                          {bill.containerNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.BILLING.PAYMENT_METHOD}</p>
                        <p className="font-medium capitalize">
                          {method === "pda"
                            ? UI_MESSAGES.COMMON.PDA_FULL
                            : UI_MESSAGES.BILLING.ONLINE_PAYMENT}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.BILLING.AMOUNT_PAID}</p>
                        <p className="font-bold text-lg text-success">
                          {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{bill.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => bill && generateBillPDF(bill)}
                    disabled={!bill}
                  >
                    <Download className="h-4 w-4" />
                    {UI_MESSAGES.BILLING.DOWNLOAD_RECEIPT}
                  </Button>
                  <Button
                    onClick={() => navigate("/customer/bills")}
                    className="gap-2"
                  >
                    {UI_MESSAGES.BILLING.VIEW_ALL_BILLS}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-destructive mb-2">
                  {UI_MESSAGES.BILLING.PAYMENT_FAILED}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {UI_MESSAGES.BILLING.PAYMENT_FAILED_DESC}
                </p>

                {bill && (
                  <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                    <h3 className="font-semibold mb-4">{UI_MESSAGES.BILLING.PAYMENT_DETAILS}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.BILLING.BILL_NUMBER}</p>
                        <p className="font-mono font-medium">
                          {bill.billNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{UI_MESSAGES.TABLE.AMOUNT}</p>
                        <p className="font-bold">
                          {UI_MESSAGES.COMMON.CURRENCY_SYMBOL}{bill.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-destructive/10 rounded text-sm text-destructive">
                      {UI_MESSAGES.COMMON.ERROR_LABEL} {UI_MESSAGES.BILLING.PAYMENT_FAILED_ERROR}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/customer/bills")}
                  >
                    {UI_MESSAGES.BILLING.BACK_TO_BILLS}
                  </Button>
                  <Button
                    onClick={() => navigate(`/customer/payment/${billId}`)}
                  >
                    {UI_MESSAGES.BILLING.TRY_AGAIN}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
