import api from "./api";
import type { Equipment } from "@/types";

export const equipmentService = {
    async getEquipment(filters?: {
        type?: string;
        status?: string;
        name?: string;
    }): Promise<Equipment[]> {
        const response = await api.get<Equipment[]>("/equipment", { params: filters });
        return response.data;
    },

    async addEquipment(data: Omit<Equipment, "id">): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>("/equipment", data);
        return response.data;
    },

    async updateEquipment(id: string, data: Partial<Equipment>): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(`/equipment/${id}`, data);
        return response.data;
    },

    async deleteEquipment(id: string): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/equipment/${id}`);
        return response.data;
    },
};
