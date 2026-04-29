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
import { Badge } from "@/components/ui/badge";
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
    clearContainerError,
} from "@/store/slices/containerSlice";
import { fetchShippingLines } from "@/store/slices/shippingLineSlice";
import { UI_MESSAGES } from "@/constants/messages";

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
            dispatch(clearContainerError());
        }
    }, [error, dispatch]);

    const handleAddContainer = async (data: Partial<Container>) => {
        try {
            await dispatch(createContainer(data)).unwrap();
            setAddDialogOpen(false);
            toast.success(UI_MESSAGES.CONTAINER.ADD_SUCCESS);
        } catch (err: unknown) {
            const errorMessage =
                typeof err === "string" ? err : UI_MESSAGES.CONTAINER.ADD_FAILED;
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
                toast.success(UI_MESSAGES.CONTAINER.BLACKLIST_TOGGLE_SUCCESS(containerToToggle.containerNumber, false));
            } else {
                await dispatch(blacklistContainer(containerToToggle.id)).unwrap();
                toast.success(UI_MESSAGES.CONTAINER.BLACKLIST_TOGGLE_SUCCESS(containerToToggle.containerNumber, true));
            }
            setConfirmBlacklistOpen(false);
            setContainerToToggle(null);
        } catch (err: unknown) {
            const errorMessage =
                typeof err === "string" ? err : UI_MESSAGES.CONTAINER.BLACKLIST_TOGGLE_FAILED;
            toast.error(errorMessage);
        }
    };

    const columns: Column<Container>[] = [
        {
            key: "containerNumber",
            header: UI_MESSAGES.TABLE.CONTAINER_NO,
            sortable: true,
            render: (item) => (
                <span className="font-medium text-foreground">
                    {item.containerNumber}
                </span>
            ),
        },
        {
            key: "size",
            header: UI_MESSAGES.TABLE.SIZE,
            sortable: true,
        },
        {
            key: "type",
            header: UI_MESSAGES.TABLE.TYPE,
            sortable: true,
            render: (item) => <span className="capitalize">{item.type}</span>,
        },
        {
            key: "empty",
            header: UI_MESSAGES.TABLE.LOAD,
            sortable: true,
            render: (item) => (
                <Badge variant="secondary">
                    {item.empty ? UI_MESSAGES.TABLE.EMPTY : UI_MESSAGES.TABLE.LOADED}
                </Badge>
            ),
        },
        {
            key: "status",
            header: UI_MESSAGES.TABLE.STATUS,
            sortable: true,
            render: (item) => <StatusBadge status={item.status} />,
        },
        {
            key: "shippingLine",
            header: UI_MESSAGES.TABLE.SHIPPING_LINE,
            sortable: true,
        },
        {
            key: "yardLocation",
            header: UI_MESSAGES.TABLE.LOCATION,
            render: (item) => (item.yardLocation ? item.yardLocation.block : UI_MESSAGES.COMMON.NA),
        },
        {
            key: "dwellTime",
            header: UI_MESSAGES.TABLE.DWELL_DAYS,
            sortable: true,
            render: (item) => item.dwellTime ?? UI_MESSAGES.COMMON.NA,
        },
        {
            key: "actions",
            header: UI_MESSAGES.TABLE.ACTIONS,
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
                        {UI_MESSAGES.TABLE.VIEW}
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
                        {item.blacklisted ? UI_MESSAGES.TABLE.UNBLACKLIST : UI_MESSAGES.TABLE.BLACKLIST}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout
            navItems={adminNavItems}
            pageTitle={UI_MESSAGES.TITLES.CONTAINER_MANAGEMENT}
            pageActions={
                <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {UI_MESSAGES.TITLES.ADD_CONTAINER}
                </Button>
            }
        >
            <DataTable
                data={containers}
                isLoading={isLoading}
                columns={columns}
                searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_CONTAINERS}
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
                            {containerToToggle?.blacklisted ? UI_MESSAGES.TABLE.UNBLACKLIST : UI_MESSAGES.TABLE.BLACKLIST}
                        </DialogTitle>
                        <DialogDescription>
                            {UI_MESSAGES.CONTAINER.BLACKLIST_CONFIRM(containerToToggle?.containerNumber || "", !containerToToggle?.blacklisted)}{" "}
                            {UI_MESSAGES.CONTAINER.BLACKLIST_DESC(!!containerToToggle?.blacklisted)}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setConfirmBlacklistOpen(false)}>
                            {UI_MESSAGES.COMMON.CANCEL}
                        </Button>
                        <Button
                            variant={containerToToggle?.blacklisted ? "default" : "destructive"}
                            onClick={confirmBlacklistToggle}
                        >
                            {containerToToggle?.blacklisted ? UI_MESSAGES.TABLE.CONFIRM_UNBLACKLIST : UI_MESSAGES.TABLE.CONFIRM_BLACKLIST}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
