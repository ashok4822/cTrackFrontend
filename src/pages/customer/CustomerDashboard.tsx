import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
// import { SupportChatbot } from "@/components/customer/SupportChatbot";
import {
  Factory,
  // Plus,
} from "lucide-react";

export default function CustomerDashboard() {
  // Filter containers for this customer (ABC Manufacturing in demo)

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="Customer Dashboard">
      {/* Organization Info */}
      <div className="mb-6 rounded-lg border bg-success/5 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
            <Factory className="h-7 w-7 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              ABC Manufacturing
            </h2>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold mb-2">
            Welcome to Customer Dashboard
          </h3>
          <p className="text-muted-foreground">
            New operational features are coming soon. Stay tuned!
          </p>
        </div>
      </div>

      {/* Support Chatbot */}
      {/* <SupportChatbot /> */}
    </DashboardLayout>
  );
}
