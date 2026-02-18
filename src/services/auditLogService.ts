import api from "./api";

export interface AuditLog {
    id: string;
    userId: string;
    userRole: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string | null;
    details: string;
    ipAddress: string;
    timestamp: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuditLogFilters {
    startDate?: string;
    endDate?: string;
    userId?: string;
    actionType?: string;
    entityType?: string;
    page?: number;
    limit?: number;
}

export interface AuditLogsResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
}

const auditLogService = {
    getAuditLogs: async (filters?: AuditLogFilters): Promise<AuditLogsResponse> => {
        const params = new URLSearchParams();

        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.actionType) params.append('actionType', filters.actionType);
        if (filters?.entityType) params.append('entityType', filters.entityType);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const response = await api.get(`/users/audit-logs?${params.toString()}`);
        return response.data;
    }
};

export default auditLogService;
