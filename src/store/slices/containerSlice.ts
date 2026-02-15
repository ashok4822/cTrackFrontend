import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { containerService } from "@/services/containerService";
import type { Container } from "@/types";
import { AxiosError } from "axios";

interface ContainerState {
    containers: Container[];
    currentContainer: Container | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ContainerState = {
    containers: [],
    currentContainer: null,
    isLoading: false,
    error: null,
};

export const fetchContainers = createAsyncThunk(
    "container/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            return await containerService.getContainers();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to fetch containers");
        }
    }
);

export const fetchContainerById = createAsyncThunk(
    "container/fetchById",
    async (id: string, { rejectWithValue }) => {
        try {
            return await containerService.getContainerById(id);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to fetch container");
        }
    }
);

export const createContainer = createAsyncThunk(
    "container/create",
    async (data: Partial<Container>, { dispatch, rejectWithValue }) => {
        try {
            const response = await containerService.createContainer(data);
            dispatch(fetchContainers());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to create container");
        }
    }
);

export const updateContainer = createAsyncThunk(
    "container/update",
    async ({ id, data }: { id: string; data: Partial<Container> }, { dispatch, rejectWithValue }) => {
        try {
            const response = await containerService.updateContainer(id, data);
            dispatch(fetchContainerById(id));
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to update container");
        }
    }
);

export const blacklistContainer = createAsyncThunk(
    "container/blacklist",
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await containerService.blacklistContainer(id);
            return { id, ...response };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to blacklist container");
        }
    }
);

export const unblacklistContainer = createAsyncThunk(
    "container/unblacklist",
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await containerService.unblacklistContainer(id);
            return { id, ...response };
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to unblacklist container");
        }
    }
);

const containerSlice = createSlice({
    name: "container",
    initialState,
    reducers: {
        clearContainerError: (state) => {
            state.error = null;
        },
        clearCurrentContainer: (state) => {
            state.currentContainer = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchContainers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchContainers.fulfilled, (state, action: PayloadAction<Container[]>) => {
                state.isLoading = false;
                state.containers = action.payload;
            })
            .addCase(fetchContainers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchContainerById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchContainerById.fulfilled, (state, action: PayloadAction<Container>) => {
                state.isLoading = false;
                state.currentContainer = action.payload;
            })
            .addCase(fetchContainerById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(createContainer.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createContainer.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(createContainer.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateContainer.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateContainer.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(updateContainer.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(blacklistContainer.fulfilled, (state, action) => {
                const container = state.containers.find(c => c.id === action.payload.id);
                if (container) {
                    container.blacklisted = true;
                }
                if (state.currentContainer && state.currentContainer.id === action.payload.id) {
                    state.currentContainer.blacklisted = true;
                }
            })
            .addCase(unblacklistContainer.fulfilled, (state, action) => {
                const container = state.containers.find(c => c.id === action.payload.id);
                if (container) {
                    container.blacklisted = false;
                }
                if (state.currentContainer && state.currentContainer.id === action.payload.id) {
                    state.currentContainer.blacklisted = false;
                }
            });
    },
});

export const { clearContainerError, clearCurrentContainer } = containerSlice.actions;
export default containerSlice.reducer;
