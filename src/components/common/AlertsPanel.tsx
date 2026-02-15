import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  link?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  className?: string;
  onAlertClick?: (alert: Alert) => void;
}

const alertConfig = {
  error: {
    icon: AlertCircle,
    bgColor: "bg-destructive/5 hover:bg-destructive/10",
    borderColor: "border-destructive/20",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-warning/5 hover:bg-warning/10",
    borderColor: "border-warning/20",
    iconColor: "text-warning",
  },
  info: {
    icon: Info,
    bgColor: "bg-info/5 hover:bg-info/10",
    borderColor: "border-info/20",
    iconColor: "text-info",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-success/5 hover:bg-success/10",
    borderColor: "border-success/20",
    iconColor: "text-success",
  },
};

export function AlertsPanel({
  alerts,
  className,
  onAlertClick,
}: AlertsPanelProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="border-b p-4">
        <h3 className="font-semibold text-foreground">Alerts & Actions</h3>
      </div>
      <div className="divide-y">
        {alerts.map((alert, index) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              onClick={() => onAlertClick?.(alert)}
              className={cn(
                "flex items-start gap-3 p-4 transition-colors cursor-pointer",
                config.bgColor,
                "animate-fade-in",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  config.bgColor,
                  config.iconColor,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
      {alerts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No active alerts
        </div>
      )}
    </div>
  );
}
