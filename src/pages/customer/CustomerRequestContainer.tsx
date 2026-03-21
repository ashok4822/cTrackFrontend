import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  Container as ContainerIcon,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { Container } from "@/types";
import { useToast } from "@/hooks/useToast";
import { containerRequestService } from "@/services/containerRequestService";
import { billingService, type CargoCategory } from "@/services/billingService";
import { useOverdueStatus } from "@/hooks/useOverdueStatus";
import { OverdueBlocker } from "@/components/common/OverdueBlocker";
import { Skeleton } from "@/components/ui/skeleton";

const containerSizes = ["20ft", "40ft"];
const containerTypes: { value: string; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "reefer", label: "Reefer" },
  { value: "tank", label: "Tank" },
  { value: "open-top", label: "Open Top" },
];

export default function CustomerRequestContainer() {
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [requestType, setRequestType] = useState<"stuffing" | "destuffing">(
    "stuffing",
  );

  const [isLoading, setIsLoading] = useState(false);
  const [myContainers, setMyContainers] = useState<Container[]>([]);
  const [cargoCategories, setCargoCategories] = useState<CargoCategory[]>([]);
  const [isFetchingContainers, setIsFetchingContainers] = useState(false);
  const { hasOverdueBills, loading: checkingOverdue } = useOverdueStatus();

  // Stuffing form state
  const [stuffingForm, setStuffingForm] = useState({
    containerSize: "",
    containerType: "",
    cargoDescription: "",
    cargoWeight: "",
    cargoCategoryId: "",
    isHazardous: false,
    preferredDate: "",
    specialInstructions: "",
  });

  // Destuffing form state
  const [selectedContainer, setSelectedContainer] = useState<string>("");
  const [destuffingRemarks, setDestuffingRemarks] = useState("");
  const [destuffingDate, setDestuffingDate] = useState("");

  // Fetch customer's containers for destuffing and cargo categories
  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingContainers(true);
      try {
        const [containers, categories] = await Promise.all([
          containerRequestService.getCustomerContainers(),
          billingService.fetchCargoCategories(),
        ]);
        setMyContainers(containers);
        setCargoCategories(categories.filter((c) => c.active));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsFetchingContainers(false);
      }
    };
    
    if (!hasOverdueBills && !checkingOverdue) {
      fetchData();
    }
  }, [hasOverdueBills, checkingOverdue]);

  const selectedContainerDetails = myContainers.find(
    (c) => c.id === selectedContainer || c._id === selectedContainer,
  );

  // Only loaded (non-empty), gate-in or in-yard containers are eligible for destuffing
  const destuffingEligibleContainers = myContainers.filter(
    (c) =>
      c.empty === false && (c.status === "gate-in" || c.status === "in-yard"),
  );

  const handleStuffingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await containerRequestService.createRequest({
        type: "stuffing",
        containerSize: stuffingForm.containerSize,
        containerType: stuffingForm.containerType,
        cargoDescription: stuffingForm.cargoDescription,
        cargoWeight: parseFloat(stuffingForm.cargoWeight),
        preferredDate: stuffingForm.preferredDate,
        specialInstructions: stuffingForm.specialInstructions,
        isHazardous: stuffingForm.isHazardous,
        cargoCategoryId:
          stuffingForm.cargoCategoryId === "none"
            ? undefined
            : stuffingForm.cargoCategoryId,
      });
      setRequestType("stuffing");
      setShowSuccessDialog(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestuffingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContainerDetails) return;
    setIsLoading(true);
    try {
      await containerRequestService.createRequest({
        type: "destuffing",
        containerId:
          selectedContainerDetails.id || selectedContainerDetails._id || "",
        containerNumber: selectedContainerDetails.containerNumber,
        preferredDate: destuffingDate,
        remarks: destuffingRemarks,
        // Carry over cargo info from the container so it shows in listings
        cargoDescription: selectedContainerDetails.cargoDescription,
        cargoWeight: selectedContainerDetails.cargoWeight,
        // Container type uses hazardousClassification, ContainerRequest uses isHazardous
        isHazardous: selectedContainerDetails.hazardousClassification ?? false,
      });
      setRequestType("destuffing");
      setShowSuccessDialog(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    toast({
      title: "Request Submitted",
      description: `Your ${requestType} request has been submitted successfully. You will be notified once it's approved.`,
    });
    // Reset forms
    if (requestType === "stuffing") {
      setStuffingForm({
        containerSize: "",
        containerType: "",
        cargoDescription: "",
        cargoWeight: "",
        cargoCategoryId: "",
        isHazardous: false,
        preferredDate: "",
        specialInstructions: "",
      });
    } else {
      setSelectedContainer("");
      setDestuffingRemarks("");
      setDestuffingDate("");
    }
  };

  if (checkingOverdue) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Request Container">
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (hasOverdueBills) {
    return (
      <DashboardLayout navItems={customerNavItems} pageTitle="Request Container">
        <OverdueBlocker />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={customerNavItems} pageTitle="Request Container">
      <Tabs defaultValue="stuffing" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="stuffing" className="gap-2">
            <Package className="h-4 w-4" />
            Empty for Stuffing
          </TabsTrigger>
          <TabsTrigger value="destuffing" className="gap-2">
            <ContainerIcon className="h-4 w-4" />
            Loaded for Destuffing
          </TabsTrigger>
        </TabsList>

        {/* Request Empty Container for Stuffing */}
        <TabsContent value="stuffing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Request Empty Container for Stuffing
              </CardTitle>
              <CardDescription>
                Fill in the cargo details to request an empty container for
                loading your goods.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStuffingSubmit} className="space-y-6">
                {/* Container Requirements */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Container Requirements
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Container Size *</Label>
                      <Select
                        value={stuffingForm.containerSize}
                        onValueChange={(value) =>
                          setStuffingForm({
                            ...stuffingForm,
                            containerSize: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {containerSizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Container Type *</Label>
                      <Select
                        value={stuffingForm.containerType}
                        onValueChange={(value) =>
                          setStuffingForm({
                            ...stuffingForm,
                            containerType: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {containerTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Cargo Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Cargo Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cargo Category</Label>
                      <Select
                        value={stuffingForm.cargoCategoryId}
                        onValueChange={(value) =>
                          setStuffingForm({
                            ...stuffingForm,
                            cargoCategoryId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="General / Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            General / Default
                          </SelectItem>
                          {cargoCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id || ""}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Select a category if your cargo requires special
                        handling or rates (e.g., Hazardous, Reefer).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo Description *</Label>
                      <Textarea
                        placeholder="Describe the cargo to be loaded..."
                        value={stuffingForm.cargoDescription}
                        onChange={(e) =>
                          setStuffingForm({
                            ...stuffingForm,
                            cargoDescription: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Cargo Weight (kg) *</Label>
                        <Input
                          type="number"
                          placeholder="Enter weight in kg"
                          value={stuffingForm.cargoWeight}
                          onChange={(e) =>
                            setStuffingForm({
                              ...stuffingForm,
                              cargoWeight: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Stuffing Date *</Label>
                        <Input
                          type="date"
                          value={stuffingForm.preferredDate}
                          onChange={(e) =>
                            setStuffingForm({
                              ...stuffingForm,
                              preferredDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hazardous Classification */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hazardous-checkbox"
                      checked={stuffingForm.isHazardous}
                      onCheckedChange={(checked) =>
                        setStuffingForm({
                          ...stuffingForm,
                          isHazardous: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="hazardous-checkbox"
                      className="text-sm font-semibold cursor-pointer"
                    >
                      Is this cargo hazardous?
                    </Label>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="space-y-2">
                  <Label>Special Instructions (Optional)</Label>
                  <Textarea
                    placeholder="Any special handling requirements or instructions..."
                    value={stuffingForm.specialInstructions}
                    onChange={(e) =>
                      setStuffingForm({
                        ...stuffingForm,
                        specialInstructions: e.target.value,
                      })
                    }
                  />
                </div>

                <Button type="submit" className="gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Request Loaded Container for Destuffing */}
        <TabsContent value="destuffing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ContainerIcon className="h-5 w-5" />
                Request Loaded Container for Destuffing
              </CardTitle>
              <CardDescription>
                Select a loaded container from your inventory to request
                destuffing services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDestuffingSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Container *</Label>
                  <Select
                    value={selectedContainer}
                    onValueChange={setSelectedContainer}
                    disabled={isFetchingContainers}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isFetchingContainers
                            ? "Loading containers..."
                            : "Select a container"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {destuffingEligibleContainers.length === 0 &&
                      !isFetchingContainers ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No loaded containers found in your inventory.
                        </div>
                      ) : (
                        destuffingEligibleContainers.map((container, index) => (
                          <SelectItem
                            key={container.id || container._id || index}
                            value={container.id || container._id || ""}
                          >
                            <div className="flex items-center gap-2">
                              <ContainerIcon className="h-4 w-4" />
                              {container.containerNumber} - {container.size}{" "}
                              {container.type}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Container Details Card */}
                {selectedContainerDetails && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Container Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Container Number
                          </p>
                          <p className="font-mono font-medium">
                            {selectedContainerDetails.containerNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Size / Type
                          </p>
                          <p className="font-medium capitalize">
                            {selectedContainerDetails.size}{" "}
                            {selectedContainerDetails.type}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <p className="font-medium capitalize">
                            {selectedContainerDetails.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Weight
                          </p>
                          <p className="font-medium">
                            {selectedContainerDetails.weight
                              ? `${selectedContainerDetails.weight.toLocaleString()} kg`
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {/* Cargo Details */}
                      <div className="pt-2 border-t border-muted-foreground/10">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Cargo Description
                            </p>
                            <p className="font-medium">
                              {selectedContainerDetails.cargoDescription ||
                                "No description provided"}
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Cargo Weight
                              </p>
                              <p className="font-medium">
                                {selectedContainerDetails.cargoWeight
                                  ? `${selectedContainerDetails.cargoWeight.toLocaleString()} kg`
                                  : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Hazardous
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {selectedContainerDetails.hazardousClassification ? (
                                  <>
                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                    <span className="text-sm font-semibold text-destructive uppercase">
                                      Hazardous
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-medium text-success">
                                    Non-Hazardous
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedContainerDetails.yardLocation && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Yard Location
                          </p>
                          <p className="font-medium">
                            Block {selectedContainerDetails.yardLocation.block}
                          </p>
                        </div>
                      )}
                      {selectedContainerDetails.sealNumber && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Seal Number
                          </p>
                          <p className="font-mono font-medium">
                            {selectedContainerDetails.sealNumber}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Cargo Category
                        </p>
                        <p className="capitalize font-medium text-primary">
                          {selectedContainerDetails.cargoCategory || "General / Default"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Preferred Destuffing Date *</Label>
                    <Input
                      type="date"
                      value={destuffingDate}
                      onChange={(e) => setDestuffingDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remarks / Special Instructions (Optional)</Label>
                  <Textarea
                    placeholder="Any special requirements for destuffing..."
                    value={destuffingRemarks}
                    onChange={(e) => setDestuffingRemarks(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="gap-2"
                  disabled={!selectedContainer || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle>Request Submitted!</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Your {requestType === "stuffing" ? "empty container" : "destuffing"}{" "}
            request has been submitted successfully. You will receive a
            notification once it's processed.
          </p>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleSuccessClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
