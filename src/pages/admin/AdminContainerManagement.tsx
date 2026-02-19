import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { adminNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import type { Container } from "@/types";
import { Plus, Eye, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddContainerDialog } from "@/components/containers/AddContainerDialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchContainers,
    createContainer,
    blacklistContainer,
    unblacklistContainer,
} from "@/store/slices/containerSlice";
import { fetchShippingLines } from "@/store/slices/shippingLineSlice";

export default function AdminContainerManagement() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { containers, isLoading, error } = useAppSelector(
        (state) => state.container,
    );
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [confirmBlacklistOpen, setConfirmBlacklistOpen] = useState(false);
    const [containerToToggle, setContainerToToggle] = useState<Container | null>(null);

    useEffect(() => {
        dispatch(fetchContainers());
        dispatch(fetchShippingLines());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleAddContainer = async (data: Partial<Container>) => {
        try {
            await dispatch(createContainer(data)).unwrap();
            setAddDialogOpen(false);
            toast.success("Container created successfully");
        } catch (err: unknown) {
            const errorMessage =
                typeof err === "string" ? err : "Failed to create container";
            toast.error(errorMessage);
        }
    };

    const handleBlacklistToggle = (container: Container) => {
        setContainerToToggle(container);
        setConfirmBlacklistOpen(true);
    };

    const confirmBlacklistToggle = async () => {
        if (!containerToToggle) return;
        try {
            if (containerToToggle.blacklisted) {
                await dispatch(unblacklistContainer(containerToToggle.id)).unwrap();
                toast.success(`Container ${containerToToggle.containerNumber} has been unblacklisted`);
            } else {
                await dispatch(blacklistContainer(containerToToggle.id)).unwrap();
                toast.success(`Container ${containerToToggle.containerNumber} has been blacklisted`);
            }
            setConfirmBlacklistOpen(false);
            setContainerToToggle(null);
        } catch (err: unknown) {
            const errorMessage =
                typeof err === "string" ? err : "Failed to update blacklist status";
            toast.error(errorMessage);
        }
    };

    const columns: Column<Container>[] = [
        {
            key: "containerNumber",
            header: "Container No.",
            sortable: true,
            render: (item) => (
                <span className="font-medium text-foreground">
                    {item.containerNumber}
                </span>
            ),
        },
        {
            key: "size",
            header: "Size",
            sortable: true,
        },
        {
            key: "type",
            header: "Type",
            sortable: true,
            render: (item) => <span className="capitalize">{item.type}</span>,
        },
        {
            key: "status",
            header: "Status",
            sortable: true,
            render: (item) => <StatusBadge status={item.status} />,
        },
        {
            key: "shippingLine",
            header: "Shipping Line",
            sortable: true,
        },
        {
            key: "yardLocation",
            header: "Location",
            render: (item) => (item.yardLocation ? item.yardLocation.block : "-"),
        },
        {
            key: "dwellTime",
            header: "Dwell (days)",
            sortable: true,
            render: (item) => item.dwellTime ?? "-",
        },
        {
            key: "actions",
            header: "Actions",
            render: (item) => (
                <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            (window.location.href = `/admin/containers/${item.id}`)
                        }
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={item.blacklisted ? "text-green-600 hover:text-green-600 hover:bg-green-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleBlacklistToggle(item);
                        }}
                    >
                        <Ban className="h-4 w-4 mr-1" />
                        {item.blacklisted ? "Unblacklist" : "Blacklist"}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout
            navItems={adminNavItems}
            pageTitle="Container Management"
            pageActions={
                <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Container
                </Button>
            }
        >
            <DataTable
                data={containers}
                isLoading={isLoading}
                columns={columns}
                searchPlaceholder="Search containers..."
                onRowClick={(item) => navigate(`/admin/containers/${item.id}`)}
            />

            <AddContainerDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSubmit={handleAddContainer}
            />

            <Dialog open={confirmBlacklistOpen} onOpenChange={setConfirmBlacklistOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {containerToToggle?.blacklisted ? "Unblacklist Container" : "Blacklist Container"}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {containerToToggle?.blacklisted ? "unblacklist" : "blacklist"}{" "}
                            <span className="font-semibold text-foreground">{containerToToggle?.containerNumber}</span>?{" "}
                            {containerToToggle?.blacklisted
                                ? "This will allow the container to be used in operations again."
                                : "This will restrict the container from certain operations."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setConfirmBlacklistOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={containerToToggle?.blacklisted ? "default" : "destructive"}
                            onClick={confirmBlacklistToggle}
                        >
                            {containerToToggle?.blacklisted ? "Confirm Unblacklist" : "Confirm Blacklist"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
