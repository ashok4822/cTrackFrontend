import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Search } from "lucide-react";
import type { CreateGateOperationData } from "@/services/gateOperationService";
import api from "@/services/api";
import { toast } from "sonner";

const gateOutSchema = z.object({
    containerNumber: z
        .string()
        .min(11, "Container number must be at least 11 characters")
        .max(11, "Container number must be exactly 11 characters")
        .regex(
            /^[A-Z]{4}\d{7}$/,
            "Format: 4 letters + 7 digits (e.g., MSCU1234567)",
        ),
    vehicleNumber: z.string().min(1, "Vehicle number is required"),
    driverName: z.string().min(1, "Driver name is required"),
    purpose: z.enum(["port", "factory", "transfer"] as const),
    remarks: z.string().optional(),
});

type GateOutFormData = z.infer<typeof gateOutSchema>;

interface GateOutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateGateOperationData) => Promise<void>;
    loading: boolean;
}

export function GateOutDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
}: GateOutDialogProps) {
    const [isLookupLoading, setIsLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState<any>(null);

    const form = useForm<GateOutFormData>({
        resolver: zodResolver(gateOutSchema),
        defaultValues: {
            containerNumber: "",
            vehicleNumber: "",
            driverName: "",
            purpose: "port",
            remarks: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                containerNumber: "",
                vehicleNumber: "",
                driverName: "",
                purpose: "port",
                remarks: "",
            });
            setLookupResult(null);
        }
    }, [open, form]);

    const handleContainerLookup = async () => {
        const containerNumber = form.getValues("containerNumber");
        if (!containerNumber || containerNumber.length !== 11) {
            toast.error("Please enter a valid 11-digit container number");
            return;
        }

        setIsLookupLoading(true);
        try {
            const response = await api.get(`/containers?containerNumber=${containerNumber}`);
            const containers = response.data;
            if (containers && containers.length > 0) {
                setLookupResult(containers[0]);
                toast.success("Container found in yard");
            } else {
                setLookupResult(null);
                toast.error("Container not found in yard");
            }
        } catch (err) {
            toast.error("Failed to lookup container");
        } finally {
            setIsLookupLoading(false);
        }
    };

    const onFormSubmit = async (data: GateOutFormData) => {
        if (!lookupResult) {
            toast.error("Please lookup and verify container before processing gate-out");
            return;
        }
        const payload: CreateGateOperationData = {
            type: "gate-out",
            containerNumber: data.containerNumber,
            vehicleNumber: data.vehicleNumber,
            driverName: data.driverName,
            purpose: data.purpose,
            remarks: data.remarks,
        };
        await onSubmit(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New Gate-Out</DialogTitle>
                    <DialogDescription>Process a container gate-out</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel>Container Lookup</FormLabel>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="containerNumber"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        placeholder="MSCU1234567"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleContainerLookup}
                                        disabled={isLookupLoading}
                                    >
                                        <Search className={`h-4 w-4 ${isLookupLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>
                            </div>

                            {lookupResult && (
                                <div className="p-3 bg-muted rounded-md space-y-1 text-sm border">
                                    <p>
                                        <span className="font-medium text-muted-foreground">Shipping Line:</span>{" "}
                                        {lookupResult.shippingLine}
                                    </p>
                                    <p>
                                        <span className="font-medium text-muted-foreground">Type:</span>{" "}
                                        {lookupResult.size} {lookupResult.type}
                                    </p>
                                    <p>
                                        <span className="font-medium text-muted-foreground">Status:</span>{" "}
                                        <span className="capitalize">{lookupResult.status}</span>
                                    </p>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="vehicleNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="TN01AB1234"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="driverName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Driver Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter driver name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destination</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select destination" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="port">To Port</SelectItem>
                                                <SelectItem value="factory">To Factory</SelectItem>
                                                <SelectItem value="transfer">Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="remarks"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Remarks</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional remarks" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || !lookupResult}>
                                {loading ? "Processing..." : "Process Gate-Out"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
