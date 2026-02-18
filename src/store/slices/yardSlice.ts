import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { yardService } from "@/services/yardService";
import type { Block } from "@/types";
import { AxiosError } from "axios";

interface YardState {
    blocks: Block[];
    isLoading: boolean;
    error: string | null;
}

const initialState: YardState = {
    blocks: [],
    isLoading: false,
    error: null,
};

export const fetchBlocks = createAsyncThunk(
    "yard/fetchBlocks",
    async (_, { rejectWithValue }) => {
        try {
            return await yardService.getBlocks();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to fetch blocks";
            return rejectWithValue(message);
        }
    }
);

export const createBlock = createAsyncThunk(
    "yard/createBlock",
    async ({ name, capacity }: { name: string; capacity: number }, { dispatch, rejectWithValue }) => {
        try {
            await yardService.createBlock({ name, capacity });
            dispatch(fetchBlocks()); // Refresh the list
            return { name, capacity };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to create block";
            return rejectWithValue(message);
        }
    }
);

export const updateBlock = createAsyncThunk(
    "yard/updateBlock",
    async ({ id, name, capacity }: { id: string; name: string; capacity: number }, { rejectWithValue }) => {
        try {
            await yardService.updateBlock(id, { name, capacity });
            return { id, name, capacity };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to update block";
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
            .addCase(fetchBlocks.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBlocks.fulfilled, (state, action: PayloadAction<Block[]>) => {
                state.isLoading = false;
                state.blocks = action.payload;
            })
            .addCase(fetchBlocks.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(createBlock.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createBlock.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(createBlock.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateBlock.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateBlock.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.blocks.findIndex((b) => b.id === action.payload.id);
                if (index !== -1) {
                    state.blocks[index] = { ...state.blocks[index], ...action.payload };
                }
            })
            .addCase(updateBlock.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearYardError } = yardSlice.actions;
export default yardSlice.reducer;
