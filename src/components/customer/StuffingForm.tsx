import React from "react";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CargoCategory } from "@/services/billingService";
import { UI_MESSAGES } from "@/constants/messages";

const containerSizes = ["20ft", "40ft"];
const containerTypes: { value: string; label: string }[] = [
    { value: "standard", label: "Standard" },
    { value: "reefer", label: "Reefer" },
    { value: "tank", label: "Tank" },
    { value: "open-top", label: "Open Top" },
];

export interface StuffingFormData {
    containerSize: string;
    containerType: string;
    cargoCategoryId: string;
    cargoDescription: string;
    cargoWeight: string;
    preferredDate: string;
    isHazardous: boolean;
    specialInstructions?: string;
}

interface StuffingFormProps {
    formData: StuffingFormData;
    setFormData: React.Dispatch<React.SetStateAction<StuffingFormData>>;
    cargoCategories: CargoCategory[];
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function StuffingForm({
    formData,
    setFormData,
    cargoCategories,
    isLoading,
    onSubmit
}: StuffingFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {UI_MESSAGES.STUFFING.TITLE}
                </CardTitle>
                <CardDescription>
                    {UI_MESSAGES.STUFFING.DESCRIPTION}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">
                            Container Requirements
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{UI_MESSAGES.STUFFING.SIZE_LABEL}</Label>
                                <Select
                                    value={formData.containerSize}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, containerSize: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={UI_MESSAGES.STUFFING.SIZE_PLACEHOLDER} />
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
                                <Label>{UI_MESSAGES.STUFFING.TYPE_LABEL}</Label>
                                <Select
                                    value={formData.containerType}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, containerType: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={UI_MESSAGES.STUFFING.TYPE_PLACEHOLDER} />
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

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">
                            Cargo Details
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{UI_MESSAGES.STUFFING.CATEGORY_LABEL}</Label>
                                <Select
                                    value={formData.cargoCategoryId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, cargoCategoryId: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={UI_MESSAGES.STUFFING.CATEGORY_PLACEHOLDER} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cargoCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id || ""}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{UI_MESSAGES.STUFFING.DESCRIPTION_LABEL}</Label>
                                <Textarea
                                    placeholder={UI_MESSAGES.STUFFING.DESCRIPTION_PLACEHOLDER}
                                    value={formData.cargoDescription}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cargoDescription: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{UI_MESSAGES.STUFFING.WEIGHT_LABEL}</Label>
                                    <Input
                                        type="number"
                                        placeholder={UI_MESSAGES.STUFFING.WEIGHT_PLACEHOLDER}
                                        value={formData.cargoWeight}
                                        onChange={(e) =>
                                            setFormData({ ...formData, cargoWeight: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{UI_MESSAGES.STUFFING.DATE_LABEL}</Label>
                                    <Input
                                        type="date"
                                        value={formData.preferredDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, preferredDate: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hazardous-checkbox"
                                checked={formData.isHazardous}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isHazardous: checked as boolean })
                                }
                            />
                            <Label htmlFor="hazardous-checkbox" className="text-sm font-semibold cursor-pointer">
                                {UI_MESSAGES.STUFFING.HAZARDOUS_LABEL}
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{UI_MESSAGES.STUFFING.INSTRUCTIONS_LABEL}</Label>
                        <Textarea
                            placeholder={UI_MESSAGES.STUFFING.INSTRUCTIONS_PLACEHOLDER}
                            value={formData.specialInstructions}
                            onChange={(e) =>
                                setFormData({ ...formData, specialInstructions: e.target.value })
                            }
                        />
                    </div>

                    <Button type="submit" className="gap-2" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="h-4 w-4" />
                        )}
                        {UI_MESSAGES.STUFFING.SUBMIT_BUTTON}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
