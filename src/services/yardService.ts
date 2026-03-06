import api from "./api";
import type { Block } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const yardService = {
    getBlocks: async () => {
        const response = await api.get<Block[]>(API_ENDPOINTS.YARD.GET_ALL);
        return response.data;
    },

    createBlock: async (data: { name: string; capacity: number }) => {
        const response = await api.post<{ message: string }>(API_ENDPOINTS.YARD.CREATE, data);
        return response.data;
    },

    updateBlock: async (id: string, data: { name?: string; capacity?: number }) => {
        const response = await api.put<{ message: string }>(API_ENDPOINTS.YARD.UPDATE(id), data);
        return response.data;
    },
};
