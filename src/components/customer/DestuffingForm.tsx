import { Container as ContainerIcon, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Container } from "@/types";
import { ContainerDetailsCard } from "./ContainerDetailsCard";
import { UI_MESSAGES } from "@/constants/messages";

interface DestuffingFormProps {
    selectedContainer: string;
    setSelectedContainer: (id: string) => void;
    eligibleContainers: Container[];
    isFetchingContainers: boolean;
    destuffingDate: string;
    setDestuffingDate: (date: string) => void;
    destuffingRemarks: string;
    setDestuffingRemarks: (remarks: string) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function DestuffingForm({
    selectedContainer,
    setSelectedContainer,
    eligibleContainers,
    isFetchingContainers,
    destuffingDate,
    setDestuffingDate,
    destuffingRemarks,
    setDestuffingRemarks,
    isLoading,
    onSubmit
}: DestuffingFormProps) {
    const selectedContainerDetails = eligibleContainers.find(
        (c) => c.id === selectedContainer || c._id === selectedContainer
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ContainerIcon className="h-5 w-5" />
                    {UI_MESSAGES.DESTUFFING.TITLE}
                </CardTitle>
                <CardDescription>
                    {UI_MESSAGES.DESTUFFING.DESCRIPTION}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>{UI_MESSAGES.DESTUFFING.SELECT_LABEL}</Label>
                        <Select
                            value={selectedContainer}
                            onValueChange={setSelectedContainer}
                            disabled={isFetchingContainers}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        isFetchingContainers
                                            ? UI_MESSAGES.DESTUFFING.LOADING_CONTAINERS
                                            : UI_MESSAGES.DESTUFFING.PLACEHOLDER
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleContainers.length === 0 && !isFetchingContainers ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        {UI_MESSAGES.DESTUFFING.NO_CONTAINERS}
                                    </div>
                                ) : (
                                    eligibleContainers.map((container, index) => (
                                        <SelectItem
                                            key={container.id || container._id || index}
                                            value={container.id || container._id || ""}
                                        >
                                            <div className="flex items-center gap-2">
                                                <ContainerIcon className="h-4 w-4" />
                                                {container.containerNumber} - {container.size} {container.type}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedContainerDetails && (
                        <ContainerDetailsCard container={selectedContainerDetails} />
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>{UI_MESSAGES.DESTUFFING.DATE_LABEL}</Label>
                            <Input
                                type="date"
                                value={destuffingDate}
                                onChange={(e) => setDestuffingDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{UI_MESSAGES.DESTUFFING.REMARKS_LABEL}</Label>
                        <Textarea
                            placeholder={UI_MESSAGES.DESTUFFING.REMARKS_PLACEHOLDER}
                            value={destuffingRemarks}
                            onChange={(e) => setDestuffingRemarks(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full gap-2">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="h-4 w-4" />
                        )}
                        {UI_MESSAGES.DESTUFFING.SUBMIT_BUTTON}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
