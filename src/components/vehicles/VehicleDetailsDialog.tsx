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
import { gateOperationService } from "@/services/gateOperationService";
import type { Vehicle, GateOperation } from "@/types";
import { format } from "date-fns";
import { History, Truck, User, Phone, MapPin, Cpu, Clock, Calendar } from "lucide-react";

interface VehicleDetailsDialogProps {
    vehicle: Vehicle;
}

export function VehicleDetailsDialog({ vehicle }: VehicleDetailsDialogProps) {
    const [history, setHistory] = useState<GateOperation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await gateOperationService.getGateOperations({
                vehicleNumber: vehicle.vehicleNumber.trim(),
                limit: 20
            });
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch vehicle history:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
                        <Truck className="h-5 w-5 text-primary" />
                        <DialogTitle>Vehicle Details</DialogTitle>
                    </div>
                    <DialogDescription>
                        Full details and history for {vehicle.vehicleNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Number</Label>
                                <p className="text-sm font-bold">{vehicle.vehicleNumber}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                                <p className="text-sm font-medium capitalize">{vehicle.type}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Driver</Label>
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">{vehicle.driverName}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                                <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">{vehicle.driverPhone}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${vehicle.status === 'in-yard' ? 'bg-green-500' : 'bg-slate-400'}`} />
                                    <p className="text-sm font-medium capitalize">{vehicle.status}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Location</Label>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">{vehicle.currentLocation || "N/A"}</p>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1 pt-2 border-t mt-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">GPS Device ID</Label>
                                <div className="flex items-center gap-1">
                                    <Cpu className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">{vehicle.gpsDeviceId || "No Device Linked"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <History className="h-4 w-4" /> Movement History
                        </h3>
                        <ScrollArea className="h-[280px] pr-4 rounded-lg border bg-muted/10 p-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-2 text-muted-foreground">
                                    <Clock className="h-8 w-8 animate-spin-pulse" />
                                    <p className="text-xs">Loading history...</p>
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-6">
                                    {history.map((op, index) => (
                                        <div key={op.id} className="relative pl-6 pb-2">
                                            {index !== history.length - 1 && (
                                                <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-border" />
                                            )}
                                            <div className={`absolute left-0 top-1 h-5 w-5 rounded-full flex items-center justify-center border bg-background shadow-sm ${op.type === 'gate-in' ? 'text-green-600 border-green-200' : 'text-blue-600 border-blue-200'}`}>
                                                {op.type === 'gate-in' ? (
                                                    <Calendar className="h-3 w-3" />
                                                ) : (
                                                    <Clock className="h-3 w-3" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${op.type === 'gate-in' ? 'text-green-600' : 'text-blue-600'}`}>
                                                        {op.type === 'gate-in' ? 'Gated In' : 'Gated Out'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-2 w-2" />
                                                        {format(new Date(op.timestamp), "MMM dd, yyyy HH:mm")}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-foreground">
                                                    {op.containerNumber ? (
                                                        <>Container: <span className="text-primary font-bold">{op.containerNumber}</span></>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">No container (Empty movement)</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-[10px]">
                                                    <p className="text-muted-foreground capitalize">
                                                        <span className="font-semibold uppercase text-[9px] mr-1">Purpose:</span>
                                                        {op.purpose}
                                                    </p>
                                                    {op.approvedBy && (
                                                        <p className="text-muted-foreground">
                                                            <span className="font-semibold uppercase text-[9px] mr-1">By:</span>
                                                            {op.approvedBy}
                                                        </p>
                                                    )}
                                                </div>
                                                {op.remarks && (
                                                    <p className="text-[11px] text-muted-foreground bg-muted/50 p-1.5 rounded mt-1 border border-dashed">
                                                        {op.remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
                                    <History className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground font-medium">No history found</p>
                                    <p className="text-[11px] text-muted-foreground">Historical records for this vehicle will appear here.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
