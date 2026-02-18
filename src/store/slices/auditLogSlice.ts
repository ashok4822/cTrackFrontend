import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import auditLogService from "@/services/auditLogService";
import type { AuditLog, AuditLogFilters, AuditLogsResponse } from "@/services/auditLogService";
import { AxiosError } from "axios";

interface AuditLogState {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuditLogState = {
    logs: [],
    total: 0,
    page: 1,
    limit: 50,
    isLoading: false,
    error: null,
};

export const fetchAuditLogs = createAsyncThunk(
    "auditLog/fetchAuditLogs",
    async (filters: AuditLogFilters | undefined, { rejectWithValue }) => {
        try {
            return await auditLogService.getAuditLogs(filters);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to fetch audit logs");
        }
    }
);

const auditLogSlice = createSlice({
    name: "auditLog",
    initialState,
    reducers: {
        clearAuditLogError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAuditLogs.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAuditLogs.fulfilled, (state, action: PayloadAction<AuditLogsResponse>) => {
                state.isLoading = false;
                state.logs = action.payload.logs;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.limit = action.payload.limit;
            })
            .addCase(fetchAuditLogs.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearAuditLogError } = auditLogSlice.actions;
export default auditLogSlice.reducer;
