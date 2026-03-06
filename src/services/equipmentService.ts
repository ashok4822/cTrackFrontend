import api from "./api";
import type { Equipment } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const equipmentService = {
    async getEquipment(filters?: {
        type?: string;
        status?: string;
        name?: string;
    }): Promise<Equipment[]> {
        const response = await api.get<Equipment[]>(API_ENDPOINTS.EQUIPMENT.GET_ALL, { params: filters });
        return response.data;
    },

    async addEquipment(data: Omit<Equipment, "id">): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(API_ENDPOINTS.EQUIPMENT.CREATE, data);
        return response.data;
    },

    async updateEquipment(id: string, data: Partial<Equipment>): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(API_ENDPOINTS.EQUIPMENT.UPDATE(id), data);
        return response.data;
    },

    async deleteEquipment(id: string): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(API_ENDPOINTS.EQUIPMENT.DELETE(id));
        return response.data;
    },

    async getEquipmentHistory(id: string): Promise<any[]> {
        const response = await api.get<any[]>(API_ENDPOINTS.EQUIPMENT.HISTORY(id));
        return response.data;
    },
};
