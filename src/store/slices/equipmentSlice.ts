import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { equipmentService } from "@/services/equipmentService";
import type { Equipment } from "@/types";
import { AxiosError } from "axios";

interface EquipmentState {
    equipment: Equipment[];
    isLoading: boolean;
    error: string | null;
}

const initialState: EquipmentState = {
    equipment: [],
    isLoading: false,
    error: null,
};

export const fetchEquipment = createAsyncThunk(
    "equipment/fetchAll",
    async (
        filters:
            | {
                type?: string;
                status?: string;
                name?: string;
            }
            | undefined,
        { rejectWithValue }
    ) => {
        try {
            return await equipmentService.getEquipment(filters);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to fetch equipment"
            );
        }
    }
);

export const addEquipment = createAsyncThunk(
    "equipment/add",
    async (data: Omit<Equipment, "id">, { dispatch, rejectWithValue }) => {
        try {
            const response = await equipmentService.addEquipment(data);
            dispatch(fetchEquipment());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to add equipment"
            );
        }
    }
);

export const updateEquipment = createAsyncThunk(
    "equipment/update",
    async (
        { id, data }: { id: string; data: Partial<Equipment> },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const response = await equipmentService.updateEquipment(id, data);
            dispatch(fetchEquipment());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to update equipment"
            );
        }
    }
);

export const deleteEquipment = createAsyncThunk(
    "equipment/delete",
    async (id: string, { dispatch, rejectWithValue }) => {
        try {
            const response = await equipmentService.deleteEquipment(id);
            dispatch(fetchEquipment());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || "Failed to delete equipment"
            );
        }
    }
);

const equipmentSlice = createSlice({
    name: "equipment",
    initialState,
    reducers: {
        clearEquipmentError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEquipment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchEquipment.fulfilled, (state, action: PayloadAction<Equipment[]>) => {
                state.isLoading = false;
                state.equipment = action.payload;
            })
            .addCase(fetchEquipment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addEquipment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addEquipment.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(addEquipment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateEquipment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateEquipment.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(updateEquipment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteEquipment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteEquipment.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(deleteEquipment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearEquipmentError } = equipmentSlice.actions;
export default equipmentSlice.reducer;
