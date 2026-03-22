import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRightLeft, CheckCircle2, Timer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DashboardActiveTask } from "@/types";

interface CustomerActiveRequestsProps {
  requests: DashboardActiveTask[];
}

export function CustomerActiveRequests({
  requests,
}: CustomerActiveRequestsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-primary">
          Active Requests Pipeline
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Timer className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 pt-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <CheckCircle2 className="mb-2 h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs">
                No active requests currently processing.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between py-3 group hover:bg-muted/30 transition-colors px-2 rounded-lg -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        req.type === "stuffing"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-purple-500/10 text-purple-500",
                      )}
                    >
                      <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight">
                        {req.containerNumber || "Awaiting Allocation"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                        <span className="uppercase tracking-wider">
                          {req.type}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(req.createdAt), "MMM dd, HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 border",
                      req.status === "pending"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : req.status === "approved"
                          ? "bg-success/10 text-success border-success/20"
                          : req.status === "in-progress"
                            ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {req.status.replace("-", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
