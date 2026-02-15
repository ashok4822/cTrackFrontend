import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/common/KPICard";
import { operatorNavItems } from "@/config/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DoorOpen,
  Container,
  CheckSquare,
  ArrowRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  FileCheck,
  MapPin,
  Package,
  User,
  Phone,
} from "lucide-react";
// import { gateService } from "@/services/gateService";
// import { taskService } from "@/services/taskService";
// import { containerService } from "@/services/containerService";
// import { Link } from "react-router-dom";
// import { useToast } from "@/hooks/use-toast";
import type { KPIData } from "@/types";

interface Nomination {
  id: string;
  containerNumber: string;
  shippingLine: string;
  customer: string;
  factory: string;
  location: string;
  distance: string;
  size: string;
  type: string;
  movementType: string;
  status: string;
  nominatedAt: string;
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export default function OperatorDashboard() {
  // const { toast } = useToast();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [gateOps, setGateOps] = useState<any[]>([]);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     try {
  //       const [kpi, taskList, gateList, nominationList] = await Promise.all([
  //         gateService.getKPIData(),
  //         taskService.getTasks(),
  //         gateService.getGateOperations(),
  //         taskService.getNominations()
  //       ]);
  //       setKpiData(kpi);
  //       setTasks(taskList);
  //       setGateOps(gateList);
  //       setNominations(nominationList as Nomination[]);
  //     } catch (error) {
  //       toast({
  //         title: "Error",
  //         description: "Failed to load dashboard data.",
  //         variant: "destructive",
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchDashboardData();
  // }, []);

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const pendingGateOps = gateOps.filter((g) => g.status === "pending");

  const handleApproveLoading = (nomination: Nomination) => {
    setNominations((prev) =>
      prev.map((n) =>
        n.id === nomination.id
          ? { ...n, status: "approved", approvedAt: new Date().toISOString(), approvedBy: "Mike Operator" }
          : n,
      ),
    );
    // toast({
    //   title: "Loading Approved",
    //   description: `Container ${nomination.containerNumber} has been approved for loading to truck ${nomination.truckNumber}`,
    // });
    setDialogOpen(false);
    setSelectedNomination(null);
  };

  const handleRejectLoading = (nomination: Nomination) => {
    if (!rejectionReason.trim()) {
      // toast({
      //   title: "Rejection Reason Required",
      //   description: "Please provide a reason for rejecting the loading request.",
      //   variant: "destructive",
      // });
      return;
    }
    setNominations((prev) =>
      prev.map((n) =>
        n.id === nomination.id
          ? {
            ...n,
            status: "rejected",
            rejectedAt: new Date().toISOString(),
            rejectedBy: "Mike Operator",
            rejectionReason,
          }
          : n,
      ),
    );
    // toast({
    //   title: "Loading Rejected",
    //   description: `Container ${nomination.containerNumber} loading request has been rejected.`,
    //   variant: "destructive",
    // });
    setDialogOpen(false);
    setSelectedNomination(null);
    setRejectionReason("");
  };

  if (isLoading || !kpiData) {
    return (
      <DashboardLayout navItems={operatorNavItems} pageTitle="Operator Dashboard">
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-warning border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={operatorNavItems} pageTitle="Operator Dashboard">


      <div className="grid gap-6 lg:grid-cols-1">
        New features are coming soon
      </div>
    </DashboardLayout>
  );
}
