import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { adminService } from "@/services/adminService";
import type { User } from "@/types";
import { AxiosError } from "axios";

interface AdminState {
    users: User[];
    isLoading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    users: [],
    isLoading: false,
    error: null,
};

export const fetchAllUsers = createAsyncThunk(
    "admin/fetchAllUsers",
    async (_, { rejectWithValue }) => {
        try {
            return await adminService.fetchAllUsers();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to fetch users");
        }
    }
);

export const toggleUserBlock = createAsyncThunk(
    "admin/toggleUserBlock",
    async (userId: string, { rejectWithValue }) => {
        try {
            return await adminService.toggleUserBlock(userId);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to toggle block status");
        }
    }
);

export const adminCreateUser = createAsyncThunk(
    "admin/createUser",
    async (userData: Partial<User> & { password?: string }, { rejectWithValue, dispatch }) => {
        try {
            const response = await adminService.createUser(userData);
            dispatch(fetchAllUsers());
            return response;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to create user");
        }
    }
);

export const adminUpdateUser = createAsyncThunk(
    "admin/updateUser",
    async ({ userId, userData }: { userId: string, userData: Partial<User> }, { rejectWithValue }) => {
        try {
            return await adminService.updateUser(userId, userData);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(axiosError.response?.data?.message || "Failed to update user");
        }
    }
);

const adminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {
        clearAdminError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
                state.isLoading = false;
                state.users = action.payload;
                console.log("AdminSlice: Users fetched successfully", action.payload);
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(toggleUserBlock.fulfilled, (state, action) => {
                const { id, isBlocked } = action.payload.user;
                const user = state.users.find((u) => u.id === id);
                if (user) {
                    user.isBlocked = isBlocked;
                }
            })
            .addCase(adminUpdateUser.fulfilled, (state, action) => {
                const updatedUser = action.payload.user;
                const index = state.users.findIndex((u) => u.id === updatedUser.id);
                if (index !== -1) {
                    state.users[index] = { ...state.users[index], ...updatedUser };
                }
            });
    },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
