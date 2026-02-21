import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { gateOperationService } from "@/services/gateOperationService";
import type { GateOperationFilters, CreateGateOperationData } from "@/services/gateOperationService";
import type { GateOperation } from "@/types";
import { AxiosError } from "axios";

interface GateOperationState {
    operations: GateOperation[];
    loading: boolean;
    error: string | null;
}

const initialState: GateOperationState = {
    operations: [],
    loading: false,
    error: null,
};

export const fetchGateOperations = createAsyncThunk(
    "gateOperations/fetchAll",
    async (filters: GateOperationFilters = {}, { rejectWithValue }) => {
        try {
            return await gateOperationService.getGateOperations(filters);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to fetch gate operations");
        }
    }
);

export const createGateOperation = createAsyncThunk(
    "gateOperations/create",
    async (data: CreateGateOperationData, { dispatch, rejectWithValue }) => {
        try {
            const result = await gateOperationService.createGateOperation(data);
            dispatch(fetchGateOperations({}));
            return result;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to record gate operation");
        }
    }
);

const gateOperationSlice = createSlice({
    name: "gateOperations",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGateOperations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGateOperations.fulfilled, (state, action) => {
                state.loading = false;
                state.operations = action.payload;
            })
            .addCase(fetchGateOperations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createGateOperation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGateOperation.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createGateOperation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = gateOperationSlice.actions;
export default gateOperationSlice.reducer;
