import api from "./api";
import type { User } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const adminService = {
    async fetchAllUsers(): Promise<User[]> {
        const response = await api.get<User[]>(API_ENDPOINTS.USERS.GET_ALL);
        return response.data;
    },

    async toggleUserBlock(userId: string): Promise<{ user: { id: string; isBlocked: boolean } }> {
        const response = await api.patch<{ user: { id: string; isBlocked: boolean } }>(
            API_ENDPOINTS.USERS.BLOCK(userId)
        );
        return response.data;
    },

    async createUser(userData: Partial<User> & { password?: string }): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(API_ENDPOINTS.USERS.CREATE, userData);
        return response.data;
    },

    async updateUser(userId: string, userData: Partial<User>): Promise<{ message: string; user: User }> {
        const response = await api.put<{ message: string; user: User }>(API_ENDPOINTS.USERS.BY_ID(userId), userData);
        return response.data;
    },
};
