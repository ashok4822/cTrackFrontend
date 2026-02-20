import { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { type CreateGateOperationData } from "@/services/gateOperationService";
import type { ShippingLine } from "@/types";

const gateInSchema = z.object({
    containerNumber: z.string().length(11),
    size: z.enum(["20ft", "40ft"] as const),
    type: z.enum(["standard", "reefer", "tank", "open-top"] as const),
    movementType: z.enum(["import", "export", "domestic"] as const),
    shippingLine: z.string().min(1),
    weight: z.string(),
    vehicleNumber: z.string().min(1),
    driverName: z.string().min(1),
    purpose: z.enum(["port", "factory", "transfer"] as const),
    sealNumber: z.string(),
    cargoWeight: z.string(),
    remarks: z.string(),
    loaded: z.boolean(),
    hasDamage: z.boolean(),
});

type GateInFormData = z.infer<typeof gateInSchema>;

interface GateInDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateGateOperationData) => Promise<void>;
    loading: boolean;
    shippingLines: ShippingLine[];
}

export function GateInDialog({
    open,
    onOpenChange,
    onSubmit,
    loading,
    shippingLines,
}: GateInDialogProps) {
    const form = useForm<GateInFormData>({
        resolver: zodResolver(gateInSchema),
        defaultValues: {
            containerNumber: "",
            size: "40ft",
            type: "standard",
            movementType: "import",
            shippingLine: "",
            weight: "",
            vehicleNumber: "",
            driverName: "",
            purpose: "port",
            sealNumber: "",
            cargoWeight: "",
            remarks: "",
            loaded: false,
            hasDamage: false,
        },
    });

    const isLoaded = form.watch("loaded");

    useEffect(() => {
        if (open) {
            form.reset({
                containerNumber: "",
                size: "40ft",
                type: "standard",
                movementType: "import",
                shippingLine: "",
                weight: "",
                vehicleNumber: "",
                driverName: "",
                purpose: "port",
                sealNumber: "",
                cargoWeight: "",
                remarks: "",
                loaded: false,
                hasDamage: false,
            });
        }
    }, [open, form]);

    const onFormSubmit = async (data: GateInFormData) => {
        const payload: CreateGateOperationData = {
            type: "gate-in",
            containerNumber: data.containerNumber,
            vehicleNumber: data.vehicleNumber,
            driverName: data.driverName,
            purpose: data.purpose,
            remarks: data.remarks,
            size: data.size,
            containerType: data.type,
            shippingLine: data.shippingLine,
            weight: data.weight ? Number(data.weight) : undefined,
            cargoWeight: data.cargoWeight ? Number(data.cargoWeight) : undefined,
            sealNumber: data.sealNumber,
            empty: !data.loaded,
            movementType: data.movementType,
        };
        await onSubmit(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New Gate-In</DialogTitle>
                    <DialogDescription>Record a new container gate-in</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="containerNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Container Number</FormLabel>
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
                                <FormField
                                    control={form.control}
                                    name="size"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Container Size</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select size" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="20ft">20ft</SelectItem>
                                                    <SelectItem value="40ft">40ft</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Container Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="reefer">Reefer</SelectItem>
                                                    <SelectItem value="tank">Tank</SelectItem>
                                                    <SelectItem value="open-top">Open Top</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="movementType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Movement Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select movement" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="import">Import</SelectItem>
                                                    <SelectItem value="export">Export</SelectItem>
                                                    <SelectItem value="domestic">Domestic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="shippingLine"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipping Line</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select shipping line" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {shippingLines.map((line) => (
                                                        <SelectItem key={line.id} value={line.shipping_line_name}>
                                                            {line.shipping_line_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tare Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="2200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purpose</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select purpose" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="port">From Port</SelectItem>
                                                <SelectItem value="factory">From Factory</SelectItem>
                                                <SelectItem value="transfer">Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="loaded"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Loaded Container</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="hasDamage"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-destructive">Has Damage</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {isLoaded && (
                                <FormField
                                    control={form.control}
                                    name="cargoWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cargo Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="18000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="sealNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Seal Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter seal number" {...field} />
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
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Processing..." : "Process Gate-In"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
