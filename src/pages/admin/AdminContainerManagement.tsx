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

    const handleBlacklistToggle = async (container: Container) => {
        try {
            if (container.blacklisted) {
                await dispatch(unblacklistContainer(container.id)).unwrap();
                toast.success(`Container ${container.containerNumber} has been unblacklisted`);
            } else {
                await dispatch(blacklistContainer(container.id)).unwrap();
                toast.success(`Container ${container.containerNumber} has been blacklisted`);
            }
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
        </DashboardLayout>
    );
}
