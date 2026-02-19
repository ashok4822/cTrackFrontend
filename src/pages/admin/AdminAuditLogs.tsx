import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import type { Column } from "@/components/common/DataTable";
import { adminNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileText, Filter, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAuditLogs } from "@/store/slices/auditLogSlice";
import type { AuditLog } from "@/services/auditLogService";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminAuditLogs() {
    const dispatch = useAppDispatch();
    const { logs, total, page, limit, isLoading } = useAppSelector((state) => state.auditLog);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        actionType: "",
        entityType: "",
        page: 1,
        limit: 50,
    });

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const loadAuditLogs = (customFilters?: typeof filters) => {
        const filtersToUse = customFilters || filters;
        const cleanFilters: any = { ...filtersToUse };

        // Remove empty filters
        Object.keys(cleanFilters).forEach(key => {
            if (!cleanFilters[key]) delete cleanFilters[key];
        });

        dispatch(fetchAuditLogs(cleanFilters))
            .unwrap()
            .catch((err) => toast.error(err || "Failed to load audit logs"));
    };

    const handleApplyFilters = () => {
        loadAuditLogs({ ...filters, page: 1 });
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            startDate: "",
            endDate: "",
            actionType: "",
            entityType: "",
            page: 1,
            limit: 50,
        };
        setFilters(clearedFilters);
        loadAuditLogs(clearedFilters);
    };

    const handlePageChange = (newPage: number) => {
        const newFilters = { ...filters, page: newPage };
        setFilters(newFilters);
        loadAuditLogs(newFilters);
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const parseDetails = (details: string) => {
        try {
            const parsed = JSON.parse(details);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return details;
        }
    };

    const columns: Column<AuditLog>[] = [
        {
            key: "timestamp",
            header: "Timestamp",
            sortable: true,
            render: (item) => (
                <div className="text-sm">
                    <div className="font-medium">{format(new Date(item.timestamp), "MMM dd, yyyy")}</div>
                    <div className="text-muted-foreground">{format(new Date(item.timestamp), "HH:mm:ss")}</div>
                </div>
            ),
        },
        {
            key: "userName",
            header: "User",
            sortable: true,
            render: (item) => (
                <div>
                    <div className="font-medium">{item.userName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{item.userRole}</div>
                </div>
            ),
        },
        {
            key: "action",
            header: "Action",
            render: (item) => (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    {formatAction(item.action)}
                </span>
            ),
        },
        {
            key: "entityType",
            header: "Entity",
            render: (item) => <span className="capitalize">{item.entityType}</span>,
        },
        {
            key: "details",
            header: "Details",
            render: (item) => (
                <div className="max-w-xs truncate text-sm text-muted-foreground" title={parseDetails(item.details)}>
                    {parseDetails(item.details)}
                </div>
            ),
        },
        {
            key: "ipAddress",
            header: "IP Address",
            render: (item) => <span className="font-mono text-xs">{item.ipAddress}</span>,
        },
    ];

    const totalPages = Math.ceil(total / limit);

    return (
        <DashboardLayout
            navItems={adminNavItems}
            pageTitle="Audit Logs"
            pageActions={
                <Button
                    variant={showFilters ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
            }
        >
            {/* Summary Card */}
            <div className="mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{total}</p>
                                <p className="text-sm text-muted-foreground">Total Audit Logs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Action Type</Label>
                                <Select value={filters.actionType} onValueChange={(value) => setFilters({ ...filters, actionType: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Actions</SelectItem>
                                        <SelectItem value="USER_CREATED">User Created</SelectItem>
                                        <SelectItem value="USER_UPDATED">User Updated</SelectItem>
                                        <SelectItem value="USER_BLOCKED">User Blocked</SelectItem>
                                        <SelectItem value="USER_UNBLOCKED">User Unblocked</SelectItem>
                                        <SelectItem value="USER_LOGIN">User Login</SelectItem>
                                        <SelectItem value="PROFILE_UPDATED">Profile Updated</SelectItem>
                                        <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
                                        <SelectItem value="BLOCK_CREATED">Block Created</SelectItem>
                                        <SelectItem value="BLOCK_UPDATED">Block Updated</SelectItem>
                                        <SelectItem value="SHIPPING_LINE_CREATED">Shipping Line Created</SelectItem>
                                        <SelectItem value="SHIPPING_LINE_UPDATED">Shipping Line Updated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Entity Type</Label>
                                <Select value={filters.entityType} onValueChange={(value) => setFilters({ ...filters, entityType: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Entities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Entities</SelectItem>
                                        <SelectItem value="User">User</SelectItem>
                                        <SelectItem value="Profile">Profile</SelectItem>
                                        <SelectItem value="Auth">Auth</SelectItem>
                                        <SelectItem value="Block">Block</SelectItem>
                                        <SelectItem value="ShippingLine">Shipping Line</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button onClick={handleApplyFilters}>Apply Filters</Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audit Logs Table */}
            <DataTable
                data={logs}
                columns={columns}
                isLoading={isLoading}
                searchPlaceholder="Search audit logs..."
                showFooter={false}
                manualPagination={true}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
