import api from "./api";
import type { Vehicle } from "@/types";

export const vehicleService = {
    async getVehicles(filters?: {
        type?: string;
        status?: string;
        vehicleNumber?: string;
    }): Promise<Vehicle[]> {
        const response = await api.get<Vehicle[]>("/vehicles", { params: filters });
        return response.data;
    },

    async addVehicle(data: Omit<Vehicle, "id">): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>("/vehicles", data);
        return response.data;
    },

    async updateVehicle(id: string, data: Partial<Vehicle>): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(`/vehicles/${id}`, data);
        return response.data;
    },

    async deleteVehicle(id: string): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(`/vehicles/${id}`);
        return response.data;
    },
};
