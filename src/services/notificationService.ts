import api from "./api";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import type { Notification } from "@/types";

export const notificationService = {
    getNotifications: async (): Promise<Notification[]> => {
        const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
        return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    },

    markAllAsRead: async (): Promise<void> => {
        await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },

    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    },
};
