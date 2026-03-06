import api from "./api";
import type { Vehicle } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const vehicleService = {
    async getVehicles(filters?: {
        type?: string;
        status?: string;
        vehicleNumber?: string;
    }): Promise<Vehicle[]> {
        const response = await api.get<Vehicle[]>(API_ENDPOINTS.VEHICLES.GET_ALL, { params: filters });
        return response.data;
    },

    async addVehicle(data: Omit<Vehicle, "id">): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(API_ENDPOINTS.VEHICLES.CREATE, data);
        return response.data;
    },

    async updateVehicle(id: string, data: Partial<Vehicle>): Promise<{ message: string }> {
        const response = await api.put<{ message: string }>(API_ENDPOINTS.VEHICLES.UPDATE(id), data);
        return response.data;
    },

    async deleteVehicle(id: string): Promise<{ message: string }> {
        const response = await api.delete<{ message: string }>(API_ENDPOINTS.VEHICLES.DELETE(id));
        return response.data;
    },
};
