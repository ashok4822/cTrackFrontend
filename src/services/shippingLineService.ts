import api from "./api";
import type { ShippingLine } from "@/types";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

// The backend DTO returns { id, name, code } via ShippingLineMapper.toResponseDto,
// but the frontend ShippingLine type uses shipping_line_name / shipping_line_code.
// We normalize here so all consumers (GateInDialog, AdminShippinglineManagement, etc.)
// receive correctly shaped objects.
type ApiShippingLine = { id: string; name: string; code: string; createdAt?: string; updatedAt?: string };

export const shippingLineService = {
    getShippingLines: async () => {
        const response = await api.get<ApiShippingLine[]>(API_ENDPOINTS.SHIPPING_LINES.GET_ALL);
        const raw = response.data as unknown as ApiShippingLine[];
        const normalized: ShippingLine[] = raw.map((item) => ({
            id: item.id,
            shipping_line_name: item.name,
            shipping_line_code: item.code,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
        return normalized;
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
