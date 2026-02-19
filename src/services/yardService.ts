import api from "./api";
import type { Block } from "@/types";

export const yardService = {
    getBlocks: async () => {
        const response = await api.get<Block[]>("/yard");
        return response.data;
    },

    createBlock: async (data: { name: string; capacity: number }) => {
        const response = await api.post<{ message: string }>("/yard", data);
        return response.data;
    },

    updateBlock: async (id: string, data: { name?: string; capacity?: number }) => {
        const response = await api.put<{ message: string }>(`/yard/${id}`, data);
        return response.data;
    },
};
