import api from "./api";
import type { ShippingLine } from "@/types";

export const shippingLineService = {
    getShippingLines: async () => {
        const response = await api.get<ShippingLine[]>("/shipping-lines");
        return response.data;
    },

    createShippingLine: async (data: { name: string; code: string }) => {
        const response = await api.post<{ message: string }>("/shipping-lines", data);
        return response.data;
    },

    updateShippingLine: async (id: string, data: { name?: string; code?: string }) => {
        const response = await api.put<{ message: string }>(`/shipping-lines/${id}`, data);
        return response.data;
    },
};
