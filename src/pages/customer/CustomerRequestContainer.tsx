import DashboardLayout from "@/components/layout/DashboardLayout";
import { customerNavItems } from "@/config/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Container as ContainerIcon, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OverdueBlocker } from "@/components/common/OverdueBlocker";
import { useContainerRequestForm } from "@/hooks/useContainerRequestForm";
import { StuffingForm } from "@/components/customer/StuffingForm";
import { DestuffingForm } from "@/components/customer/DestuffingForm";
import { UI_MESSAGES } from "@/constants/messages";

export default function CustomerRequestContainer() {
    const {
        stuffingForm,
        setStuffingForm,
        selectedContainer,
        setSelectedContainer,
        destuffingRemarks,
        setDestuffingRemarks,
        destuffingDate,
        setDestuffingDate,
        isLoading,
        isFetchingContainers,
        cargoCategories,
        destuffingEligibleContainers,
        hasOverdueBills,
        checkingOverdue,
        showSuccessDialog,
        requestType,
        handleStuffingSubmit,
        handleDestuffingSubmit,
        handleSuccessClose,
    } = useContainerRequestForm();

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
                        {UI_MESSAGES.STUFFING.EMPTY_FOR_STUFFING}
                    </TabsTrigger>
                    <TabsTrigger value="destuffing" className="gap-2">
                        <ContainerIcon className="h-4 w-4" />
                        {UI_MESSAGES.DESTUFFING.LOADED_FOR_DESTUFFING}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stuffing">
                    <StuffingForm
                        formData={stuffingForm}
                        setFormData={setStuffingForm}
                        cargoCategories={cargoCategories}
                        isLoading={isLoading}
                        onSubmit={handleStuffingSubmit}
                    />
                </TabsContent>

                <TabsContent value="destuffing">
                    <DestuffingForm
                        selectedContainer={selectedContainer}
                        setSelectedContainer={setSelectedContainer}
                        eligibleContainers={destuffingEligibleContainers}
                        isFetchingContainers={isFetchingContainers}
                        destuffingDate={destuffingDate}
                        setDestuffingDate={setDestuffingDate}
                        destuffingRemarks={destuffingRemarks}
                        setDestuffingRemarks={setDestuffingRemarks}
                        isLoading={isLoading}
                        onSubmit={handleDestuffingSubmit}
                    />
                </TabsContent>
            </Tabs>

            <SuccessDialog 
                open={showSuccessDialog} 
                onClose={handleSuccessClose} 
                requestType={requestType} 
            />
        </DashboardLayout>
    );
}

function SuccessDialog({ open, onClose, requestType }: { 
    open: boolean; 
    onClose: () => void; 
    requestType: "stuffing" | "destuffing"; 
}) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm text-center">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle>{UI_MESSAGES.TITLES.REQUEST_SUBMITTED}</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground">
                    {UI_MESSAGES.CONTAINER.SUBMIT_SUCCESS_DESC(requestType === "stuffing" ? UI_MESSAGES.STUFFING.EMPTY_CONTAINER : UI_MESSAGES.DESTUFFING.TITLE.toLowerCase())}
                </p>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
