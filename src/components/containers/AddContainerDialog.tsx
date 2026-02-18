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
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchBlocks } from "@/store/slices/yardSlice";

const containerSchema = z.object({
  containerNumber: z
    .string()
    .min(11, "Container number must be at least 11 characters")
    .max(11, "Container number must be exactly 11 characters")
    .regex(
      /^[A-Z]{4}\d{7}$/,
      "Format: 4 letters + 7 digits (e.g., MSCU1234567)",
    ),
  size: z.enum(["20ft", "40ft"] as const),
  type: z.enum(["standard", "reefer", "tank", "open-top"] as const),
  status: z.enum([
    "pending",
    "in-yard",
    "in-transit",
    "at-port",
    "at-factory",
    "gate-in",
    "gate-out",
    "damaged",
  ] as const),
  shippingLine: z.string().min(1, "Shipping line is required"),
  customer: z.string().optional(),
  weight: z
    .union([z.number(), z.string(), z.undefined()])
    .transform((val) => (val === "" || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || val >= 0, "Weight must be positive"),
  sealNumber: z.string().optional(),
  yardLocation: z
    .object({
      block: z.string(),
    })
    .optional(),
});

type ContainerFormData = z.infer<typeof containerSchema>;

interface AddContainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ContainerFormData) => void;
}

export function AddContainerDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddContainerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { lines: shippingLines } = useAppSelector((state) => state.shippingLine);
  const { blocks: yardBlocks } = useAppSelector((state) => state.yard);

  const form = useForm<ContainerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(containerSchema) as any,
    defaultValues: {
      containerNumber: "",
      size: "40ft",
      type: "standard",
      status: "pending",
      shippingLine: "",
      customer: "",
      weight: undefined,
      sealNumber: "",
      yardLocation: { block: "" },
    },
  });

  useEffect(() => {
    if (open) {
      dispatch(fetchBlocks());
    }
  }, [open, dispatch]);

  const handleSubmit = async (data: ContainerFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit?.(data);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Container</DialogTitle>
          <DialogDescription>
            Enter the container details below. All required fields are marked.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="containerNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
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

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="gate-in">Gate In</SelectItem>
                        <SelectItem value="in-yard">In Yard</SelectItem>
                        <SelectItem value="in-transit">In Transit</SelectItem>
                        <SelectItem value="at-port">At Port</SelectItem>
                        <SelectItem value="at-factory">At Factory</SelectItem>
                        <SelectItem value="gate-out">Gate Out</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Line *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 25000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sealNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seal Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SEAL123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("status") === "in-yard" && (
                <FormField
                  control={form.control}
                  name="yardLocation.block"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Yard Block *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select yard block" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yardBlocks.map((block) => (
                            <SelectItem key={block.id} value={block.name}>
                              {block.name} ({block.occupied}/{block.capacity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
                {isSubmitting ? "Adding..." : "Add Container"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
