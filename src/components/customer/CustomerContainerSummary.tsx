import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Container,
  CheckCircle2,
  AlertCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
}

function StatusCard({ title, count, icon: Icon, color }: StatusCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </h4>
          <p className="text-xl font-black">{count}</p>
        </div>
      </div>
    </div>
  );
}

interface CustomerContainerSummaryProps {
  totalInYard: number;
  inTransit: number;
  damaged: number;
}

export function CustomerContainerSummary({
  totalInYard,
  inTransit,
  damaged,
}: CustomerContainerSummaryProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Inventory Overview
        </CardTitle>
        <Container className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 pt-2">
          <StatusCard
            title="Available in Yard"
            count={totalInYard}
            icon={CheckCircle2}
            color="bg-success/10 text-success"
          />
          <StatusCard
            title="In Transit"
            count={inTransit}
            icon={Clock}
            color="bg-primary/10 text-primary"
          />
          <StatusCard
            title="Damaged / Survey"
            count={damaged}
            icon={AlertCircle}
            color="bg-destructive/10 text-destructive"
          />
        </div>
      </CardContent>
    </Card>
  );
}
