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
import type { CreateGateOperationData } from "@/services/gateOperationService";
import api from "@/services/api";
import { toast } from "sonner";

const gateOutSchema = z.object({
    containerNumber: z.string().optional(),
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
    vehicle?: any; // Add optional vehicle prop
    isContainerRequired?: boolean; // New prop to control requirement
}

export function GateOutDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    vehicle,
    isContainerRequired = false,
}: GateOutDialogProps) {
    const [isVerifying, setIsVerifying] = useState(false);

    const form = useForm<GateOutFormData>({
        resolver: zodResolver(gateOutSchema),
        defaultValues: {
            vehicleNumber: "",
            containerNumber: "",
            driverName: "",
            purpose: "port",
            remarks: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                vehicleNumber: vehicle?.vehicleNumber || "",
                containerNumber: vehicle?.currentContainer || "",
                driverName: vehicle?.driverName || "",
                purpose: "port",
                remarks: "",
            });
            setIsVerifying(false);
        }
    }, [open, vehicle, form]);


    const onFormSubmit = async (data: GateOutFormData) => {
        console.group("GateOutDialog: onFormSubmit");
        setIsVerifying(true);
        try {

            // 2. Verify container and vehicle status
            const vNum = data.vehicleNumber.trim();
            const cNum = data.containerNumber?.trim() || "";

            if (isContainerRequired && !cNum) {
                form.setError("containerNumber", { message: "Container number is required for this operation." });
                setIsVerifying(false);
                return;
            }

            if (isContainerRequired && cNum.length !== 11) {
                form.setError("containerNumber", { message: "Container number must be exactly 11 characters." });
                setIsVerifying(false);
                return;
            }

            // Fetch container to check current status if provided
            if (cNum) {
                const containerResponse = await api.get("/containers", {
                    params: { containerNumber: cNum }
                });
                const containers = containerResponse.data;
                const currentContainer = Array.isArray(containers) ? containers[0] : null;

                if (!currentContainer) {
                    form.setError("containerNumber", { message: "Container not found in system." });
                    console.groupEnd();
                    return;
                }

                const validInStatuses = ["gate-in", "in-yard", "at-port", "at-factory"];
                if (!validInStatuses.includes(currentContainer.status)) {
                    form.setError("containerNumber", {
                        message: `Container status is '${currentContainer.status}'. Only containers currently inside terminal can Gate-Out.`
                    });
                    console.groupEnd();
                    return;
                }
            }

            // Fetch vehicle to check current status
            const vehicleResponse = await api.get("/vehicles", {
                params: { vehicleNumber: vNum }
            });
            const vehicles = vehicleResponse.data;
            const currentVehicle = Array.isArray(vehicles) ? vehicles[0] : null;

            if (!currentVehicle) {
                form.setError("vehicleNumber", { message: "Vehicle not found in system." });
                console.groupEnd();
                return;
            }

            if (currentVehicle.status !== "in-yard") {
                form.setError("vehicleNumber", {
                    message: `Vehicle status is '${currentVehicle.status}'. Only vehicles currently In-Yard can Gate-Out.`
                });
                console.groupEnd();
                return;
            }

            // 3. Submit operation
            await onSubmit({
                type: "gate-out",
                vehicleNumber: vNum,
                containerNumber: cNum || undefined,
                driverName: data.driverName,
                purpose: data.purpose,
                remarks: data.remarks,
            });
        } catch (err: any) {
            console.error("Submission failed:", err);
            const message = err.response?.data?.message || err.message || "Failed to process Gate-Out";

            if (message.toLowerCase().includes("vehicle")) {
                form.setError("vehicleNumber", { message });
            } else {
                toast.error(message);
            }
        } finally {
            setIsVerifying(false);
            console.groupEnd();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New Gate-Out</DialogTitle>
                    <DialogDescription>Process vehicle exit from terminal</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">

                        {isContainerRequired && (
                            <FormField
                                control={form.control}
                                name="containerNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Container Number *
                                        </FormLabel>
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || isVerifying}>
                                {loading || isVerifying ? (isVerifying ? "Verifying..." : "Processing...") : "Process Gate-Out"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
