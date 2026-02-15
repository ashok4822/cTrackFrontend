import api from "./api";
import type { YardBlock } from "@/types";

export const yardService = {
    getYardBlocks: async () => {
        const response = await api.get<YardBlock[]>("/yard");
        return response.data;
    },

    createYardBlock: async (data: { name: string; capacity: number }) => {
        const response = await api.post<{ message: string }>("/yard", data);
        return response.data;
    },

    updateYardBlock: async (id: string, data: { name?: string; capacity?: number }) => {
        const response = await api.put<{ message: string }>(`/yard/${id}`, data);
        return response.data;
    },
};
