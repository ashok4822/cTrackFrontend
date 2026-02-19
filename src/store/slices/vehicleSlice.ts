import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { vehicleService } from "@/services/vehicleService";
import type { Vehicle } from "@/types";
import { AxiosError } from "axios";

interface VehicleState {
    vehicles: Vehicle[];
    isLoading: boolean;
    error: string | null;
}

const initialState: VehicleState = {
    vehicles: [],
    isLoading: false,
    error: null,
};

export const fetchVehicles = createAsyncThunk(
    "vehicle/fetchAll",
    async (
        filters:
            | {
                type?: string;
                status?: string;
                vehicleNumber?: string;
            }
            | undefined,
        { rejectWithValue }
    ) => {
        try {
            return await vehicleService.getVehicles(filters);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to fetch vehicles"
            );
        }
    }
);

export const addVehicle = createAsyncThunk(
    "vehicle/add",
    async (data: Omit<Vehicle, "id">, { dispatch, rejectWithValue }) => {
        try {
            const response = await vehicleService.addVehicle(data);
            dispatch(fetchVehicles());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to add vehicle"
            );
        }
    }
);

export const updateVehicle = createAsyncThunk(
    "vehicle/update",
    async (
        { id, data }: { id: string; data: Partial<Vehicle> },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await vehicleService.updateVehicle(id, data);
            dispatch(fetchVehicles());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to update vehicle"
            );
        }
    }
);

export const deleteVehicle = createAsyncThunk(
    "vehicle/delete",
    async (id: string, { dispatch, rejectWithValue }) => {
        try {
            const response = await vehicleService.deleteVehicle(id);
            dispatch(fetchVehicles());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to delete vehicle"
            );
        }
    }
);

const vehicleSlice = createSlice({
    name: "vehicle",
    initialState,
    reducers: {
        clearVehicleError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVehicles.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVehicles.fulfilled, (state, action: PayloadAction<Vehicle[]>) => {
                state.isLoading = false;
                state.vehicles = action.payload;
            })
            .addCase(fetchVehicles.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addVehicle.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addVehicle.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(addVehicle.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateVehicle.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateVehicle.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(updateVehicle.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteVehicle.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteVehicle.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(deleteVehicle.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearVehicleError } = vehicleSlice.actions;
export default vehicleSlice.reducer;
