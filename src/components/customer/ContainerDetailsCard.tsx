import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Container } from "@/types";
import { UI_MESSAGES } from "@/constants/messages";

interface ContainerDetailsCardProps {
    container: Container;
}

export function ContainerDetailsCard({ container }: ContainerDetailsCardProps) {
    return (
        <Card className="bg-muted/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">
                    {UI_MESSAGES.CONTAINER_DETAILS.TITLE}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {UI_MESSAGES.CONTAINER_DETAILS.NUMBER_LABEL}
                        </p>
                        <p className="font-mono font-medium">
                            {container.containerNumber}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {UI_MESSAGES.CONTAINER_DETAILS.SIZE_TYPE_LABEL}
                        </p>
                        <p className="font-medium capitalize">
                            {container.size} {container.type}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {UI_MESSAGES.CONTAINER_DETAILS.STATUS_LABEL}
                        </p>
                        <p className="font-medium capitalize">
                            {container.status}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {UI_MESSAGES.CONTAINER_DETAILS.WEIGHT_LABEL}
                        </p>
                        <p className="font-medium">
                            {container.weight
                                ? `${container.weight.toLocaleString()} kg`
                                : "-"}
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t border-muted-foreground/10">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                {UI_MESSAGES.CONTAINER_DETAILS.CARGO_DESC_LABEL}
                            </p>
                            <p className="font-medium">
                                {container.cargoDescription || UI_MESSAGES.CONTAINER_DETAILS.NO_CARGO_DESC}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {UI_MESSAGES.CONTAINER_DETAILS.CARGO_WEIGHT_LABEL}
                                </p>
                                <p className="font-medium">
                                    {container.cargoWeight
                                        ? `${container.cargoWeight.toLocaleString()} kg`
                                        : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {UI_MESSAGES.CONTAINER_DETAILS.HAZARDOUS_LABEL}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {container.hazardousClassification ? (
                                        <>
                                            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                            <span className="text-sm font-semibold text-destructive uppercase">
                                                {UI_MESSAGES.CONTAINER_DETAILS.HAZARDOUS_LABEL}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm font-medium text-success">
                                            {UI_MESSAGES.CONTAINER_DETAILS.NON_HAZARDOUS_LABEL}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {container.yardLocation && (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {UI_MESSAGES.CONTAINER_DETAILS.YARD_LOCATION_LABEL}
                        </p>
                        <p className="font-medium">
                            Block {container.yardLocation.block}
                        </p>
                    </div>
                )}
                {container.sealNumber && (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {UI_MESSAGES.CONTAINER_DETAILS.SEAL_NUMBER_LABEL}
                        </p>
                        <p className="font-mono font-medium">
                            {container.sealNumber}
                        </p>
                    </div>
                )}
                <div>
                    <p className="text-sm text-muted-foreground">
                        {UI_MESSAGES.CONTAINER_DETAILS.CARGO_CATEGORY_LABEL}
                    </p>
                    <p className="capitalize font-medium text-primary">
                        {container.cargoCategory || "N/A"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
