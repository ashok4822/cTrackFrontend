import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OverdueBlockerProps {
  title?: string;
  message?: string;
}

export function OverdueBlocker({ 
  title = "Access Denied", 
  message = "You have overdue bills. Please settle your outstanding payments to access this feature." 
}: OverdueBlockerProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center p-6 h-full min-h-[400px]">
      <Card className="max-w-md w-full border-red-200 shadow-lg">
        <CardHeader className="text-center pb-2 bg-red-50/50 rounded-t-lg border-b border-red-100">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-red-700 text-xl">{title}</CardTitle>
          <CardDescription className="text-foreground/80 mt-2 text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Our system has detected unpaid invoices on your account that are past their due date. 
            Once payment is processed, full access will be automatically restored.
          </p>
          <Button 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" 
            onClick={() => navigate("/customer/bills")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            View and Pay Bills
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
