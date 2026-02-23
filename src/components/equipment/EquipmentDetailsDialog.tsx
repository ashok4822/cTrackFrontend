import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEquipmentHistory } from "@/store/slices/equipmentSlice";
import type { Equipment } from "@/types";
import { format } from "date-fns";
import { History, Wrench, User, Clock, Calendar, Info, Activity } from "lucide-react";

interface EquipmentDetailsDialogProps {
    equipment: Equipment;
}

export function EquipmentDetailsDialog({ equipment }: EquipmentDetailsDialogProps) {
    const dispatch = useAppDispatch();
    const { selectedEquipmentHistory: history, isHistoryLoading: isLoading } = useAppSelector((state) => state.equipment);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            dispatch(fetchEquipmentHistory(equipment.id));
        }
    }, [open, equipment.id, dispatch]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                    Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        <DialogTitle>Equipment Details</DialogTitle>
                    </div>
                    <DialogDescription>
                        Full details and operation history for {equipment.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" /> Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">ID / Name</Label>
                                <p className="text-sm font-bold">{equipment.name}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                                <p className="text-sm font-medium capitalize">{equipment.type.replace("-", " ")}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Operator</Label>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">{equipment.operator || "Unassigned"}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${equipment.status === 'operational' ? 'bg-green-500' :
                                        equipment.status === 'maintenance' ? 'bg-yellow-500' :
                                            equipment.status === 'down' ? 'bg-red-500' : 'bg-slate-400'
                                        }`} />
                                    <p className="text-sm font-medium capitalize">{equipment.status}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Last Maintenance</Label>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">
                                        {equipment.lastMaintenance ? format(new Date(equipment.lastMaintenance), "MMM dd, yyyy") : "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Next Maintenance</Label>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium text-primary">
                                        {equipment.nextMaintenance ? format(new Date(equipment.nextMaintenance), "MMM dd, yyyy") : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <History className="h-4 w-4" /> Operation History
                        </h3>
                        <ScrollArea className="h-[280px] pr-4 rounded-lg border bg-muted/10 p-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
                                    <Clock className="h-8 w-8 animate-spin-pulse" />
                                    <p className="text-xs">Loading history...</p>
                                </div>
                            ) : history && history.length > 0 ? (
                                <div className="space-y-6">
                                    {history.map((record, index) => (
                                        <div key={record.id} className="relative pl-6 pb-2">
                                            {index !== history.length - 1 && (
                                                <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-border" />
                                            )}
                                            <div className={`absolute left-0 top-1 h-5 w-5 rounded-full flex items-center justify-center border bg-background shadow-sm ${record.activity === 'Created' ? 'text-green-600 border-green-200' : 'text-blue-600 border-blue-200'
                                                }`}>
                                                {record.activity === 'Created' ? (
                                                    <Calendar className="h-3 w-3" />
                                                ) : (
                                                    <Activity className="h-3 w-3" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${record.activity === 'Created' ? 'text-green-600' : 'text-blue-600'
                                                        }`}>
                                                        {record.activity}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-2 w-2" />
                                                        {format(new Date(record.timestamp), "MMM dd, HH:mm")}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-foreground leading-relaxed">
                                                    {record.details}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                                                    <span className="font-semibold uppercase">By:</span>
                                                    <span>{record.performedBy || "System"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
                                    <History className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground font-medium">No history found</p>
                                    <p className="text-[11px] text-muted-foreground">Operation logs for this equipment will appear here.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
