import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  ClipboardCheck,
  CheckCircle,
  CreditCard,
  Container,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  time: string;
  type: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const typeIcons: Record<string, typeof Container> = {
  gate: ArrowRightLeft,
  survey: ClipboardCheck,
  approval: CheckCircle,
  payment: CreditCard,
  yard: Container,
};

const typeColors: Record<string, string> = {
  gate: "bg-primary/10 text-primary",
  survey: "bg-warning/10 text-warning",
  approval: "bg-success/10 text-success",
  payment: "bg-info/10 text-info",
  yard: "bg-purple-100 text-purple-700",
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="border-b p-4">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y">
        {activities.map((activity, index) => {
          const Icon = typeIcons[activity.type] || Container;
          const colorClass =
            typeColors[activity.type] || "bg-muted text-muted-foreground";

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-4 p-4 transition-colors hover:bg-muted/30",
                "animate-fade-in",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  colorClass,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{activity.action}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
      {activities.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No recent activity
        </div>
      )}
    </div>
  );
}
