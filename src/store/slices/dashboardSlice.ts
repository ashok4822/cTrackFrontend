import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { KPIData } from "@/types";
import { dashboardService } from "@/services/dashboardService";
import { AxiosError } from "axios";

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
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      return rejectWithValue(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to fetch KPI data",
      );
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setKPIData: (state, action: PayloadAction<KPIData>) => {
      state.kpiData = action.payload;
    },
    updateKPIOptimistically: (state, action: PayloadAction<{ eventType: string; data: any }>) => {
      if (!state.kpiData) return;
      const { eventType, data } = action.payload;

      if (eventType === 'GATE_OPERATION') {
        const opType = data.type; // 'gate-in' or 'gate-out'
        if (opType === 'gate-in') {
          state.kpiData.totalContainersInYard++;
          state.kpiData.gateInToday++;
        } else if (opType === 'gate-out') {
          state.kpiData.totalContainersInYard = Math.max(0, state.kpiData.totalContainersInYard - 1);
          state.kpiData.gateOutToday++;
          state.kpiData.containersInTransit++;
        }
      } else if (eventType === 'CONTAINER_CREATED') {
        state.kpiData.totalContainersInYard++;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKPIData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchKPIData.fulfilled,
        (state, action: PayloadAction<KPIData>) => {
          state.isLoading = false;
          state.kpiData = action.payload;
        },
      )
      .addCase(fetchKPIData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setKPIData, updateKPIOptimistically } = dashboardSlice.actions;
export default dashboardSlice.reducer;
