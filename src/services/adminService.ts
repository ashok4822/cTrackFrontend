import api from "./api";
import type { User } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const adminService = {
    async fetchAllUsers(): Promise<User[]> {
        const response = await api.get<User[]>(API_ENDPOINTS.USERS.GET_ALL);
        return response.data;
    },

    async toggleUserBlock(userId: string): Promise<User> {
        const response = await api.patch<User>(
            API_ENDPOINTS.USERS.BLOCK(userId)
        );
        return response.data;
    },

    async createUser(userData: Partial<User> & { password?: string }): Promise<User> {
        const response = await api.post<User>(API_ENDPOINTS.USERS.CREATE, userData);
        return response.data;
    },

    async updateUser(userId: string, userData: Partial<User>): Promise<User> {
        const response = await api.put<User>(API_ENDPOINTS.USERS.BY_ID(userId), userData);
        return response.data;
    },
};
