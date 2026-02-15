import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { KPIData } from "@/types";
import { dashboardService } from "@/services/dashboardService";

interface DashboardState {
    kpiData: KPIData | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    kpiData: null,
    isLoading: false,
    error: null,
};

// Async thunk to fetch KPI data (currently returns dummy data via service)
export const fetchKPIData = createAsyncThunk(
    "dashboard/fetchKPIData",
    async (_, { rejectWithValue }) => {
        try {
            return await dashboardService.getKPIData();
        } catch (error: any) {
            return rejectWithValue(error.message || "Failed to fetch KPI data");
        }
    }
);

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        setKPIData: (state, action: PayloadAction<KPIData>) => {
            state.kpiData = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchKPIData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchKPIData.fulfilled, (state, action: PayloadAction<KPIData>) => {
                state.isLoading = false;
                state.kpiData = action.payload;
            })
            .addCase(fetchKPIData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setKPIData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
