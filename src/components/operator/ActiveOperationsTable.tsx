import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ActiveOperation {
    id: string;
    containerNumber: string;
    status: string;
    type: string;
    updatedAt: string | Date;
}

interface ActiveOperationsTableProps {
    operations: ActiveOperation[];
}

export function ActiveOperationsTable({ operations }: ActiveOperationsTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Active Gate Operations</CardTitle>
                <Badge variant="outline" className="bg-primary/5 text-primary">Live</Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {operations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Truck className="mb-2 h-10 w-10 opacity-20" />
                            <p>No active gate operations</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {operations.map((op) => (
                                <div key={op.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{op.containerNumber}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "h-5 text-[10px] uppercase",
                                                        op.status === 'gate-in' ? 'bg-success/10 text-success border-success/20' :
                                                            op.status === 'gate-out' ? 'bg-warning/10 text-warning border-warning/20' :
                                                                'bg-primary/10 text-primary border-primary/20'
                                                    )}
                                                >
                                                    {op.status.replace('-', ' ')}
                                                </Badge>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(op.updatedAt), "HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{op.type}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


