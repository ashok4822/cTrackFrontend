import api from "./api";
import type { User } from "@/types";

export const adminService = {
    async fetchAllUsers(): Promise<User[]> {
        const response = await api.get<User[]>("/users");
        return response.data;
    },

    async toggleUserBlock(userId: string): Promise<{ user: { id: string; isBlocked: boolean } }> {
        const response = await api.patch<{ user: { id: string; isBlocked: boolean } }>(
            `/users/${userId}/block`
        );
        return response.data;
    },

    async createUser(userData: Partial<User> & { password?: string }): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>("/users", userData);
        return response.data;
    },

    async updateUser(userId: string, userData: Partial<User>): Promise<{ message: string; user: User }> {
        const response = await api.put<{ message: string; user: User }>(`/users/${userId}`, userData);
        return response.data;
    },
};
