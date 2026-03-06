import api from "./api";
import type { ShippingLine } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

export const shippingLineService = {
    getShippingLines: async () => {
        const response = await api.get<ShippingLine[]>(API_ENDPOINTS.SHIPPING_LINES.GET_ALL);
        return response.data;
    },

    createShippingLine: async (data: { name: string; code: string }) => {
        const response = await api.post<{ message: string }>(API_ENDPOINTS.SHIPPING_LINES.CREATE, data);
        return response.data;
    },

    updateShippingLine: async (id: string, data: { name?: string; code?: string }) => {
        const response = await api.put<{ message: string }>(API_ENDPOINTS.SHIPPING_LINES.UPDATE(id), data);
        return response.data;
    },
};
