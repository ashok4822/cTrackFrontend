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

const gateOperationSchema = z.object({
    containerNumber: z
        .string()
        .min(11, "Container number must be at least 11 characters")
        .max(11, "Container number must be exactly 11 characters")
        .regex(
            /^[A-Z]{4}\d{7}$/,
            "Format: 4 letters + 7 digits (e.g., MSCU1234567)",
        ),
    type: z.enum(["gate-in", "gate-out"] as const),
    vehicleNumber: z.string().min(1, "Vehicle number is required"),
    driverName: z.string().min(1, "Driver name is required"),
    purpose: z.enum(["port", "factory", "transfer"] as const),
    remarks: z.string().optional(),
});

type GateOperationFormData = z.infer<typeof gateOperationSchema>;

interface AddGateOperationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateGateOperationData) => Promise<void>;
    defaultType?: "gate-in" | "gate-out";
}

export function AddGateOperationDialog({
    open,
    onOpenChange,
    onSubmit,
    defaultType = "gate-in",
}: AddGateOperationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GateOperationFormData>({
        resolver: zodResolver(gateOperationSchema),
        defaultValues: {
            containerNumber: "",
            type: defaultType,
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
                type: defaultType,
                vehicleNumber: "",
                driverName: "",
                purpose: "port",
                remarks: "",
            });
        }
    }, [open, defaultType, form]);

    const handleSubmit = async (data: GateOperationFormData) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            form.reset();
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Record Gate {form.watch("type") === "gate-in" ? "In" : "Out"}</DialogTitle>
                    <DialogDescription>
                        Enter the gate operation details below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="containerNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Container Number *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="MSCU1234567"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(e.target.value.toUpperCase())
                                            }
                                            maxLength={11}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operation Type *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="gate-in">Gate In</SelectItem>
                                                <SelectItem value="gate-out">Gate Out</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purpose *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select purpose" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="port">Port</SelectItem>
                                                <SelectItem value="factory">Factory</SelectItem>
                                                <SelectItem value="transfer">Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="vehicleNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vehicle Number *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="TN-01-AB-1234" {...field} />
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
                                    <FormLabel>Driver Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter driver name" {...field} />
                                    </FormControl>
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Recording..." : "Record Operation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
