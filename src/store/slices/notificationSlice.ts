import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Notification } from "@/types";
import { notificationService } from "@/services/notificationService";
import { AxiosError } from "axios";
import { UI_MESSAGES } from "@/constants/messages";

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

export const fetchNotifications = createAsyncThunk(
    "notifications/fetchNotifications",
    async (_, { rejectWithValue }) => {
        try {
            return await notificationService.getNotifications();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || axiosError.message || UI_MESSAGES.NOTIFICATION.FETCH_FAILED
            );
        }
    }
);

export const markAsRead = createAsyncThunk(
    "notifications/markAsRead",
    async (id: string, { rejectWithValue }) => {
        try {
            await notificationService.markAsRead(id);
            return id;
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || axiosError.message || UI_MESSAGES.NOTIFICATION.MARK_READ_FAILED
            );
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    "notifications/markAllAsRead",
    async (_, { rejectWithValue }) => {
        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue(
                axiosError.response?.data?.message || axiosError.message || UI_MESSAGES.NOTIFICATION.MARK_ALL_READ_FAILED
            );
        }
    }
);

const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.read) {
                state.unreadCount += 1;
            }
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.read) {
                state.unreadCount -= 1;
            }
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
                state.isLoading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter(n => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(markAsRead.fulfilled, (state, action: PayloadAction<string>) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.read) {
                    notification.read = true;
                    state.unreadCount -= 1;
                }
            })
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    },
});

export const { addNotification, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
