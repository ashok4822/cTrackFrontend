import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { shippingLineService } from "@/services/shippingLineService";
import type { ShippingLine } from "@/types";
import { AxiosError } from "axios";

interface ShippingLineState {
    lines: ShippingLine[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ShippingLineState = {
    lines: [],
    isLoading: false,
    error: null,
};

export const fetchShippingLines = createAsyncThunk(
    "shippingLine/fetchLines",
    async (_, { rejectWithValue }) => {
        try {
            return await shippingLineService.getShippingLines();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to fetch shipping lines";
            return rejectWithValue(message);
        }
    }
);

export const createShippingLine = createAsyncThunk(
    "shippingLine/createLine",
    async ({ name, code }: { name: string; code: string }, { dispatch, rejectWithValue }) => {
        try {
            await shippingLineService.createShippingLine({ name, code });
            dispatch(fetchShippingLines());
            return { name, code };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to create shipping line";
            return rejectWithValue(message);
        }
    }
);

export const updateShippingLine = createAsyncThunk(
    "shippingLine/updateLine",
    async ({ id, name, code }: { id: string; name: string; code: string }, { rejectWithValue }) => {
        try {
            await shippingLineService.updateShippingLine(id, { name, code });
            return { id, name, code };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
                axiosError.response?.data?.message ||
                axiosError.message ||
                "Failed to update shipping line";
            return rejectWithValue(message);
        }
    }
);

const shippingLineSlice = createSlice({
    name: "shippingLine",
    initialState,
    reducers: {
        clearShippingLineError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShippingLines.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchShippingLines.fulfilled, (state, action: PayloadAction<ShippingLine[]>) => {
                state.isLoading = false;
                state.lines = action.payload;
            })
            .addCase(fetchShippingLines.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(createShippingLine.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createShippingLine.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(createShippingLine.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateShippingLine.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateShippingLine.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.lines.findIndex((l) => l.id === action.payload.id);
                if (index !== -1) {
                    state.lines[index] = {
                        ...state.lines[index],
                        shipping_line_name: action.payload.name,
                        shipping_line_code: action.payload.code,
                    };
                }
            })
            .addCase(updateShippingLine.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearShippingLineError } = shippingLineSlice.actions;
export default shippingLineSlice.reducer;
