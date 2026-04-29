import { useState, useEffect, useCallback } from "react";
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
import { UI_MESSAGES } from "@/constants/messages";

export default function AdminAuditLogs() {
  const dispatch = useAppDispatch();
  const { logs, total, page, limit, isLoading } = useAppSelector(
    (state) => state.auditLog,
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    actionType: "",
    entityType: "",
    page: 1,
    limit: 50,
  });

  const loadAuditLogs = useCallback(
    (customFilters?: typeof filters) => {
      const filtersToUse = customFilters || filters;
      const cleanFilters: Record<string, string | number> = { ...filtersToUse };

      // Remove empty filters
      Object.keys(cleanFilters).forEach((key) => {
        if (!cleanFilters[key]) delete cleanFilters[key];
      });

      dispatch(fetchAuditLogs(cleanFilters))
        .unwrap()
        .catch((err) => toast.error(err || UI_MESSAGES.AUDIT.FETCH_FAILED));
    },
    [dispatch, filters],
  );

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

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
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const parseDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      if (typeof parsed !== "object" || parsed === null) return details;

      return Object.entries(parsed)
        .map(([key, value]) => {
          // Convert camelCase to Title Case
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());

          // Format value if it's an array or object
          let displayValue = "";
          if (Array.isArray(value)) {
            displayValue = value.join(", ");
          } else if (typeof value === "object" && value !== null) {
            displayValue = JSON.stringify(value);
          } else {
            displayValue = String(value);
          }

          return `${label}: ${displayValue}`;
        })
        .join(", ");
    } catch {
      return details;
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "timestamp",
      header: UI_MESSAGES.TABLE.TIMESTAMP,
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          <div className="font-medium">
            {format(new Date(item.timestamp), "MMM dd, yyyy")}
          </div>
          <div className="text-muted-foreground">
            {format(new Date(item.timestamp), "HH:mm:ss")}
          </div>
        </div>
      ),
    },
    {
      key: "userName",
      header: UI_MESSAGES.TABLE.USER,
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.userName}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {item.userRole}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: UI_MESSAGES.TABLE.ACTION,
      render: (item) => (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
          {formatAction(item.action)}
        </span>
      ),
    },
    {
      key: "entityType",
      header: UI_MESSAGES.TABLE.ENTITY,
      render: (item) => <span className="capitalize">{item.entityType}</span>,
    },
    {
      key: "details",
      header: UI_MESSAGES.TABLE.DETAILS,
      render: (item) => (
        <div
          className="max-w-xs truncate text-sm text-muted-foreground"
          title={parseDetails(item.details)}
        >
          {parseDetails(item.details)}
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout
      navItems={adminNavItems}
      pageTitle={UI_MESSAGES.TITLES.AUDIT_LOGS}
      pageActions={
        <Button
          variant={showFilters ? "default" : "outline"}
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          {showFilters ? UI_MESSAGES.TABLE.HIDE_FILTERS : UI_MESSAGES.TABLE.SHOW_FILTERS}
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
                <p className="text-sm text-muted-foreground">
                  {UI_MESSAGES.AUDIT.TOTAL_LOGS}
                </p>
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
                <Label htmlFor="startDate">{UI_MESSAGES.TABLE.START_DATE}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{UI_MESSAGES.TABLE.END_DATE}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{UI_MESSAGES.TABLE.ACTION_TYPE}</Label>
                <Select
                  value={filters.actionType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, actionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={UI_MESSAGES.TABLE.ALL_ACTIONS} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{UI_MESSAGES.TABLE.ALL_ACTIONS}</SelectItem>
                    <SelectItem value="USER_CREATED">{UI_MESSAGES.AUDIT.ACTIONS.USER_CREATED}</SelectItem>
                    <SelectItem value="USER_UPDATED">{UI_MESSAGES.AUDIT.ACTIONS.USER_UPDATED}</SelectItem>
                    <SelectItem value="USER_BLOCKED">{UI_MESSAGES.AUDIT.ACTIONS.USER_BLOCKED}</SelectItem>
                    <SelectItem value="USER_UNBLOCKED">
                      {UI_MESSAGES.AUDIT.ACTIONS.USER_UNBLOCKED}
                    </SelectItem>
                    <SelectItem value="USER_LOGIN">{UI_MESSAGES.AUDIT.ACTIONS.USER_LOGIN}</SelectItem>
                    <SelectItem value="PROFILE_UPDATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.PROFILE_UPDATED}
                    </SelectItem>
                    <SelectItem value="PASSWORD_CHANGED">
                      {UI_MESSAGES.AUDIT.ACTIONS.PASSWORD_CHANGED}
                    </SelectItem>
                    <SelectItem value="BLOCK_CREATED">{UI_MESSAGES.AUDIT.ACTIONS.BLOCK_CREATED}</SelectItem>
                    <SelectItem value="BLOCK_UPDATED">{UI_MESSAGES.AUDIT.ACTIONS.BLOCK_UPDATED}</SelectItem>
                    <SelectItem value="SHIPPING_LINE_CREATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.SHIPPING_LINE_CREATED}
                    </SelectItem>
                    <SelectItem value="SHIPPING_LINE_UPDATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.SHIPPING_LINE_UPDATED}
                    </SelectItem>
                    <SelectItem value="CONTAINER_CREATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.CONTAINER_CREATED}
                    </SelectItem>
                    <SelectItem value="CONTAINER_UPDATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.CONTAINER_UPDATED}
                    </SelectItem>
                    <SelectItem value="REQUEST_CREATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.REQUEST_CREATED}
                    </SelectItem>
                    <SelectItem value="REQUEST_UPDATED">
                      {UI_MESSAGES.AUDIT.ACTIONS.REQUEST_UPDATED}
                    </SelectItem>
                    <SelectItem value="BILL_PAID">{UI_MESSAGES.AUDIT.ACTIONS.BILL_PAID}</SelectItem>
                    <SelectItem value="SIGNUP">{UI_MESSAGES.AUDIT.ACTIONS.SIGNUP}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{UI_MESSAGES.TABLE.ENTITY_TYPE}</Label>
                <Select
                  value={filters.entityType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, entityType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={UI_MESSAGES.TABLE.ALL_ENTITIES} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{UI_MESSAGES.TABLE.ALL_ENTITIES}</SelectItem>
                    <SelectItem value="User">{UI_MESSAGES.AUDIT.ENTITIES.USER}</SelectItem>
                    <SelectItem value="Profile">{UI_MESSAGES.AUDIT.ENTITIES.PROFILE}</SelectItem>
                    <SelectItem value="Auth">{UI_MESSAGES.AUDIT.ENTITIES.AUTH}</SelectItem>
                    <SelectItem value="Block">{UI_MESSAGES.AUDIT.ENTITIES.BLOCK}</SelectItem>
                    <SelectItem value="ShippingLine">{UI_MESSAGES.AUDIT.ENTITIES.SHIPPING_LINE}</SelectItem>
                    <SelectItem value="Container">{UI_MESSAGES.AUDIT.ENTITIES.CONTAINER}</SelectItem>
                    <SelectItem value="Request">{UI_MESSAGES.AUDIT.ENTITIES.REQUEST}</SelectItem>
                    <SelectItem value="Bill">{UI_MESSAGES.AUDIT.ENTITIES.BILL}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleApplyFilters}>{UI_MESSAGES.TABLE.APPLY_FILTERS}</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                {UI_MESSAGES.REPORTS.CLEAR_FILTERS}
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
        searchPlaceholder={UI_MESSAGES.TABLE.SEARCH_AUDIT_LOGS}
        showFooter={false}
        manualPagination={true}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {UI_MESSAGES.TABLE.SHOWING_LOGS(
              (page - 1) * limit + 1,
              Math.min(page * limit, total),
              total
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              {UI_MESSAGES.REPORTS.PREVIOUS}
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
              {UI_MESSAGES.REPORTS.NEXT}
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
