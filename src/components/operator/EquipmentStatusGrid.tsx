import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Equipment {
    id: string;
    name: string;
    type: string;
    status: string;
}

interface EquipmentStatusGridProps {
    equipment: Equipment[];
}

export function EquipmentStatusGrid({ equipment }: EquipmentStatusGridProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Equipment Monitor</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {equipment.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-muted-foreground">
                            No equipment found
                        </div>
                    ) : (
                        equipment.map((item) => {
                            return (
                                <div key={item.id} className="flex items-center gap-2.5 rounded-xl border p-2.5 bg-muted/30">
                                    <div className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                                        item.status === 'operational' ? "bg-success/5 border-success/20 text-success" :
                                            item.status === 'maintenance' ? "bg-warning/5 border-warning/20 text-warning" :
                                                "bg-destructive/5 border-destructive/20 text-destructive"
                                    )}>
                                        <Cpu className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold truncate text-sm">{item.name}</p>
                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">{item.type}</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full",
                                                item.status === 'operational' ? "bg-success animate-pulse" :
                                                    item.status === 'maintenance' ? "bg-warning" : "bg-destructive"
                                            )} />
                                            <span className="text-[10px] font-bold capitalize">{item.status}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
