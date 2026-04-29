import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { containerRequestService } from "@/services/containerRequestService";
import { billingService, type CargoCategory } from "@/services/billingService";
import { useOverdueStatus } from "@/hooks/useOverdueStatus";
import { UI_MESSAGES } from "@/constants/messages";
import type { Container } from "@/types";
import type { StuffingFormData } from "@/components/customer/StuffingForm";

export function useContainerRequestForm() {
    const { toast } = useToast();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [requestType, setRequestType] = useState<"stuffing" | "destuffing">("stuffing");
    const [isLoading, setIsLoading] = useState(false);
    const [myContainers, setMyContainers] = useState<Container[]>([]);
    const [cargoCategories, setCargoCategories] = useState<CargoCategory[]>([]);
    const [isFetchingContainers, setIsFetchingContainers] = useState(false);
    const { hasOverdueBills, loading: checkingOverdue } = useOverdueStatus();

    // Stuffing form state
    const [stuffingForm, setStuffingForm] = useState<StuffingFormData>({
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

    const handleStuffingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stuffingForm.cargoCategoryId || stuffingForm.cargoCategoryId === "none") {
            toast({
                title: UI_MESSAGES.TITLES.ERROR,
                description: UI_MESSAGES.CONTAINER.SELECT_CATEGORY,
                variant: "destructive",
            });
            return;
        }
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
                title: UI_MESSAGES.TITLES.ERROR,
                description: err.response?.data?.message || UI_MESSAGES.CONTAINER.SUBMIT_FAILED,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDestuffingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedContainerDetails = myContainers.find(
            (c) => c.id === selectedContainer || c._id === selectedContainer
        );
        if (!selectedContainerDetails) return;
        
        setIsLoading(true);
        try {
            await containerRequestService.createRequest({
                type: "destuffing",
                containerId: selectedContainerDetails.id || selectedContainerDetails._id || "",
                containerNumber: selectedContainerDetails.containerNumber,
                preferredDate: destuffingDate,
                remarks: destuffingRemarks,
                cargoDescription: selectedContainerDetails.cargoDescription,
                cargoWeight: selectedContainerDetails.cargoWeight,
                isHazardous: selectedContainerDetails.hazardousClassification ?? false,
            });
            setRequestType("destuffing");
            setShowSuccessDialog(true);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: UI_MESSAGES.TITLES.ERROR,
                description: err.response?.data?.message || UI_MESSAGES.CONTAINER.SUBMIT_FAILED,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessDialog(false);
        toast({
            title: UI_MESSAGES.TITLES.REQUEST_SUBMITTED,
            description: UI_MESSAGES.CONTAINER.SUBMIT_SUCCESS_DESC(requestType),
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

    // Business Logic: Eligibility check
    const destuffingEligibleContainers = myContainers.filter(
        (c) => c.empty === false && (c.status === "gate-in" || c.status === "in-yard")
    );

    return {
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
        myContainers,
        cargoCategories,
        destuffingEligibleContainers,
        hasOverdueBills,
        checkingOverdue,
        showSuccessDialog,
        setShowSuccessDialog,
        requestType,
        handleStuffingSubmit,
        handleDestuffingSubmit,
        handleSuccessClose,
    };
}
