import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { yardService } from "@/services/yardService";
import type { YardBlock } from "@/types";
import { AxiosError } from "axios";

interface YardState {
    blocks: YardBlock[];
    isLoading: boolean;
    error: string | null;
}

const initialState: YardState = {
    blocks: [],
    isLoading: false,
    error: null,
};

export const fetchYardBlocks = createAsyncThunk(
    "yard/fetchBlocks",
    async (_, { rejectWithValue }) => {
        try {
            return await yardService.getYardBlocks();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to fetch yard blocks";
            return rejectWithValue(message);
        }
    }
);

export const createYardBlock = createAsyncThunk(
    "yard/createBlock",
    async ({ name, capacity }: { name: string; capacity: number }, { dispatch, rejectWithValue }) => {
        try {
            await yardService.createYardBlock({ name, capacity });
            dispatch(fetchYardBlocks()); // Refresh the list
            return { name, capacity };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to create yard block";
            return rejectWithValue(message);
        }
    }
);

export const updateYardBlock = createAsyncThunk(
    "yard/updateBlock",
    async ({ id, name, capacity }: { id: string; name: string; capacity: number }, { rejectWithValue }) => {
        try {
            await yardService.updateYardBlock(id, { name, capacity });
            return { id, name, capacity };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to update yard block";
            return rejectWithValue(message);
        }
    }
);

const yardSlice = createSlice({
    name: "yard",
    initialState,
    reducers: {
        clearYardError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchYardBlocks.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchYardBlocks.fulfilled, (state, action: PayloadAction<YardBlock[]>) => {
                state.isLoading = false;
                state.blocks = action.payload;
            })
            .addCase(fetchYardBlocks.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(createYardBlock.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createYardBlock.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(createYardBlock.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateYardBlock.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateYardBlock.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.blocks.findIndex((b) => b.id === action.payload.id);
                if (index !== -1) {
                    state.blocks[index] = { ...state.blocks[index], ...action.payload };
                }
            })
            .addCase(updateYardBlock.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearYardError } = yardSlice.actions;
export default yardSlice.reducer;
